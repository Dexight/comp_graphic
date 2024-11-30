// Получение контекста WebGL
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");
const selectFigure = document.getElementById('figure');
const selectColor = document.getElementById('colorSelector');
const chooseColor = document.getElementById('chooseColor');
chooseColor.style.display = 'none';
const quadranglePanel = document.getElementById('quadranglePointsChangePanel');
const pentagonPanel = document.getElementById('pentagonRadiusChangePanel');
const veerPanel = document.getElementById('veerCountsPanel');

if (!gl) { alert("WebGL не поддерживается!"); }

let color = [0, 1, 0, 1];

// основной класс фигуры
class Figure{
    constructor(vertexShader, fragmentShader, positions)
    {
        this.vertexShaderSource = vertexShader;
        this.fragmentShaderSource = fragmentShader;//переделать потом в зависимости от выбранного цвета, пока что просто зелёный
        this.positions = positions;
    }

    draw()
    {
        //================================| 1 Шаг |========================================

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
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderSource);

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

        if (chooseColor.style.display === 'inline')
        {
            const uColorLocation = gl.getUniformLocation(shaderProgram, "uColor")
            gl.uniform4fv(uColorLocation, color);
        }
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

        const positions = this.positions;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Привязка атрибута
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        //================================| 5 Шаг |========================================

        // Очистка и отрисовка
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Чёрный фон
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.positions.length/2);

        //================================| 6 Шаг |========================================

        // Очистка ресурсов
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(shaderProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

//хардкод - наше всё

const vertexShader = `attribute vec4 aPosition; //позиция вершины
                              void main() { gl_Position = aPosition; }`;

const constFragmentShader = `precision mediump float; //точность для float чисел
                             void main() { gl_FragColor = vec4(0, 1, 0, 1); }`
const uniformFragmentShader = `precision mediump float; //точность для float чисел
                               uniform vec4 uColor; // передаём цвет
                               void main() { gl_FragColor = uColor; }`

let usedFragmentShader = constFragmentShader;
// квадрат
let quadrangle_x1 = -0.5;
let quadrangle_y1 = 0.5;
let quadrangle_x2 = 0.5;
let quadrangle_y2 = 0.5;
let quadrangle_x3 = 0.5;
let quadrangle_y3 = -0.5;
let quadrangle_x4 = -0.5;
let quadrangle_y4 = -0.5;

let quadrangle;
function initQuadrangle()
{
    quadrangle = new Figure(vertexShader,
                            usedFragmentShader,
                            [quadrangle_x1, quadrangle_y1,
                            quadrangle_x2, quadrangle_y2,
                            quadrangle_x3, quadrangle_y3,
                            quadrangle_x4, quadrangle_y4])
}

//пятиугольник

let pentagon_x1 = 0;
let pentagon_y1 = 1;

let pentagon;
function initPentagon()
{ 
    let pentagon_x2 = Math.sin(72 * Math.PI / 180)*pentagon_y1;
    let pentagon_y2 = Math.cos(72 * Math.PI / 180)*pentagon_y1;
    let pentagon_x3 = Math.sin(36 * Math.PI / 180)*pentagon_y1;
    let pentagon_y3 = -Math.cos(36 * Math.PI / 180)*pentagon_y1;
    let pentagon_x4 = -pentagon_x3;
    let pentagon_y4 = pentagon_y3;
    let pentagon_x5 = -pentagon_x2;
    let pentagon_y5 = pentagon_y2;
    pentagon = new Figure(vertexShader,
                          usedFragmentShader,
                          [pentagon_x1, pentagon_y1,
                          pentagon_x2, pentagon_y2,
                          pentagon_x3, pentagon_y3,
                          pentagon_x4, pentagon_y4,
                          pentagon_x5, pentagon_y5])
}

// веер
let veer;
let n = 3; //количество разбиений половинки веера
// нижняя точка
let veer_x1 = 0;
let veer_y1 = -0.75;
function initVeer()
{
    let veer_points = [veer_x1, veer_y1];

    // остальные слева направо
    let y_split = 0;
    for (let i = 0; i <= n; i++)//левая половина
    {
        veer_points.push((-1/n)*(n-i));
        veer_points.push(y_split);
        y_split += 0.75/n-i*(0.75/n/n);
    }

    let k = 1;
    for (let i = (n+2)*2-3; i >= 3; i -= 2)//правая половина
    {
        veer_points.push((1/n)*k);
        k++;
        veer_points.push(veer_points[i]);
    }

    veer = new Figure(vertexShader,
                      usedFragmentShader,
                      veer_points)
}

initQuadrangle();
initVeer();
initPentagon();
quadrangle.draw();
//================================| Остальное |========================================

// Обработчик выпадающего списка фигур
selectFigure.addEventListener('change', (e) => {
    const selectedValue = e.target.value;

    switch (selectedValue)
    {
        case "4angle": initQuadrangle();
                       quadrangle.draw(); 
                       quadranglePanel.style.display = 'flex'; 
                       veerPanel.style.display = 'none'; 
                       pentagonPanel.style.display = 'none';
                       break;
        case "veer":   initVeer()
                       veer.draw();
                       quadranglePanel.style.display = 'none';
                       veerPanel.style.display = 'flex'; 
                       pentagonPanel.style.display = 'none';
                       break;
        case "5angle": initPentagon();
                       pentagon.draw(); 
                       quadranglePanel.style.display = 'none';
                       veerPanel.style.display = 'none';
                       pentagonPanel.style.display = 'flex';
                       break;
    }
});

// Обработчик выпадающего списка цветов
selectColor.addEventListener('change', (e) => {
    const selectedValue = e.target.value;

    switch (selectedValue)
    {
        case "constant": usedFragmentShader = constFragmentShader; 
                         chooseColor.style.display = "none"; 
                         break;
        case "uniform":  usedFragmentShader = uniformFragmentShader; 
                         chooseColor.style.display = "inline"; 
                         break;
        case "gradient": chooseColor.style.display = "none"; 
                         break; // TODO
    }

    selectFigure.dispatchEvent(new Event("change"));
});

document.getElementById('X1').addEventListener('input', (e) => {
    quadrangle_x1 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('Y1').addEventListener('input', (e) => {
    quadrangle_y1 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('X2').addEventListener('input', (e) => {
    quadrangle_x2 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('Y2').addEventListener('input', (e) => {
    quadrangle_y2 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('X3').addEventListener('input', (e) => {
    quadrangle_x3 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('Y3').addEventListener('input', (e) => {
    quadrangle_y3 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('X4').addEventListener('input', (e) => {
    quadrangle_x4 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('Y4').addEventListener('input', (e) => {
    quadrangle_y4 = parseFloat(e.target.value);
    initQuadrangle();
    quadrangle.draw();
});

document.getElementById('R').addEventListener('input', (e) => {
    pentagon_y1 = parseFloat(e.target.value);
    initPentagon();
    pentagon.draw();
});

document.getElementById('N').addEventListener('input', (e) => {
    n = parseInt(e.target.value);
    initVeer();
    veer.draw();
});

document.getElementById('bottom_point').addEventListener('input', (e) => {
    veer_y1 = parseFloat(e.target.value);
    initVeer();
    veer.draw();
});

document.getElementById('chooseColor').addEventListener('input', (e) => {
    function hexToRgbWebGL(hex)
    {
        let bigint = parseInt(hex.slice(1), 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return [r/255, g/255, b/255, 1];
    }
    
    color = hexToRgbWebGL(e.target.value);
    selectFigure.dispatchEvent(new Event("change"));
});