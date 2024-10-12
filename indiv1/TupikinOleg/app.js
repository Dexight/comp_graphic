let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
let cur_points;
let alifeEdges = new Set();
let deadEdges = new Set();
let dotRadius = 3;

function arraysEqual(a, b) 
{
    for (let i = 0; i < a.length; i++) 
      if (a[i].x !== b[i].x || a[i].y != b[i].y) return false;

    return true;
}

// Рисование точек
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

// Очистка сцены
document.getElementById('clear-scene').addEventListener('click', clearScene);
function clearScene() {
    points.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.getElementById('build-triangular').addEventListener('click', buildTriangular);

function buildTriangular() 
{
    if (points.size < 3) {
        alert('Недостаточно точек для триангуляции');
        return;
    }

    let [v1, v2] = chooseVector();
    alifeEdges.add([v1, v2]); // Первое ребро

    while (alifeEdges.size != 0)
    {
        let cur_edge = Array.from(alifeEdges).pop();

        cur_points = new Set(Array.from(points)); //cur_points = points
        cur_points.delete(cur_edge[0]);
        cur_points.delete(cur_edge[1]);

        rightPoints = findRightPoints(cur_edge[0], cur_edge[1]);

        if (rightPoints.length === 0) {
            alifeEdges.delete(cur_edge);
            deadEdges.add(cur_edge);
            continue;
        }

        // Середина ребра
        let mid1 = { x: (cur_edge[0].x + cur_edge[1].x) / 2, y: (cur_edge[0].y + cur_edge[1].y) / 2 };

        // Перпедликуляр ребра
        let slope1 = -(cur_edge[1].x - cur_edge[0].x) / (cur_edge[1].y - cur_edge[0].y);

        for (let rp of rightPoints) 
        {
            // Середина второго ребра
            let mid2 = { x: (cur_edge[1].x + rp.x) / 2, y: (cur_edge[1].y + rp.y) / 2 };
            
            // Перпендикуляр второго ребра
            let slope2 = -(rp.x - cur_edge[1].x) / (rp.y - cur_edge[1].y);

            // Уравнения прямых
            let b1 = mid1.y - slope1 * mid1.x;
            let b2 = mid2.y - slope2 * mid2.x;

            // Находим точку пересечения - центр описанной окружности
            let centerX = (b2 - b1) / (slope1 - slope2);
            let centerY = slope1 * centerX + b1;
            
            // Радиус окружности
            let r = Math.sqrt((centerX - cur_edge[0].x) ** 2 + (centerY - cur_edge[0].y) ** 2);
            
            // Проверяем, находятся ли точки внутри описанной окружности
            let hasPointsInside = false;

            points.delete(cur_edge[0]);
            points.delete(cur_edge[1]);
            points.delete(rp);
            let otherPoints = Array.from(points);
            for (let p of otherPoints)
            {
                let distToCenter = Math.sqrt((centerX - p.x) ** 2 + (centerY - p.y) ** 2);
                if (distToCenter < r) 
                {
                    hasPointsInside = true;
                    break;
                }
            }

            points.add(cur_edge[0]);
            points.add(cur_edge[1]);
            points.add(rp);

            if (!hasPointsInside)//рисуем треугольник //добавить deadEdges
            {
                let a = [cur_edge[0], rp];
                let b = [rp, cur_edge[0]];

                let c = [rp, cur_edge[1]];
                let d = [cur_edge[1], rp];

                let has1 = false;
                let has2 = false;

                //поиск в живых
                for (let e of alifeEdges)
                    if (arraysEqual(e, a) || arraysEqual(e, b))
                    {
                        alifeEdges.delete(e);
                        deadEdges.add(e);
                        has1 = true;
                        break;
                    }
                
                for (let e of alifeEdges)
                    if (arraysEqual(e, c) || arraysEqual(e, d))
                    {
                        alifeEdges.delete(e);
                        deadEdges.add(e);
                        has2 = true;
                        break;
                    }

                
                //поиск в мёртвых
                if(!has1)
                for (let e of deadEdges)
                    if (arraysEqual(e, a) || arraysEqual(e, b))
                    {
                        has1 = true;
                        break;
                    }
                
                if(!has2)
                for (let e of deadEdges)
                    if (arraysEqual(e, c) || arraysEqual(e, d))
                    {
                        has2 = true;
                        break;
                    }

                if(!has1)
                {
                    alifeEdges.add([cur_edge[0], rp]);
                    drawVector(cur_edge[0], rp)
                }

                if (!has2)
                {
                    alifeEdges.add([rp, cur_edge[1]]);
                    drawVector(rp, cur_edge[1]);
                }

                break;
            }
        }

        alifeEdges.delete(cur_edge);
        deadEdges.add(cur_edge);
    }

    console.log(v1, v2);

    // Для красоты

    for (let p of points)
    {
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
    points.clear();
}

function findRightPoints(point1, point2) {
    let rightPoints = [];
    
    let pointsArray = Array.from(cur_points);
    
    let dx = point2.x - point1.x;
    let dy = point2.y - point1.y;

    for (let p of pointsArray) 
    {
        // вектор point1 -> p
        let px = p.x - point1.x;
        let py = p.y - point1.y;

        // Векторное произведение
        let crossProduct = dx * py - dy * px;

        // Если векторное произведение > 0, то точка p находится справа от вектора
        if (crossProduct > 0)
            rightPoints.push(p);
    }

    return rightPoints;
}

function chooseVector() 
{
    let pointsArray = Array.from(points);
    
    // Находим самую левую точку
    leftmostPoint = pointsArray.reduce((leftmost, p) => (p.x < leftmost.x) ? p : leftmost, pointsArray[0]);

    // Перебираем все точки и находим ту, которая имеет наибольший угол относительно leftmostPoint
    let nextPoint = null;
    let minAngle = Infinity; // минимальный угол относительно оси x
    
    for (let p of pointsArray) 
    {
        if (p === leftmostPoint) continue; // игнорируем самую левую точку
        
        // Вычисляем угол относительно оси x
        let angle = Math.atan2(p.y - leftmostPoint.y, p.x - leftmostPoint.x);

        if (angle < minAngle) 
        {
            minAngle = angle;
            nextPoint = p;
        }
    }

    drawVector(leftmostPoint, nextPoint);
    //drawVector(leftmostPoint, nextPoint, 'blue'); //debug
    return [leftmostPoint, nextPoint];
}

function drawVector(p1, p2, color = 'black') 
{
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function doIntersect(edge1, edge2) 
{
    const x11 = edge1[0].x;
    const y11 = edge1[0].y;
    const x12 = edge1[1].x
    const y12 = edge1[1].y;

    const x21 = edge2[0].x;
    const y21 = edge2[0].y;
    const x22 = edge2[1].x;
    const y22 = edge2[1].y;

    // Параметры для уравнений прямых
    const d = (y22 - y21) * (x12 - x11) - (x22 - x21) * (y12 - y11);
    
    // Если denom равен 0, 
    if (d === 0)
        return false; //линии параллельны

    const ua = ((x22 - x21) * (y11 - y21) - (y22 - y21) * (x11 - x21)) / d;
    const ub = ((x12 - x11) * (y11 - y21) - (y12 - y11) * (x11 - x21)) / d;

    // Проверяем, находятся ли ua и ub в пределах [0, 1]
    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}