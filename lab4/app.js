let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let points = new Set();
let polygons = [];
let dotRadius = 3;

canvas.addEventListener('click', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    let point = { x, y };

    if (![...points].some(p => p.x === x && p.y === y)) {
        points.add(point);
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
    console.log("points size = " + points.size);
});

document.getElementById('build-polygon').addEventListener('click', buildPolygon);

function buildPolygon() {
    if (points.size < 1) {
        alert('Недостаточно точек для построения полигона');
        return;
    }
    let polygonPoints = [...points];
    polygons.push(polygonPoints);
    drawPolygon(polygonPoints);

    // Перекрашиваем точки полигона в черный
    polygonPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    });

    points.clear();
}

function drawPolygon(polygon) {
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

document.getElementById('clear-scene').addEventListener('click', clearScene);

function clearScene() {
    points.clear();
    polygons = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('contextmenu', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    // Ищем точку в Set
    for (let point of points) {
        if (Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)) < dotRadius) {
            points.delete(point); // Удаляем точку из Set

            ctx.clearRect(point.x - dotRadius, point.y - dotRadius, 2 * dotRadius, 2 * dotRadius); // Очистка квадратом

            break;
        }
    }

    event.preventDefault();
});
