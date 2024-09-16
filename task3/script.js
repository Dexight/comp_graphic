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
    let h,s,v;
    var mx = Math.max(r,g,b); // максимум для перевода
    var mn = Math.min(r,g,b); // минимум для перевода
    if (mx === mn){
        h = 0;
    }
    else{
        var d = mx - mn;
         
    }
    
}