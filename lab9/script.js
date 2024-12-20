const canvas = document.getElementById('canvas');
const width = canvas.width;
const height = canvas.height;
const ctx = canvas.getContext('2d');
let figureSelect = document.getElementById('figure-select');
let shadingList = document.getElementById('shading-list');
let shadingSelect = document.getElementById('shading-select');
let load_obj = document.getElementById('load-obj');
let save_obj = document.getElementById('save-obj');
let curFigure = 0;
let curFunction = 0;
let currentFigure = null;
let useFileNormals = true; 
let lightPosX = document.getElementById('lightPosX').value;
let lightPosY = document.getElementById('lightPosY').value;
let lightPosZ = document.getElementById('lightPosZ').value;

let showVertices = true;
let showEdges = true;
let showXYZ = true; //TEST
let rotateX = parseFloat(document.getElementById('rotateX').value);
let rotateY = parseFloat(document.getElementById('rotateY').value);
let rotateZ = parseFloat(document.getElementById('rotateZ').value);
let scale = parseFloat(document.getElementById('scale').value);
let translateX = parseInt(document.getElementById('translateX').value);
let translateY = parseInt(document.getElementById('translateY').value);
let translateZ = parseInt(document.getElementById('translateZ').value);
let Ax = 0, Ay = 0, Az = 0;
let Bx = 0, By = 0, Bz = 0;
let angle = 0;
let currentProjection = 'axonometric';
let curShading = 0;//по-умолчанию плоский
let visibleTriangles;

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

//==============Textures===========
let textureImage = null;  // Глобальное изображение
let textureCanvas = document.createElement('canvas');
let textureCtx = textureCanvas.getContext('2d');

