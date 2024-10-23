let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;

let points = new Set();
let polygon1 = [];
let polygon2 = [];
let convex1 = [];
let convex2 = [];

let dotRadius = 3;
let DrawSecondPoly = false;
let canDraw = true;
canvas.style.border = "solid lightgreen 4px";

function pointsEqual(a, b) 
{
    return Math.floor(a.x) === Math.floor(b.x) && Math.floor(a.y) === Math.floor(b.y);
}

// Рисование точек
canvas.addEventListener('click', (e) => {
    if(canDraw)
    {
        let x = e.offsetX;
        let y = e.offsetY;
        let point = { x, y };

        if (![...points].some(p => p.x === x && p.y === y))
        {
            points.add(point);

            if (points.size > 2)
                clearScene();
            else
            {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }

            if (!DrawSecondPoly)
            {
                polygon1.push(point);
                convex1 = DrawConvexPoly(polygon1, 'blue');
            }
            else
            {
                polygon2.push(point);
                DrawConvexPoly(polygon1, 'blue');
                convex2 = DrawConvexPoly(polygon2, 'red');
            }
        }
    }
});

// Очистка сцены-----------------
document.getElementById('clear-scene').addEventListener('click', restart);

function restart()
{
    clearScene();
    
    points.clear();
    polygon1 = [];
    polygon2 = [];
    document.getElementById('buttons1').style.display = 'flex';
    document.getElementById('buttons2').style.display = 'flex';
    DrawSecondPoly = false;
    canDraw = true;
    canvas.style.border = "solid lightgreen 4px";
}

function clearScene() 
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
//--------------------------------

//Переключение на 2 полигон------
document.getElementById('draw-second').addEventListener('click', drawSecond);

function drawSecond()
{
    DrawSecondPoly = true;
    if (polygon1.length < 3)
    {
        alert("Не хватает точек для первого полигона");
        return;
    }
    points.clear();
    document.getElementById('buttons2').style.display = 'none';
}
//-------------------------------

//Объединение полигонов----------
document.getElementById('merge').addEventListener('click', MergePoly);

