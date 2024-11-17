const canvas = document.getElementById('canvas');
const width = canvas.width;
const height = canvas.height;
const ctx = canvas.getContext('2d');
let figureSelect = document.getElementById('figure-select');
let load_obj = document.getElementById('load-obj');
let functionSelect = document.getElementById('function-select');
let surfacePanel = document.getElementById('surfacePanel');
let rotationFigurePanel = document.getElementById('rotationFigurePanel');
let curFigure = 0;
let curFunction = 0;

//=======Z-buffer=======

function Triangulation(triangles, face)
{
    for (let i = 0; i < face.length-2; i++) 
    {
        triangle = [
                    face[0],
                    face[i+1],
                    face[i+2] 
                   ];
        triangles.push(triangle);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let zBuffer = Array(width * height).fill(Infinity);

    let project = projectPerspective; 
    if (currentProjection === 'axonometric') {
        project = projectAxonometric;
    } else {
        project = projectPerspective;
    }

    const rotationX = getRotationXMatrix(rotateX);
    const rotationY = getRotationYMatrix(rotateY);
    const rotationZ = getRotationZMatrix(rotateZ);
    const scaling = getScaleMatrix(scale);
    const translating = getTranslationMatrix(translateX, translateY, translateZ)
    reflectionMatrix = getReflectionMatrix() // получаем "чистую" матрицу отражения
    const RotateAroundLineMatrix  = getRotationAroundLineMatrix([Ax,Ay,Az], [Bx, By, Bz], angle);
    if (document.getElementById("reflectXY").checked) {
        reflectionMatrix = multiplyMatrices(reflectionMatrix, getReflectionXYMatrix());
    }
    if (document.getElementById("reflectXZ").checked) {
        reflectionMatrix = multiplyMatrices(reflectionMatrix, getReflectionXZMatrix());
    }
    if (document.getElementById("reflectYZ").checked) {
        reflectionMatrix = multiplyMatrices(reflectionMatrix, getReflectionYZMatrix());
    }

    let figure;
    let isCube = false;
    surfacePanel.style.display = 'none';
    let showSurfacePanel = false;
    rotationFigurePanel.style.display = 'none';
    let showRotationFigurePanel = false;
    switch(curFigure) {
        case 0: 
            if (customFigure) {
                figure = customFigure; 
            } else {
                return; 
            }
            break;
        case 1: figure = tetrahedron; break;
        case 2: figure = cube; isCube = true; break;
        case 3: figure = octahedron; break;
        case 4: figure = icosahedron; break;
        case 5: figure = dodecahedron; break;
        case 6: bs = buildSurface(); 
                figure = {vertices: bs.surfaceVertices,faces: bs.surfaceFaces,}; 
                showSurfacePanel = true; 
                break;
        case 7: rf = buildRotationFigure();
                figure = {vertices: rf.vertices,faces: rf.faces};
                showRotationFigurePanel = true;
                break;
        default: return;
    }
    
    //drawLine([Ax, Ay, Az], [Bx, By, Bz], 'yellow');
    if(figure.vertices!==undefined || figure.faces !==undefined)
    {
        const transformedVertices = figure.vertices.map(vertex => {
                let point = [...vertex, 1];  
                if(Ax !== Bx || Ay !== By || Az !== Bz)
                    point = multiplyMatrixAndPoint(RotateAroundLineMatrix, point);
                point = multiplyMatrixAndPoint(rotationX, point);
                point = multiplyMatrixAndPoint(rotationY, point);
                point = multiplyMatrixAndPoint(rotationZ, point);
                point = multiplyMatrixAndPoint(scaling, point);
                point = multiplyMatrixAndPoint(translating, point);
                point = multiplyMatrixAndPoint(reflectionMatrix, point);  
                return project([point[0], point[1], point[2]]);
            });
        
        // рёбра
        all_triangles = [];
        if (showEdges) 
        {
            figure.faces.forEach(face => {
                // триангуляция если > 3 точек
                triangles = [];
                if (face.length > 3)
                    Triangulation(triangles, face);
                else { triangles.push(face); }

                // растеризация
                triangles.forEach(t => {
                    all_triangles.push(t);
                    projected_t = [[transformedVertices[t[0]][0], transformedVertices[t[0]][1], transformedVertices[t[0]][2]],
                                   [transformedVertices[t[1]][0], transformedVertices[t[1]][1], transformedVertices[t[1]][2]], 
                                   [transformedVertices[t[2]][0], transformedVertices[t[2]][1], transformedVertices[t[2]][2]]];
                    testn = rasterizeTriangle(projected_t, zBuffer, width, height);
                })

                // for (let i = 0; i < face.length; i++) 
                // {
                //     const [x1, y1] = transformedVertices[face[i]];

                //     const [x2, y2] = transformedVertices[face[(i + 1) % face.length]];
                    
                //     ctx.moveTo(x1, y1);
                //     ctx.lineTo(x2, y2);
                // }
            });
        }

        renderDepthBuffer(zBuffer);

        //отображение триангуляции
        ctx.strokeStyle = 'pink';
        ctx.beginPath();
        all_triangles.forEach(t=>{
            for (let i = 0; i < t.length; i++)
            {
                const [x1, y1] = transformedVertices[t[i]];
                const [x2, y2] = transformedVertices[t[(i + 1) % t.length]];
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        ctx.stroke();
        })

        // вершины
        if (showVertices) {
            ctx.fillStyle = 'red';
            transformedVertices.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // отображение куба
        if (showCube && !isCube) {
            const transformedVerticesCube = cube.vertices.map(vertex => {
                let point = [...vertex, 1];
                if(Ax !== Bx || Ay !== By || Az !== Bz)
                    point = multiplyMatrixAndPoint(RotateAroundLineMatrix, point);  
                point = multiplyMatrixAndPoint(rotationX, point);
                point = multiplyMatrixAndPoint(rotationY, point);
                point = multiplyMatrixAndPoint(rotationZ, point);
                point = multiplyMatrixAndPoint(scaling, point);
                point = multiplyMatrixAndPoint(translating, point);
                point = multiplyMatrixAndPoint(reflectionMatrix, point);
                return project([point[0], point[1], point[2]]);
            });

            ctx.strokeStyle = 'pink';
            ctx.beginPath();
            cube.faces.forEach(face => {
                for (let i = 0; i < face.length; i++) {
                    const [x1, y1] = transformedVerticesCube[face[i]];
                    const [x2, y2] = transformedVerticesCube[face[(i + 1) % face.length]];
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            });
            ctx.stroke();
        }

        //TEST
        if (showXYZ)
        {
            const transformedXYZ = xyz.vertices.map(vertex => {
                let point = [...vertex, 1];
                if(Ax !== Bx || Ay !== By || Az !== Bz)
                    point = multiplyMatrixAndPoint(RotateAroundLineMatrix, point);
                point = multiplyMatrixAndPoint(rotationX, point);
                point = multiplyMatrixAndPoint(rotationY, point);
                point = multiplyMatrixAndPoint(rotationZ, point);
                point = multiplyMatrixAndPoint(scaling, point);
                point = multiplyMatrixAndPoint(translating, point);
                point = multiplyMatrixAndPoint(reflectionMatrix, point);
                if(Ax !== Bx && Ay !== By && Az !== Bz)
                    point = multiplyMatrixAndPoint(RotateAroundLineMatrix, point);
                return project([point[0], point[1], point[2]]);
            });

            styles = ['red', 'lightgreen', 'blue'];
            let n_style = 0;
            xyz.faces.forEach(face => {
                ctx.beginPath();
                ctx.strokeStyle = styles[n_style];
                const [x1, y1] = transformedXYZ[face[0]];
                const [x2, y2] = transformedXYZ[face[1]];
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                n_style++;
            });
        }
    }
    surfacePanel.style.display = showSurfacePanel? 'flex':'none';
    rotationFigurePanel.style.display = showRotationFigurePanel?'flex':'none';
    load_obj.style.display = showSurfacePanel? 'none' : 'inline'
}

function rasterizeTriangle(triangle, zBuffer, width, height) {
    n = 0;
    const v0 = triangle[0];
    const v1 = triangle[1];
    const v2 = triangle[2];

    // Упорядочиваем вершины по y (y0 <= y1 <= y2)
    const vertices = [v0, v1, v2].sort((a, b) => a[1] - b[1]);
    const [[x0s, y0s, z0s], [x1s, y1s, z1s], [x2s, y2s, z2s]] = vertices;

    // Растеризация верхнего и нижнего треугольника
    const fillFlatTriangle = (xStart, yStart, zStart, xEnd, yEnd, zEnd, xTip, yTip, zTip) => {
        const invSlope1 = (xEnd - xStart) / (yEnd - yStart || 1);
        const invSlope2 = (xTip - xStart) / (yTip - yStart || 1);
        let zSlope1 = (zEnd - zStart) / (yEnd - yStart || 1);
        let zSlope2 = (zTip - zStart) / (yTip - yStart || 1);

        let curX1 = xStart;
        let curX2 = xStart;
        let curZ1 = zStart;
        let curZ2 = zStart;

        for (let y = Math.ceil(yStart); y <= Math.ceil(yEnd); y++) {//округляем y и x чтобы однозначно вычислять индекс буфера


            if (y < 0 || y >= height) continue; // Игнорируем координаты вне экрана

            const startX = Math.ceil(curX1);
            const endX = Math.ceil(curX2);
            let z = curZ1;

            const zStep = (curZ2 - curZ1) / (endX - startX || 1);

            for (let x = startX; x <= endX; x++) {

                if (x < 0 || x >= width) continue; // Игнорируем координаты вне экрана

                const index = y * width + x;

                if (z < zBuffer[index]) //обновляем буфер
                    {zBuffer[index] = z; n++;}

                z += zStep;
            }

            curX1 += invSlope1;
            curX2 += invSlope2;
            curZ1 += zSlope1;
            curZ2 += zSlope2;
        }
    };

    // Обрабатываем нижний треугольник
    fillFlatTriangle(x0s, y0s, z0s, x1s, y1s, z1s, x2s, y2s, z2s);

    // Обрабатываем верхний треугольник
    fillFlatTriangle(x1s, y1s, z1s, x2s, y2s, z2s, x0s, y0s, z0s);
    return n;
}

function renderDepthBuffer(zBuffer) 
{
    // Найти минимальное и максимальное значение в Z-буфере
    let minZ = Infinity, maxZ = -Infinity;
    for (let z of zBuffer) {
        if (z < minZ && z !== Infinity) minZ = z;
        if (z > maxZ && z !== Infinity) maxZ = z;
    }
    
    // Если буфер пуст, заполнить серым цветом
    if (minZ === Infinity || maxZ === -Infinity) {
        ctx.fillStyle = "rgb(128, 128, 128)";
        ctx.fillRect(0, 0, width, height);
        return;
    }

    // Массив для хранения данных изображения
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const z = zBuffer[index];

            // Если пиксель не был изменен, закрасить его серым цветом
            let shade = 128; // Средний серый
            if (z !== Infinity) {
                // Линейная интерполяция оттенка серого
                shade = Math.floor(((z - minZ) / (maxZ - minZ)) * 255);
            }

            // Заполнить RGBA
            const pixelIndex = (y * width + x) * 4;
            data[pixelIndex] = shade;        // Red
            data[pixelIndex + 1] = shade;    // Green
            data[pixelIndex + 2] = shade;    // Blue
            data[pixelIndex + 3] = 255;      // Alpha
        }
    }

    // Нарисовать изображение на холсте
    ctx.putImageData(imageData, 0, 0);
}
//======================

//=========7.2==========
let formingPoints = [[1, 2, 3], [2, 0, 0], [3, 0, 0]];
let numDivisions = 10;
let rotationAxis = 0;

function buildRotationFigure() {
    let figureVertices = [];
    let figureFaces = [];
    let angleStep = (numDivisions !== 0) ? 2 * Math.PI / numDivisions : 0;
    console.log('forming points: ', formingPoints);
    // Создание вершин вращаемой фигуры
    for (let i = 0; i <= numDivisions; i++) {
        const angle = i * angleStep;

        formingPoints.forEach(([x, y, z]) => {
            let rotatedPoint;

            // Вращаем точку вокруг выбранной оси
            switch(rotationAxis) {
                case 0: // Вращение вокруг оси X
                    rotatedPoint = multiplyMatrixAndPoint(getRotationXMatrix(angle), [x, y, z, 1]);
                    break;
                case 1: // Вращение вокруг оси Y
                    rotatedPoint = multiplyMatrixAndPoint(getRotationYMatrix(angle), [x, y, z, 1]);
                    break;
                case 2: // Вращение вокруг оси Z
                    rotatedPoint = multiplyMatrixAndPoint(getRotationZMatrix(angle), [x, y, z, 1]);
                    break;
                default:
                    rotatedPoint = [x, y, z, 1];
                    break;
            }

            // Добавляем только x, y, z координаты вершины
            figureVertices.push([rotatedPoint[0], rotatedPoint[1], rotatedPoint[2]]);
        });
    }
    console.log('vertices: ', figureVertices);

    // Создание граней
    const pointsPerDivision = formingPoints.length;
    for (let i = 0; i < numDivisions; i++) {
        const start = i * pointsPerDivision;
        const nextStart = (i + 1) * pointsPerDivision;

        for (let j = 0; j < pointsPerDivision - 1; j++) {
            figureFaces.push([
                start + j,
                start + j + 1,
                nextStart + j + 1,
                nextStart + j
            ]);
        }
    }
    console.log('vertices: ', figureFaces);

    return { vertices: figureVertices, faces: figureFaces };
}

//обработчик для ввода образующей
document.getElementById('formingPoints').addEventListener('input', (e)=>{
    const formingPointsInput = e.target.value;
    formingPoints = formingPointsInput.split(';').map(point => {const [x, y, z] = point.split(',').map(parseFloat);
        return [x, y, z];
    })
    draw();
});

//Обработчик для ввода числа разбиений
document.getElementById('numDivisions').addEventListener('input', (e)=>{
    numDivisions = parseFloat(e.target.value);
    draw();
});

let rotationAxisSelect = document.getElementById('rotationAxis'); // выбор оси для вращения
rotationAxisSelect.addEventListener('change', (e) => {
    rotationAxis = parseInt(e.target.value);
    draw();
});

//====================

//========7.3=========
let Zcoef = 1;

let xMin = -1, xMax = 1;
let yMin = -1, yMax = 1;
let segments = 30;

// Функция для задания сегмента поверхности
function defaultSegment(x, y) {return x*y;} 
function f1(x, y) { return -Math.sqrt(x*x+y*y); }
function f2 (x, y) { return x*x+y*y; }
function f3 (x, y) { return Math.sin(x) * Math.cos(y); }
function f4 (x, y) { return Math.sin(x) + Math.cos(y); }
function f5 (x, y) { return 5*(Math.cos(x*x+y*y+1)/(x*x+y*y+1)+0.1); }
function f6 (x, y) { return Math.cos(x*x+y*y)/(x*x+y*y+1); }

function buildSurface() {
    
    let surfaceVertices = [];
    let surfaceFaces = [];

    const dx = (xMax - xMin) / segments;
    const dy = (yMax - yMin) / segments;

    // Создаём вершины
    for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments; j++) {
            const x = xMin + i * dx;
            const y = yMin + j * dy;
            switch(curFunction)
            {
                case 0: z = defaultSegment(x, y); break;
                case 1: z = f1(x, y); break;
                case 2: z = f2(x, y); break;
                case 3: z = f3(x, y); break;
                case 4: z = f4(x, y); break;
                case 5: z = f5(x, y); break;
                case 6: z = f6(x, y); break;
                default: z = defaultSegment(x, y); break;
            }
            z = z*Zcoef;
            surfaceVertices.push([x, y, z]);
        }
    }

    // Создаём грани
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const idx = i * (segments + 1) + j;
            const nextRowIdx = (i + 1) * (segments + 1) + j;
            surfaceFaces.push([idx, idx + 1, nextRowIdx + 1, nextRowIdx]);
        }
    }

    return { surfaceVertices, surfaceFaces }
}
document.getElementById('surfaceXmin').addEventListener('input', (e) => { xMin = parseFloat(e.target.value); draw();});
document.getElementById('surfaceXmax').addEventListener('input', (e) => { xMax = parseFloat(e.target.value); draw();});
document.getElementById('surfaceYmin').addEventListener('input', (e) => { yMin = parseFloat(e.target.value); draw();});
document.getElementById('surfaceYmax').addEventListener('input', (e) => { yMax = parseFloat(e.target.value); draw();});
document.getElementById('surfaceSegments').addEventListener('input', (e) => { segments = parseInt(e.target.value); draw();});
document.getElementById('Zcoef').addEventListener('input', (e) => {Zcoef = parseFloat(e.target.value); draw();});
// Обработчик выбора функции из выпадающего списка
functionSelect.addEventListener('change', (e) => {
    curFunction = parseInt(e.target.value);
    document.getElementById("rotateX").value = "270";
    rotateX = 270*Math.PI/180;
    draw();
});
//=====================

