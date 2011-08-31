var game;
var highScore = 0;
var highScoreReadout;
var playAgainBtn;
var lightsOn = true;
var lightsDiv;

dojo.ready(function() {
	lightsDiv = dojo.byId("lights");
	highScoreReadout = dojo.byId("highscore");
	playAgainBtn = dojo.byId("playagainbtn");
	dojo.style(playAgainBtn, "display", "none");
	
	var difficulty = 0;
	game = new SoundDefender(dojo.byId("maincanvas"), dojo.byId("score"), dojo.byId("lives"), difficulty);
	
	var toggleLightsBtn = dojo.byId("togglelightsbtn");
	dojo.connect(window, "keydown", this, function (event) {
		if (event.keyCode === 76 /* L key */) {
			toggleLights(toggleLightsBtn);
		}
	});
	
	dojo.subscribe("gameOver", null, "handleGameOver");
});

function handleGameOver(score) {
	// update high score
	if (score > highScore) {
		highScore = score;
		highScoreReadout.innerHTML = highScore;
	}
	
	// show play again button
	//dojo.style(playAgainBtn, "display", "inline");
}

function playAgain() {
	dojo.style(playAgainBtn, "display", "none");
	game.start();
}

function toggleLights(btn) {
	if (lightsOn) {
		// turn lights off
		lightsOn = false;
		dojo.style(lightsDiv, "backgroundColor", "black");
		btn.innerHTML = "Turn lights on";
	}
	else {
		// turn lights on
		lightsOn = true;
		dojo.style(lightsDiv, "backgroundColor", "transparent");
		btn.innerHTML = "Turn lights off";
	}
}