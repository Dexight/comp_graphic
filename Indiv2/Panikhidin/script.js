canvas = document.getElementById('canvas');
ctx = canvas.getContext("2d");
pixelsData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Функция-конструктор для цвета
function Color(r,g,b){
    return {
        r,
        g,
        b,
        add: function(otherColor) {return new Color(r + otherColor.r, g + otherColor.g, b + otherColor.b);}, // сложение с другим объектом цвета
        mult: function(num) {return new Color(r*num, g*num, b*num)}  // умножение цвета на заданное число
    };
}

//Функция-конструктор для вектора
function Vector(x, y, z){
    return {
        x,
        y, 
        z,
        add: function(otherVector){return new Vector(x + otherVector.x, y + otherVector.y, z + otherVector.z);},
        sub: function(otherVector){return new Vector(x - otherVector.x, y - otherVector.y, z - otherVector.z)},
        dot: function(otherVector){return x * otherVector.x + y*otherVector.y + z*otherVector.z;},
        mult: function(num){return new Vector(x*num, y*num, z*num);},
        len: function() {return Math.sqrt(x*x + y*y +z*z);},
    }
}

//Функция для создания сферы
function Sphere(){
    //TODO
}


// логи для тестрования функций: 

/*
console.log(Color(0.3, 0.5, 0.7).mult(2))
console.log(Color(0.3, 0.5, 0.7).add(Color(0.2, 0.3, 0.3)))
console.log(Vector(1,1,1).dot(Vector(2,2,2)))
console.log(Vector(1,1,1).mult(0.5))
console.log(Vector(1,1,1).len())
*/
