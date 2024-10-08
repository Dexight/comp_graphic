let isDrawing = false;
let x = 0;
let y = 0;

let fieldColor = 0;


let foundPixelX = null; // Координата X найденного пикселя
let foundPixelY = null; // Координата Y найденного пикселя
let foundPixelColor = null; // Цвет найденного пикселя
let boundaryPixels = []; // Массив для хранения координат граничных пикселей

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

//отладка по фигуре
// context.filter = 'url(#remove-alpha)';
// context.fillStyle = `rgb(0, 0, 255)`;
// context.fillRect(400, 300, 1, 1);
// context.fillRect(401, 300, 1, 1);
// context.fillRect(401, 299, 1, 1);
// context.fillRect(401, 298, 1, 1);
// context.fillRect(402, 301, 1, 1);
// context.fillRect(402, 300, 1, 1);
// context.fillRect(402, 299, 1, 1);
// context.fillRect(402, 298, 1, 1);
// context.fillRect(402, 297, 1, 1);
// context.fillRect(403, 297, 1, 1);
// context.fillRect(403, 300, 1, 1);


canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // ЛКМ
        x = e.offsetX;
        y = e.offsetY;
        isDrawing = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Поиск пикселя справа при ПКМ
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Предотвращаем контекстное меню
    const startX = e.offsetX;
    const startY = e.offsetY;
    
    fieldColor = getPixelColor(startX, startY);
    let found = false;

    // Найдём пиксель, который отличается от текущего справа
    for (let i = startX + 1; i < canvas.width; i++) {
        const currentColor = getPixelColor(i, startY);
        
        if (currentColor !== fieldColor) {
            foundPixelX = i;
            foundPixelY = startY;
            
            //отладочный пиксель
            //foundPixelX = 400;
            //foundPixelY = 300;

            foundPixelColor = currentColor;

            console.log(`Найден пиксель [${foundPixelX}, ${foundPixelY}]`);
            found = true;
            
            // Выполняем обход границы объекта, состоящего из одинаковых пикселей
            findBoundary(foundPixelX, foundPixelY);
            //console.log("Граничные пиксели:", boundaryPixels);        

            // Зарисовываем граничные пиксели выбранным цветом
            const selectedColor = document.getElementById('selBoundaryColor').value;

            //console.log("Начало отрисовки")
            drawBoundary(selectedColor);
            //console.log("Конец отрисовки")

            break;
        }
    }

    if (!found) {
        alert('Объект справа не найден.');
    }
});

// Алгоритм обхода границы
function findBoundary(startX, startY) {
    const directions = [
        [1, 0],   // Право
        [1, -1],  // Вверх-право
        [0, -1],  // Вверх
        [-1, -1],  // Вверх-лево
        [-1, 0],  // Лево
        [-1, 1],  // Вниз-лево
        [0, 1],   // Вниз
        [1, 1],   // Вниз-право
    ];

    let currentX = startX-1;
    let currentY = startY;
    let curDirIndex = 0; // Направление для начала поиска (вправо по-умолчанию)

    do
    { // Завершаем, когда возвращаемся в начальную точку
        for (let i = curDirIndex; i < directions.length+curDirIndex; i++) {//От текущего направления против часовой стрелки
            let checkDirectionIndex = (i) % directions.length;//индекс направления просматриваемого пикселя -> координаты просм. пикс.
            let [dx, dy] = directions[checkDirectionIndex];

            let checkX = currentX + dx;
            let checkY = currentY + dy;

            const neighborColor = getPixelColor(checkX, checkY);

            if (neighborColor === fieldColor)
            {
                boundaryPixels.push({ x: checkX, y: checkY });

                currentX = checkX;
                currentY = checkY;
                curDirIndex = (checkDirectionIndex === 1 || checkDirectionIndex === 0) ? 6 :
                              (checkDirectionIndex === 2 || checkDirectionIndex === 3)? 0 :
                              (checkDirectionIndex === 4 || checkDirectionIndex === 5)? 2 : 4 //для (checkDirectionIndex === 6 || checkDirectionIndex === 7)
                break; // Переходим к следующему пикселю
            }
        }
    }
    while (currentX !== startX-1 || currentY !== startY)
}

// Функция для зарисовки граничных пикселей
function drawBoundary(color) {
    context.fillStyle = color;
    boundaryPixels.forEach(({ x, y }) => {
        context.fillRect(x, y, 1, 1); // Закрашиваем каждый пиксель
    });
    boundaryPixels = [];
}

// Функция для рисования линии
function drawLine(context, x1, y1, x2, y2) {
    //context.filter = 'url(#remove-alpha)'; //с ним работает красивее, но дольше
    context.beginPath();
    context.strokeStyle = document.getElementById('selColor').value;
    context.lineWidth = document.getElementById('selWidth').value;
    context.lineJoin = "round";
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.closePath();
    context.stroke();
}

// Получение цвета пикселя в формате rgba
function getPixelColor(x, y) {
    const pixel = context.getImageData(x, y, 1, 1).data;
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
}

function clearArea() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
}
