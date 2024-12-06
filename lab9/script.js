const canvas = document.getElementById('canvas');
const width = canvas.width;
const height = canvas.height;
const ctx = canvas.getContext('2d');
let figureSelect = document.getElementById('figure-select');
let load_obj = document.getElementById('load-obj');
let save_obj = document.getElementById('save-obj');
let curFigure = 0;
let curFunction = 0;
let currentFigure = null;
let useFileNormals = false; 
let lightPosX = document.getElementById('lightPosX').value;
let lightPosY = document.getElementById('lightPosY').value;
let lightPosZ = document.getElementById('lightPosZ').value;

let showVertices = true;
let showEdges = true;
let showXYZ = true; //TEST
let rotateX = 0, rotateY = 0, rotateZ = 0;
let scale = 1;
let translateX = 0, translateY = 0, translateZ = 0;
let Ax = 0, Ay = 0, Az = 0;
let Bx = 0, By = 0, Bz = 0;
let angle = 0;
let currentProjection = 'axonometric';

document.getElementById('lightPosX').addEventListener('input', (e) => {
    lightPosX = parseFloat(e.target.value);
    draw();
});

document.getElementById('lightPosY').addEventListener('input', (e) => {
    lightPosY = parseFloat(e.target.value);
    draw();
});

document.getElementById('lightPosZ').addEventListener('input', (e) => {
    lightPosZ = parseFloat(e.target.value);
    draw();
});

document.getElementById('useFileNormalsCheckbox').addEventListener('change', (e) => {
    useFileNormals = e.target.checked;
    draw();
});

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

// Функция для вычисления вектора нормали
function calculateNormal(vertex1, vertex2, vertex3) {
    const vector1 = [
        vertex2[0] - vertex1[0],
        vertex2[1] - vertex1[1],
        vertex2[2] - vertex1[2]
    ];
    const vector2 = [
        vertex3[0] - vertex1[0],
        vertex3[1] - vertex1[1],
        vertex3[2] - vertex1[2]
    ];
    const normal = [
        vector1[1] * vector2[2] - vector1[2] * vector2[1],
        vector1[2] * vector2[0] - vector1[0] * vector2[2],
        vector1[0] * vector2[1] - vector1[1] * vector2[0]
    ];
    // console.log('vector1', vector1);
    // console.log('vector2', vector2);
    // console.log('normal',normal);
    return normal;
}

function dotProduct(vector1, vector2) {
    return vector1[0] * vector2[0] + vector1[1] * vector2[1] + vector1[2] * vector2[2];
}

function magnitude(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
}

function cosAngleBetween(vector1, vector2) {
    return dotProduct(vector1, vector2) / (magnitude(vector1) * magnitude(vector2));
}

