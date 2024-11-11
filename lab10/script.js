function resizeCanvas() {
    let canvas = document.getElementById('myCanvas');
    canvas.width = window.innerWidth;
    canvas.height = 500;
}

// Функция для рисования пустого треугольника
function drawTriangle() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    
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
    document.getElementById('colorInputs').style.display = 'block';
}

function buttonDrawGradient() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x1 = parseInt(document.getElementById('x1').value);
    let y1 = parseInt(document.getElementById('y1').value);
    let x2 = parseInt(document.getElementById('x2').value);
    let y2 = parseInt(document.getElementById('y2').value);
    let x3 = parseInt(document.getElementById('x3').value);
    let y3 = parseInt(document.getElementById('y3').value);

    let color1 = hexToRgb(document.getElementById('color1').value);
    let color2 = hexToRgb(document.getElementById('color2').value);
    let color3 = hexToRgb(document.getElementById('color3').value);

    drawGradientTriangle(ctx, x1, y1, x2, y2, x3, y3, color1, color2, color3);
}

function drawGradientTriangle(ctx, x1, y1, x2, y2, x3, y3, color1, color2, color3) {
    // Ищем макс и мин Y треугольника
    let minY = Math.min(y1, y2, y3);
    let maxY = Math.max(y1, y2, y3);

    for (let y = minY; y <= maxY; y++) {
        let intersections = []; // пересечения

        // Для каждого Y нахожу пересечения с сторонами треугольника -> вычисляю X и цвета
        if (y1 !== y2 && y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) {
            let t = (y - y1) / (y2 - y1); //Смотрим на положения текущего Y в зависимости от соответствующих вершин
            intersections.push({
                x: x1 + t * (x2 - x1),
                color: lerpColor(color1, color2, t)
            });
        }

        if (y2 !== y3 && y >= Math.min(y2, y3) && y <= Math.max(y2, y3)) {
            let t = (y - y2) / (y3 - y2);
            intersections.push({
                x: x2 + t * (x3 - x2),
                color: lerpColor(color2, color3, t)
            });
        }

        if (y3 !== y1 && y >= Math.min(y3, y1) && y <= Math.max(y3, y1)) {
            let t = (y - y3) / (y1 - y3);
            intersections.push({
                x: x3 + t * (x1 - x3),
                color: lerpColor(color3, color1, t)
            });
        }

        // Если строка текущего Y пересекает 2 стороны
        if (intersections.length === 2) {
            let [p1, p2] = intersections;
            if (p1.x > p2.x) [p1, p2] = [p2, p1];// Сохраняем последовательнось пересечения

            // Заполнение цветом Y по X
            for (let x = Math.round(p1.x); x <= Math.round(p2.x); x++) {
                let t = (x - p1.x) / (p2.x - p1.x); //смотрим на положение текущего Х от Х-ов 1 и 2 пересечения
                let color = lerpColor(p1.color, p2.color, t);

                // Рисуем пиксель
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

// Вычисление цвета
function lerpColor(color1, color2, t) {
    return {
        r: Math.round(color1.r + t * (color2.r - color1.r)),
        g: Math.round(color1.g + t * (color2.g - color1.g)),
        b: Math.round(color1.b + t * (color2.b - color1.b))
    };
}

function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
