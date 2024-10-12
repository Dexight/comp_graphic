let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
let dotRadius = 4;

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

    if(points.size > 3)
    {
        let pointsArray = Array.from(points);
        buildBezye(pointsArray[0], pointsArray[1], pointsArray[2], pointsArray[3]);
    }
});

// Очистка сцены
document.getElementById('clear-scene').addEventListener('click', clearScene);
function clearScene() {
    points.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function buildBezye(startPoint, ctrlPoint1, ctrlPoint2, endPoint) {
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.bezierCurveTo(ctrlPoint1.x, ctrlPoint1.y, ctrlPoint2.x, ctrlPoint2.y, endPoint.x, endPoint.y);
    ctx.stroke();

    for(let p of points)
    {
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}