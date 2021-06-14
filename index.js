var select = selector => document.querySelector(selector);
var keys = [];
var camera = {
	x: 0,
	y: 0
};
var stuff = {
	velocity: {
		forward: 0,
		turn: 0
	},
	coordinates: {
		x: 0,
		y: 0
	},
	direction: 90
};
var cars = [];
var explosions = [];
var explodedHouses = [];
function image(source, width, height) {
	let image = new Image();
	image.src = source;
	if(typeof width === "number") image.style.width = width + "px";
	if(typeof height === "number") image.style.height = height + "px";
	return image;
}
function frame(stuff, useControls, element) {
	element.hidden = false;
	if(useControls) {
		stuff.velocity.turn += (keys.includes("arrowright") - keys.includes("arrowleft"));
		stuff.velocity.forward += (keys.includes("arrowup") - keys.includes("arrowdown")) / 2;
	} else {
		stuff.velocity.turn += Math.sign(Math.random() - 0.5);
		stuff.velocity.forward += Math.sign(Math.random() - 0.5) / 2;
		if(Math.floor(Math.random() * 400) === 0) {
			element.remove();
			cars.splice(cars.indexOf(stuff), 1);
			return;
		}
	}
	stuff.direction += stuff.velocity.turn;
	stuff.coordinates.x += 10 * Math.sin(stuff.direction * (Math.PI / 180)) * stuff.velocity.forward;
	stuff.coordinates.y += 10 * Math.cos(stuff.direction * (Math.PI / 180)) * stuff.velocity.forward;
	stuff.velocity.forward *= 0.9;
	stuff.velocity.turn *= 0.93;
	element.style.setProperty("--x", String(Math.ceil(stuff.coordinates.x - camera.x)) + "px");
	element.style.setProperty("--y", String(Math.ceil(stuff.coordinates.y - camera.y)) + "px");
	element.style.setProperty("transform", "translate(-50%, -50%) rotate(" + String(stuff.direction - 90) + "deg)");
}
function boom(x, y, type) {
	let index = explosions.length;
	let explosion = image("images/boom.svg", null, 0);
	let sound = new Audio("sounds/boom.mp3");
	select("div#game").appendChild(explosion);
	explosion.style.setProperty("--x", String(x) + "px");
	explosion.style.setProperty("--y", String(y) + "px");
	explosions.push({
		stage: 0,
		element: explosion,
		type: type,
		index: index
	});
	sound.addEventListener("canplaythrough", function(event) {
		this.play();
	});
}
document.addEventListener("keydown", function(event) {
	if(!keys.includes(event.key.toLowerCase())) keys.push(event.key.toLowerCase());
});
document.addEventListener("keyup", function(event) {
	if(keys.includes(event.key.toLowerCase())) keys.splice(keys.indexOf(event.key.toLowerCase()), 1);
});
addEventListener("load", function() {
	let audioContext = new (window.AudioContext || window.webkitAudioContext)();
	let oscillator = audioContext.createOscillator();
	var gainNode = audioContext.createGain();
	gainNode.gain.value = 0.2;
	gainNode.connect(audioContext.destination);
	oscillator.type = "square";
	oscillator.frequency.setValueAtTime((stuff.velocity.forward * 10.7) + 5, audioContext.currentTime);
	oscillator.connect(gainNode);
	oscillator.start();
	if(audioContext.state === "suspended") {
		select("div.suspended").hidden = false;
		document.addEventListener("click", function() {
			select("div.suspended").hidden = true;
			audioContext.resume();
		});
	}
	let container = select("div#game");
	let car = image("images/car.svg", null, 50);
	container.appendChild(car);
	setInterval(function() {
		camera.x += (stuff.coordinates.x - camera.x) / 10;
		camera.y += (stuff.coordinates.y - camera.y) / 10;
		frame(stuff, true, car);
		let playerX = Number(car.style.getPropertyValue("--x").slice(0, -2));
		let playerY = Number(car.style.getPropertyValue("--y").slice(0, -2));
		cars.filter(element => {
			frame(element, false, element.element);
			let x = Number(element.element.style.getPropertyValue("--x").slice(0, -2));
			let y = Number(element.element.style.getPropertyValue("--y").slice(0, -2));
			let width = element.element.width;
			let height = element.element.height;
			let playerWidth = car.width;
			let playerHeight = car.height;
			if(x < playerX + playerWidth && x + width > playerX && y < playerY + playerHeight && y + height > playerY) {
				boom(x, y, "car");
				element.element.remove();
				return false;
			}
			return true;
		});
		explosions.filter(element => {
			element.element.style.height = String(Math.min(element.stage, 50)) + "px";
			element.element.style.opacity = String(element.stage > 50 ? 1 - ((element.stage - 50) / 50) : 1);
			element.stage += element.stage < 50 ? 10 : 5;
			if(element.stage >= 100) {
				element.element.remove();
				return false;
			}
			return true;
		});
		if(Math.round(Math.abs(stuff.velocity.forward)) > 0) {
			document.querySelectorAll("div#game img.house").forEach(element => element.remove());
			//empty part in the road is 276x276, width of vertical road is 123.08, height 400
			
		}
		oscillator.frequency.setValueAtTime((stuff.velocity.forward * 10.7) + 5, audioContext.currentTime);
		document.body.style.backgroundPositionX = "calc(50% - " + String(camera.x) + "px)";
		document.body.style.backgroundPositionY = "calc(50% + " + String(camera.y) + "px)";
	}, 33);
	setInterval(function spawnCar() {
		let car = image("images/othercar.svg", null, 50);
		car.hidden = true;
		let x = Math.floor(Math.random() * innerWidth) + stuff.coordinates.x;
		let y = Math.floor(Math.random() * innerHeight) + stuff.coordinates.y;
		x -= (x / 2) + 1
		y -= (y / 2) + 1
		container.appendChild(car);
		cars.push({
			coordinates: {
				x: x,
				y: y
			},
			direction: Math.floor(Math.random() * 360),
			velocity: {
				forward: 0,
				turn: 0
			},
			element: car
		});
	}, 2000);
});
