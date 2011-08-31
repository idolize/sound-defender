dojo.require("dojox.timing");
dojo.declare("SoundDefender", null, {

	constructor: function(canvas, scoreReadout, livesReadout, difficulty) {
		this.canvas = canvas;
		this.width = canvas.width;
		this.halfWidth = canvas.width/2;
		this.height = canvas.height;
		this.halfHeight = canvas.height/2;
		
		this.scoreReadout = scoreReadout;
		this.livesReadout = livesReadout;
		
		this.difficulty = difficulty;
		if (this.difficulty === 0) {
			this.lives = 5;
			this.step = 30;
			this.enemySpawnDist = this.halfWidth + 100;
		}
		else {
			this.lives = 3;
			this.step = 10;
			this.enemySpawnDist = this.halfWidth - 30;
		}
		
		// ensure step is a multiple of 5
		if (this.step % 5 != 0) {
			console.log("Warning: 'step' must be a multiple of 5. Seeing to 10.");
			this.step = 10;
		}
		
		livesReadout.innerHTML = this.lives;
		
		// precalculate the numbers between 0 and 360 at X degree steps
		this.numSteps = Math.floor(360 / this.step);
		this.steps = new Array(this.numSteps);
		var deg = -this.step;
		for (var i=0; i<this.numSteps; i++) {
			deg += this.step;
			this.steps[i] = deg;
		}
		this.degsToRads = Math.PI/180;
		
		// initialize graphics
		this.context = canvas.getContext("2d");
		
		// initialize audio
		uow.getAudio({ defaultCaching: true }).then(dojo.hitch(this, function(a) {
		    this.audio = a;  // save it
		    // now proceed to the title screen
		    this.showTitleScreen();
		}));
	},
	
	showTitleScreen: function() {
		var context = this.context;
		var size = { width: this.width, height: this.height};
		//this.context.translate(this.width/2, this.height/2);
		
		// show the title screen
		this.clearScreen();
		
		context.font = "bold 12px sans-serif";
		context.fillStyle = "#888";
		context.textAlign = "center";
		
		var titleImg = new Image();
		titleImg.src = "SoundDefenderLogo.png";
		titleImg.onload = function() {
			// show the image
			context.drawImage(titleImg, Math.floor((size.width/2)-(this.width/2)), Math.floor((size.height/2)-(this.height/2)));
			context.fillText("Press Enter to play", (size.width/2), (size.height/2)+titleImg.height);
		};
		
		var audio = this.audio;
		audio.play({url: "SoundDefender"}).callAfter(function() {
		    audio.say({
		        text: "Press Enter to play", channel: "speech"
		    });
		});
		
		// wait for an Enter press
		var listener = dojo.connect(window, "keydown", this, function (event) {
			if (event.keyCode === dojo.keys.ENTER) {
				this.start();
				dojo.disconnect(listener);
			}
		});
	},
	
	start: function() {
		this.audio.stop();
		this.audio.stop({channel: "speech"});
		this.clearScreen();
		
		this.turret = new Turret(this.canvas, this.width/2, this.height/2, this.step, this.audio);
		this.enemies = [];
		this.score = 0;
		this.scoreReadout.innerHTML = this.score;
		this.lives = 3;
		this.livesReadout.innerHTML = this.lives;
		
		this.isLaserActive = false;
		
		var game = this;
		this.timer = new dojox.timing.Timer(50/3);
		this.timer.onTick = function() {game.onTick();};
		this.timer.start();
		
		this.enemyTimer = {timePeriod: 3000, numEnemiesToSpawn : 0};
		this.enemyTimer.start = function() {
			this.timeout = setTimeout(function() {
			    for (var i=0; i<game.enemyTimer.numEnemiesToSpawn; i++) {
			    	var spawnPt = game.randomSpawnPoint();
			    	game.enemies.push(new Enemy(spawnPt.x, spawnPt.y, game.audio, game.turret));
			    }
			    game.enemyTimer.numEnemiesToSpawn = 0;
			}, this.timePeriod);
		};
		this.enemyTimer.stop = function() {
			clearTimeout(this.timeout);
		};
		
		this.spawnNewEnemies(1);
		
		this.laserListener = dojo.subscribe("laserFired", this, "onLaserShot");
	},
	
	stop: function() {
		this.timer.stop();
		this.timer = null;
		this.enemyTimer.stop();
		this.enemyTimer = null;
		this.turret.destroy();
		this.turret = null;
		for (var i=0, len=this.enemies.length; i<len; i++) this.enemies[i].stopSound();
		this.enemies = null;
		dojo.unsubscribe(this.laserListener);
		dojo.publish("gameOver", [this.score]);
	},
	
	pauseGame: function() {
		this.timer.stop();
		this.enemyTimer.stop();
		for (var i=0, len=this.enemies.length; i<len; i++) {
			this.enemies[i].stopSound();
		}
	},
	
	resumeGame: function() {
		this.timer.start();
		if (this.enemyTimer.numEnemiesToSpawn > 0) this.enemyTimer.start();
		for (var i=0, len=this.enemies.length; i<len; i++) {
			this.enemies[i].startSound();
		}
	},
	
	randomSpawnPoint: function() {
		var point = { x: 0, y: 0};
		
		//randomly pick a number from 0 to n
		var randDeg = this.steps[randomTo(this.numSteps)];
		
		// make sure the enemy doesn't spawn behind the player
		var angleToTurret = this.turret.angle - randDeg;
		if (angleToTurret > 180) {
		    angleToTurret -= 360;
		} else if (angleToTurret < -180) {
		    angleToTurret += 360;
		}
		if (Math.abs(angleToTurret) > 90) {
			//console.log("this enemy is behind you "+randDeg);
			randDeg = (randDeg+180)%360;
		}
		
		var rand = randDeg * this.degsToRads;
		
		point.x = this.halfWidth + this.enemySpawnDist * Math.cos(rand);
		point.y = this.halfHeight + this.enemySpawnDist * Math.sin(rand);
		
		return point;
	},
	
	onLaserShot: function(angle) {
		this.isLaserActive = true;
		this.checkIfLaserHit(angle);
	},
	
	drawLaser: function(angle) {
		var angleInRads = Math.PI * angle / 180.0;
		
		var context = this.context;
		context.save();
		context.fillStyle = "#00ff00";
		context.strokeStyle = "#00ff00";
		
		context.beginPath();
		var dx = Math.cos(angleInRads);
		var dy = Math.sin(angleInRads);
		context.moveTo(this.turret.x+dx*this.turret.size, this.turret.x+dy*this.turret.size);
		context.lineTo(this.halfWidth+dx*this.width, this.halfWidth+dy*this.height);
		context.closePath();
		context.stroke();
		context.restore();
		
		this.isLaserActive = false;
	},
	
	checkIfLaserHit: function(angleDeg) {
		var angle = Math.PI * angleDeg / 180.0;
		var numEnemiesHit = 0;
		
		var vec = {x: Math.cos(angle), y: Math.sin(angle)};
		//console.log("vec = x:"+vec.x + ", y:"+vec.y);
		//console.log("len of vec = " + Math.sqrt(vec.x * vec.x + vec.y * vec.y));
		
		var enemy;
		for (var i=this.enemies.length-1; i >= 0; i--) {
			enemy = this.enemies[i];
			
			var distAlongLine = ((vec.x * enemy.x) + (vec.y * enemy.y)) - ((this.halfWidth * vec.x) + (this.halfHeight * vec.y));
			
			var nearestX, nearestY;
			if (distAlongLine < 0) {
				nearestX = this.halfWidth;
				nearestY = this.halfHeight;
			}
			else {
				nearestX = this.halfWidth+ (distAlongLine*vec.x);
				nearestY = this.halfHeight+ (distAlongLine*vec.y);
			}
			
			//console.log("distAlongLine = "+distAlongLine);
			//console.log("closest point = x:"+nearestX+", y:"+nearestY);
			
			var distX = enemy.x - nearestX;
			var distY = enemy.y - nearestY;
			var actualDist = Math.sqrt(distX*distX + distY*distY);
			//actualDist = (actualDist < 0)? -actualDist : actualDist;
			
			//console.log("actualDist = "+actualDist);
			
			if (actualDist <= enemy.halfSize+2) {
				//console.log("enemy hit! player angle was "+this.turret.angle);
				enemy.destroy();
				
				this.enemies.splice(i, 1); // remove this enemy
				this.spawnNewEnemies(1);
				
				this.score += 1000;
				this.scoreReadout.innerHTML = this.score;
			}
		}
	},
	
	clearScreen: function() {
		this.context.fillStyle = "#ffffff";
		this.context.fillRect(0,0,this.width,this.height);
	},
	
	gameOver: function() {
		this.livesReadout.innerHTML = this.lives;
		var self = this;
		this.audio.say({
		    text: ("Game Over! Final score: "+this.score), channel: "speech"
		}).callAfter(function(){self.showTitleScreen();});
		this.stop();
		
		//alert("Game Over! Final score: "+this.score); // Ask for name?
		//this.showTitleScreen();
	},
	
	playerHit: function(dontSpeak) {
		// player was hit
		this.lives--;
		this.livesReadout.innerHTML = this.lives;
		if (!dontSpeak) {
			this.pauseGame();
			var self = this;
			this.audio.say({
			    text: "You were hit! "+ this.lives + " lives remaining.", channel: "speech"
			}).callAfter(function(){self.resumeGame();});
		}
	},
	
	isEnemyColliding: function(enemy) {
		if (this.turret.y + this.turret.size < enemy.y) return false;
		if (this.turret.y > enemy.y + enemy.size) return false;
		
		if (this.turret.x + this.turret.size < enemy.x) return false;
		if (this.turret.x > enemy.x + enemy.size) return false;
		
		return true;
	},
	
	spawnNewEnemies: function(num) {
		this.enemyTimer.numEnemiesToSpawn += num;
		//console.log("spawning "+this.enemyTimer.numEnemiesToSpawn+" new enemies...");
		this.enemyTimer.start();
	},
	
	onTick: function() {
		// called every frame
		//this.canvas.width = this.width; // clears the canvas
		this.context.fillStyle = "rgba(255, 255, 255, 0.25)";//'#ffffff';
		this.context.fillRect(0,0,this.width,this.height);
		
		var enemy;
		for (var i=this.enemies.length-1; i >= 0; i--) {
			enemy = this.enemies[i];
			enemy.move();
			
			if (this.isEnemyColliding(enemy)) {
				//console.log(" enemy "+i+" with pos=("+enemy.x+","+enemy.y+") hit player!");
				enemy.stopSound();
				this.enemies.splice(i, 1); // remove this enemy
				this.spawnNewEnemies(1);
				this.playerHit(this.lives==1);
				if (this.lives <= 0) {
					this.gameOver();
					return;
				}
			}
			else enemy.render(this.context);
		}
		
		if (this.isLaserActive) this.drawLaser(this.turret.angle);
		
		this.turret.render(this.context);
	}
});

// generates a random number anywhere in the range from 0 to upper-1
function randomTo(upper){
	return Math.floor(Math.random()*upper);
}