//загрузка текстуры из файла
function loadTexture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png, .jpg';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            const img = new Image();
            reader.onload = (e) => {
                img.onload = () => {
                    textureCanvas.width = img.width;
                    textureCanvas.height = img.height;
                    textureCtx.drawImage(img, 0, 0);
                    textureImage = textureCtx.getImageData(0, 0, img.width, img.height);
                    console.log('Текстура загружена');
                    draw();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

//интерполяция
function lerpUV(uv1, uv2, t) {
    return [
        uv1[0] + (uv2[0] - uv1[0]) * t,
        uv1[1] + (uv2[1] - uv1[1]) * t
    ];
}

//==============Textures===========

//=======Z-buffer=======

function Triangulation(triangles, face)
{
    for (let i = 0; i < face.length-2; i++) 
    {
        triangle = [[//вершины
                    face[0][0],
                    face[i+1][0],
                    face[i+2][0] 
                   ], 
                   [//нормали
                    face[0][1],
                    face[i+1][1],
                    face[i+2][1] 
                   ],
                   [//текстуры
                    face[0][2],
                    face[i+1][2],
                    face[i+2][2]
                   ]];
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
    let colorBuffer = new Array(width * height).fill(null);

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
    save_obj.style.display = "none";

    switch(curFigure) {
        case 0:  
            if (customFigure) {
                figure = customFigure; 
                load_obj.style.display = "block";
                save_obj.style.display = "block";
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
        
        const transformedNormals = figure.normals.map(n=>{
            let point = [...n, 1];  
            if(Ax !== Bx || Ay !== By || Az !== Bz)
                point = multiplyMatrixAndPoint(RotateAroundLineMatrix, point);// поворот вокруг прямой
            point = multiplyMatrixAndPoint(rotationX, point);//повороты
            point = multiplyMatrixAndPoint(rotationY, point);
            point = multiplyMatrixAndPoint(rotationZ, point);
            point = multiplyMatrixAndPoint(reflectionMatrix, point);//отражение
            return point;
        })

        const projectedVertices = transformedVertices.map(vertex => project([vertex[0], vertex[1], vertex[2]]));
        //console.log(projectedVertices);
                
        // грани
        visibleTriangles = [];
        let minZ = Infinity;
        let maxZ = -Infinity;

        // Триангуляция, отсечение нелицевых и растеризация
        figure.faces.forEach((face, faceIndex) => {
            // триангуляция если > 3 точек
            triangles = [];
            
            Triangulation(triangles, face);

            triangles.forEach((t, tIndex) => {//t = [v,n,t]
                const [v1, v2, v3] = t[0].map(index => transformedVertices[index]);
                let normal;

                if (useFileNormals && figure.normals[0] != null) 
                {
                    //normal1v = figure.normals[t[1][0]]
                    //normal2v = figure.normals[t[1][1]]
                    //normal3v = figure.normals[t[1][2]]
                    //xnorm = normal1v[0] + normal2v[0] + normal3v[0]
                    //ynorm = normal1v[1] + normal2v[1] + normal3v[1]
                    //znorm = normal1v[2] + normal2v[2] + normal3v[2]
                    //normal = [xnorm, ynorm, znorm]
                    normal = transformedNormals[t[1][0]]
                }
                else 
                {
                    normal = calculateNormal(v1, v2, v3);
                }

                //нормализация
                normalization_value = Math.sqrt(normal[0]*normal[0]+normal[1]*normal[1]+normal[2]*normal[2])
                normal.forEach(coord => coord/normalization_value)
                


                const [pv1, pv2, pv3] = t[0].map(index => projectedVertices[index]);
                const textureCoords = t[2].map(index => figure.textures[index]); // Текстурные координаты
                // console.log(textureCoords);
                const projectedNormal = calculateNormal(pv1, pv2, pv3);
                const cosAngle = cosAngleBetween(projectedNormal, viewVector);

                if (cosAngle < 0) { // Отсечение нелицевых граней
                    visibleTriangles.push(t);
                    [minZ, maxZ] = rasterizeTriangle([[pv1, pv2, pv3], t[1].map(index => transformedNormals[index])], zBuffer, normalBuffer, colorBuffer, width, height, minZ, maxZ, normal, textureCoords);
                }
            })
        });

        renderDepthBufferSimple(zBuffer, normalBuffer, colorBuffer, minZ.toFixed(5), maxZ.toFixed(5));
        
        //далее - опциональные приколюхи

        // отображение триангуляции
        if (showEdges)
        {
            ctx.strokeStyle = 'pink';
            ctx.beginPath();
            visibleTriangles.forEach(t=>{
                for (let i = 0; i < t[0].length; i++)
                {
                    const [x1, y1] = projectedVertices[t[0][i]];
                    const [x2, y2] = projectedVertices[t[0][(i + 1) % t[0].length]];
                    
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

function lerpUV(x0, u0, v0, x1, u1, v1, x) {
    const t = (x - x0) / (x1 - x0); // Нормализованное значение интерполяции
    const u = u0 + t * (u1 - u0);  // Линейная интерполяция для U
    const v = v0 + t * (v1 - v0);  // Линейная интерполяция для V
    return { u, v };
}

function rasterizeTriangle(triangle, zBuffer, normalBuffer, colorBuffer, width, height, minZ, maxZ, normal, textureCoords) 
{
    // console.log('before ','trgls: ', triangle, "textureCoords", textureCoords);
    const [vn0, vn1, vn2] = [[triangle[0][0], triangle[1][0], textureCoords[0]], [triangle[0][1], triangle[1][1], textureCoords[1]], [triangle[0][2], triangle[1][2], textureCoords[2]]]; // [[Три вершины треугольника (x, y, z)], [Их нормали]]
    // console.log('before ',"points and normals: ", [vn0, vn1, vn2], "textures ", textureCoords);
    
    // Сортировка по Y-координате для упрощения
    const [pn0, pn1, pn2] = [vn0, vn1, vn2].sort((a, b) => a[0][1] - b[0][1]);
    const [p0, p1, p2, n0, n1, n2, vt0, vt1, vt2] = [pn0[0], pn1[0], pn2[0], pn0[1], pn1[1], pn2[1], pn0[2], pn1[2], pn2[2]]//pN - это точки, nN - их нормали
    // const [vt0, vt1, vt2] = [textureCoords[0], textureCoords[1], textureCoords[2]]; // извлекаем в переменные текстурные координаты
    // console.log('after ', 'points: ', [p0, p1, p2], "normals: ", [n0, n1, n2], 'text: ', [vt0, vt1, vt2]);
    // console.log(vt0, vt1, vt2);
    // Вычисление границ по Y
    const yMin = Math.max(Math.ceil(p0[1]), 0);
    const yMax = Math.min(Math.floor(p2[1]), height - 1);

    //Вычисление цвета для Гуро
    const [color0, color1, color2] = calculateColorGuro(n0, n1, n2, p0, p1, p2);

    for (let y = yMin; y <= yMax; y++) 
    {
        // Интерполяция X-координат и Z для текущей строки
        let xStart, xEnd, zStart, zEnd, normalStart, normalEnd, cStart, cEnd, uvStart, uvEnd;

        if (y < p1[1]) // Верхняя половина треугольника 
        { 
            const t0 = (y - p0[1]) / (p1[1] - p0[1]);
            const t1 = (y - p0[1]) / (p2[1] - p0[1]);
            xStart = lerp(p0[0], p1[0], t0);
            zStart = lerp(p0[2], p1[2], t0);
            xEnd = lerp(p0[0], p2[0], t1);
            zEnd = lerp(p0[2], p2[2], t1);

            normalStart = normal_lerp(n0, n1, t0);
            normalEnd = normal_lerp(n0, n2, t1);

            uvStart = lerpUVPersp(vt0, vt1,zStart,zEnd, t0);
            uvEnd = lerpUVPersp(vt0, vt2, zStart, zEnd, t1);

            cStart = color_lerp(color0, color1, t0);
            cEnd = color_lerp(color0, color2, t1);
        }
        else // Нижняя половина треугольника
        { 
            const t0 = (y - p1[1]) / (p2[1] - p1[1]);
            const t1 = (y - p0[1]) / (p2[1] - p0[1]);
            xStart = lerp(p1[0], p2[0], t0);
            zStart = lerp(p1[2], p2[2], t0);
            xEnd = lerp(p0[0], p2[0], t1);
            zEnd = lerp(p0[2], p2[2], t1);

            normalStart = normal_lerp(n1, n2, t0);
            normalEnd = normal_lerp(n0, n2, t1);

            uvStart = lerpUVPersp(vt1, vt2, zStart, zEnd, t0); // Интерполяция текстурных координат
            uvEnd = lerpUVPersp(vt0, vt2, zStart, zEnd, t1);  // Интерполяция текстурных координат

            cStart = color_lerp(color1, color2, t0);
            cEnd = color_lerp(color0, color2, t1);
        }

        // Обеспечение порядка X
        if (xStart > xEnd) 
        {
            [xStart, xEnd] = [xEnd, xStart];
            [zStart, zEnd] = [zEnd, zStart];
            [normalStart, normalEnd] = [normalEnd, normalStart];
            [cStart, cEnd] = [cEnd, cStart];
            [uvStart, uvEnd] = [uvEnd, uvStart];

        }

        // Округление X для пиксельных границ
        const xMin = Math.max(Math.ceil(xStart), 0);
        const xMax = Math.min(Math.floor(xEnd), width - 1);

        for (let x = xMin; x <= xMax; x++) 
        {
            // Интерполяция Z
            const t = (x - xStart) / (xEnd - xStart);
            const z = lerp(zStart, zEnd, t);

            // Интерполяция нормали
            calculated_normal = normal_lerp(normalStart, normalEnd, t);
            // Индекс в Z-буфере
            const index = Math.floor(y) * width + Math.floor(x);

            // Индекс в Z-буфере
            const uv = lerpUVPersp(uvStart, uvEnd, zStart, zEnd, t);
            // Обновление Z-буфера, если пиксель ближе
            if (z > zBuffer[index]) 
            {
                zBuffer[index] = z;
                const color = getTextureColor(uv[0], uv[1]);
                if (curShading === 0)          normalBuffer[index] = [...normal]
                else if (curShading === 2)     normalBuffer[index] = calculated_normal;//Phong
                else if(curShading === 1)      colorBuffer[index] = color_lerp(cStart, cEnd, t);//Guro
                // else if(curShading === 1)      colorBuffer[index] = color_lerp(color, color, t);//Guro

                colorBuffer[index] = color;
            }

            // Обновление z границ;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
    }

    return [minZ, maxZ];
}

// Получение цвета пикселя из текстуры
function getTextureColor(u, v) {
    if (!textureImage) return { r: 255, g: 255, b: 255 }; // Белый цвет по умолчанию

    const x = Math.floor(u * (textureImage.width - 1));
    const y = Math.floor(v * (textureImage.height - 1));

    const index = (y * textureImage.width + x) * 4;
    const data = textureImage.data;

    return {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2]
    };
}
// Линейная интерполяция
function lerp(a, b, t) { return a + t * (b - a); }
function normal_lerp(v1, v2, t) { return v1.map((val, i) => val + t * (v2[i] - val)); }
function color_lerp(c0, c1, t) {
    return {
        r: lerp(c0.r, c1.r, t),
        g: lerp(c0.g, c1.g, t),
        b: lerp(c0.b, c1.b, t)
    };
}

function calculateColorGuro(n0, n1, n2, p0, p1, p2)
{
    const lightPos = [lightPosX, lightPosY, lightPosZ];
    const baseColor = { r: 255, g: 255, b: 255 }; 
    const ambientIntensity = 0.3;
    
    const lightDir0 = [
        lightPos[0] - p0[0],
        lightPos[1] - (-p0[1]),
        lightPos[2] - p0[2]
    ];
    const lightDir1 = [
        lightPos[0] - p1[0],
        lightPos[1] - (-p1[1]),
        lightPos[2] - p1[2]
    ];
    const lightDir2 = [
        lightPos[0] - p2[0],
        lightPos[1] - (-p2[1]),
        lightPos[2] - p2[2]
    ];
    const intensity0 = calculateLambert(n0, lightDir0, ambientIntensity);
    const intensity1 = calculateLambert(n1, lightDir1, ambientIntensity);
    const intensity2 = calculateLambert(n2, lightDir2, ambientIntensity);
    const shade0 = applyShading(baseColor, intensity0);
    const shade1 = applyShading(baseColor, intensity1);
    const shade2 = applyShading(baseColor, intensity2);
    return [shade0, shade1, shade2];
}

function renderDepthBufferSimple(zBuffer, normalBuffer, colorBuffer, minZ, maxZ) {
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
    if (curShading !== 1)
    {
        const lightPos = [lightPosX, lightPosY, lightPosZ];
        //console.log('lightPos:', lightPos);

        const baseColor = { r: 255, g: 255, b: 255 }; 
        const ambientIntensity = 0.3; 

        for (let y = 0; y < height; y++) 
        {
            for (let x = 0; x < width; x++) 
            {
                const index = y * width + x;
                const z = zBuffer[index];

                let shade = { r: 128, g: 128, b: 128 }; // Цвет по умолчанию
                if (z !== -Infinity) 
                {
                    let normal = normalBuffer[index];
                    //const normalLength = Math.hypot(normal[0], normal[1], normal[2]);
                    
                    //normal = [
                    //    normal[0] / normalLength,
                    //    normal[1] / normalLength,
                    //    normal[2] / normalLength
                    //];

                    if (normal) 
                    {
                        // Вычисление направления света от источника к текущему пикселю
                        const lightDir = [
                            lightPos[0] - x,
                            lightPos[1] - (-y),
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
    }
    else
    {   
        for (let y = 0; y < height; y++) 
        {
            for (let x = 0; x < width; x++) 
            {
                const index = y * width + x;
                const z = zBuffer[index];

                let shade = { r: 128, g: 128, b: 128 }; // Цвет по умолчанию
                if (z !== -Infinity) 
                {
                    if (colorBuffer[index] !== null)
                    {
                        shade = colorBuffer[index];
                    }
                } 

                const pixelIndex = (y * width + x) * 4;
                data[pixelIndex] = shade.r;        // Красный
                data[pixelIndex + 1] = shade.g;    // Зеленый
                data[pixelIndex + 2] = shade.b;    // Синий
                data[pixelIndex + 3] = 255;        // Альфа
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
    //ctx.fillStyle = 'yellow';//Источник света дебаг
    //ctx.beginPath();
    //ctx.arc(lightPosX, -lightPosY, lightPosZ, 0, Math.PI * 2);
    //ctx.fill();
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
                shadingList.style.display = 'inline';
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

            parts.slice(1).forEach(part => {
                const indices = part.split('/');
                const vertexIndex = parseInt(indices[0], 10) - 1;

                const vertex_constructor = [vertexIndex];

                if (indices[2]) 
                {
                    const normalIndex = parseInt(indices[2], 10) - 1;
                    vertex_constructor.push(normalIndex);
                }
                else vertex_constructor.push(null)

                if (indices[1]) 
                {
                    const textureIndex = parseInt(indices[1], 10) - 1;
                    vertex_constructor.push(textureIndex);
                }
                else vertex_constructor.push(null)

                face.push(vertex_constructor);
            });

            faces.push(face);
        }
    });

    customFigure = {
        vertices: vertices,
        normals: normals,
        textures: textures,
        faces: faces,//[[vind, nind, tind], ..., [vind, nind, tind]]
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

// Обработчик выбора фигуры из выпадающего списка
figureSelect.addEventListener('change', (e) => {
    curFigure = parseInt(e.target.value);
    draw();
});

// Обработчик выбора шейдинга из выпадающего списка
shadingSelect.addEventListener('change', (e) => {
    curShading = parseInt(e.target.value);
    draw();
});

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