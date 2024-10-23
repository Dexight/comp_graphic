let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
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

    if (![...points].some(p => p.x === x && p.y === y))
    {
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
    if (points.size < 4) 
    {
        alert('Недостаточно точек для триангуляции');
        return;
    }

    points.clear();
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

//Проверка пересечения прямых
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