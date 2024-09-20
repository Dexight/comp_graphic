// get canvas and context

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.fillStyle = 'black'

// get inputs
const x0Input = document.getElementById('x0');
const y0Input = document.getElementById('y0');
const x1Input = document.getElementById('x1');
const y1Input = document.getElementById('y1');
const button = document.getElementById('drawButton');

function setPixel(x, y){
    // const x_decart = x + canvas.width / 2; // переход к декартовой системе координат
    // const y_decart = canvas.height / 2 - y; // переход к декартовой системе координат
    // ctx.fillRect(x_decart, y_decart, 1, 1);   
    ctx.fillRect(x, y, 1, 1);
}

function bresenham(x0,y0,x1,y1){

    // if(Math.abs(x1 - x0) < Math.abs(y1 - y0)){
    //     [x0, y0] = [y0,x0];
    //     [x1, y1] = [y1,x1];

    // }

    if(x0 > x1){
        [x0,x1] = [x1,x0];
    }

    // if(y0 > y1){
    //     [y0,y1] = [y1,y0];
    // }

    let dx = Math.abs(x1-x0);
    let dy = Math.abs(y1-y0);
    let err = 0;
    let derr = dy + 1;
    let y = y0;
    let diry = y1 - y0;
    if (diry > 0)
        diry = 1;
    if (diry < 0)
        diry = -1;
    for(let x=x0; x<=x1; x++){
        setPixel(x, y);
        err += derr;
        if(err >= dx+1){
            y = y + diry;
            err -= dx + 1 
        }
    }
}

// Обработчик кнопки для рисования отрезка
drawButton.addEventListener('click', () => {
    // Получаем координаты из полей ввода
    const x0 = parseInt(x0Input.value);
    const y0 = parseInt(y0Input.value);
    const x1 = parseInt(x1Input.value);
    const y1 = parseInt(y1Input.value);

    // Очищаем canvas
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем отрезок
    bresenham(x0, y0, x1, y1);
});
