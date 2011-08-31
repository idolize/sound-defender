dojo.require("dojox.timing");
dojo.declare("Enemy", null, {
	speed: 1,
	size: 15,
	halfSize: 7.5,
	
	constructor: function(x, y, audio, turret) {
		this.x = x;
		this.y = y;
		this.turret = turret;
		
		var angleInRadians = Math.atan2(turret.y-y, turret.x-x);
		this.dx = Math.cos(angleInRadians) * this.speed;
		this.dy = Math.sin(angleInRadians) * this.speed;
		
		this.angle = Math.atan2(y-turret.y, x-turret.x);
		if (this.angle < 0) this.angle += 2*Math.PI;
		this.angle *= (180/Math.PI);
		this.angle = Math.round(this.angle);
		
		//console.log("enemy angle = " +this.angle + " which is "+(this.angle/36) + " times 36");
		
		this.audio = audio;
		var self = this;
		this.soundTimer = new dojox.timing.Timer(500);
		this.soundTimer.onTick = function() {self.playSound();};
		this.startSound();
	},
	
	playSound: function() {
		// Angle must be from -180 to 180
		var angleToTurret = this.angle - this.turret.angle;
		if (angleToTurret > 180) {
		    angleToTurret -= 360;
		} else if (angleToTurret < -180) {
		    angleToTurret += 360;
		}
		//console.log(angleToTurret);
		
		var def = this.audio.play({url: ("Cricket/a" + angleToTurret), channel: "beeps"});
		if (typeof def === "undefined") console.log("Error: audio file 'Cricket/a"+angleToTurret+"' does not exist");
	},
	
	move: function() {
		this.x += this.dx;
		this.y += this.dy;
	},
	
	startSound: function() {
		this.soundTimer.start();
	},
	
	stopSound: function() {
		//if (this.soundTimer) clearTimeout(this.soundTimer);
		//this.soundTimer = null;
		this.soundTimer.stop();
		this.audio.stop({channel: "beeps"});
	},
	
	destroy: function() {
		this.stopSound();
		// explosion
		this.audio.play({url: "explosion"});
	},
	
	render: function(context) {
		context.save();
		//context.rotate(this.angle);
		
		context.fillStyle = "#0000ff";
		context.fillRect(this.x-this.halfSize, this.y-this.halfSize, this.size, this.size);
		
		context.restore();
	}
});