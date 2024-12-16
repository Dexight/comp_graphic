// Псевдокод и все тонкости рендеринга смотрел тутъ: https://habr.com/ru/articles/342510/ + ещё много где искал
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const width = canvas.width = 600;
const height = canvas.height = 600;

//----------------------------------- Полезные функции

// Разность векторов
const subtract = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z });

// Сумма векторов
const sum = (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z });

// Произведение вектора на число
const mult = (v, n) => ({ x: v.x * n, y: v.y * n, z: v.z * n });

// Скалярное произведение
const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

const vlength = (v) => Math.sqrt(dot(v, v));

const ColorPlusColor = (c1, c2) => ({r: c1.r+c2.r, g: c1.g + c2.g, b: c1.b + c2.b});

const ColorMultN = (c, n) => ({r: c.r*n, g: c.g*n, b: c.b*n});

const ReflectRay = (v1, v2) => (subtract(mult(v2, 2*dot(v1, v2)), v1));

const CanvasToViewport = (x, y) =>({x: x * viewport_size / width, y: y * viewport_size / height, z: projection_plane_d})
//------------------------------------ Классы объектов

class Sphere 
{
    constructor(center, radius, color, specular, reflective, alpha) 
    {
        this.color = color;
        this.center = center;
        this.radius = radius;
        this.specular = specular;//Блеск
        this.reflective = reflective;//отражение
        this.alpha = alpha;
    }

    intersect(rayOrigin, rayDir) 
    {
        let oc = subtract(rayOrigin, this.center);
        let a = dot(rayDir, rayDir);
        let b = 2 * dot(oc, rayDir);
        let c = dot(oc, oc) - this.radius*this.radius;

        let discriminant = b*b - 4*a*c;
        if (discriminant < 0) 
          return [Infinity, Infinity, null, null];

        let res1 = (-b + Math.sqrt(discriminant)) / (2*a);
        let res2 = (-b - Math.sqrt(discriminant)) / (2*a);
        return [res1, res2, null, null];
    }
}

class Cube 
{
  constructor(center, size, color, specular, reflective, alpha) {
      this.center = center; // Центр куба
      this.size = size; // Длина ребра куба
      this.color = color; // Цвет
      this.specular = specular; // Блеск
      this.reflective = reflective; // Отражение
      this.alpha = alpha;
  }

  intersect(rayOrigin, rayDir) 
  {
      const halfSize = this.size / 2;
      const bounds = {
          x: [this.center.x - halfSize, this.center.x + halfSize],
          y: [this.center.y - halfSize, this.center.y + halfSize],
          z: [this.center.z - halfSize, this.center.z + halfSize]
      };

      let tMin = -Infinity;
      let tMax = Infinity;
      let hitNormal = null;

      // Проверка пересечений по каждой оси
      for (const axis of ["x", "y", "z"]) {
          const t1 = (bounds[axis][0] - rayOrigin[axis]) / rayDir[axis];
          const t2 = (bounds[axis][1] - rayOrigin[axis]) / rayDir[axis];

          const tNear = Math.min(t1, t2);
          const tFar = Math.max(t1, t2);

          if (tNear > tMin) {
              tMin = tNear;
              hitNormal = { x: 0, y: 0, z: 0 };
              hitNormal[axis] = t1 < t2 ? -1 : 1;
          }
          tMax = Math.min(tMax, tFar);

          if (tMin > tMax || tMax < 0) {
              return [Infinity, Infinity, null, null]; // Нет пересечения
          }
      }

      return [tMin, tMax, hitNormal, hitNormal];
  }
}

class Light
{
    constructor(type, intensity, position = null)
    {
        this.type = type;
        this.intensity = intensity;
        this.position = position;
    }
}

//------------------------------------ Инициализация объектов

const viewport_size = 1;
const projection_plane_d = 1;
const camera = {x:0, y: 0, z: 0};
const background = {r: 0, g: 0, b:0};

let lights;
let objects;

//зеркальность
let r1 = parseFloat(document.getElementById("r1").value);
let r2 = parseFloat(document.getElementById("r2").value);
let r3 = parseFloat(document.getElementById("r3").value);
let r4 = parseFloat(document.getElementById("r4").value);
let r5 = parseFloat(document.getElementById("r5").value);

//блеск
let s1 = 100;
let s2 = 100;
let s3 = 100;

//2й источник света
let lx = 0.4;
let ly = 0;
let lz = 4;

//Прозрачность
let t1 = parseFloat(document.getElementById("t1").value);
let t2 = parseFloat(document.getElementById("t2").value);
let t3 = parseFloat(document.getElementById("t3").value);
let t4 = parseFloat(document.getElementById("t4").value);
let t5 = parseFloat(document.getElementById("t5").value);

