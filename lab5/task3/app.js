let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;

let points = new Set();
let dotRadius = 3;

let curPoints = [];

// Рисование точек
canvas.addEventListener('click', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    let point = [x, y];

    if (![...points].some(p => p[0] === x && p[1] === y)) 
    {
        points.add(point);
        curPoints.push(point)
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = (points.size === 1)? 'black' : 'red';
        ctx.fill();

        Bezier();
    }
});

function Bezier()//true если точек хватает/false если не хватает
{
    if (points.size === 4)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBezier(curPoints[0], curPoints[1], curPoints[2], curPoints[3]);
        
        let i = 0;
        plast = curPoints[0];
        for(let p of curPoints)
        {
            // рисуем точки
            ctx.beginPath();
            ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
            if (p === curPoints[0] || p === curPoints[curPoints.length-1]) ctx.fillStyle = 'black'
            else ctx.fillStyle = 'red';
            ctx.fill();

            // показываем вектор изгиба
            if(i % 2 !== 0)
            {
                ctx.moveTo(plast[0], plast[1]);
                ctx.lineTo(p[0], p[1]);
                ctx.strokeStyle = 'pink';
                ctx.stroke();
            }
            plast = p;
            i++;
        }
        return true;
    }
    else if (points.size > 4)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        buildBezier();
        let i = 0;
        plast = curPoints[0];
        for(let p of curPoints)
        {
            // рисуем точки
            ctx.beginPath();
            ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
            if (p === curPoints[0] || p === curPoints[curPoints.length-1]) ctx.fillStyle = 'black'
            else ctx.fillStyle = 'red';
            ctx.fill();

            // показываем вектор изгиба
            if(i % 2 !== 0)
            {
                ctx.moveTo(plast[0], plast[1]);
                ctx.lineTo(p[0], p[1]);
                ctx.strokeStyle = 'pink';
                ctx.stroke();
            }
            plast = p;
            i++;
        }
        return true;
    }
    else return false;
};

function buildBezier() 
{
    let prev = curPoints[0];
    let next;

    //по каждым 2 опорным точкам (которые вводит пользователь) строим кривую.
    for (let i = 0; i < points.size - 4; i += 2)
    {
        next = [(Math.round(curPoints[i+2][0] + curPoints[i+3][0])/2), 
                (Math.round(curPoints[i+2][1] + curPoints[i+3][1])/2)];
        drawBezier(prev, curPoints[i+1], curPoints[i+2], next);
        prev = next;
    }
    
    if (points.size % 2 === 0)
        drawBezier(prev, curPoints[curPoints.length-3], curPoints[curPoints.length-2], curPoints[curPoints.length-1]);
    else
    {
        let newPoint1 = [(Math.round(prev[0] + 2*(curPoints[curPoints.length-2][0]-prev[0])/3)),
                         (Math.round(prev[1] + 2*(curPoints[curPoints.length-2][1]-prev[1])/3))];
        let newPoint2 = [(Math.round(curPoints[curPoints.length-2][0] + 2*(curPoints[curPoints.length-1][0]-curPoints[curPoints.length-2][0])/3)),
                         (Math.round(curPoints[curPoints.length-2][1] + 2*(curPoints[curPoints.length-1][1]-curPoints[curPoints.length-2][1])/3))];
        drawBezier(prev, newPoint1, newPoint2, curPoints[curPoints.length-1]);
    }
}

function drawBezier(p0, p1, p2, p3)
{
    let step = 0.001;
    
    let b_last = p0;
    for (let t = step; t <= 1; t += step)
    {
        let q0 = [p0[0]*(1-t)+p1[0]*t, p0[1]*(1-t)+p1[1]*t];
        let q1 = [p1[0]*(1-t)+p2[0]*t, p1[1]*(1-t)+p2[1]*t];
        let q2 = [p2[0]*(1-t)+p3[0]*t, p2[1]*(1-t)+p3[1]*t];
        
        let r0 = [q0[0]*(1-t)+q1[0]*t, q0[1]*(1-t)+q1[1]*t];
        let r1 = [q1[0]*(1-t)+q2[0]*t, q1[1]*(1-t)+q2[1]*t];
        let b = [r0[0]*(1-t)+r1[0]*t, r0[1]*(1-t)+r1[1]*t]; //это отрисовывается

        ctx.beginPath();
        ctx.moveTo(b_last[0], b_last[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        b_last = b;
    }
}

// Очистка сцены
document.getElementById('clear-scene').addEventListener('click', clearScene);
function clearScene() 
{
    curPoints = [];
    points.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let isDragging = false;
let dragPoint = null;

// Обработчик события начала перетаскивания
canvas.addEventListener('mousedown', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    
    // Проверяем, было ли нажатие на точку
    for (let point of curPoints) {
        let distance = Math.sqrt((x - point[0])**2 + (y - point[1])**2);
        if (distance <= dotRadius) {
            isDragging = true;
            dragPoint = point;
            break;
        }
    }
});

// Обработчик события перемещения мыши
canvas.addEventListener('mousemove', (e) => {
    if (isDragging) 
    {
        let x = e.offsetX;
        let y = e.offsetY;
        
        dragPoint[0] = x;
        dragPoint[1] = y;
        
        redrawScene();
    }
});

// Обработчик события окончания перетаскивания
canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragPoint = null;
});

// Удаление точкек на пкм
canvas.addEventListener('contextmenu', function(e) 
{
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    //if ([...points].some(p => p[0] === x && p[1] === y))
    curPoints = curPoints.filter(p => Math.sqrt((mouseX - p[0]) ** 2 + (mouseY - p[1]) ** 2) > dotRadius);
    points = new Set(curPoints);
    redrawScene();
});

// Перерисовка сцены после перемещения точки
function redrawScene() 
{   
    if(Bezier() === false)
    {
        //просто рисуем оставшиеся точки
        for (let p of curPoints)
        {
            ctx.beginPath();
            ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
            if (p === curPoints[0]) ctx.fillStyle = 'black'
            else ctx.fillStyle = 'red';
            ctx.fill();
        }
    }
}