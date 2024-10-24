const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const cube = {
    vertices: [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // Задняя часть (?)
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]    // Лицевая часть (?)
    ],
    faces: [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], 
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
    ]
};

let showVertices = true;
let showEdges = true;
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

// Проекция 
function project([x, y, z]) {
    const distance = 3;
    const scale = 300;
    return [
        (x / (z + distance)) * scale + canvas.width / 2,
        (y / (z + distance)) * scale + canvas.height / 2
    ];
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rotationX = getRotationXMatrix(rotateX);
    const rotationY = getRotationYMatrix(rotateY);
    const rotationZ = getRotationZMatrix(rotateZ);
    const scaling = getScaleMatrix(scale);

    const transformedVertices = cube.vertices.map(vertex => {
        let point = [...vertex, 1];  
        point = multiplyMatrixAndPoint(rotationX, point);
        point = multiplyMatrixAndPoint(rotationY, point);
        point = multiplyMatrixAndPoint(rotationZ, point);
        point = multiplyMatrixAndPoint(scaling, point);
        return project([point[0], point[1], point[2]]);
    });

    if (showEdges) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        cube.faces.forEach(face => {
            for (let i = 0; i < face.length; i++) {
                const [x1, y1] = transformedVertices[face[i]];
                const [x2, y2] = transformedVertices[face[(i + 1) % face.length]];
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        });
        ctx.stroke();
    }

    if (showVertices) {
        ctx.fillStyle = 'red';
        transformedVertices.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

draw();
