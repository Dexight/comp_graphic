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

    /*
    float scale = 1.0 + abs(aOffset.z) * 0.01;
    mat4 scaleMatrix = mat4(
        scale, 0.0, 0.0, 0.0,
        0.0, scale, 0.0, 0.0,
        0.0, 0.0, scale, 0.0,
        0.0, 0.0, 0.0, 1.0
    );*/


    gl_Position = uMVPMatrix * ( uModelMatrix * vec4(aPosition, 1.0) + vec4(aOffset, 0.0)); //* scaleMatrix;
   
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
async function loadOBJ(url) 
{
    const response = await fetch(url);
    const text = await response.text();

    const positions = [];
    const texCoords = [];
    const finalPositions = [];
    const finalTexCoords = [];

    text.split("\n").forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === "v") 
        {
            positions.push(parts.slice(1).map(Number));
        } 
        else if (parts[0] === "vt") 
        {
            texCoords.push(parts.slice(1).map(Number));
        } 
        else if (parts[0] === "f") 
        {
            const faceIndices = parts.slice(1).map((part) => {
                const [posIdx, texIdx] = part.split("/").map((n) => parseInt(n) - 1);
                return { posIdx, texIdx };
            });

            for (let i = 1; i < faceIndices.length - 1; i++) 
            {
                const tri = [faceIndices[0], faceIndices[i], faceIndices[i + 1]];
                tri.forEach(({ posIdx, texIdx }) => {
                    finalPositions.push(...positions[posIdx]);
                    if (texIdx !== undefined && texIdx >= 0) 
                    {
                        finalTexCoords.push(...texCoords[texIdx]);
                    }
                });
            }
        }
    });

    return { positions: finalPositions, texCoords: finalTexCoords };
}

