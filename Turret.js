dojo.declare("Turret", null, {
	angle: 0,//270,
	size: 20,
	halfSize: 10,
	
	constructor: function(canvas, x, y, step, audio) {
		this.x = x;
		this.y = y;
		this.step = step;
		this.audio = audio;
		
		this.keyDownListener = dojo.connect(window, "keydown", this, "keyDown");
	},
	
	destroy: function() {
		dojo.disconnect(this.keyDownListener);
	},
	
	fireLaser: function() {
		// fire the laser
		//console.log("laser fired!");
		
		// make a sound
		this.audio.play({url: "laser", channel: "laser"})
		
		// did we hit something? (this is handled elsewhere)
		//(fire event)
		dojo.publish("laserFired", [this.angle]);
	},
	
	keyDown: function(event) {
		//console.log(event);
		
		switch (event.keyCode) {
		case dojo.keys.RIGHT_ARROW:
			// turn right
			var newAngle = this.angle + this.step;
			if (newAngle >= 360) { // roll over
				newAngle = 360 - newAngle;
			}
			this.angle = newAngle;
			//console.log("ship angle = "+this.angle);
			break;
		case dojo.keys.LEFT_ARROW:
			// turn left
			var newAngle = this.angle - this.step;
			if (newAngle < 0) { // roll over
				newAngle = 360 + newAngle;
			}
			this.angle = newAngle;
			//console.log("ship angle = "+this.angle);
			break;
		case dojo.keys.SPACE:
			this.fireLaser();
		}
	},
	
	render: function(context) {
		context.save();
		context.fillStyle = "#b3b3b3";
		context.beginPath();
		context.arc(this.x, this.y, this.halfSize, 0, Math.PI*2, true);
		context.closePath();
		context.fill();
		
		
		var angleInRads = Math.PI * this.angle / 180.0;
		
		//context.rotate(angleInRads);
		context.fillStyle = "#8a8a8a";
		context.strokeStyle = "#8a8a8a";
		context.lineWidth = 6;
		
		//context.beginPath();
		//context.arc(0,0,10,0,Math.PI*2,true);
		//context.closePath();
		//context.fill();
		
		context.beginPath();
		context.moveTo(this.x, this.y);
		context.lineTo(this.x+(Math.cos(angleInRads)*this.size),this.y+(Math.sin(angleInRads)*this.size));
		context.closePath();
		context.stroke();
		
		/*
		
		context.moveTo(this.x, this.y);
		context.rotate(this.angle * (180/Math.PI));
		
		context.fillStyle = "#f00";
		context.fillRect(this.x, this.y, 5, 5);
		*/
		
		context.restore();
	}
});