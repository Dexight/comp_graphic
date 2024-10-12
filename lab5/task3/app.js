let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
canvas.style.border ="3px solid lightgreen";
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
let curPoints = [];
let dotRadius = 3;

// состояния
let isAnimate = false;
let isAdd = true;

const addSplineButton = document.getElementById('add-spline');
addSplineButton.style.display = 'none';

// Рисование точек
canvas.addEventListener('click', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    let point = [x, y];

    if (![...points].some(p => p[0] === x && p[1] === y)) 
    {
        if(isAdd)
        {
            points.add(point);
            curPoints.push(point)
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            if(curPoints.length == 4)
            {
                if (isAdd) isAdd = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.border ="3px solid red";
                buildBezye();
                curPoints = [curPoints.pop()];
                addSplineButton.style.display = "inline";
            }
        }
    }
});

// Очистка сцены
document.getElementById('clear-scene').addEventListener('click', clearScene);
function clearScene() 
{
    curPoints = [];
    points.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isAdd = true;
    isAnimate = false;
    canvas.style.border ="3px solid lightgreen";
    addSplineButton.style.display = 'none';
}

// Добавление сплайна

document.getElementById('add-spline').addEventListener('click', addSpline);
function addSpline()
{
    canvas.style.border ="3px solid lightgreen";
    addSplineButton.style.display = "none";
    isAdd = true;
}

function buildBezye() 
{
    ctx.beginPath();
    ctx.moveTo(curPoints[0][0], curPoints[0][1]);
    ctx.bezierCurveTo(curPoints[1][0], curPoints[1][1],
                      curPoints[2][0], curPoints[2][1], 
                      curPoints[3][0], curPoints[3][1]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    for(let p of points)
    {
        ctx.beginPath();
        ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}