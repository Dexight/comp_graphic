let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
let polygons = [];
let dotRadius = 3;
let polygonSelect = document.getElementById('polygon-select');
let selectedPolygonIndex = null;
let edges = [];
let edgeSelect = document.getElementById('edge-select');
let selectedEdgeIndex = null;

document.getElementById('cx').addEventListener('input', drawRotationPoint);
document.getElementById('cy').addEventListener('input', drawRotationPoint);

document.getElementById('cx2').addEventListener('input', drawScalePoint);
document.getElementById('cy2').addEventListener('input', drawScalePoint);

function drawRotationPoint(redraw = true, isCenter = false, cx = 0, cy = 0) {
    if(!isCenter)
    {
        cx = parseFloat(document.getElementById('cx').value);
        cy = parseFloat(document.getElementById('cy').value);
    }

    // Очищаем сцену и перерисовываем все полигоны (при необходимости)
    if (redraw)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach((polygon, index) => {
            let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            drawPolygon(polygon, lineColor, pointColor);
        });
    }

    if (!isNaN(cx) && !isNaN(cy)) {
        // Рисуем крупную фиолетовую точку с белым центром
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI); //радиус = 4
        ctx.fillStyle = 'purple';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI); //радиус = 2
        ctx.fillStyle = 'white';
        ctx.fill();
    }
}

function drawScalePoint(redraw = true, isCenter = false, cx = 0, cy = 0) {
    if(!isCenter)
    {
        cx = parseFloat(document.getElementById('cx2').value);
        cy = parseFloat(document.getElementById('cy2').value);
    }

    // Очищаем сцену и перерисовываем все полигоны (при необходимости)
    if (redraw)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach((polygon, index) => {
            let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            drawPolygon(polygon, lineColor, pointColor);
        });
    }

    if (!isNaN(cx) && !isNaN(cy)) {
        // Рисуем крупную фиолетовую точку с белым центром
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI); //радиус = 4
        ctx.fillStyle = 'lightgreen';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI); //радиус = 2
        ctx.fillStyle = 'white';
        ctx.fill();
    }
}

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

function drawPolygon(polygon, lineColor, pointColor, highlightEdge = false, highlightEdgeIndex = null) {
    for (let i = 0; i < polygon.length; i++) {
        let start = polygon[i];
        let end = polygon[(i + 1) % polygon.length];

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        let edgeStrokeStyle = lineColor;

        if (highlightEdge && selectedEdgeIndex !== null && i === highlightEdgeIndex) {
            edgeStrokeStyle = 'orange';
        }

        ctx.strokeStyle = edgeStrokeStyle;
        ctx.stroke();
    }

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
    edgeSelect.innerHTML = '<option value="" disabled selected>Выберите грань</option>';
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
    edges = [];
    selectedEdgeIndex = null;
    edgeSelect.innerHTML = '<option value="" disabled selected>Выберите грань</option>';
    
    polygons.forEach((polygon, index) => {
        let lineColor = (index === selectedIndex) ? 'blue' : 'black';
        let pointColor = (index === selectedIndex) ? 'blue' : 'black';
        drawPolygon(polygon, lineColor, pointColor);
        if (index === selectedIndex && polygon.length > 1)
        {
            for (let i = 0; i < polygon.length; i++) {
                let nextIndex = (i === polygon.length - 1) ? 0 : i + 1;
                edges.push([polygon[i].x, polygon[i].y, polygon[nextIndex].x, polygon[nextIndex].y]);
                // Добавляем новую грань в выпадающий список
                let option = document.createElement('option');
                option.text = `Грань ${edges.length}`;
                option.value = edges.length - 1;
                edgeSelect.add(option);
            }
            console.log(edges);
        }
    });
    drawRotationPoint(false);
    drawScalePoint(false);
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
    edgeSelect.innerHTML = '<option value="" disabled selected>Выберите грань</option>';
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
    if(selectedPolygonIndex !== null && selectedPolygonIndex !== undefined){
        let matrix = getTranslationMatrix(dx, dy);
        let transPolygon = applyTransform(polygons[selectedPolygonIndex], matrix);
        polygons[selectedPolygonIndex] = transPolygon;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach((polygon, index) => {
            let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            drawPolygon(polygon, lineColor, pointColor);
        });
        drawRotationPoint(false);
        drawScalePoint(false);
    }
    else
    {
        alert('Выберите полигон для смещения');
        return;
    }
}

