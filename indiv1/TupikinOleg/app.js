let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width  = window.innerWidth*0.95;
ctx.canvas.height = window.innerHeight*0.9;
let points = new Set();
let dotRadius = 3;

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

function buildTriangular() {
    if (points.size < 3) {
        alert('Недостаточно точек для триангуляции');
        return;
    }
    console.log("triangular");
}