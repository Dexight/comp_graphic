canvas = document.getElementById('webgl-canvas');
gl = canvas.getContext("webgl");

if(!gl){
    alert("WebGL не поддерживается в браузере");
}

//ШАГ 1


// Создание шейдеров
//Вершинный шейдер - для вершины треугольника
const vertexShaderSrc = `
    attribute vec2 aPosition;
    void main(){
        gl_Position = vec4(aPosition, 0.0, 1.0); // Установка позиции (x, y, z, w)
    }
`;

const fragmentShaderSrc = `
    precision mediump float;
    void main(){
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // зеленый цвет
    }
`;

// Функция компиляции шейдера
function createShader(gl, type, source) {
    const shader = gl.createShader(type); // Создаем шейдер
    gl.shaderSource(shader, source);     // Передаем код шейдера
    gl.compileShader(shader);            // Компилируем шейдер

    // Проверяем на ошибки компиляции
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Ошибка компиляции шейдера:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader); // Удаляем шейдер в случае ошибки
        return null;
    }
    return shader;
}

//компилируем шейдеры
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

// ШАГ 2

function createProgram(gl, vertexShader, fragmentShader){
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error("Ошибка линковки программы:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program); // Удаляем программу в случае ошибки
        return null;
    }
    return program;
}

const program = createProgram(gl, vertexShader, fragmentShader);

// ШАГ 3

const positionAttributeLocation = gl.getAttribLocation(program, "aPosition");
if (positionAttributeLocation === -1) {
    console.error("Атрибут aPosition не найден в шейдерной программе.");
}

const triangleVertices = new Float32Array([
    0.0,  0.5,  // Вершина вверху
   -0.5, -0.5,  // Левая нижняя вершина
    0.5, -0.5   // Правая нижняя вершина
]);

// ШАГ 4

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

gl.vertexAttribPointer(
    positionAttributeLocation,  // Ссылка на атрибут
    2,                          // Количество компонентов на вершину (x, y)
    gl.FLOAT,                   // Тип данных
    false,                      // Нормализация
    0,                          // Шаг (stride)
    0                           // Смещение (offset)
);
gl.enableVertexAttribArray(positionAttributeLocation); // Включаем атрибут

//шаг 5

gl.useProgram(program);

// Очищаем canvas черным цветом
gl.clearColor(0.0, 0.0, 0.0, 1.0); // RGBA: черный
gl.clear(gl.COLOR_BUFFER_BIT);     // Очищаем буфер цвета

// Рисуем треугольник
gl.drawArrays(gl.TRIANGLES, 0, 3); // Тип примитива, начало, количество вершин
gl.bindBuffer(gl.ARRAY_BUFFER, null);             // Разбинг буфера (чистота кода)
