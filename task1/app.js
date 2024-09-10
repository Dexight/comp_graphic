var img = new Image();
img.crossOrigin = 'anonymous';
img.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmCy16nhIbV3pI1qLYHMJKwbH2458oiC9EmA&s";
console.log(img);

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

img.onload = function() {
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


const inputs = document.querySelectorAll('[name=color]');
for (const input of inputs) {
	input.addEventListener("change", function(evt) {
		switch (evt.target.value) {
			case "grayscale_1":
				return grayscale_1();
			case "grayscale_2":
				return grayscale_2();
			default:
				return original();
		}
	});
}