function draw() 
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let zBuffer = Array(width * height).fill(-Infinity);
    let normalBuffer = new Array(width * height).fill(null);

    let project = projectPerspective; 
    let viewVector = [0, 0, 1];
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
    load_obj.style.display = "none";
    save_obj.style.display = "block";

    switch(curFigure) {
        case 0:  
            if (customFigure) {
                figure = customFigure; 
                load_obj.style.display = "block";
            } else {
                return; 
            }
            break;
        case 1: load_obj.style.display = "block";
                save_obj.style.display = "none";
                return;
        default: return;
    }
    currentFigure = figure;
    
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
                return point;
            });

        const projectedVertices = transformedVertices.map(vertex => project([vertex[0], vertex[1], vertex[2]]));
        console.log(projectedVertices);
                
        // грани
        let visibleTriangles = [];
        let minZ = Infinity;
        let maxZ = -Infinity;

        figure.faces.forEach((face, faceIndex) => {
            // триангуляция если > 3 точек
            triangles = [];
            if (face.length > 3)
                Triangulation(triangles, face);
            else { triangles.push(face); }

            // Отсечение нелицевых и растеризация
            triangles.forEach((t, tIndex) => {
                const [v1, v2, v3] = t.map(index => transformedVertices[index]);
                let normal;
                if (useFileNormals && figure.faceNormals[faceIndex]) {
                    normal = figure.normals[figure.faceNormals[faceIndex][tIndex]];
                } else {
                    normal = calculateNormal(v1, v2, v3);
                }
                const [pv1, pv2, pv3] = t.map(index => projectedVertices[index]);
                const projectedNormal = calculateNormal(pv1, pv2, pv3);
                const cosAngle = cosAngleBetween(projectedNormal, viewVector);

                if (cosAngle < 0) { // Отсечение нелицевых граней
                    visibleTriangles.push(t);
                    [minZ, maxZ] = rasterizeTriangle([pv1, pv2, pv3], zBuffer, normalBuffer, width, height, minZ, maxZ, normal);
                }
            })
        });


        renderDepthBuffer(zBuffer, normalBuffer, minZ.toFixed(5), maxZ.toFixed(5));

        // отображение триангуляции
        if (showEdges)
        {
            ctx.strokeStyle = 'pink';
            ctx.beginPath();
            visibleTriangles.forEach(t=>{
                for (let i = 0; i < t.length; i++)
                {
                    const [x1, y1] = projectedVertices[t[i]];
                    const [x2, y2] = projectedVertices[t[(i + 1) % t.length]];
                    
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            ctx.stroke();
            })
        }

        // вершины
        if (showVertices) 
        {
            ctx.fillStyle = 'red';
            projectedVertices.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // XYZ
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
    load_obj.style.display = 'inline'
}

function rasterizeTriangle(triangle, zBuffer, normalBuffer, width, height, minZ, maxZ, normal) 
{
    const [v0, v1, v2] = triangle; // Три вершины треугольника (x, y, z)

    // Сортировка по Y-координате для упрощения
    const [p0, p1, p2] = [v0, v1, v2].sort((a, b) => a[1] - b[1]);

    // Вычисление границ по Y
    const yMin = Math.max(Math.ceil(p0[1]), 0);
    const yMax = Math.min(Math.floor(p2[1]), height - 1);

    for (let y = yMin; y <= yMax; y++) 
    {
        // Интерполяция X-координат и Z для текущей строки
        let xStart, xEnd, zStart, zEnd;

        if (y < p1[1]) // Верхняя половина треугольника 
        { 
            const t0 = (y - p0[1]) / (p1[1] - p0[1]);
            const t1 = (y - p0[1]) / (p2[1] - p0[1]);
            xStart = lerp(p0[0], p1[0], t0);
            zStart = lerp(p0[2], p1[2], t0);
            xEnd = lerp(p0[0], p2[0], t1);
            zEnd = lerp(p0[2], p2[2], t1);
        }
        else // Нижняя половина треугольника
        { 
            const t0 = (y - p1[1]) / (p2[1] - p1[1]);
            const t1 = (y - p0[1]) / (p2[1] - p0[1]);
            xStart = lerp(p1[0], p2[0], t0);
            zStart = lerp(p1[2], p2[2], t0);
            xEnd = lerp(p0[0], p2[0], t1);
            zEnd = lerp(p0[2], p2[2], t1);
        }

        // Обеспечение порядка X
        if (xStart > xEnd) 
        {
            [xStart, xEnd] = [xEnd, xStart];
            [zStart, zEnd] = [zEnd, zStart];
        }

        // Округление X для пиксельных границ
        const xMin = Math.max(Math.ceil(xStart), 0);
        const xMax = Math.min(Math.floor(xEnd), width - 1);

        for (let x = xMin; x <= xMax; x++) 
        {
            // Интерполяция Z
            const t = (x - xStart) / (xEnd - xStart);
            const z = lerp(zStart, zEnd, t);

            // Индекс в Z-буфере
            const index = Math.floor(y) * width + Math.floor(x);

            // Обновление Z-буфера, если пиксель ближе
            if (z > zBuffer[index]) 
            {
                zBuffer[index] = z;
                normalBuffer[index] = [...normal];
            }

            // Обновление z границ;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
    }

    return [minZ, maxZ];
}

// Линейная интерполяция
function lerp(a, b, t) { return a + t * (b - a); }

function renderDepthBuffer(zBuffer, normalBuffer, minZ, maxZ) {
    // Если буфер пуст, заполнить серым цветом
    if (minZ === -Infinity || maxZ === Infinity) {
        console.log("Buffer is empty, filling with gray color.");
        ctx.fillStyle = "rgb(128, 128, 128)";
        ctx.fillRect(0, 0, width, height);
        return;
    }

    // normalBuffer.forEach((normal, index) => {
    //     if (normal !== null) {
    //       console.log(normal);
    //     }
    //   });

    // Массив для хранения данных изображения
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const lightPos = [lightPosX, lightPosY, lightPosZ];
    console.log('lightPos:', lightPos);

    const baseColor = { r: 255, g: 0, b: 0 }; 
    const ambientIntensity = 0.3; 

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const z = zBuffer[index];

            let shade = { r: 128, g: 128, b: 128 }; // Цвет по умолчанию
            if (z !== -Infinity) {
                let normal = normalBuffer[index];
                const normalLength = Math.hypot(normal[0], normal[1], normal[2]);
                normal = [
                    normal[0] / normalLength,
                    normal[1] / normalLength,
                    normal[2] / normalLength
                ];
                if (normal) {
                    // Вычисление направления света от источника к текущему пикселю
                    const lightDir = [
                        lightPos[0] - x,
                        lightPos[1] - y,
                        lightPos[2] - z
                    ];

                    const intensity = calculateLambert(normal, lightDir, ambientIntensity);
                    shade = applyShading(baseColor, intensity);

                    //console.log(`Pixel (${x}, ${y}): z=${z}, normal=${normal}, lightDir=${lightDir}, intensity=${intensity}, shade=${shade}`);
                } 
            } 

            const pixelIndex = (y * width + x) * 4;
            data[pixelIndex] = shade.r;        // Красный
            data[pixelIndex + 1] = shade.g;    // Зеленый
            data[pixelIndex + 2] = shade.b;    // Синий
            data[pixelIndex + 3] = 255;        // Альфа
        }
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(lightPosX, -lightPosY, lightPosZ, 0, Math.PI * 2);
    ctx.fill();
}
//======================

function calculateLambert(normal, lightDir, ambientIntensity) {
    let k = 0.9;
    let i = 1;

    // Нормализуем нормаль
    const normalLength = Math.hypot(normal[0], normal[1], normal[2]);
    const normalizedNormal = [
        normal[0] / normalLength,
        normal[1] / normalLength,
        normal[2] / normalLength
    ];

    // Нормализуем направление света
    const lightLength = Math.hypot(lightDir[0], lightDir[1], lightDir[2]);
    const normalizedLightDir = [
        lightDir[0] / lightLength,
        lightDir[1] / lightLength,
        lightDir[2] / lightLength
    ];

    //console.log('Normal:', normalizedNormal, 'Light dir:', normalizedLightDir);

    // Вычисляем скалярное произведение нормали и направления света
    const cosLN = cosAngleBetween(normalizedNormal, normalizedLightDir);

    //console.log('Cos Angle:', cosLN);
   
    // Интенсивность освещения не может быть отрицательной
    const lambertIntensity = Math.max(0, cosLN);
    //console.log('lambertIntensity:', lambertIntensity * k * i);

    return ambientIntensity + lambertIntensity * k * i;
}

function applyShading(baseColor, intensity) {
    return {
        r: Math.min(255, Math.floor(baseColor.r * intensity)),
        g: Math.min(255, Math.floor(baseColor.g * intensity)),
        b: Math.min(255, Math.floor(baseColor.b * intensity))
    };
}

function saveFigureToFile() {
    if (!currentFigure) {
        alert("Нет фигуры для сохранения!");
        return;
    }
    const objData = convertFigureToOBJ(currentFigure); 
    const blob = new Blob([objData], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "figure.obj";  // Имя файла для сохранения
    link.click();
  }
  
  function convertFigureToOBJ(figure) {
    if (!figure || !figure.vertices || !figure.faces) {
        console.error("Невалидная фигура для конвертации в OBJ");
        return "";
    }
  
    let objData = "# OBJ файл, сгенерированный из фигуры\n";
    
    // Преобразуем вершины в формат OBJ (v x y z)
    figure.vertices.forEach(vertex => {
        if (Array.isArray(vertex) && vertex.length === 3) {
        objData += `v ${vertex[0]} ${vertex[1]} ${vertex[2]}\n`;
        } else {
        console.error("Некорректная вершина:", vertex);
        }
    });
  
    // Преобразуем грани в формат OBJ (f v1 v2 v3)
    figure.faces.forEach(face => {
        if (Array.isArray(face)) {
        // В OBJ индексы начинаются с 1, а не с 0, поэтому добавляем 1
        objData += `f ${face.map(i => i + 1).join(' ')}\n`;
        } else {
        console.error("Некорректная грань:", face);
        }
    });
  
    return objData;
}

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
        [0, 0, 1, 0], 
        [0, 0, -1 / c, 1]
    ];

    let [x, y, z, w] = multiplyMatrixAndPoint(perspectiveMatrix, [point[0], point[1], point[2], 1]);

    // Установка минимального значения, чтобы избежать неправильной отрисовки
    const adjustedW = Math.max(w, 0.1);

    return [
        (x / adjustedW) + canvas.width / 2, 
        (y / adjustedW) + canvas.height / 2,  
        z, 
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
        z,
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
    const normals = [];
    const textures = [];
    const faceNormals = [];
    const faceTextures = [];

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'v') {
            // Вершина
            const vertex = parts.slice(1, 4).map(Number);
            vertices.push(vertex);
        } else if (parts[0] === 'vn') {
            // Нормаль вершины
            const normal = parts.slice(1, 4).map(Number);
            normals.push(normal);
        } else if (parts[0] === 'vt') {
            // Текстурная координата
            const texture = parts.slice(1, 3).map(Number);
            textures.push(texture);
        } else if (parts[0] === 'f') {
            // Грань
            const face = [];
            const faceNormal = [];
            const faceTexture = [];

            parts.slice(1).forEach(part => {
                const indices = part.split('/');
                const vertexIndex = parseInt(indices[0], 10) - 1;
                face.push(vertexIndex);

                if (indices[1]) {
                    const textureIndex = parseInt(indices[1], 10) - 1;
                    faceTexture.push(textureIndex);
                }

                if (indices[2]) {
                    const normalIndex = parseInt(indices[2], 10) - 1;
                    faceNormal.push(normalIndex);
                }
            });

            faces.push(face);
            faceTextures.push(faceTexture);
            faceNormals.push(faceNormal);
        }
    });

    customFigure = {
        vertices: vertices,
        faces: faces,
        normals: normals,
        textures: textures,
        faceNormals: faceNormals,
        faceTextures: faceTextures,
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

//======================Обработчики=====================

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