// Обработчик выбора фигуры из выпадающего списка
figureSelect.addEventListener('change', (e) => {
    curFigure = parseInt(e.target.value);
    draw();
});

// координатная ось TEST
const xyz = {
    vertices: [
     [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]
    ],

    faces: [
        [0, 1], [0, 2], [0, 3]
    ]
}

const cube = {
    //вершины
    vertices: [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // Точки лицевой части
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]    // Точки задней части
    ],
    //грани (по индексам точек из vertices)
    faces: [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], 
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
    ]
};

const tetrahedron = {
    vertices: [
        [-1, -1, -1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]
    ],

    faces: [
        [0, 1, 3], [1, 2, 3], [0, 2, 3], [0, 1, 2]
    ]
}


const octahedron = {
    vertices:[
        [-1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 0, -1]
    ],

    faces:[
        [1, 0, 2], [1, 2, 3], [1, 3, 5], [1, 5, 0], //верхняя половина
        [4, 0, 5], [4, 0, 2], [4, 2, 3], [4, 3, 5] //нижняя половина
    ]
}

//Икосаэдр-----

//вычислим точки на окружности с центром в (0, 0, 0)

radians = (-72 * Math.PI) / 180;

p0 = {x:0, y:0, z:1};
// вычисляем первые 2 точки
p1 = {x: Math.sin(72 * Math.PI / 180), y:0, z: Math.cos(72 * Math.PI / 180)};
p2 = {x: Math.sin(36 * Math.PI / 180), y:0, z: -Math.cos(36 * Math.PI / 180)};
// другие точки - просто зеркалим по оси X
p3 = {x: -p2.x, y:0, z: p2.z};
p4 = {x: -p1.x, y:0, z: p1.z};

