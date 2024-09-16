var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');
let data;
var img;

document.getElementById('uploadImage').addEventListener('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();

    reader.onload = function(e){
        img = new Image();
        img.onload = function(e){
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img,0,0);
            updateCanvas(); 
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);

});

document.getElementById('hue').addEventListener('input', updateCanvas);
document.getElementById('saturation').addEventListener('input', updateCanvas);
document.getElementById('brightness').addEventListener('input', updateCanvas);

function rgb2hsv(r,g,b){
    r /= 255;
    g /= 255;
    b /= 255;
    var mx = Math.max(r,g,b); // максимум для перевода
    var mn = Math.min(r,g,b); // минимум для перевода
    let h=0,s=0,v=mx;
    var d = mx - mn;

    //Считаем h
    if (mx !== mn){
        if(mx === r && g>=b)
            h = 60 * (g-b)/d;
        else if(mx == r && g < b )
            h = 60 * (g-b)/d + 360;
        else if(mx == g)
            h = 60 * (b-r)/d + 120;
        else 
            h = 60 * (r-g)/d + 240;
    }
    // считаем s
    if(mx != 0){
        s = 1 - mn/mx;
    }
    return [h,s,v]
}

function hsv2rgb(h,s,v){
    let r,g,b;
    i = Math.floor(h/60)%6;
    f = h/60 - Math.floor(h/60);
    p = v*(1-s);
    q = v*(1-f*s);
    t = v*(1-(1-f)*s);

    switch(i){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break; 
        case 3: r = p, g = q, b = v; break; 
        case 4: r = t, g = p, b = v; break; 
        case 5: r = v, g = p, b = q; break; 
    }
    return [r * 255, g * 255, b * 255];
}

function updateCanvas() {
    ctx.drawImage(img,0,0);
    data = ctx.getImageData(0, 0, img.width, img.height);

    console.log(data);
    
    const hue = parseInt(document.getElementById('hue').value);
    const saturation = parseInt(document.getElementById('saturation').value) / 100;
    const brightness = parseInt(document.getElementById('brightness').value) / 100;

    document.getElementById('hueValue').textContent = hue;
    document.getElementById('saturationValue').textContent = Math.round(saturation * 100);
    document.getElementById('brightnessValue').textContent = Math.round(brightness * 100);

    const newData = ctx.createImageData(data.width, data.height);

    for (let i = 0; i < data.data.length; i += 4) {
        let r = data.data[i];
        let g = data.data[i + 1];
        let b = data.data[i + 2];

        let [h, s, v] = rgb2hsv(r, g, b);
        // console.log(h,s,v);

        h = hue;
        s = saturation;
        v = brightness;

        [r, g, b] = hsv2rgb(h, s, v);

        newData.data[i] = r;
        newData.data[i + 1] = g;
        newData.data[i + 2] = b;
        newData.data[i + 3] = data.data[i + 3];
    }

    ctx.putImageData(newData, 0, 0);
}