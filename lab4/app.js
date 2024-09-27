let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let points = new Set();
let polygons = [];
let dotRadius = 3;
let polygonSelect = document.getElementById('polygon-select');
let selectedPolygonIndex = null;

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
});

document.getElementById('build-polygon').addEventListener('click', buildPolygon);

function buildPolygon() {
    if (points.size < 1) {
        alert('Недостаточно точек для построения полигона');
        return;
    }
    let polygonPoints = [...points];
    polygons.push(polygonPoints);
    drawPolygon(polygonPoints, 'black', 'black');

    // Добавляем новый полигон в выпадающий список
    let option = document.createElement('option');
    option.text = `Полигон ${polygons.length}`;
    option.value = polygons.length - 1;
    polygonSelect.add(option);

    points.clear();
}

function drawPolygon(polygon, lineColor, pointColor) {
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = lineColor;
    ctx.stroke();

    // Рисуем точки
    polygon.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = pointColor;
        ctx.fill();
    });
}

document.getElementById('clear-scene').addEventListener('click', clearScene);

function clearScene() {
    points.clear();
    polygons = [];
    polygonSelect.innerHTML = '<option value="" disabled selected>Выберите полигон</option>';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selectedPolygonIndex = null;
}

canvas.addEventListener('contextmenu', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    for (let point of points) {
        if (Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)) < dotRadius) {
            points.delete(point); // Удаляем точку из Set

            ctx.clearRect(point.x - dotRadius, point.y - dotRadius, 2 * dotRadius, 2 * dotRadius); // Очистка квадратом
            break;
        }
    }

    event.preventDefault();
});

// Обработчик выбора полигона из выпадающего списка
polygonSelect.addEventListener('change', (e) => {
    let selectedIndex = parseInt(e.target.value);

    // Очищаем сцену и рисуем все полигоны снова
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    polygons.forEach((polygon, index) => {
        let lineColor = (index === selectedIndex) ? 'blue' : 'black';
        let pointColor = (index === selectedIndex) ? 'blue' : 'black';
        drawPolygon(polygon, lineColor, pointColor);
    });

    selectedPolygonIndex = selectedIndex;
});
