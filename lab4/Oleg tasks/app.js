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
const checkboxLabel = document.getElementById('direction-label');
const edgeButtons = document.getElementById('edge-buttons');
let direction = 1;
const findPositionButton = document.getElementById('find-position');

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

        //красные точки оставляем на месте
        let dots = [...points];
        for (let i = 0; i < points.size; i++)
        {
            ctx.beginPath();
            ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
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

        //красные точки оставляем на месте
        let dots = [...points];
        for (let i = 0; i < points.size; i++)
        {
            ctx.beginPath();
            ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
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
    findPositionButton.style.display = 'inline';
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
    findPositionButton.style.display = 'none';
}

function drawPolygon(polygon, lineColor, pointColor, highlightEdge = false, highlightEdgeIndex = null) {
    if (polygon.length !== 2){
        for (let i = 0; i < polygon.length; i++) {
            let start = polygon[i];
            let end = polygon[(i + 1) % polygon.length];

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);

            let edgeStrokeStyle = lineColor;

            if (highlightEdge && selectedEdgeIndex !== null && i === highlightEdgeIndex)
                edgeStrokeStyle = 'orange';

            ctx.strokeStyle = edgeStrokeStyle;
            ctx.stroke();
        }
    }
    else{
        let start = polygon[0]
        let end = polygon[1];

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        let edgeStrokeStyle = lineColor;

        if (highlightEdge && selectedEdgeIndex !== null && highlightEdgeIndex !== null)
            edgeStrokeStyle = 'orange';

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
    edgeButtons.style.display = 'none';
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
    edgeButtons.style.display = 'none';
    
    polygons.forEach((polygon, index) => {
        let lineColor = (index === selectedIndex) ? 'blue' : 'black';
        let pointColor = (index === selectedIndex) ? 'blue' : 'black';
        drawPolygon(polygon, lineColor, pointColor);
        
        if (index === selectedIndex && polygon.length === 2)
        {
                edges.push([polygon[0].x, polygon[0].y, polygon[1].x, polygon[1].y]);
                // Добавляем новую грань в выпадающий список
                let option = document.createElement('option');
                option.text = `Грань ${edges.length}`;
                option.value = edges.length - 1;
                edgeSelect.add(option);
        }

        if (index === selectedIndex && polygon.length > 2)
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
        }
    });
    drawRotationPoint(false);
    drawScalePoint(false);
    //красные точки оставляем на месте
    let dots = [...points];
    for (let i = 0; i < points.size; i++)
    {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
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
    edgeButtons.style.display = 'none';

    polygons.forEach((_, index) => {
        let option = document.createElement('option');
        option.text = `Полигон ${index + 1}`;
        option.value = index;
        polygonSelect.add(option);
    });

    // Очищаем сцену и перерисовываем оставшиеся полигоны
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    polygons.forEach(polygon => drawPolygon(polygon, 'black', 'black'));

    selectedPolygonIndex = null;
    
    //красные точки оставляем на месте
    let dots = [...points];
    for (let i = 0; i < points.size; i++)
    {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
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
        points.clear();
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

// Выбор грани из списка
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
    edgeButtons.style.display = 'flex';
    
    // Красные точки оставляем на месте
    let dots = [...points];
    for (let i = 0; i < points.size; i++)
    {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    // Рисуем направление вектора (треугольник-маркер)
    drawEdgeMarker(edges[selectedEdgeIndex], 15);
});

//ПЕРЕСЕЧЕНИЕ ПРЯМЫХ
document.getElementById('find-intersections').addEventListener('click', findIntersections);

function findIntersections() {
    const intersections = [];

    const selectedEdge = edges[selectedEdgeIndex];
    const edgeStart = { x: selectedEdge[0], y: selectedEdge[1] };
    const edgeEnd = { x: selectedEdge[2], y: selectedEdge[3] };

    // Проходим по всем полигонам и их граням
    polygons.forEach(polygon => {
        const polygonEdges = [];

        for (let i = 0; i < polygon.length; i++) {
            const start = polygon[i];
            const end = polygon[(i + 1) % polygon.length];
            polygonEdges.push([start, end]);
        }

        polygonEdges.forEach(edge => {
            const intersection = linesIntersect(edge[0], edge[1], edgeStart, edgeEnd);
            if (intersection) {
                intersections.push(intersection);
            }
        });
    });

    // Отображаем точки пересечения на canvas
    intersections.forEach(intersect => {
        ctx.beginPath();
        ctx.arc(intersect.x, intersect.y, dotRadius+2, 0, 2 * Math.PI);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(intersect.x, intersect.y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    });

    //красные точки оставляем на месте
    let dots = [...points];
    for (let i = 0; i < points.size; i++)
    {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}

function linesIntersect(p1, p2, p3, p4) {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y); // детерминант на основе точек отрезка
    if (det === 0) return null; // Линии параллельны
    
    const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p3.y - p1.y)) / det; //параметр 1ой прямой
    const u = -((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / det; //параметр 2ой прямой (-1*... для соблюдения векторного представления)

    //Логика: Если оба параметра находятся в диапазоне [0, 1], значит, отрезки пересекаются
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersectX = p1.x + t * (p2.x - p1.x);
        const intersectY = p1.y + t * (p2.y - p1.y);
        return { x: intersectX, y: intersectY };
    }

    return null; // Нет пересечения
}

//ПОЛОЖЕНИЕ ТОЧКИ ОТНОСИТЕЛЬНО ПРЯМОЙ

// Обработчик чекбокса
document.querySelector('input[name="direction"]').addEventListener('change', (e) => {
    direction = (e.target.checked)? -1 : 1; // Если чекбокс активирован
    // Рисуем направление вектора (треугольник-маркер)
    drawEdgeMarker(edges[selectedEdgeIndex], 15);
});

document.getElementById('find-position').addEventListener('click', findPosition);
function findPosition() {
    const selectedEdge = edges[selectedEdgeIndex];
    let edgeStart = { x: selectedEdge[0], y: selectedEdge[1] };
    let edgeEnd = { x: selectedEdge[2], y: selectedEdge[3] };

    let dots = [...points];
    let pointX = dots[dots.length - 1].x;
    let pointY = dots[dots.length - 1].y;

    // Вычисляем векторное произведение = (x2−x1)*(py−y1)−(y2−y1)*(px−x1)
    let vectorProduct = (edgeEnd.x - edgeStart.x) * (pointY - edgeStart.y) - (edgeEnd.y - edgeStart.y) * (pointX - edgeStart.x);
    vectorProduct *= direction;
    if (vectorProduct > 0) {
        console.log("left");
    } else if (vectorProduct < 0) {
        console.log("right");
    } else {
        console.log("on the line");
    }

    // Красные точки оставляем на месте
    for (let i = 0; i < points.size - 1; i++) {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    // Последнюю точку выделяем
    ctx.beginPath();
    ctx.arc(dots[dots.length - 1].x, dots[dots.length - 1].y, dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dots[dots.length - 1].x, dots[dots.length - 1].y, dotRadius - 1, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}

function drawEdgeMarker(edge, size) {
    let x1 = edge[0];
    let y1 = edge[1];

    let x2 = edge[2];
    let y2 = edge[3];

    // Очищаем сцену и перерисовываем полигоны
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    polygons.forEach((polygon, index) => {
        let lineColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
        let pointColor = (index === selectedPolygonIndex) ? 'blue' : 'black';
        let highlightEdge = (index === selectedPolygonIndex);
        drawPolygon(polygon, lineColor, pointColor, highlightEdge, selectedEdgeIndex);
    });

    // Вычисляем вектор направления
    if (direction === -1){
        let dx = x2 - x1;
        let dy = y2 - y1;
        let angle = Math.atan2(dy, dx); // Угол в радианах

        // Определяем координаты вершин треугольника
        let triangleBaseX1 = x2 - size * Math.cos(angle - Math.PI / 6);
        let triangleBaseY1 = y2 - size * Math.sin(angle - Math.PI / 6);
        let triangleBaseX2 = x2 - size * Math.cos(angle + Math.PI / 6);
        let triangleBaseY2 = y2 - size * Math.sin(angle + Math.PI / 6);

        ctx.beginPath();
        ctx.moveTo(x2, y2); // Конечная точка
        ctx.lineTo(triangleBaseX1, triangleBaseY1); // Левая точка
        ctx.lineTo(triangleBaseX2, triangleBaseY2); // Правая точка
        ctx.closePath();
    }
    else{
        let dx = x1 - x2;
        let dy = y1 - y2;
        let angle = Math.atan2(dy, dx); // Угол в радианах

        // Определяем координаты вершин треугольника
        let triangleBaseX1 = x1 - size * Math.cos(angle - Math.PI / 6);
        let triangleBaseY1 = y1 - size * Math.sin(angle - Math.PI / 6);
        let triangleBaseX2 = x1 - size * Math.cos(angle + Math.PI / 6);
        let triangleBaseY2 = y1 - size * Math.sin(angle + Math.PI / 6);

        ctx.beginPath();
        ctx.moveTo(x1, y1); // Конечная точка
        ctx.lineTo(triangleBaseX1, triangleBaseY1); // Левая точка
        ctx.lineTo(triangleBaseX2, triangleBaseY2); // Правая точка
        ctx.closePath();
    }
    // Заливка треугольника
    ctx.fillStyle = 'orange'; // Цвет маркера
    ctx.fill();

    // Обводка треугольника
    ctx.strokeStyle = 'orange';
    ctx.stroke();

    // Красные точки оставляем на месте
    let dots = [...points];
    for (let i = 0; i < dots.length; i++) {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}
