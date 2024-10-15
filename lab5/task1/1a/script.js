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
    randomness: 0, // Допустимое случайное отклонение угла
};

let points = [];

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

    // Атом, угол, начальное направление и количество итераций
    const [atom, angle = '25', direction = '0', iterations = '5'] = lines[0].split(' '); 
    lSystemConfig.atom = atom;
    lSystemConfig.angle = parseFloat(angle); 
    lSystemConfig.direction = parseFloat(direction);  
    lSystemConfig.iterations = parseInt(iterations);  

    // Остальные строки (правила)
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
            next += rules[char] || char; // Заменяем символы по правилам
        }
        current = next;
    }
    return current;
}

function calculateFractal() {
    points = [];  

    let x = 0;
    let y = 0;
    let currentAngle = -lSystemConfig.direction * (Math.PI / 180);  // Начальное направление
    let stack = [];  

    const instructions = generateLSystem(lSystemConfig.atom, lSystemConfig.rules, lSystemConfig.iterations);
    points.push({ x, y }); 

    for (let char of instructions) {
        switch (char) {
            case 'F':  // Рисуем линию вперед
                const newX = x + lSystemConfig.length * Math.cos(currentAngle);
                const newY = y + lSystemConfig.length * Math.sin(currentAngle);
                points.push({ x: newX, y: newY }); 
                x = newX;
                y = newY;
                break;
            case '+':  // Поворот по часовой стрелке
                currentAngle += lSystemConfig.angle * (Math.PI / 180);
                break;
            case '-':  // Поворот против часовой стрелки
                currentAngle -= lSystemConfig.angle * (Math.PI / 180);
                break;
            case '[':  // Сохраняем состояние
                stack.push({ x, y, currentAngle });
                break;
            case ']':  // Восстанавливаем состояние
                const state = stack.pop();
                x = state.x;
                y = state.y;
                currentAngle = state.currentAngle;
                // Добавляем разрыв в линии
                points.push({ x: null, y: null });
                points.push({ x, y }); 
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

    // Вычисляем масштаб по осям X и Y
    const scaleX = (canvas.width - 20) / (maxX - minX);
    const scaleY = (canvas.height - 20) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);  

    // Сдвиг для центрирования фрактала
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point.x === null && point.y === null) {
            // Проверяем, чтобы не выйти за пределы массива
            if (i + 1 < points.length && points[i + 1].x !== null && points[i + 1].y !== null) {
                ctx.moveTo(points[i + 1].x * scale + offsetX, points[i + 1].y * scale + offsetY); 
                continue;
            }
        } else if (point.x !== null && point.y !== null) {
            ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
        }
    }

    ctx.stroke();
}

