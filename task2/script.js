var img = new Image();
img.crossOrigin = 'anonymous';
img.src = "https://sun9-46.userapi.com/c846019/v846019815/111b99/JgBfDIXohNo.jpg";

var canvas = document.getElementById('canvas');
canvas.style.width = "1400px";
var ctx = canvas.getContext('2d');
var imgData;

img.onload = function() {
	default_img();
};

var default_img = function() {
	ctx.drawImage(img, 0, 0);
};

var Red = function() {
    ctx.drawImage(img, 0, 0);
    var imgR = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var imgData = imgR.data;
    for (var i = 0; i < imgData.length; i += 4) {
        imgData[i+1] = 0;
        imgData[i+2] = 0;
        imgData[i+3] = 255;
    }
	ctx.putImageData(imgR, 0, 0);
};

var Green = function() {
    ctx.drawImage(img, 0, 0);
    var imgR = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var imgData = imgR.data;
    for (var i = 0; i < imgData.length; i += 4) {
        imgData[i] = 0;
        imgData[i+2] = 0;
        imgData[i+3] = 255;
    }
	ctx.putImageData(imgR, 0, 0);
};

var Blue = function() {
    ctx.drawImage(img, 0, 0);
    var imgR = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var imgData = imgR.data;
    for (var i = 0; i < imgData.length; i += 4) {
        imgData[i] = 0;
        imgData[i+1] = 0;
        imgData[i+3] = 255;
    }
	ctx.putImageData(imgR, 0, 0);
};

document.getElementById('functionSelect').addEventListener('change', function() {
    const selectedValue = this.value;

    switch (selectedValue) {
        case 'origin':  default_img();
                        break;
        case 'Red':     Red();
                        break;
        case 'Green':   Green();
                        break;
        case 'Blue':    Blue();
                        break;
        default:        default_img();
    }
});