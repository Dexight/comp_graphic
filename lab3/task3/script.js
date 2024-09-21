function resizeCanvas() {
    let canvas = document.getElementById('myCanvas');
    canvas.width = window.innerWidth;
    canvas.height = 500;
}

// Функция для рисования треугольника
function drawTriangle() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    
    // Очищаем предыдущий рисунок
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x1 = parseInt(document.getElementById('x1').value);
    let y1 = parseInt(document.getElementById('y1').value);
    let x2 = parseInt(document.getElementById('x2').value);
    let y2 = parseInt(document.getElementById('y2').value);
    let x3 = parseInt(document.getElementById('x3').value);
    let y3 = parseInt(document.getElementById('y3').value);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);

    ctx.closePath();

    ctx.strokeStyle = 'black';
    ctx.stroke();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();