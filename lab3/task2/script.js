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
const button2 = document.getElementById('drawButton2');

function setPixel(x, y){
    // const x_decart = x + canvas.width / 2; // переход к декартовой системе координат
    // const y_decart = canvas.height / 2 - y; // переход к декартовой системе координат
    // ctx.fillRect(x_decart, y_decart, 1, 1);   
    ctx.fillRect(x, y, 1, 1);
}

function bresenham(x0,y0,x1,y1){

    if(Math.abs(x1 - x0) < Math.abs(y1 - y0)){
        [x0, y0] = [y0,x0];
        [x1, y1] = [y1,x1];

    }

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

function setPixelAlpha(steep, x, y, alpha){
    if(steep){
        [x,y] = [y,x];
    }
    ctx.fillStyle = 'rgba(0,0,0,${alpha})';
    ctx.fillRect(x, y, 1, 1); 
}

function Woo(x0,y0,x1,y1){
    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if(steep){
        console.log(steep)
        [x0,y0] = [y0,x0];
        [x1,y1] = [y1,x1];
    }
    if(x0 > x1){
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    console.log(x0, y0, x1, y1)

    let dx = x1 - x0;
    let dy = y1 - y0;
    let gradient  = dy /dx;

    let xend = Math.round(x0);
    let yend = y0 + gradient * (xend - x0);
    let xgap = 1 - (x0 - Math.floor(x0));
    let xpixel1 = xend;
    let ypixel1 = Math.floor(yend);

    setPixelAlpha(steep, xpixel1, ypixel1, (1 - (yend - Math.floor(yend))) * xgap); 
    setPixelAlpha(steep, xpixel1, ypixel1 + 1, (yend - Math.floor(yend)) * xgap); 

    let intery = yend + gradient;
    for (let x = xpixel1 + 1; x <= Math.round(x1); x++) {
        let yfloor = Math.floor(intery);
        setPixelAlpha(steep, x, yfloor, 1 - (intery - yfloor)); 
        setPixelAlpha(steep, x, yfloor + 1, intery - yfloor); 
        intery += gradient;
    }
    xend = Math.round(x1);
    yend = y1 + gradient * (xend - x1);
    xgap = x1 - Math.floor(x1);  
    let xpixel2 = xend;
    let ypixel2 = Math.floor(yend);
    setPixelAlpha(steep, xpixel2, ypixel2, (1 - (yend - Math.floor(yend))) * xgap); 
    setPixelAlpha(steep, xpixel2, ypixel2 + 1, (yend - Math.floor(yend)) * xgap); 
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

button2.addEventListener('click', () => {
    // Получаем координаты из полей ввода
    const x0 = parseInt(x0Input.value);
    const y0 = parseInt(y0Input.value);
    const x1 = parseInt(x1Input.value);
    const y1 = parseInt(y1Input.value);

    // Очищаем canvas
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем отрезок
    Woo(x0, y0, x1, y1);
});