function pointDistance(p1, p2) 
{
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

dist = pointDistance({x:0, y:0, z:0}, {x:0, y:0.5, z:1});//для верхней и нижней точек

const icosahedron = {
    vertices: [
        //верхняя половина

        [0, dist, 0],//верхняя точка
        [p0.x, p0.y+0.5, p0.z], [p1.x, p1.y+0.5, p1.z], [p2.x, p2.y+0.5, p2.z], [p3.x, p3.y+0.5, p3.z], [p4.x, p4.y+0.5, p4.z],//пятиугольник
        //нижняя половина
        
        [p0.x, p0.y-0.5, -p0.z], [p1.x, p1.y-0.5, -p1.z], [p2.x, p2.y-0.5, -p2.z], [p3.x, p3.y-0.5, -p3.z], [p4.x, p4.y-0.5, -p4.z],//пятиугольник (переворачиваем верхний)
        [0, -dist, 0]//нижняя точка
    ],
    faces: [
        [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1],//верхняя шляпка
        [1, 9, 8], [1, 8, 2], [8, 2, 7], [2, 7, 3], [7, 3, 6], [3, 6, 4], [4, 6, 10], [4, 5, 10], [5, 9, 10], [1, 5, 9],
        [11, 9, 8], [11, 8, 7], [11, 7, 6], [11, 6, 10], [11, 10, 9]//нижняя шляпка
    ]
}

//--------------
//Додекаэдр-----

function findIntersection(segment1, segment2) {
    const [p1, p2] = segment1;
    const [q1, q2] = segment2;

    // Вектор p1p2
    const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    // Вектор q1q2
    const v2 = [q2[0] - q1[0], q2[1] - q1[1], q2[2] - q1[2]];

    // Вектор p1q1
    const w = [q1[0] - p1[0], q1[1] - p1[1], q1[2] - p1[2]];

    // Скалярное произведение
    const crossV1V2 = [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ];

    const denom = crossV1V2[0] ** 2 + crossV1V2[1] ** 2 + crossV1V2[2] ** 2;
    const crossWv2 = [
        w[1] * v2[2] - w[2] * v2[1],
        w[2] * v2[0] - w[0] * v2[2],
        w[0] * v2[1] - w[1] * v2[0]
    ];

    const t = (crossWv2[0] * crossV1V2[0] + crossWv2[1] * crossV1V2[1] + crossWv2[2] * crossV1V2[2]) / denom;

    // Найдём точку пересечения на отрезке 1
    return [
        p1[0] + t * v1[0],
        p1[1] + t * v1[1],
        p1[2] + t * v1[2]
    ];
}

let dots = [];

icosahedron.faces.forEach(face => {
    face_coordinates = [];//точки треугольника

    for (let i = 0; i < 3; i++) face_coordinates.push(icosahedron.vertices[face[i]]);

    ab = [face_coordinates[0], face_coordinates[1]];
    bc = [face_coordinates[1], face_coordinates[2]];

    ab_center = [(ab[0][0] + ab[1][0])/2, (ab[0][1] + ab[1][1])/2, (ab[0][2] + ab[1][2])/2];
    bc_center = [(bc[0][0] + bc[1][0])/2, (bc[0][1] + bc[1][1])/2, (bc[0][2] + bc[1][2])/2];

    c_median_ab = [face_coordinates[2], ab_center];
    a_median_bc = [face_coordinates[0], bc_center];

    dot_intersect = findIntersection(c_median_ab, a_median_bc);
    dots.push(dot_intersect);
});

const dodecahedron = {
    vertices: [
        dots[0], dots[1], dots[2], dots[3], dots[4], dots[5], dots[6], dots[7], dots[8], dots[9], 
        dots[10], dots[11], dots[12], dots[13], dots[14], dots[15], dots[16], dots[17], dots[18], dots[19]
    ],

    faces:[
        [0, 1, 2, 3, 4], [1, 0, 6, 7, 8], [0, 6, 5, 14, 4], [4, 14, 13, 12, 3], [3, 12, 11, 10, 2], [2, 10, 9, 8, 1],//низ
        [7, 8, 9, 17, 16], [7, 6, 5, 15, 16], [5, 14, 13, 19, 15], [13, 12, 11, 18, 19], [11, 10, 9, 17, 18], [19, 18, 17, 16, 15]//верх
    ]
}
//--------------

let showVertices = true;
let showEdges = true;
let showCube = false;
let showXYZ = true; //TEST
let rotateX = 0, rotateY = 0, rotateZ = 0;
let scale = 1;
let translateX = 0, translateY = 0, translateZ = 0;
let Ax = 0, Ay = 0, Az = 0;
let Bx = 0, By = 0, Bz = 0;
let angle = 0;
let currentProjection = 'perspective';

document.getElementById('perspectiveButton').addEventListener('click', () => {
    currentProjection = 'perspective';
    draw(); 
});
document.getElementById('axonometricButton').addEventListener('click', () => {
    currentProjection = 'axonometric';
    draw(); 
});

document.getElementById('rotateX').addEventListener('input', (e) => {
    rotateX = parseFloat(e.target.value) * Math.PI / 180;
    draw();
});

document.getElementById('rotateY').addEventListener('input', (e) => {
    rotateY = parseFloat(e.target.value) * Math.PI / 180;
    draw();
});

document.getElementById('rotateZ').addEventListener('input', (e) => {
    rotateZ = parseFloat(e.target.value) * Math.PI / 180;
    draw();
});

document.getElementById('translateX').addEventListener('input', (e) => {
    translateX = parseFloat(e.target.value);
    draw();
});

document.getElementById('translateY').addEventListener('input', (e) => {
    translateY = parseFloat(e.target.value);
    draw();
});

document.getElementById('translateZ').addEventListener('input', (e) => {
    translateZ = parseFloat(e.target.value);
    draw();
});

document.getElementById('scale').addEventListener('input', (e) => {
    scale = parseFloat(e.target.value);
    draw();
});

document.getElementById('showVertices').addEventListener('change', (e) => {
    showVertices = e.target.checked;
    draw();
});

document.getElementById('showEdges').addEventListener('change', (e) => {
    showEdges = e.target.checked;
    draw();
});

document.getElementById('showCube').addEventListener('change', (e) => {
    showCube = e.target.checked;
    draw();
});

document.getElementById('AxInput').addEventListener('input', (e) => {
    Ax = parseFloat(e.target.value);
    draw();
});
document.getElementById('AyInput').addEventListener('input', (e) => {
    Ay = parseFloat(e.target.value);
    draw();
});
document.getElementById('AzInput').addEventListener('input', (e) => {
    Az = parseFloat(e.target.value);
    draw();
});

document.getElementById('BxInput').addEventListener('input', (e) => {
    Bx = parseFloat(e.target.value);
    draw();
});

document.getElementById('ByInput').addEventListener('input', (e) => {
    By = parseFloat(e.target.value);
    draw();
});
document.getElementById('BzInput').addEventListener('input', (e) => {
    Bz = parseFloat(e.target.value);
    draw();
});

document.getElementById('angleRotationLine').addEventListener('input', (e) => {
    angle = parseFloat(e.target.value) * Math.PI / 180;
    draw();
});

// Обработчики для чекбоксов
document.getElementById('reflectXY').addEventListener('change', draw);

document.getElementById('reflectXZ').addEventListener('change', draw);

document.getElementById('reflectYZ').addEventListener('change', draw);

// Перемножение матриц
function multiplyMatrices(matrixA, matrixB) {
    const rowsA = matrixA.length;
    const colsA = matrixA[0].length;
    const rowsB = matrixB.length;
    const colsB = matrixB[0].length;

    if (colsA !== rowsB) {
        throw new Error("Количество столбцов в первой матрице должно совпадать с количеством строк во второй матрице.");
    }

    const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += matrixA[i][k] * matrixB[k][j];
            }
        }
    }
    return result;
}

