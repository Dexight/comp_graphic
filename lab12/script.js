const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth*0.65;
canvas.height = window.innerHeight*0.65;

const width = canvas.width;
const height = canvas.height;

//----------------------------------- Полезные функции

// Нормализация вектора
const normalize = vector => {
    const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
};

// Разность векторов
const subtract = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z });

//Из градусов в радианы
const degToRad = degrees => degrees * Math.PI / 180;

// x1*x2 + y1*y2 + z1*z2 для проверки пересечений
const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

// вектор на матрицу
const multiplyMatrixVector = (matrix, vector) => {
    return {
        x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
        y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
        z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z
    };
};

// Матрица поворота в зависимости от выбранной оси и угла
const createRotationMatrix = (axis, angle) => {
    const rad = degToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    if (axis === 'x') {
        return [
            [1, 0, 0],
            [0, cos, -sin],
            [0, sin, cos]
        ];
    } else if (axis === 'y') {
        return [
            [cos, 0, sin],
            [0, 1, 0],
            [-sin, 0, cos]
        ];
    } else if (axis === 'z') {
        return [
            [cos, -sin, 0],
            [sin, cos, 0],
            [0, 0, 1]
        ];
    }
};

//------------------------------------ Константы

const fovScale = Math.tan(degToRad(90 / 2));// скейл

// Свет
const light = {
    position: { x: -4, y: 2, z:-6 },
    intensity: 1.5
};

// Камера
//const camera = { position: { x: 0, y: 0, z: 0 } };

//------------------------------------ Классы объектов

//базовый объект

// Сфера
class Sphere
{
    constructor(center, radius, color) 
    {
        this.color = color;
        this.center = center;
        this.radius = radius;
    }

    intersect(rayOrigin, rayDir) 
    {
        const oc = subtract(rayOrigin, this.center);
        const b = dot(oc, rayDir);
        
        const c = dot(oc, oc) - this.radius ** 2;
        
        const h = b * b - c;

        if (h < 0) return [-1, -1];//нет пересечений

        h = Math.sqrt(h);
        return [-b-h, -b+h];
    }
}

// Куб
class Box 
{
    constructor(center, size, color) {
        this.color = color;
        this.center = center;
        this.size = size;
        this.rotationMatrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    rotate(axis, angle) 
    {
        const rotation = createRotationMatrix(axis, angle);
        this.rotationMatrix = this.rotationMatrix.map((row, i) => row.map((_, j) => 
            rotation[i][0] * this.rotationMatrix[0][j] +
            rotation[i][1] * this.rotationMatrix[1][j] +
            rotation[i][2] * this.rotationMatrix[2][j]
        ));
    }

    intersect(rayOrigin, rayDir) 
    {
        let m = {
            x: 1.0 / rayDir.x,
            y: 1.0 / rayDir.y,
            z: 1.0 / rayDir.z
        };
    
        let n = {
            x: m.x * rayOrigin.x,
            y: m.y * rayOrigin.y,
            z: m.z * rayOrigin.z
        };
    
        let k = {
            x: Math.abs(m.x) * boxSize.x,
            y: Math.abs(m.y) * boxSize.y,
            z: Math.abs(m.z) * boxSize.z
        };
    
        let t1 = {
            x: -n.x - k.x,
            y: -n.y - k.y,
            z: -n.z - k.z
        };
    
        let t2 = {
            x: -n.x + k.x,
            y: -n.y + k.y,
            z: -n.z + k.z
        };
    
        let tN = Math.max(Math.max(t1.x, t1.y), t1.z);
        let tF = Math.min(Math.min(t2.x, t2.y), t2.z);
    
        if (tN > tF || tF < 0.0) return { tN: -1.0, tF: -1.0, outNormal: null };
    
        let outNormal = { x: 0, y: 0, z: 0 };
        if (tN > 0.0) 
        {
            outNormal.x = tN === t1.x ? 1.0 : 0.0;
            outNormal.y = tN === t1.y ? 1.0 : 0.0;
            outNormal.z = tN === t1.z ? 1.0 : 0.0;
        } 
        else 
        {
            outNormal.x = tF === t2.x ? 1.0 : 0.0;
            outNormal.y = tF === t2.y ? 1.0 : 0.0;
            outNormal.z = tF === t2.z ? 1.0 : 0.0;
        }
    
        // Adjust normal direction based on ray direction
        outNormal.x *= -Math.sign(rd.x);
        outNormal.y *= -Math.sign(rd.y);
        outNormal.z *= -Math.sign(rd.z);
    
        return [tN, tF, outNormal];
    }
}

//--------------------------------------------------------- Основной функционал
