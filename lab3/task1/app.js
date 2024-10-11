
let isDrawing = false;
let x = 0;
let y = 0;

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

canvas.addEventListener('dblclick', (e) => {
    const fillX = e.offsetX;
    const fillY = e.offsetY;
    floodFillScanline(fillX, fillY, document.getElementById('selColor').value);
});

function drawLine(context, x1, y1, x2, y2) {
    context.filter = 'url(#remove-alpha)';
    context.beginPath();
    context.strokeStyle = document.getElementById('selColor').value;
    context.lineWidth = document.getElementById('selWidth').value;
    context.lineJoin = "round";
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.closePath();
    context.stroke();
}

function hexToRGBA(hex, alpha = 255) {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.slice(0, 2), 16) || 0; 
    const g = parseInt(hex.slice(2, 4), 16) || 0; 
    const b = parseInt(hex.slice(4, 6), 16) || 0; 

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function floodFillScanline(x, y, newColor) {
    context.filter = 'none';
    const oldColor = getPixelColor(x, y);

    if (oldColor === hexToRGBA(newColor)) { 
        return;     
    }
    
    let x1;
    let spanAbove, spanBelow;
    let stack = []; 
    stack.push({ x, y }); // Добавляем начальную точку в стек
    
    while (stack.length > 0) {
        const { x: currX, y: currY } = stack.pop();
        
        // Ищем границу слева
        x1 = currX;
        while (x1 >= 0 && getPixelColor(x1, currY) === oldColor) x1--;
        x1++; 
        
        spanAbove = spanBelow = false;
        
        // Заливаем пиксели вправо
        while (x1 < canvas.width && getPixelColor(x1, currY) === oldColor) {
            drawPixel(x1, currY, newColor);
        
            // Проверяем верхнюю строку
            if (!spanAbove && currY > 0 && getPixelColor(x1, currY - 1) === oldColor) {
                stack.push({ x: x1, y: currY - 1 });
                spanAbove = true;
            } else if (spanAbove && currY > 0 && getPixelColor(x1, currY - 1) !== oldColor) {
                spanAbove = false;
            }
        
            // Проверяем нижнюю строку
            if (!spanBelow && currY < canvas.height - 1 && getPixelColor(x1, currY + 1) === oldColor) {
                stack.push({ x: x1, y: currY + 1 });
                spanBelow = true;
            } else if (spanBelow && currY < canvas.height - 1 && getPixelColor(x1, currY + 1) !== oldColor) {
                spanBelow = false;
            }
        
            x1++;
        }
    }
    stack = []; 
}

function drawPixel(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
}

function getPixelColor(x, y) {
    const pixel = context.getImageData(x, y, 1, 1).data;
    return `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;
}

function clearArea() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
