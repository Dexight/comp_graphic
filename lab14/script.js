const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

// GLSL шейдеры
const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aOffset;

uniform mat4 uMVPMatrix;
uniform mat4 uModelMatrix;

out vec2 vTexCoord;

void main() {
    gl_Position = uMVPMatrix * (uModelMatrix * vec4(aPosition, 1.0) + vec4(aOffset, 0.0));
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
function compileShader(gl, source, type) 
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error("Ошибка компиляции шейдера");
    }

    return shader;
}

// Создание программы
function createProgram(gl, vertexSource, fragmentSource) 
{
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
    {
        console.error(gl.getProgramInfoLog(program));
        throw new Error("Ошибка линковки программы");
    }

    return program;
}

// Класс для работы с объектами
class GLObject 
{
    constructor(gl, program, objUrl, textureUrl, scale = [1.0, 1.0, 1.0]) 
    {
        this.gl = gl;
        this.program = program;
        this.objUrl = objUrl;
        this.textureUrl = textureUrl;
        this.scale = scale;
        this.positionBuffer = null;
        this.texCoordBuffer = null;
        this.texture = null;
        this.offsets = new Float32Array([0.0, 0.0, 0.0]);
        this.objData = null;
    }

    async init() 
    {
        // Загрузка OBJ-файла
        this.objData = await this.loadOBJ(this.objUrl);

        // Создание и привязка буферов
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.objData.positions), this.gl.STATIC_DRAW);

        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.objData.texCoords), this.gl.STATIC_DRAW);

        // Создание текстуры
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        const image = new Image();
        image.src = this.textureUrl;
        await new Promise((resolve) => {
            image.onload = () => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
                resolve();
            };
        });
    }

    async loadOBJ(url) 
    {
        const response = await fetch(url);
        const text = await response.text();

        const positions = []; // Вершины (v)
        const texCoords = []; // Текстурные координаты (vt)
        const normals = [];   // Нормали (vn)
        const finalPositions = []; // Итоговые вершины
        const finalTexCoords = []; // Итоговые текстурные координаты
        const finalNormals = [];   // Итоговые нормали

        text.split("\n").forEach((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts[0] === "v") {
                // Загрузка вершин
                positions.push(parts.slice(1).map(Number));
            } else if (parts[0] === "vt") {
                // Загрузка текстурных координат
                texCoords.push(parts.slice(1).map(Number));
            } else if (parts[0] === "vn") {
                // Загрузка нормалей
                normals.push(parts.slice(1).map(Number));
            } else if (parts[0] === "f") {
                // Загрузка граней
                const faceIndices = parts.slice(1).map((part) => {
                    const [posIdx, texIdx, normIdx] = part.split("/").map((n) => parseInt(n) - 1);
                    return { posIdx, texIdx, normIdx };
                });

                // Преобразование граней в треугольники
                for (let i = 1; i < faceIndices.length - 1; i++) {
                    const tri = [faceIndices[0], faceIndices[i], faceIndices[i + 1]];
                    tri.forEach(({ posIdx, texIdx, normIdx }) => {
                        // Добавление вершин
                        finalPositions.push(...positions[posIdx]);

                        // Добавление текстурных координат (если они есть)
                        if (texIdx !== undefined && texIdx >= 0) {
                            finalTexCoords.push(...texCoords[texIdx]);
                        }

                        // Добавление нормалей (если они есть)
                        if (normIdx !== undefined && normIdx >= 0) {
                            finalNormals.push(...normals[normIdx]);
                        }
                    });
                }
            }
        });

        return {
            positions: finalPositions,
            texCoords: finalTexCoords,
            normals: finalNormals,
        };
    }

    setOffsets(offsets) { this.offsets = new Float32Array(offsets); }

    render(modelMatrix, mvpMatrix, aPosition, aTexCoord, aOffsetLocation, uTextureLocation, uModelMatrix, uMVPMatrix) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(aPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(aTexCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(aTexCoord);

        const offsetBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, offsetBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.offsets, this.gl.STATIC_DRAW);

        this.gl.enableVertexAttribArray(aOffsetLocation);
        this.gl.vertexAttribPointer(aOffsetLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribDivisor(aOffsetLocation, 1);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(uTextureLocation, 0);

        mat4.scale(modelMatrix, modelMatrix, this.scale);
        this.gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
        this.gl.uniformMatrix4fv(uMVPMatrix, false, mvpMatrix);

        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.objData.positions.length / 3, this.offsets.length / 3);
    }
}

// Основной код
(async function main() 
{
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Создание объектов
    const kinder = new GLObject(gl, program, "kinder.obj", "kinder.png", [1.5, 1.5, 1.5]);
    const balloon = new GLObject(gl, program, "balloon.obj", "balloon.png", [2.0, 2.0, 2.0]);

    // Инициализация объектов
    await kinder.init();
    await balloon.init();

    // Установка смещений для kinder
    let angle = 0;
    const kinderAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const orbitRadius = 40;

    // Установка смещений для balloon
    balloon.setOffsets([0.0, 0.0, -50.0]);

    // Получение местоположений атрибутов и uniform-переменных
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aTexCoord = gl.getAttribLocation(program, "aTexCoord");
    const aOffsetLocation = gl.getAttribLocation(program, "aOffset");
    const uTextureLocation = gl.getUniformLocation(program, "uTexture");
    const uMVPMatrix = gl.getUniformLocation(program, "uMVPMatrix");
    const uModelMatrix = gl.getUniformLocation(program, "uModelMatrix");

    // Матрица проекций
    const mvpMatrix = mat4.create();
    const modelMatrix = mat4.create();
    mat4.perspective(mvpMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, Infinity);

    // Камера
    let cameraPosition = vec3.fromValues(0, 0, -5);
    let cameraTarget = vec3.fromValues(0, 0, 0);
    let cameraUp = vec3.fromValues(0, 1, 0);

    function updateModelViewMatrix() {
        mat4.identity(modelMatrix);
        mat4.lookAt(modelMatrix, cameraPosition, cameraTarget, cameraUp);
    }

    // Рендеринг
    function render() 
    {
        angle += 0.04;
    
        // Обновляем углы для каждого kinder
        for (let i = 0; i < kinderAngles.length; i++) {
            kinderAngles[i] += 0.01; // Скорость вращения
        }

        const newOffsets = new Float32Array([
            Math.cos(kinderAngles[0]) * orbitRadius, -5.0, Math.sin(kinderAngles[0]) * orbitRadius - 50,
            Math.cos(kinderAngles[1]) * orbitRadius, -5.0, Math.sin(kinderAngles[1]) * orbitRadius - 50,
            Math.cos(kinderAngles[2]) * orbitRadius, -5.0, Math.sin(kinderAngles[2]) * orbitRadius - 50,
            Math.cos(kinderAngles[3]) * orbitRadius, -5.0, Math.sin(kinderAngles[3]) * orbitRadius - 50
        ]);
    
        kinder.setOffsets(newOffsets);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        updateModelViewMatrix();

        // Отрисовка kinder
        kinder.render(modelMatrix, mvpMatrix, aPosition, aTexCoord, aOffsetLocation, uTextureLocation, uModelMatrix, uMVPMatrix);

        // Отрисовка balloon
        balloon.render(modelMatrix, mvpMatrix, aPosition, aTexCoord, aOffsetLocation, uTextureLocation, uModelMatrix, uMVPMatrix);

        requestAnimationFrame(render);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    render();
})();