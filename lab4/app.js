let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let points = [];
let polygons = [];
let dotRadius = 3;

canvas.addEventListener('click', (e) => {
    let x = e.offsetX;
    let y = e.offsetY;
    points.push({ x, y });
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red'; 
    ctx.fill();
});

document.getElementById('build-polygon').addEventListener('click', buildPolygon);

function buildPolygon() {
    if (points.length < 1) {
        alert('Недостаточно точек для построения полигона');
        return;
    }
    polygons.push(points);
    drawPolygon(polygons[polygons.length - 1]);
    
    // Перекрашиваем точки полигона в черный
    for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black'; 
        ctx.fill();
    }
    points = [];
}

function drawPolygon(polygon) {
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'black'; 
    ctx.stroke();
}

document.getElementById('clear-scene').addEventListener('click', clearScene);

function clearScene() {
  points = [];
  polygons = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('contextmenu', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
  
    // Проверяем, находится ли клик внутри границы точки
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)) < dotRadius) {
        points.splice(i, 1); // Если клик внутри границы, удаляем точку из массива points
  
        ctx.clearRect(point.x - dotRadius, point.y - dotRadius, 2 * dotRadius, 2 * dotRadius); // Очистка квадратом
  
        break;
      }
    }
  
    event.preventDefault();
});