function Prerender()
{
  lights = [
    new Light("ambient", 0.1, null, null),
    new Light("point", 0.15, {x: lx, y: ly, z: lz}, null),
    new Light("point", 0.55, {x: 0, y: 0, z: 4}, null)
  ];

  objects = [
    new Sphere({x: 0,  y: -5002, z: 0}, 5000, {r: 255, g: 255, b: 255}, -1, document.getElementById('floor').checked, 0),//пол
    new Sphere({x: 0,  y:  5002, z: 0}, 5000, {r: 0, g: 180, b: 255}, -1, document.getElementById('ceil').checked, 0),//потолок
    new Sphere({x: -5002,  y: 0, z: 0}, 5000, {r: 255, g: 0, b: 0}, -1, document.getElementById('left').checked, 0),//левая стена
    new Sphere({x: 5002,   y: 0, z: 0}, 5000, {r: 255, g: 0, b: 0}, -1, document.getElementById('right').checked, 0),//правая стена
    new Sphere({x: 0,   y: 0, z: 5008}, 5000, {r: 255, g: 0, b: 0}, -1, document.getElementById('front').checked, 0),//передняя стена
    new Sphere({x: 0,   y: 0, z: -4999}, 5000, {r: 255, g: 0, b: 0}, -1, document.getElementById('back').checked, 0),//задняя стена

    new Sphere({x: 0,  y: -1.5,     z: 5}, 0.5, {r: 255, g: 255, b: 255}, s3, r3, t3),//низ
    new Sphere({x: 0,  y: -0.8,     z: 5}, 0.4, {r: 255, g: 255, b: 255}, s2, r2, t2),//середина
    new Sphere({x: 0,  y: -0.2,     z: 5}, 0.3, {r: 255, g: 255, b: 255}, s1, r1, t1),//голова

    new Sphere({x: -0.1,  y: -0.1,     z: 4.75}, 0.05, {r: 0, g: 0, b: 0}, 100, 0, 0),//л глаз
    new Sphere({x: 0.1,  y: -0.1,     z: 4.75}, 0.05, {r: 0, g: 0, b: 0}, 100, 0, 0),//п глаз
    new Sphere({x: 0,  y: -0.2,     z: 4.7}, 0.075, {r: 255, g: 0, b: 0}, 100, 0, 0),//нос 1
    new Sphere({x: 0,  y: -0.2,     z: 4.64}, 0.04, {r: 255, g: 0, b: 0}, 100, 0, 0),//нос 2
    
    new Sphere({x: 0,  y: -0.6,     z: 4.7}, 0.05, {r: 0, g: 0, b: 0}, 100, 0, 0),// пуг 1
    new Sphere({x: 0,  y: -0.7,     z: 4.65}, 0.05, {r: 0, g: 0, b: 0}, 100, 0, 0),// пуг 2
    new Sphere({x: 0,  y: -0.8,     z: 4.64}, 0.05, {r: 0, g: 0, b: 0}, 100, 0, 0),// пуг 3

    new Cube({x:1.5, y: -1.7, z: 5.2}, 0.7, {r:0, g:255, b:0}, -1, r4,  t4),
    new Cube({x:-1.5, y: -1.8, z: 5.2}, 0.35, {r:0, g:0, b:255}, -1, r5, t5)
  ];
}

//------------------------------------ Основные функции трассировки

function ComputeLighting(point, normal, view, specular) 
{
  let intensity = 0;
  let length_n = vlength(normal);
  let length_v = vlength(view);

  for (let i = 0; i < lights.length; i++) 
  {
    let light = lights[i];
    
    if (light.type === "ambient") 
    {
      intensity += light.intensity;
      continue;
    }

    let vec_l, t_max;
    if (light.type === "point")
    {
      vec_l = subtract(light.position, point);
      t_max = 1.0;
    }

    // Проверка теней
    let shadow_sphere = ClosestIntersection(point, vec_l, 0.001, t_max);
    
    if (shadow_sphere) 
      continue;

    // Диффузность
    let n_dot_l = dot(normal, vec_l);
    if (n_dot_l > 0)
      intensity += light.intensity * n_dot_l / (length_n * vlength(vec_l));

    //Блеск
    if (specular != -1)
    {
      let ray = subtract(mult(normal, 2.0*n_dot_l), vec_l);

      let r_dot_v = dot(ray, view);

      if (r_dot_v > 0)
        intensity += light.intensity * Math.pow(r_dot_v / (vlength(ray) * length_v), specular);
    }
  }

  return intensity;
}

function ClosestIntersection(origin, direction, min_t, max_t) 
{
  let closest_t = Infinity;
  let closest_object = null;
  let normal = null;
  
  for (let i = 0; i < objects.length; i++) 
  {
    let res = objects[i].intersect(origin, direction);
    if (res[0] < closest_t && min_t < res[0] && res[0] < max_t) 
    {
      closest_t = res[0];
      closest_object = objects[i];
      normal = res[2];
    }
    
    if (res[1] < closest_t && min_t < res[1] && res[1] < max_t) 
    {
      closest_t = res[1];
      closest_object = objects[i];
      normal = res[3];
    }
  }

  if (closest_object)
    return [closest_object, closest_t, normal];
  return null;
}