document.getElementById('translate-polygon').addEventListener('click', () => {
    let dx = parseFloat(document.getElementById('dx').value);
    let dy = parseFloat(document.getElementById('dy').value);
    translatePoly(dx, dy);
});

function rotatePoly(angle, x, y, isCenter = false){
    if(selectedPolygonIndex !== null && selectedPolygonIndex !== undefined){
        let rad = (Math.PI / 180) * angle;
        let matrix = getRotationMatrix(rad, x, y);
        let transPolygon = applyTransform(polygons[selectedPolygonIndex], matrix)
        polygons[selectedPolygonIndex] = transPolygon;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach((polygon, index) => {
            let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            drawPolygon(polygon, lineColor, pointColor);
        });
        drawRotationPoint(!isCenter, isCenter, x, y);
    }
    else
    {
        alert('Выберите полигон для поворота');
        return;
    }
}

document.getElementById('rotate-polygon').addEventListener('click', () => {
    let angle = parseFloat(document.getElementById('angle').value);
    let cx = parseFloat(document.getElementById('cx').value);
    let cy = parseFloat(document.getElementById('cy').value);
    rotatePoly(angle, cx, cy);
});


function scalePoly(sx, sy, cx, cy, isCenter = false){
    if(selectedPolygonIndex !== null && selectedPolygonIndex !== undefined){
        let matrix = getScalingMatrix(sx, sy, cx, cy);
        let transPolygon = applyTransform(polygons[selectedPolygonIndex], matrix);
        polygons[selectedPolygonIndex] = transPolygon;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        polygons.forEach((polygon, index) => {
            let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
            drawPolygon(polygon, lineColor, pointColor);
        });
        drawScalePoint(!isCenter, isCenter, cx, cy);
    }
    else
    {
        alert('Выберите полигон для масштабирования');
        return;
    }
}

document.getElementById('scale-polygon').addEventListener('click', () => {
    let sx = parseFloat(document.getElementById('sx').value);
    let sy = parseFloat(document.getElementById('sy').value);
    let cx = parseFloat(document.getElementById('cx2').value);
    let cy = parseFloat(document.getElementById('cy2').value);
    scalePoly(sx, sy, cx, cy);
});

function getPolyCenter(polygon){
    let sumX = 0, sumY = 0;
    polygon.forEach(point => {sumX += point.x; sumY+=point.y;});
    return  [Math.round(sumX / polygon.length), Math.round(sumY / polygon.length)]; 
}

document.getElementById('rotate-polygon-center').addEventListener('click', () => {
    if(selectedPolygonIndex !== null && selectedPolygonIndex !== undefined){
        let angle = parseFloat(document.getElementById('angle-center').value);
        let [cx,cy] = getPolyCenter(polygons[selectedPolygonIndex]);
        rotatePoly(angle, cx, cy, true);
    }
    else
    {
        alert('Выберите полигон для поворота');
        return;
    }
});

document.getElementById('scale-polygon-center').addEventListener('click', () => {
    if(selectedPolygonIndex !== null && selectedPolygonIndex !== undefined){
        let sx = parseFloat(document.getElementById('sx2').value);
        let sy = parseFloat(document.getElementById('sy2').value);
        let [cx, cy] = getPolyCenter(polygons[selectedPolygonIndex]);
        scalePoly(sx, sy, cx, cy, true);
    }
    else
    {
        alert('Выберите полигон для масштабирования');
        return;
    }
});

edgeSelect.addEventListener('change', (e) => {
    selectedEdgeIndex = parseInt(e.target.value);

    // Очищаем сцену и перерисовываем полигоны
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    polygons.forEach((polygon, index) => {
        let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
        let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
        let highlightEdge = (index === selectedPolygonIndex);
        drawPolygon(polygon, lineColor, pointColor, highlightEdge, selectedEdgeIndex);
    });

});