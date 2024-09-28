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

document.getElementById('delete-polygon').addEventListener('click', deletePolygon);

function deletePolygon() {
    if (selectedPolygonIndex === null || selectedPolygonIndex === undefined) {
        alert('Выберите полигон для удаления');
        return;
    }

    // Удаляем выбранный полигон
    polygons.splice(selectedPolygonIndex, 1);

    // Обновляем выпадающий список
    polygonSelect.innerHTML = '<option value="" disabled selected>Выберите полигон</option>';
    polygons.forEach((_, index) => {
        let option = document.createElement('option');
        option.text = `Полигон ${index + 1}`;
        option.value = index;
        polygonSelect.add(option);
    });

    // Очищаем сцену и перерисовываем оставшиеся полигоны
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    polygons.forEach(polygon => drawPolygon(polygon, 'black', 'black'));

    // Сбрасываем выбранный полигон
    selectedPolygonIndex = null;
}

// произведение матрицы и точки
function multMatrixAndPoint(matrix, point){
    let x = point.x;
    let y = point.y;
    let resultX = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
    let resultY = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
    return { x: resultX, y: resultY };
}


function applyTransform(polygon, transformMatrix){
    return polygon.map(point => multMatrixAndPoint(transformMatrix, point));
}

// матрица смещения
function getTranslationMatrix(dx, dy) {
    return [
        [1, 0, dx],
        [0, 1, dy],
        [0, 0, 1]
    ];
}

function getRotationMatrix(phi, x, y){
    let cosPhi = Math.cos(phi);
    let sinPhi = Math.sin(phi);
    return [
        [cosPhi, -sinPhi, x*(1-cosPhi)+y*sinPhi],
        [sinPhi, cosPhi, y*(1-cosPhi)-x*sinPhi],
        [0, 0, 1]
    ]
}

function getScalingMatrix(sx, sy, cx, cy) {
    return [
        [sx, 0, cx * (1 - sx)],
        [0, sy, cy * (1 - sy)],
        [0, 0, 1]
    ];
}

function translatePoly(dx, dy){
    if(selectedPolygonIndex !==null){
        let matrix = getTranslationMatrix(dx, dy);
        let transPolygon = applyTransform(polygons[selectedPolygonIndex], matrix);
        polygons[selectedPolygonIndex] = transPolygon;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach(polygon => drawPolygon(polygon, 'black', 'black'));
    }
}

document.getElementById('translate-polygon').addEventListener('click', () => {
    let dx = parseFloat(document.getElementById('dx').value);
    let dy = parseFloat(document.getElementById('dy').value);
    translatePoly(dx, dy);
});

function RotatePoly(angle, x, y){
    if(selectedPolygonIndex !== null){
        let rad = (Math.PI / 180) * angle;
        let matrix = getRotationMatrix(rad, x, y);
        let transPolygon = applyTransform(polygons[selectedPolygonIndex], matrix)
        polygons[selectedPolygonIndex] = transPolygon;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach(polygon => drawPolygon(polygon, 'black', 'black'));
    }
}

document.getElementById('rotate-polygon').addEventListener('click', () => {
    let angle = parseFloat(document.getElementById('angle').value);
    let cx = parseFloat(document.getElementById('cx').value);
    let cy = parseFloat(document.getElementById('cy').value);
    RotatePoly(angle, cx, cy);
});