function TraceRay(origin, direction, min_t, max_t, depth) 
{
  let intersection = ClosestIntersection(origin, direction, min_t, max_t);

  if (!intersection)
    return background;

  let closest_object = intersection[0];
  let closest_t = intersection[1];

  let point = sum(origin, mult(direction, closest_t));// точка пересечения
  
  let normal = intersection[2];
  if (!normal)
  {
    normal = subtract(point, closest_object.center);
    normal = mult(normal, 1.0 / vlength(normal));// нормализация нормали
  }

  //локальный цвет
  let view = {x: -direction.x, y: -direction.y, z: -direction.z};
  let lighting = ComputeLighting(point, normal, view, closest_object.specular);
  let local_color = ColorMultN(closest_object.color, lighting);

  //если конец рекурсии/объект не отражающий и не прозрачный
  if ((closest_object.reflective <= 0 && closest_object.alpha == 0) || depth <= 0)
    return local_color;

  //Отражённый свет
  let ray = ReflectRay(view, normal);
  let reflected_color = TraceRay(point, ray, 0.001, Infinity, depth - 1);

  let mixed_color = ColorPlusColor(
    ColorMultN(local_color, 1 - closest_object.reflective),
    ColorMultN(reflected_color, closest_object.reflective)
  );

  // прозрачность
  if (closest_object.alpha > 0) 
  {
    let refracted_color = TraceRay(point, direction, 0.001, Infinity, depth - 1);

    // Комбинирование локального цвета, отраженного и преломленного света
    
    mixed_color = ColorPlusColor(
      ColorMultN(mixed_color, 1 - closest_object.alpha), // Оригинальный цвет с учетом прозрачности
      ColorMultN(refracted_color, closest_object.alpha) // Цвет через прозрачность
    )
  }

  // возвращаем комбинированный цвет (без учета прозрачности)
  return mixed_color;
}

let depth = 3;
function Render() 
{
  Prerender()
  ctx.clearRect(0, 0, width, height);
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let x = -width/2; x < width/2; x++) 
  {
    for (let y = -height/2; y < height/2; y++) 
    {
        let direction = CanvasToViewport(x, y);
        let color = TraceRay(camera, direction, 1, Infinity, depth);
        
        let put_x = width/2 + x;
        let put_y = height/2 - y - 1;
      
        if (put_x < 0 || put_x >= width || put_y < 0 || put_y >= height)
          return;
      
        let index = 4*(put_x + width*put_y);
        data[index] = color.r;
        data[index+1] = color.g;
        data[index+2] = color.b;
        data[index+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

Render();

//---------------------------------------Обработчики

document.getElementById('r1').addEventListener('input', (e) => {
  r1 = parseFloat(e.target.value);
  Render();
});

document.getElementById('r2').addEventListener('input', (e) => {
  r2 = parseFloat(e.target.value);
  Render();
});

document.getElementById('r3').addEventListener('input', (e) => {
  r3 = parseFloat(e.target.value);
  Render();
});

document.getElementById('r4').addEventListener('input', (e) => {
  r4 = parseFloat(e.target.value);
  Render();
});

document.getElementById('r5').addEventListener('input', (e) => {
  r5 = parseFloat(e.target.value);
  Render();
});

document.getElementById('right').addEventListener('change', Render);
document.getElementById('left').addEventListener('change', Render);
document.getElementById('front').addEventListener('change', Render);
document.getElementById('back').addEventListener('change', Render);
document.getElementById('ceil').addEventListener('change', Render);
document.getElementById('floor').addEventListener('change', Render);

document.getElementById('depth').addEventListener('input', (e) => {
  depth = parseInt(e.target.value);
  Render();
});

document.getElementById('s1').addEventListener('input', (e) => {
  s1 = parseInt(e.target.value);
  s1 = s1 == 100? -1 : 1100-s1;
  Render();
});

document.getElementById('s2').addEventListener('input', (e) => {
  s2 = parseInt(e.target.value);
  s2 = s2 == 100? -1 : 1100-s2;
  Render();
});

document.getElementById('s3').addEventListener('input', (e) => {
  s3 = parseInt(e.target.value);
  s3 = s3 == 100? -1 : 1100-s3;
  Render();
});

document.getElementById('lx').addEventListener('input', (e) => {
  lx = parseFloat(e.target.value);
  Render();
});

document.getElementById('ly').addEventListener('input', (e) => {
  ly = parseFloat(e.target.value);
  Render();
});

document.getElementById('lz').addEventListener('input', (e) => {
  lz = parseFloat(e.target.value);
  Render();
});

document.getElementById('t1').addEventListener('input', (e) => {
  t1 = parseFloat(e.target.value);
  Render();
});

document.getElementById('t2').addEventListener('input', (e) => {
  t2 = parseFloat(e.target.value);
  Render();
});

document.getElementById('t3').addEventListener('input', (e) => {
  t3 = parseFloat(e.target.value);
  Render();
});

document.getElementById('t4').addEventListener('input', (e) => {
  t4 = parseFloat(e.target.value);
  Render();
});

document.getElementById('t5').addEventListener('input', (e) => {
  t5 = parseFloat(e.target.value);
  Render();
});