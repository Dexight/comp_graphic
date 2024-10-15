const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');

let lSystemConfig = {
    atom: '',
    angle: 0,
    direction: 90, // Начальное направление
    rules: {},
    iterations: 4,
    length: 10, // Начальная длина шага
    randomness: 50, // Допустимое случайное отклонение угла
};

let points = [];
let thickness = 5; // Начальная толщина ветвей

// Чтение файла
fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        parseLSystemFile(content);
        calculateFractal();  
        drawFractal();  
    };

    reader.readAsText(file);
});

function parseLSystemFile(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const [atom, angle = '25', direction = '0', iterations = '5'] = lines[0].split(' '); 
    lSystemConfig.atom = atom;
    lSystemConfig.angle = parseFloat(angle); 
    lSystemConfig.direction = parseFloat(direction);  
    lSystemConfig.iterations = parseInt(iterations);  

    lSystemConfig.rules = {};
    for (let i = 1; i < lines.length; i++) {
        const [key, value] = lines[i].split('->').map(str => str.trim());
        lSystemConfig.rules[key] = value;
    }
}

function generateLSystem(axiom, rules, iterations) {
    let current = axiom;
    for (let i = 0; i < iterations; i++) {
        let next = '';
        for (let char of current) {
            next += rules[char] || char;
        }
        current = next;
    }
    return current;
}

function calculateFractal() {
    points = [];
    let x = 0;
    let y = 0;
    let currentAngle = -lSystemConfig.direction * (Math.PI / 180);
    let stack = [];
    let currentThickness = thickness;
    let currentColor = { r: 139, g: 69, b: 19 };  // Начальный цвет (коричневый)

    const instructions = generateLSystem(lSystemConfig.atom, lSystemConfig.rules, lSystemConfig.iterations);
    points.push({ x, y, thickness: currentThickness, color: { ...currentColor } });

    for (let char of instructions) {
        switch (char) {
            case 'F': 
                const newX = x + lSystemConfig.length * Math.cos(currentAngle);
                const newY = y + lSystemConfig.length * Math.sin(currentAngle);
                points.push({ x: newX, y: newY, thickness: currentThickness, color: { ...currentColor } });
                x = newX;
                y = newY;
                break;
                
            case '+': 
                currentAngle += (lSystemConfig.angle + Math.random() * lSystemConfig.randomness - lSystemConfig.randomness / 2) * (Math.PI / 180);
                break;
                
            case '-': 
                currentAngle -= (lSystemConfig.angle + Math.random() * lSystemConfig.randomness - lSystemConfig.randomness / 2) * (Math.PI / 180);
                break;
                
            case '[': 
                stack.push({ x, y, currentAngle, thickness: currentThickness, color: { ...currentColor } });
                currentThickness *= 0.76;  // Уменьшаем толщину ветвей

                // Переход от коричневого к зелёному
                if (currentColor.g < 139) {
                    currentColor.g = Math.min(139, currentColor.g + 10);  // Увеличиваем зелёный
                }
                if (currentColor.r > 34) {
                    currentColor.r = Math.max(34, currentColor.r - 10);   // Уменьшаем красный
                }
                if (currentColor.b < 34) {
                    currentColor.b = Math.min(34, currentColor.b + 5);   // Немного увеличиваем синий
                }
                break;
                
            case ']': 
                const state = stack.pop();
                x = state.x;
                y = state.y;
                currentAngle = state.currentAngle;
                currentThickness = state.thickness;
                currentColor = state.color;
                points.push({ x: null, y: null });  // Разрыв
                points.push({ x, y, thickness: currentThickness, color: { ...currentColor } });
                break;
        }
    }
}


function drawFractal() {
    if (points.length === 0) return;

    let minX = Math.min(...points.filter(p => p.x !== null).map(p => p.x));
    let maxX = Math.max(...points.filter(p => p.x !== null).map(p => p.x));
    let minY = Math.min(...points.filter(p => p.y !== null).map(p => p.y));
    let maxY = Math.max(...points.filter(p => p.y !== null).map(p => p.y));

    const scaleX = (canvas.width - 20) / (maxX - minX);
    const scaleY = (canvas.height - 20) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";  // Круглые окончания линий

    for (let i = 1; i < points.length; i++) { // Начинаем с i = 1, чтобы был предыдущий элемент
        const point = points[i];
        const prevPoint = points[i - 1];

        if (point.x === null && point.y === null) {
            if (i + 1 < points.length && points[i + 1].x !== null && points[i + 1].y !== null) {
                ctx.moveTo(points[i + 1].x * scale + offsetX, points[i + 1].y * scale + offsetY);
            }
            continue;  // Пропускаем текущую итерацию, так как это разрыв
        }

        if (prevPoint.x !== null && prevPoint.y !== null) {
            ctx.beginPath();
            ctx.moveTo(prevPoint.x * scale + offsetX, prevPoint.y * scale + offsetY);
            ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
            ctx.lineWidth = point.thickness * scale;  
            ctx.strokeStyle = `rgb(${point.color.r},${point.color.g},${point.color.b})`;
            ctx.stroke();
        }
    }
}

