// Получение контекста WebGL
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) { alert("WebGL не поддерживается!"); }

let x1 = 0;
let y1 = 1;
let x2 = -1;
let y2 = -1;
let x3 = 1;
let y3 = -1;
let color = "(0, 1, 0, 1)"
function draw()
{
    //================================| 1 Шаг |========================================

    // Вершинный шейдер (расположение каждой вершины треугольника на экране)
    const vertexShaderSource = "attribute vec4 aPosition; //позиция вершины \n void main() { gl_Position = aPosition; }";

    // Фрагментный шейдер (окрашивает каждый фрагмент)\
    const fragmentShaderSource = "precision mediump float; //точность для float чисел \n void main() { gl_FragColor = vec4" + color + "; }";

    // Инициализация шейдера
    function createShader(gl, type, source) 
    {
        const shader = gl.createShader(type); //Создаём
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
        {
            console.error("Ошибка компиляции шейдера:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Создание и компиляция шейдеров
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    //================================| 2 Шаг |========================================

    // Инициализация шейдерной программы
    function createShaderProgram(gl, vertexShader, fragmentShader) 
    {
        const p = gl.createProgram();
        gl.attachShader(p, vertexShader);
        gl.attachShader(p, fragmentShader);
        gl.linkProgram(p);

        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) 
        {
            console.error("Ошибка линковки шейдерной программы:", gl.getProgramInfoLog(p));
            gl.deleteProgram(p);
            return null;
        }

        return p;
    }

    // Создание шейдерной программы
    const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(shaderProgram);

    //================================| 3 Шаг |========================================

    // Получение ID атрибута
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    if (positionAttributeLocation === -1) 
    {
        console.error("Атрибут aPosition не найден в шейдерной программе.");
    }

    //================================| 4 Шаг |========================================

    // Инициализация VBO
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        x1,  y1,
        x2, y2,
        x3, y3
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Привязка атрибута
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    //================================| 5 Шаг |========================================

    // Очистка и отрисовка
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Чёрный фон
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //================================| 6 Шаг |========================================

    // Очистка ресурсов
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

//================================| Остальное |========================================

document.getElementById('X1').addEventListener('input', (e) => {
    x1 = parseFloat(e.target.value);
    draw();
});

document.getElementById('Y1').addEventListener('input', (e) => {
    y1 = parseFloat(e.target.value);
    draw();
});

document.getElementById('X2').addEventListener('input', (e) => {
    x2 = parseFloat(e.target.value);
    draw();
});

document.getElementById('Y2').addEventListener('input', (e) => {
    y2 = parseFloat(e.target.value);
    draw();
});

document.getElementById('X3').addEventListener('input', (e) => {
    x3 = parseFloat(e.target.value);
    draw();
});

document.getElementById('Y3').addEventListener('input', (e) => {
    y3 = parseFloat(e.target.value);
    draw();
});

document.getElementById('color').addEventListener('input', (e) => {
    function hexToRgbWebGL(hex) 
    {
        let bigint = parseInt(hex.slice(1), 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return "(" + r/255 + ", " + g/255 + ", " + b/255 + ", 1)";
    }
    
    color = hexToRgbWebGL(e.target.value);
    draw();
});

draw();