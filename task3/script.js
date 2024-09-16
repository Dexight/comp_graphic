var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');
let data;

document.getElementById('uploadImage').addEventListener('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();

    reader.onload = function(e){
        var img = new Image();
        img.onload = function(e){
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img,0,0);
            data = ctx.getImageData(0,0,canvas.width, canvas.height);
            // updateCanvas(); //TODO
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);

});

// document.getElementById('hue').addEventListener('input', updateCanvas);
// document.getElementById('saturation').addEventListener('input', updateCanvas);
// document.getElementById('brightness').addEventListener('input', updateCanvas);

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

// function hsv2rgb(h,s,v){

// }