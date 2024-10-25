const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let figureSelect = document.getElementById('figure-select');
let curFigure = 0;

// Обработчик выбора фигуры из выпадающего списка
figureSelect.addEventListener('change', (e) => {
    curFigure = parseInt(e.target.value);
    
    draw(curFigure);
});

// центр системы координат = центр фигуры
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

//ab = 2 * Math.sin( 36 * Math.PI / 180);

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
let rotateX = 0, rotateY = 0, rotateZ = 0;
let scale = 1;

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

function project([x, y, z]) {
    const distance = 3;
    const scale = 300;

    const adjustedZ = Math.max(z + distance, 0.1); // Установка минимального значения для z

    return [
        (x / adjustedZ) * scale + canvas.width / 2,
        (canvas.height / 2 - (y / adjustedZ) * scale) // Инвертируем Y
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rotationX = getRotationXMatrix(rotateX);
    const rotationY = getRotationYMatrix(rotateY);
    const rotationZ = getRotationZMatrix(rotateZ);
    const scaling = getScaleMatrix(scale);

    let figure;
    let isCube = false;
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
        default: return;
    }

    const transformedVertices = figure.vertices.map(vertex => {
        let point = [...vertex, 1];  
        point = multiplyMatrixAndPoint(rotationX, point);
        point = multiplyMatrixAndPoint(rotationY, point);
        point = multiplyMatrixAndPoint(rotationZ, point);
        point = multiplyMatrixAndPoint(scaling, point);
        return project([point[0], point[1], point[2]]);
    });

    // рёбра
    if (showEdges) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        figure.faces.forEach(face => {
            for (let i = 0; i < face.length; i++) {
                const [x1, y1] = transformedVertices[face[i]];
                const [x2, y2] = transformedVertices[face[(i + 1) % face.length]];
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        });
        ctx.stroke();
    }

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
            point = multiplyMatrixAndPoint(rotationX, point);
            point = multiplyMatrixAndPoint(rotationY, point);
            point = multiplyMatrixAndPoint(rotationZ, point);
            point = multiplyMatrixAndPoint(scaling, point);
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
}

draw();