function multiplyMatrixAndPoint(matrix, point) {
    let [x, y, z] = point;
    return [
        matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z + matrix[0][3],
        matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z + matrix[1][3],
        matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z + matrix[2][3],
        matrix[3][0] * x + matrix[3][1] * y + matrix[3][2] * z + matrix[3][3]
    ];
}

function getRotationXMatrix(angle) {
    return [
        [1, 0, 0, 0],
        [0, Math.cos(angle), -Math.sin(angle), 0],
        [0, Math.sin(angle), Math.cos(angle), 0],
        [0, 0, 0, 1]
    ];
}

function getRotationYMatrix(angle) {
    return [
        [Math.cos(angle), 0, Math.sin(angle), 0],
        [0, 1, 0, 0],
        [-Math.sin(angle), 0, Math.cos(angle), 0],
        [0, 0, 0, 1]
    ];
}

function getRotationZMatrix(angle) {
    return [
        [Math.cos(angle), -Math.sin(angle), 0, 0],
        [Math.sin(angle), Math.cos(angle), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

function getScaleMatrix(scale) {
    return [
        [scale, 0, 0, 0],
        [0, scale, 0, 0],
        [0, 0, scale, 0],
        [0, 0, 0, 1]
    ];
}
//Матрица смещения
function getTranslationMatrix(dx, dy, dz){
    return [
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0, 1]
        ];
}
// матрица отражения
function getReflectionMatrix(){
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]
}

//Матрица отражения по XY
function getReflectionXYMatrix(){
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, 1]
    ];
}

