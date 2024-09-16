var img = new Image();
img.crossOrigin = 'anonymous';
img.src = "ФРУКТЫ.jpg";
console.log(img);

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

img.onload = function() {
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);
};

var original = function() {
	ctx.drawImage(img, 0, 0);
};

var grayscale_1 = function() {
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		var avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
		data[i]     = avg; // red
		data[i + 1] = avg; // green
		data[i + 2] = avg; // blue
	}
	ctx.putImageData(imageData, 0, 0);
};

var grayscale_2 = function() {
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		var avg = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
		data[i]     = avg; // red
		data[i + 1] = avg; // green
		data[i + 2] = avg; // blue
	}
	ctx.putImageData(imageData, 0, 0);
};

var difference = function() {
	grayscale_1();
	const imageData1 = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data1 = imageData1.data;

	grayscale_2();
	const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data2 = imageData2.data;
    
	const diffData = ctx.createImageData(canvas.width, canvas.height);
	const diffPixels = diffData.data;

	for (var i = 0; i < data1.length; i += 4) {
        var coef = 1;
		var diffR = Math.abs(data1[i] - data2[i]);
		var diffG = Math.abs(data1[i + 1] - data2[i + 1]);
		var diffB = Math.abs(data1[i + 2] - data2[i + 2]);

		diffPixels[i] = diffR * coef;
		diffPixels[i + 1] = diffG * coef;
		diffPixels[i + 2] = diffB * coef;
		diffPixels[i + 3] = 255; // opacity
	}

	ctx.putImageData(diffData, 0, 0);
};


const inputs = document.querySelectorAll('[name=color]');
for (const input of inputs) {
	input.addEventListener("change", function(evt) {
		switch (evt.target.value) {
			case "grayscale_1":
				return grayscale_1();
			case "grayscale_2":
				return grayscale_2();
			case "difference":
				return difference();
			default:
				return original();
		}
	});
}

