canvas = document.getElementById('canvas');
ctx = canvas.getContext("2d");
pixelsData = ctx.getImageData(0, 0, canvas.width, canvas.height);
let spheres; // сферы на сцене

//чекбоксы для стен зеркал
leftWallCheckbox = document.getElementById("leftWall");
backwardWallCheckbox = document.getElementById('backwardWall')
rightWallCheckbox = document.getElementById('rightWall')
forwardWallCheckbox = document.getElementById('forwardWall')

reflSphere1 = document.getElementById("reflectionSphere1");
specSphere1 = document.getElementById("specularitySphere1");

reflSphere2 = document.getElementById("reflectionSphere2");
specSphere2 = document.getElementById("specularitySphere2");


//
//Установка значенияя пикселя
function setPixel(x, y, col){
    //нормируем координаты (чтоб начало координат в центре было)
    if(col == undefined)
        alert('setPixel: Ошибка: Цвет не определен');
    // console.log(col)    
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

// Функция конструктор-освещения
// задается интенсивноостью и позицией светильника 
function Ligthing(intensity, position){
    return {
        intensity: intensity,
        position : position
    }
}

light1 = Ligthing(0.9, Vector(0, 0.6, 3));

function onchangeLight1(){
    let X = document.getElementById('light1X').value;
    let Y = document.getElementById('light1Y').value;
    let Z = document.getElementById('light1Z').value;
    let intens = document.getElementById('intensityLigth1').value;
    light1 = Ligthing(intens, Vector(X,Y,Z));
    draw();
}
let lightings;

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
//Поиск ближайшего пересечения луча и сферы
function FindClosestIntersection(origin, dir, mint, maxt){
    let rest = Infinity;
    let closestSphere = undefined;

    for(let i = 0; i < spheres.length; ++i){
        let t = intersectOfRaySphere(origin, dir, spheres[i]);
        if (t[0] < rest && mint<=t[0] && t[0] <= maxt){
            rest = t[0];
            closestSphere = spheres[i];
        }
        if (t[1] < rest && mint<=t[1] && t[1] <= maxt){
            rest = t[1];
            closestSphere = spheres[i];
        }
    }
    if (closestSphere!== undefined){
        return [closestSphere, rest]
    }
    return undefined
}

//Функция для расчета отраженного вектора
//N - нормаль(единичный вектор)
//R - падающий
    function ReflectionRay(N, R){
        return N.mult(2*N.dot(R)).sub(R);
    }

// расчет света в точке
//pointLighting - точка, где рассчитывается освещение
//normalVector - вектор нормали для pointLighting
//viewVector - вектор направления к наблюдателю
//specularity - параметр отражаемости в точке 
function computeLigthingAtPoint(pointLighting, normalVector, viewVector, specularity){
    let intensityOfLightAtPoint = 0; // интенсивность света в точке
    for(let i = 0; i < lightings.length; ++i){
        lightingVector = lightings[i].position.sub(pointLighting); // вектор освещения
        let thingBetween = FindClosestIntersection(pointLighting, lightingVector, 0.0001, 1);
        if(thingBetween !== undefined) continue; // игнорируем источник света, если найдено препятствие

        let cosPhi = (normalVector.dot(lightingVector)) / (normalVector.len()*lightingVector.len());
        if (cosPhi > 0){
            intensityOfLightAtPoint += lightings[i].intensity * cosPhi;
        }

        if(specularity != -1){
            let reflectedVector = ReflectionRay(normalVector, lightingVector);
            let cosPsi = (reflectedVector.dot(viewVector))/(reflectedVector.len()*viewVector.len());
            if(cosPsi > 0){
                intensityOfLightAtPoint += lightings[i].intensity * Math.pow(cosPsi, specularity);
            }
        }
    }
    return intensityOfLightAtPoint;
}

function RayTracing(originVector, dir, mint, maxt, depth = 5) {
    let intersection = FindClosestIntersection(originVector, dir, mint, maxt);
    if (intersection === undefined)
        return Color(0, 0, 0); // Фон - черный

    let closestSphere = intersection[0];
    let t = intersection[1];

    // Точка пересечения
    let point = originVector.add(dir.mult(t));
    
    // Нормаль в точке пересечения
    let normalVector = point.sub(closestSphere.center);
    normalVector = normalVector.mult(1.0 / normalVector.len()); // Нормализованная нормаль
    // console.log('Вектор нормали: ', normalVector);
    // Вектор взгляда
    let viewVector = dir.mult(-1);

    // Локальное освещение
    let intensityOfLighting = computeLigthingAtPoint(point, normalVector, viewVector, closestSphere.specularity);
    let localColor = closestSphere.color.mult(intensityOfLighting);

    // Проверка на отражающие свойства
    if (closestSphere.reflective <= 0 || depth <= 0) {
        return localColor;
    }

    // Отраженный луч
    let reflRay = ReflectionRay(viewVector, normalVector);
    let reflectedColor = RayTracing(point, reflRay, 0.0001, Infinity, depth - 1);

    // Смешивание локального и отраженного цветов
    let localContribution = localColor.mult(1 - closestSphere.reflective);
    let reflectedContribution = reflectedColor.mult(closestSphere.reflective);
    return localContribution.add(reflectedContribution);
}

function changeSpherePos(){
    draw();
}
//функция отрисовки сцены
function draw(){
    clearCanvas();
    lightings = [light1];
    sphere1X = document.getElementById("smallSpherePositionX").value; 
    sphere1Y = document.getElementById("smallSpherePositionY").value;
    sphere1Z = document.getElementById("smallSpherePositionZ").value;

    sphere2X = document.getElementById("bigSpherePositionX").value; 
    sphere2Y = document.getElementById("bigSpherePositionY").value;
    sphere2Z = document.getElementById("bigSpherePositionZ").value;

    spheres = [
        //<стены>
        Sphere(Vector(-4001, 0, 0), 4000, Color(255, 255, 255), 1, leftWallCheckbox.checked ? 1 : 0), // левая стена
        Sphere(Vector(0, -4001, 0), 4000, Color(255, 255, 0), 1, 0), // пол
        Sphere(Vector(4001, 0, 0), 4000, Color(128, 64, 0), 1, rightWallCheckbox.checked? 1 : 0), // правая стена
        Sphere(Vector(0, 4001, 0), 4000, Color(255, 128, 255), 1, 0), //потолок
        Sphere(Vector(0, 0, -3996), 4000, Color(128, 255, 255), 1, forwardWallCheckbox.checked ? 1 : 0), // передняя от камеры стена
        Sphere(Vector(0, 0, 3996), 4000, Color(255, 255, 255), 1, backwardWallCheckbox.checked ? 1 : 0), // задняя от камеры стена
        //</стены>
        Sphere(Vector(sphere1X, sphere1Y, sphere1Z), 0.1, Color(255, 0, 0), parseInt(specSphere1.value), parseInt(reflSphere1.value)), // красная сфера с радиусом 1
        Sphere(Vector(sphere2X, sphere2Y, sphere2Z), 0.4, Color(0, 0, 255), parseInt(specSphere2.value), parseInt(reflSphere2.value)), // синяя сфера с радиусом 1.5
      
    ]
    for (let x = -canvas.width / 2; x < canvas.width / 2; x++) {
        for (let y = -canvas.height / 2; y < canvas.height / 2; y++) {
            let direction = canvas2viewport(x, y);
            let color = RayTracing(Vector(0,0,0), direction, 1, Infinity, 10);
            setPixel(x, y, color);
        }
    }

    UpdateCanvas();
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