//Матрица отражения по XZ
function getReflectionXZMatrix(){
    return [
        [1, 0, 0, 0],
        [0,-1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]
}
//матрица отражения по YZ
function getReflectionYZMatrix(){
    return [
        [-1, 0, 0, 0],
        [0, 1, 0, 0], 
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]
}
// параметры - 2 точки, задающие прямую.
function getRotationAroundLineMatrix(point0, point1, angle){
    [ax, ay, az] = point0;
    [bx, by, bz] = point1;
    cord = [bx-ax, by-ay, bz-az];
    len = Math.sqrt(cord[0]*cord[0] + cord[1]*cord[1]  + cord[2]*cord[2]);
    normCord = [cord[0] / len, cord[1] / len, cord[2] / len];
    [l, m, n] = normCord;
    let cosPhi = Math.cos(angle);
    let sinPhi = Math.sin(angle);


    return [
        [l*l + cosPhi*(1-l*l), l*(1-cosPhi)*m + n*sinPhi, l*(1-cosPhi)*n - m*sinPhi, 0],
        [l*(1-cosPhi)*m - n*sinPhi, m*m + cosPhi*(1-m*m), m*(1-cosPhi)*n + l*sinPhi, 0],
        [l*(1-cosPhi)*n + m*sinPhi, m*(1-cosPhi)*n - l*sinPhi, n*n +cosPhi*(1-n*n), 0],
        [0,0,0,1]
    ];
}

function projectPerspective(point) {//
    const c = 3; 
    const scale = 100;

    const perspectiveMatrix = [
        [scale, 0, 0, 0],
        [0, -scale, 0, 0], // -scale для инверсии Y
        [0, 0, scale, 0], 
        [0, 0, -1 / c, 1]
    ];

    let [x, y, z, w] = multiplyMatrixAndPoint(perspectiveMatrix, [point[0], point[1], point[2], 1]);

    // Установка минимального значения, чтобы избежать неправильной отрисовки
    const adjustedW = Math.max(w, 0.1);

    return [
        (x / adjustedW) + canvas.width / 2, 
        (y / adjustedW) + canvas.height / 2,  
        z/adjustedW, 
        1
    ];
}

function projectAxonometric(point) {
    const scale = 100;
    const angleA = Math.PI / 6; // 30 градусов
    const angleB = Math.PI / 6; // 30 градусов

    const rotationX = getRotationXMatrix(Math.PI / 6);
    const rotationY = getRotationYMatrix(Math.PI / 6);
    let [x, y, z, w] = multiplyMatrixAndPoint(rotationX, [point[0], point[1], point[2], 1]);
    [x, y, z, w] = multiplyMatrixAndPoint(rotationY, [x, y, z, 1]);

    return [
        x * scale + canvas.width / 2,
        canvas.height / 2 - y * scale, // Инвертируем Y
        0,
        1
    ];
}

let customFigure = null; 

document.getElementById('load-obj').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.obj';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target.result;
                parseOBJ(contents);
                curFigure = 0;
                draw(); 
            };
            reader.readAsText(file);
        }
    };
    input.click();
});

function parseOBJ(data) {
    const lines = data.split('\n');
    const vertices = [];
    const faces = [];

    lines.forEach(line => {
        const parts = line.trim().split(' ');
        if (parts[0] === 'v') {
            // Добавление вершины
            const vertex = parts.slice(1, 4).map(Number);
            vertices.push(vertex);
        } else if (parts[0] === 'f') {
            // Добавление грани
            const face = parts.slice(1).map(part => {
                const vertexIndex = parseInt(part.split('/')[0]) - 1; // Убираем индексы нормалей и текстур
                return vertexIndex;
            });
            faces.push(face);
        }
    });

    customFigure = {
        vertices: vertices,
        faces: faces,
    };
}
//функция для рисования прямой
function drawLine(point1, point2, color){
    let project = projectPerspective; 
    if (currentProjection === 'axonometric') {
        project = projectAxonometric;
    } else {
        project = projectPerspective;
    }

    point1Proj = project(point1);
    point2Proj = project(point2);

    ctx.beginPath();
    ctx.moveTo(point1Proj[0], point1Proj[1]);
    ctx.lineTo(point2Proj[0], point2Proj[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

draw();
