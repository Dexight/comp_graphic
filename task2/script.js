var img = new Image();
img.crossOrigin = 'anonymous';
img.src = "https://sun9-46.userapi.com/c846019/v846019815/111b99/JgBfDIXohNo.jpg";

var canvas = document.getElementById('canvas');
canvas.style.width = "1400px";
var ctx = canvas.getContext('2d');
var imgData;

// Для гистограммы
var dictionaryR = []; 
var dictionaryG = []; 
var dictionaryB = [];

//Обнуляем
for (var i = 0; i < 256; i++) {
    dictionaryR.push(0);
    dictionaryG.push(0);
    dictionaryB.push(0);
}

img.onload = function() {
	default_img();
    // Для гистограммы
    var imgR = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var imgData = imgR.data;
    for (var i = 0; i < imgData.length; i += 4) {
        dictionaryR[imgData[i]]   += 1;
        dictionaryG[imgData[i+1]] += 1;
        dictionaryB[imgData[i+2]] += 1;
    }
    drawHistogram();
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

function drawHistogram() {
    anychart.onDocumentReady(function() {
        // Преобразуем прошлые данные в новые (для гистограммы - из строчного в столбцевое представление)
        var dataR = [];
        var dataG = [];
        var dataB = [];

        for (var i = 0; i < 256; i++) {
            dataR.push([i, dictionaryR[i]]);
            dataG.push([i, dictionaryG[i]]);
            dataB.push([i, dictionaryB[i]]);
        }

        // Создаем график
        var chart = anychart.column();

        chart.palette(["#ff3300", "#00ff00", "#0000cc"]);

        var seriesR = chart.column(dataR);
        seriesR.name("Red");

        var seriesG = chart.column(dataG);
        seriesG.name("Green");

        var seriesB = chart.column(dataB);
        seriesB.name("Blue");

        chart.title("Гистограмма RGB");
        chart.xAxis().title("Intensity");
        chart.yAxis().title("Count");

        chart.container("container");
        chart.draw();
    });
}