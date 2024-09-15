var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');
let data;

document.getElementById('uploadImage').addEventListener('change', function(event) {
    var f = event.target.files[0];
    var reader = new FileReader();

    reader.onload() = function(e){
        var img = new Image();
        img.onload() = function(e){
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img,0,0);
            data = ctx.getImageData(0,0,canvas.width, canvas.height);
            updateCanvas();
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);

});