function MergePoly()
{
    ctx.strokeStyle = 'black';
    if (polygon2.length < 3)
    {
        alert("Не хватает точек для второго полигона");
        return;
    }
    canDraw = false;
    canvas.style.border = "solid red 4px";
    document.getElementById('buttons1').style.display = 'none';
    
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
        
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)
        {
            const intersectionX = x11 + ua * (x12 - x11);
            const intersectionY = y11 + ua * (y12 - y11);
            return {x: intersectionX, y: intersectionY};
        }
        else 
            return false;
    }

    function findLeftPoint()
    {
        min1 = convex1[0];
        min2 = convex2[0];
        
        for (let i = 0; i < convex1.length; i++)
            if (convex1[i].x < min1.x) min1 = convex1[i]
        
        for (let i = 0; i < convex2.length; i++)
            if (convex2[i].x < min2.x) min2 = convex2[i]
        
        return min1.x < min2.x ? [min1, true]: [min2, false];
    }

    leftPoint = findLeftPoint();

    //возвращает индекс точки/false
    function arrayContainPoint(array, point)
    {
        for (let i = 0; i < array.length; i++)
            if (pointsEqual(array[i], point))
            {
                return i;
            }
        return false;
    }

    function pointDistance(p1, p2) 
    {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    let indx;
    curPoint = leftPoint[0];
    isFirstPoly = leftPoint[1];
    fromFirstStarted = leftPoint[1];

    clearScene();
    ctx.beginPath();
    ctx.moveTo(curPoint.x, curPoint.y);
    n = 1; //отслеживание количества отрисованных точек
    //=======================================
    do
    {
        if (isFirstPoly)
        {
            indx = arrayContainPoint(convex1, curPoint);
            next_point = convex1[(indx+1)%convex1.length];
            
            intersections = [];// [точка пересечения, индекс одной из точек второго полигона]
            for (let j = 0; j < convex2.length; j++)
            {
                intersect = doIntersect([convex1[indx], convex1[(indx+1)%convex1.length]], [convex2[j], convex2[(j+1)%convex2.length]]);

                if (intersect)
                    intersections.push([intersect, j]);
            }

            if (intersections.length > 0)
            {
                intersect = intersections[0][0];
                minDist = pointDistance(intersect, curPoint);
                j = intersections[0][1];
                for (let i = 0; i < intersections.length; i++)//найдем ближайшее пересечение (если их несколько)
                {
                    dist = pointDistance(intersections[i][0], curPoint);
                    if (dist < minDist)
                    {
                        minDist = dist;
                        intersect = intersections[i][0]
                        j = intersections[i][1];
                    }
                }

                ctx.lineTo(intersect.x, intersect.y);
                ctx.stroke();
                curPoint = intersect;
                if (isLeft([convex1[indx], convex1[(indx+1)%convex1.length]], convex2[j], fromFirstStarted))
                {
                    ctx.lineTo(convex2[j].x, convex2[j].y);
                    next_point = convex2[j];
                    n++;
                }
                else
                {
                    ctx.lineTo(convex2[(j+1)%convex2.length].x, convex2[(j+1)%convex2.length].y);
                    next_point = convex2[(j+1)%convex2.length];
                    n++;
                }
                
                isFirstPoly = false;
            }
            else
                ctx.lineTo(next_point.x, next_point.y);
            n++;
        }
        else
        {
            indx = arrayContainPoint(convex2, curPoint);
            next_point = convex2[(indx+1)%convex2.length];
            
            intersections = [];// [точка пересечения, индекс одной из точек второго полигона]
            for (let j = 0; j < convex1.length; j++)
            {
                intersect = doIntersect([convex2[indx], convex2[(indx+1)%convex2.length]], [convex1[j], convex1[(j+1)%convex1.length]]);

                if (intersect)
                    intersections.push([intersect, j]);
            }

            if (intersections.length > 0)
            {
                intersect = intersections[0][0];
                minDist = pointDistance(intersect, curPoint);
                j = intersections[0][1];
                for (let i = 0; i < intersections.length; i++)//найдем ближайшее пересечение (если их несколько)
                {
                    dist = pointDistance(intersections[i][0], curPoint);
                    if (dist < minDist)
                    {
                        minDist = dist;
                        intersect = intersections[i][0]
                        j = intersections[i][1];
                    }
                }

                ctx.lineTo(intersect.x, intersect.y);
                ctx.stroke();
                curPoint = intersect;
                if (isLeft([convex2[indx], convex2[(indx+1)%convex2.length]], convex1[j], fromFirstStarted))
                {
                    ctx.lineTo(convex1[j].x, convex1[j].y);
                    next_point = convex1[j];
                    n++;
                }
                else
                {
                    ctx.lineTo(convex1[(j+1)%convex1.length].x, convex1[(j+1)%convex1.length].y);
                    next_point = convex1[(j+1)%convex1.length];
                    n++;
                }
                
                isFirstPoly = true;
            }
            else
                ctx.lineTo(next_point.x, next_point.y);
            n++;
        }
        ctx.stroke();
        curPoint = next_point;
    }
    while(!pointsEqual(leftPoint[0], curPoint));
    //================================
    console.log(n);
    if (fromFirstStarted && n === convex1.length+1)
    {
        DrawConvexPoly(polygon2, 'black');
    }

    if (!fromFirstStarted && n === convex2.length+1)
    {
        DrawConvexPoly(polygon1, 'black');
    }
}
//-------------------------------

function drawVector(p1, p2, color = 'black') 
{
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Грэхем для построения многоугольников
function DrawConvexPoly(points, color) 
{
    if (points.length < 3) return points;

    function orientation(p, q, r) {
        let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        if (val === 0) return 0;
        return val > 0 ? 1 : 2;
    }

    function compare(p1, p2) {
        let o = orientation(lowest, p1, p2);
        if (o === 0) return dist(lowest, p2) >= dist(lowest, p1) ? -1 : 1;
        return o === 2 ? -1 : 1;
    }

    function dist(p1, p2) {
        return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
    }

    let lowest = points[0];
    for (let i = 1; i < points.length; i++) {
        if (points[i].y < lowest.y || (points[i].y === lowest.y && points[i].x < lowest.x)) {
            lowest = points[i];
        }
    }

    let sortedPoints = points.slice().sort(compare);

    let hull = [];
    hull.push(sortedPoints[0]);
    hull.push(sortedPoints[1]);
    hull.push(sortedPoints[2]);

    for (let i = 3; i < sortedPoints.length; i++) {
        while (hull.length > 1 && orientation(hull[hull.length - 2], hull[hull.length - 1], sortedPoints[i]) !== 2) {
            hull.pop();
        }
        hull.push(sortedPoints[i]);
    }

    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) 
    {
        ctx.lineTo(hull[i].x, hull[i].y);
    }

    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    return hull;
}

function isLeft(edge, p, fromFirstStarted) 
{
    let edgeStart = { x: edge[0], y: edge[1] };
    let edgeEnd = { x: edge[2], y: edge[3] };

    // Вычисляем векторное произведение = (x2−x1)*(py−y1)−(y2−y1)*(px−x1)
    let vectorProduct = (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) - (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x);

    vectorProduct = fromFirstStarted ? vectorProduct : -vectorProduct;

    //если точка слева
    if (vectorProduct >= 0) 
        return p;
    else return false;
}