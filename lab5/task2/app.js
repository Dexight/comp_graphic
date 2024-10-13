let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const MIN_DISPLACEMENT = 1;
nextDisplacement = 0;
function midpointDisplacement(points, recursionDepth, displacement){
    //условия выхода из рекурсии
    if(recursionDepth === 0 || displacement <= MIN_DISPLACEMENT){
        
        console.log("Выход из рекурсии")
        drawPolyline(points);
        return points;
    }
    let nextPoints = []
    for(let i = 0; i < points.length-1; ++i){
        let [x1, y1] = points[i];
        let [x2, y2] = points[i+1];
        
        //Считаем середину
        let midx = (x1+x2)/2;
        let midy = (y1+y2)/2 + (Math.random() * displacement *2 - displacement );
        nextPoints.push([x1,y1], [midx,midy]); // пушим точки
    }
    nextPoints.push(points[points.length-1])
    nextDisplacement = Math.max(displacement / 2, MIN_DISPLACEMENT);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPolyline(nextPoints);

    setTimeout(() => midpointDisplacement(nextPoints, recursionDepth - 1, nextDisplacement), 500);
} 

function drawPolyline(points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
}

function generate() {
    let totalDepth = parseInt(document.getElementById('recursionDepth').value);
    const displacement = parseInt(document.getElementById('displacement').value);
    
    const points = [[0, canvas.height / 2], [canvas.width, canvas.height / 2]];
    
    midpointDisplacement(points, totalDepth, displacement);
}

document.getElementById('generateBtn').addEventListener('click', generate);