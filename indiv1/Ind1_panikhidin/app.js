const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dotRadius = 3;
const points = []; // массив для точек

// Добавляем точки по клику
canvas.addEventListener("click", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    let p = {x, y};
    if (!points.some(point => point.x === x && point.y === y)) {
        points.push(p);
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
});

// Отрисовать точку
function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();
}

// Функция для вычисления вектора (перекрестного произведения)
function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// Алгоритм Грэхема
function graham(points = points) {
    if (points.length >= 3) {
        // Берем за стартовую точку самую нижнюю или самую левую
        let start = points.reduce(
            (lowest, point) => point.y < lowest.y || (point.y === lowest.y && point.x < lowest.x) ? point : lowest
        );
        // Создаем копию массива и сортируем по углам
        let sortedPoints = points.slice().sort((a, b) => {
            const angleA = Math.atan2(a.y - start.y, a.x - start.x);
            const angleB = Math.atan2(b.y - start.y, b.x - start.x);
            return angleA - angleB;
        });

        let Convexhull = [start]; // Инициализируем оболочку стартовой точкой
        for (let i = 0; i < sortedPoints.length; i++) {
            while (Convexhull.length > 1 && crossProduct(Convexhull[Convexhull.length - 2], Convexhull[Convexhull.length - 1], sortedPoints[i]) <= 0) {
                Convexhull.pop(); // Убираем точки, которые не входят в оболочку
            }
            Convexhull.push(sortedPoints[i]); // Добавляем новую точку в оболочку
        }
        return Convexhull;
    } else {
        alert('Отметьте как минимум три точки мышкой на канве');
        return [];
    }
}

// Рисуем оболочку
function drawConvexHull(hull) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(point => drawPoint(point.x, point.y));

    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Кнопка для построения выпуклой оболочки
document.getElementById('buildHullButton').addEventListener('click', () => {
        const hull = graham(points);
        drawConvexHull(hull);
});

document.getElementById('clearButton').addEventListener('click', () => {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    points.length=0;
});