// Основной код
(async function main() 
{
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Загрузка и преобразование OBJ-файлов
    const obj = await loadOBJ("kinder.obj");

    // KINDER
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

    const image1 = new Image();
    image1.src = "kinder.png";
    image1.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);
        gl.generateMipmap(gl.TEXTURE_2D);
        console.log("Texture kinder loaded and mipmap generated");
    };

    // balloon
    // Создание и привязка буферов
    const obj2 = await loadOBJ("balloon.obj");

    const positionBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj2.positions), gl.STATIC_DRAW);

    const texCoordBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj2.texCoords), gl.STATIC_DRAW);

    // Создание текстуры
    const texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const image2 = new Image();
    image2.src = "balloon.png";
    image2.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
        gl.generateMipmap(gl.TEXTURE_2D);
        console.log("Texture balloon loaded and mipmap generated");
    };

    // Установка атрибутов
    const aPosition = gl.getAttribLocation(program, "aPosition");
    
    const aTexCoord = gl.getAttribLocation(program, "aTexCoord");

    const uTextureLocation = gl.getUniformLocation(program, "uTexture");

    const offsetBuffer = gl.createBuffer();

    const offsetBuffer2 = gl.createBuffer();

    // Получение местоположения атрибута aOffset
    const aOffsetLocation = gl.getAttribLocation(program, "aOffset");

    // Матрица проекций
    const uMVPMatrix = gl.getUniformLocation(program, "uMVPMatrix");
    const uModelMatrix = gl.getUniformLocation(program, "uModelMatrix");
    const mvpMatrix = mat4.create();
    const modelMatrix = mat4.create();
    mat4.perspective(mvpMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, Infinity);
    //mat4.translate(mvpMatrix, mvpMatrix, [0, 0, -100]);
    //mat4.rotateX(mvpMatrix, mvpMatrix, Math.PI / 4);

    let angle = 0;

    //======Камера==========
     //Камера
     let cameraPosition = vec3.fromValues(0, 0, -5);
     let cameraTarget = vec3.fromValues(0, 0, 0);
     let cameraUp = vec3.fromValues(0, 1, 0);
     const speedDelta = 0.5;
     const rotationSpeed = 0.05;

     function updateModelViewMatrix(){
         mat4.identity(modelMatrix);
         mat4.lookAt(modelMatrix, cameraPosition, cameraTarget, cameraUp);
     }

     // Функция для обновления матрицы проекции
     function updateProjectionMatrix() {
        //mat4.perspective(uMVPMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, Infinity);
     }
     
     function rotateCamera(yaw, pitch) {
        // Создаём матрицу поворота
        const rotationMatrix = mat4.create();
        mat4.rotateY(rotationMatrix, rotationMatrix, yaw); // Поворот вокруг оси Y
        mat4.rotateX(rotationMatrix, rotationMatrix, pitch); // Поворот вокруг оси X

        // Применяем поворот к направлению камеры
        const direction = vec3.create();
        vec3.subtract(direction, cameraTarget, cameraPosition);
        vec3.transformMat4(direction, direction, rotationMatrix);
        vec3.add(cameraTarget, cameraPosition, direction);
    }

    const kinderAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // Начальные углы для каждого kinder
    const orbitRadius = 50; // Радиус орбиты

    // Рендеринг
    function render() {
        angle += 0.04;
    
        // Обновляем углы для каждого kinder
        for (let i = 0; i < kinderAngles.length; i++) {
            kinderAngles[i] += 0.01; // Скорость вращения
        }
    
        // Обновляем позиции kinder на основе углов (вращение по оси Y)
        const newOffsets = new Float32Array([
            Math.cos(kinderAngles[0]) * orbitRadius, -5.0, Math.sin(kinderAngles[0]) * orbitRadius - 50,
            Math.cos(kinderAngles[1]) * orbitRadius, -5.0, Math.sin(kinderAngles[1]) * orbitRadius - 50,
            Math.cos(kinderAngles[2]) * orbitRadius, -5.0, Math.sin(kinderAngles[2]) * orbitRadius - 50,
            Math.cos(kinderAngles[3]) * orbitRadius, -5.0, Math.sin(kinderAngles[3]) * orbitRadius - 50
        ]);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        updateModelViewMatrix();
        updateProjectionMatrix();
        mat4.scale(modelMatrix, modelMatrix, [1.5, 1.5, 1.5]);
        mat4.rotateY(modelMatrix, modelMatrix, angle);
        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(uMVPMatrix, false, mvpMatrix);
    
        //kinder
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, newOffsets, gl.STATIC_DRAW); // Обновляем буфер смещений
    
        gl.enableVertexAttribArray(aOffsetLocation);
        gl.vertexAttribPointer(aOffsetLocation, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aOffsetLocation, 1);
    
        // Устанавливаем текстуру kinder
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTextureLocation, 0);
    
        // Отрисовка экземпляров
        gl.drawArraysInstanced(gl.TRIANGLES, 0, obj.positions.length / 3, 4);
    
        //balloon
        const offsets2 = new Float32Array([
            0.0, 0.0, -50.0,  
        ]);

        updateModelViewMatrix();
        updateProjectionMatrix();
        mat4.rotateY(modelMatrix, modelMatrix, angle);
        mat4.scale(modelMatrix, modelMatrix, [2.0, 2.0, 2.0]);
        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(uMVPMatrix, false, mvpMatrix);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer2);
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aTexCoord);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER, offsets2, gl.STATIC_DRAW);
    
        gl.enableVertexAttribArray(aOffsetLocation);
        gl.vertexAttribPointer(aOffsetLocation, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aOffsetLocation, 1);
    
        // Устанавливаем текстуру balloon
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.uniform1i(uTextureLocation, 0);
    
        // Отрисовка экземпляров
        gl.drawArraysInstanced(gl.TRIANGLES, 0, obj.positions.length / 3, 1);
    
        requestAnimationFrame(render);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.GREATER);
    render();

    //обработчики
    document.addEventListener("keydown", (event) => {
        console.log(event.key);
        const dir = vec3.create();
        vec3.subtract(dir, cameraTarget, cameraPosition);
        vec3.normalize(dir, dir);
        switch (event.key) {
            // case "+":
            //     // console.log('plus');
            //     mixRatio = Math.min(1, mixRatio + 0.1);
            //     // render();
            //     break;
            // case "-":
            //     mixRatio = Math.max(0, mixRatio - 0.1);
            //     // render();
            //     break;
            case "ArrowLeft":
                cameraPosition[0] -= speedDelta;
                cameraTarget[0] -= speedDelta;
                break;
            case "ArrowRight":
                cameraPosition[0] += speedDelta;
                cameraTarget[0] += speedDelta;
                break;    
            case "ArrowUp":
                cameraPosition[1] += speedDelta;
                cameraTarget[1] += speedDelta;
                break;
            case "ArrowDown":
                cameraPosition[1] -= speedDelta;
                cameraTarget[1] -= speedDelta;
                break;

            case "w":
                vec3.scaleAndAdd(cameraPosition, cameraPosition, dir, speedDelta);
                vec3.scaleAndAdd(cameraTarget, cameraTarget, dir, speedDelta);
                break;
            case "s":
                vec3.scaleAndAdd(cameraPosition, cameraPosition, dir, -speedDelta);
                vec3.scaleAndAdd(cameraTarget, cameraTarget, dir, -speedDelta);
                break;
                // Повороты камеры
            case "k": // Поворот влево
                rotateCamera(-rotationSpeed, 0);
                break;
            case "l": // Поворот вправо
                rotateCamera(rotationSpeed, 0);
                break;
            case "i": // Поворот вверх
                rotateCamera(0, -rotationSpeed);
                break;
            case "j": // Поворот вниз
                rotateCamera(0, rotationSpeed);
                break;
            }

        updateModelViewMatrix();
    });
})();