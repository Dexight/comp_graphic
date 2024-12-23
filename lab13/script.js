const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

// GLSL шейдеры
const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aOffset;

uniform mat4 uMVPMatrix;

out vec2 vTexCoord;

void main() {
    gl_Position = uMVPMatrix * vec4(aPosition + aOffset, 1.0);
    vTexCoord = aTexCoord;
    vTexCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y); // Invert Y coordinate
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    fragColor = texture(uTexture, vTexCoord);
}
`;

// Компиляция шейдеров
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error("Ошибка компиляции шейдера");
    }

    return shader;
}

// Создание программы
function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw new Error("Ошибка линковки программы");
    }

    return program;
}

// Загрузка OBJ-файла и преобразование граней
async function loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();

    const positions = [];
    const texCoords = [];
    //const indices = [];
    const finalPositions = [];
    const finalTexCoords = [];

    text.split("\n").forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === "v") {
            positions.push(parts.slice(1).map(Number));
        } else if (parts[0] === "vt") {
            texCoords.push(parts.slice(1).map(Number));
        } else if (parts[0] === "f") {
            for (let i = 1; i < parts.length; i++) {
                const [posIdx, texIdx] = parts[i].split("/").map((n) => parseInt(n) - 1);
                finalPositions.push(...positions[posIdx]);
                finalTexCoords.push(...texCoords[texIdx]);
            }
        }
    });

    return { positions: finalPositions, texCoords: finalTexCoords };
}

// Основной код
(async function main() {
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Загрузка и преобразование OBJ-файла
    const obj = await loadOBJ("bus2.obj");

    // Создание и привязка буферов
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.positions), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);

    // Создание текстуры
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const image = new Image();
    image.src = "bus2.png";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        console.log("Texture loaded and mipmap generated");
    };

    // Установка атрибутов
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    const aTexCoord = gl.getAttribLocation(program, "aTexCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoord);

    // Матрица проекций
    const uMVPMatrix = gl.getUniformLocation(program, "uMVPMatrix");
    const mvpMatrix = mat4.create();
    mat4.perspective(mvpMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    mat4.translate(mvpMatrix, mvpMatrix, [0, 0, -20]);
    mat4.rotateY(mvpMatrix, mvpMatrix, Math.PI / 2);

    // Рендеринг
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(uMVPMatrix, false, mvpMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, obj.positions.length / 3);

        requestAnimationFrame(render);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    render();
})();