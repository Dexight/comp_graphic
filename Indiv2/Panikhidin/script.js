canvas = document.getElementById('canvas');
ctx = canvas.getContext("2d");
pixelsData = ctx.getImageData(0, 0, canvas.width, canvas.height);
let spheres; // сферы на сцене
//чекбоксы для стен зеркал
leftWallCheckbox = document.getElementById("leftWall");
backwardWallCheckbox = document.getElementById('backwardWall')
rightWallCheckbox = document.getElementById('rightWall')
forwardWallCheckbox = document.getElementById('forwardWall')

//Установка значенияя пикселя
function setPixel(x, y, col){
    //нормируем координаты (чтоб начало координат в центре было)
    if(col == undefined)
        alert('setPixel: Ошибка: Цвет не определен');
    console.log(col)    
    x = canvas.width / 2 + x;
    y = canvas.height / 2 - y - 1;

    if( x < 0 || x > canvas.width || y < 0 || y > canvas.height){
        alert('setPixel: Ошибка: выход за границы канвы');
    }

    let offset = 4*(x + y*pixelsData.width);
    if (offset < 0 || offset + 3 >= pixelsData.data.length) {
        alert('setPixel: Ошибка: индекс offset выходит за границы массива');
        return;
    }
    pixelsData.data[offset] = col.r;
    pixelsData.data[offset+1] = col.g;
    pixelsData.data[offset+2] = col.b;
    pixelsData.data[offset+3] = 255;
}

//Обновление канваса
function UpdateCanvas(){
    ctx.putImageData(pixelsData, 0, 0);
}

//Очистка канваса
function clearCanvas(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
}

// Функция-конструктор для цвета
function Color(r,g,b){
    return {
        r: r,
        g: g,
        b: b,
        add: function(otherColor) {return new Color(r + otherColor.r, g + otherColor.g, b + otherColor.b);}, // сложение с другим объектом цвета
        mult: function(num) {return new Color(r*num, g*num, b*num)}  // умножение цвета на заданное число
    };
}

//Функция-конструктор для вектора
function Vector(x, y, z){
    return {
        x: x,
        y: y, 
        z: z,
        add: function(otherVector){return new Vector(x + otherVector.x, y + otherVector.y, z + otherVector.z);},
        sub: function(otherVector){return new Vector(x - otherVector.x, y - otherVector.y, z - otherVector.z)},
        dot: function(otherVector){return x * otherVector.x + y*otherVector.y + z*otherVector.z;},
        mult: function(num){return new Vector(x*num, y*num, z*num);},
        len: function() {return Math.sqrt(x*x + y*y +z*z);},
    }
}

//Функция для создания сферы
//spec - зеркальность
//refl - отражение
function Sphere(centerVec, radius, color, spec, refl){
    return{
        center: centerVec,
        radius: radius,
        color: color,
        specularity: spec, 
        reflective: refl
    };
}
let viewPortSize = 1;
function canvas2viewport(x, y){
    return Vector(
        x*viewPortSize / canvas.width,
        y*viewPortSize / canvas.height,
        1
    );
}


//Освещение
// задается интенсивноостью и позицией светильника 
function Ligthing(intensity, position){
    return {
        intensity: intensity,
        position : position
    }
}

//P(t)=origin+t⋅direction - уравнение луча, где P(t) - точка на луче, t - расстояние вдоль направления луча
/* 
|P - center|^2 = radius^2  - уравнение сферы
|origin + t*direction - center|^2 = radius

раскрывая, получаем:

oc⋅oc+2t⋅(oc⋅direction)+t^2⋅(direction⋅direction)=radius^2
~ 
a*t^2 + b*t + c, 
где a = direction^2,
    b = 2*oc*direction,
    c = oc^2 - radius^2
*/

//функция поиска пересечения луча и сферы 
//origin - начальная точка луча
//dir - направление луча
//sphere - сфера с которой происходит пересечение

function intersectOfRaySphere(origin, dir, sphere){
    let center = sphere.center; // берем центр сферы
    let rad = sphere.radius
    let oc = origin.sub(center); // разность origin - center
    let a = dir.dot(dir); // direction * direction
    let b = 2*oc.dot(dir);
    let c = oc.dot(oc) - rad*rad;

    let D = b*b -4*a*c; // Дискриминант
    if(D < 0){
        return [Infinity, Infinity]; // пересечение неопределено
    }
    //корни
    let t1 = (-b - Math.sqrt(D))/(2*a);
    let t2 = (-b + Math.sqrt(D))/(2*a);
    return [t1, t2];
}

//функция отрисовки сцены
function draw(){
    clearCanvas();
    spheres = [
        //<стены>
        Sphere(Vector(-4001, 0, 0), 4000, Color(0, 255, 0), 1, leftWallCheckbox.checked),
        Sphere(Vector(0, -4001, 0), 4000, Color(255, 255, 255), 1, 0),
        Sphere(Vector(4001, 0, 0), 4000, Color(255, 255, 0), 1, rightWallCheckbox.checked),
        Sphere(Vector(4001, 0, 0), 4000, Color(255, 0, 255), 1, 0),
        Sphere(Vector(0, 0, -3995), 4000, Color(128, 255, 255), 1, forwardWallCheckbox.checked),
        Sphere(Vector(0, 0, 3995), 4000, Color(255, 255, 255), 1, backwardWallCheckbox.checked),
        //</стены>


    ]
}


draw();
// логи для тестрования функций: 

/*
console.log(Color(0.3, 0.5, 0.7).mult(2))
console.log(Color(0.3, 0.5, 0.7).add(Color(0.2, 0.3, 0.3)))
console.log(Vector(1,1,1).dot(Vector(2,2,2)))
console.log(Vector(1,1,1).mult(0.5))
console.log(Vector(1,1,1).len())

col = Color(0,0,255);
console.log(col)
for(let i = 0; i < 20; i++)
    setPixel(i,i,col);

UpdateCanvas();


*/
