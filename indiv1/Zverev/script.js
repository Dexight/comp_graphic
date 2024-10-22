let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let points = [];
let polygons = [];
let dotRadius = 3;

canvas.addEventListener('click', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    points.push({ x, y });
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red'; 
    ctx.fill();
});

document.getElementById('build-hull').addEventListener('click', buildHull);

function buildHull() {
    if (points.length < 3) {
        alert('Недостаточно точек для построения оболочки');
        return;
    }

    // Сортируем точки по x-координате (при равенстве по y)
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    // Находим крайнюю левую и крайнюю правую точки
    let left = points[0];
    let right = points[points.length - 1];

    let aboveLine = [];
    let belowLine = [];

    for (let i = 0; i < points.length; i++) {
        if (cross(left, right, points[i]) > 0) {
            aboveLine.push(points[i]);  
        } else if (cross(left, right, points[i]) < 0) {
            belowLine.push(points[i]); 
        }
    }

    // Верхняя оболочка
    let upper = buildPartialHull([left, ...aboveLine, right], true); 

    // Нижняя оболочка
    let lower = buildPartialHull([left, ...belowLine, right], false); 

    // Объединяем
    const hull = upper.concat(lower);

    polygons.push(hull);

    // Отрисовываем оболочку
    drawPolygon(hull, 'black');

    // Отрисовываем красную линию поверх черной
    drawLine(left, right, 'white');
    drawLine(left, right, 'red');

    // Отображаем точки
    for (let i = 0; i < hull.length; i++) {
        ctx.beginPath();
        ctx.arc(hull[i].x, hull[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    points = [];
}

// Функция для построения части оболочки (верхней или нижней)
function buildPartialHull(points, isUpper) {
    let partialHull = [];

    for (let i = 0; i < points.length; i++) {
        while (partialHull.length >= 2 && 
               (isUpper ? cross(partialHull[partialHull.length - 2], partialHull[partialHull.length - 1], points[i]) > 0
                        : cross(partialHull[partialHull.length - 2], partialHull[partialHull.length - 1], points[i]) < 0)) {
            partialHull.pop();
        }
        partialHull.push(points[i]);
    }

    return partialHull;
}

function drawLine(pointA, pointB, color) {
    ctx.beginPath();
    ctx.moveTo(pointA.x, pointA.y);
    ctx.lineTo(pointB.x, pointB.y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

// Функция определения поворота (положительное значение для левого поворота, отрицательное для правого)
function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function drawPolygon(polygon, color) {
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = color; 
    ctx.stroke();
}

document.getElementById('clear-scene').addEventListener('click', clearScene);
function clearScene() {
    points = [];
    polygons = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Обработчик для удаления точки по клику правой кнопкой мыши
canvas.addEventListener('contextmenu', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    // Проверяем, находится ли клик внутри границы точки
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)) < dotRadius) {
        points.splice(i, 1); // Если клик внутри границы, удаляем точку из массива points

        ctx.clearRect(point.x - dotRadius, point.y - dotRadius, 2 * dotRadius, 2 * dotRadius); // Очистка квадратом

        break;
      }
    }

    event.preventDefault();
});
