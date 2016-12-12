// glitchgarden.js
// My entry to Ludum Dare 37. It's also fy first entry, so I'M IN!
// Theme: One Room
// The "One Room" thing here is that everybody who's playing in the same time are using a same version
// of the map, and players can let signs in the map that appears in the other games occouring (a la Dark Souls).
// So, even people are in diferent machines, in diferent places in the world, everbody are playing in one room
// I hope I didn't get too far from the theme :P
//
// Any questions, just call me
// Cheers :)
//
// Paulo Henrique da Silva Ferreira
// phenry.ferreira@gmail.com

// ========= Server-side communication ============== //
// Hold the connection with the WebSocket server (that is in the same "place" that the HTTP server)
var webSocketConnection = new WebSocket("wss://" + location.host);

// Keep the informations about the map came from the server
var platforms = [];
var monuments = [];
var oldSigns = [];

// Function called when receive a message from server
webSocketConnection.onmessage = function(event){
	// Parse the message
	var msg = JSON.parse(event.data);

	// If a message have the 'platform' field, create the map
	if(msg.platforms){
		platforms = msg.platforms;
		monuments = msg.monuments;
		oldSigns = msg.signs;
	}

	// If not, the message is a player message. So we create a sign when specified
	else if(msg.type){ game.add.sprite(msg.x, msg.y, msg.type); }
};

// Function called to get initial informations from server
webSocketConnection.onopen = function(event){
	// Send the requisition for map to server
	webSocketConnection.send(JSON.stringify({ "mapRequest": true }));
};


// ========= Client-side operations ========= //
//#===========#
// PHASER.IO
//#===========#
// The game object
game = new Phaser.Game(800, 600, Phaser.AUTO, "glitchgarden", {preload: preload, create: create, update: update, render: render}, false, false);
// Keep the number of monuments visited
var monumentsCount = 0;

//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
    //  The Google Fonts we want to load
    google: { families: ["Press Start 2P"] }
};


// To load all the assets before the game starts
function preload(){

	// Preload the Google Webfont
	game.load.script("webfont", "//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js");

	// Initial configs
	game.stage.backgroundColor = "#000000"; //"#6495ED"
	game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
	game.scale.pageAlignHorizontally = true;

	// Define the physics system that will be used
	game.physics.startSystem(Phaser.Physics.ARCADE);

	// Load the assets
	// Images
	game.load.image("earth", "assets/images/sprites/earth.png");
	game.load.image("platform", "assets/images/sprites/platform.png");
	game.load.image("monument", "assets/images/sprites/monument.png");
	game.load.image("hud", "assets/images/sprites/hud.png");
	game.load.image("up", "assets/images/sprites/up.png");
	game.load.image("down", "assets/images/sprites/down.png");
	game.load.image("left", "assets/images/sprites/left.png");
	game.load.image("right", "assets/images/sprites/right.png");

	// Spritesheets
	game.load.spritesheet("player_test", "assets/images/spritesheets/base_player.png", 24, 32);
	game.load.spritesheet("vine_vertical", "assets/images/spritesheets/vine_vertical.png", 32, 32);
	game.load.spritesheet("vine_horizontal", "assets/images/spritesheets/vine_horizontal.png", 32, 32);
	game.load.spritesheet("door", "assets/images/spritesheets/door.png", 34, 40);

	// Audios
	game.load.audio("wind", "assets/audios/wind.mp3");
	game.load.audio("respect", "assets/audios/respect.wav");

	// Others
}
// To create the initial objects of the game 
function create(){
	// Set the room size to camera
	game.world.setBounds(0, 0, 1500, 5000);

	// Initialize the game objects 
	this.garden = new Glitchgarden();
	this.player = new Player("player_test", this.garden, 40, (5000-32), 0);
	//this.hud = new Hud(this.player);

	// Set the gamera to follow the player
	game.camera.follow(this.player.avatar, Phaser.Camera.FOLLOW_TOPDOWN);
}
// To update the state of all objects in game
function update(){
	// End-game
	if(this.garden.door.frame == 1){
		var endText = game.add.text(35, 120, "The climb is over.\n\nI hope the journey has been joyfull\nfor you.\nThanks for playing my first LD entry :)");
		// Config the text
		endText.font = "Press Start 2P";
		endText.fontSize = 18;
		endText.fill = "#FF0044";
		endText.fixedToCamera = true;
    }
	// Player update
	this.player.update();

	// Hud update
	//this.hud.update();
}
// To debug render
function render(){}



//#===========#
// PLAYER
//#===========#
Player = function(type, gardenRef, x, y, seeds){
	// Add the player sprite to game
	this.avatar = game.add.sprite(x, y, type);
	this.avatar.anchor.setTo(0.5, 1);

	// Keep a map reference to check collisions
	this.gardenRef = gardenRef;

	// Set the initial facing
	this.facing = "right";

	// Enable physics in the player 
	game.physics.arcade.enable(this.avatar, true);
	//  Physics properties 
	this.avatar.body.bounce.y = 0;
	this.avatar.body.gravity.y = 1250;
	this.avatar.body.collideWorldBounds = true;

	// Create the animations
	this.avatar.animations.add("idle", [0, 0, 1, 1], 5, true);
	this.avatar.animations.add("walk", [2, 0, 3, 0], 8, true);
	this.avatar.animations.add("climb", [5, 6], 4, true);

	// Create the sounds
	this.avatar.sound = game.add.audio("respect");
	this.avatar.sound.volume = 0.3;

	// Controls
	this.controlCursors = game.input.keyboard.createCursorKeys();
	this.controlButtons = {
		jump: game.input.keyboard.addKey(Phaser.Keyboard.Z),
		// Actions in-game
		action1: game.input.keyboard.addKey(Phaser.Keyboard.M),
		action2: game.input.keyboard.addKey(Phaser.Keyboard.THREE),
		action3: game.input.keyboard.addKey(Phaser.Keyboard.L),
		// Messages
		msgUp: game.input.keyboard.addKey(Phaser.Keyboard.Q),
		msgDown: game.input.keyboard.addKey(Phaser.Keyboard.S),
		msgLeft: game.input.keyboard.addKey(Phaser.Keyboard.A),
		msgRight: game.input.keyboard.addKey(Phaser.Keyboard.W),
	}

	// Set the actions that occour with one button click (not continuous like movement for example)
	// Action Buttons
	this.controlButtons.action1.onDown.add(this.act1, this);
	this.controlButtons.action2.onDown.add(this.act2, this);
	this.controlButtons.action3.onDown.add(this.act3, this);

	// Message Buttons
	this.controlButtons.msgUp.onDown.add(this.msgUp, this);
	this.controlButtons.msgDown.onDown.add(this.msgDown, this);
	this.controlButtons.msgLeft.onDown.add(this.msgLeft, this);
	this.controlButtons.msgRight.onDown.add(this.msgRight, this);
}
Player.prototype = {
	// To update the player
	update: function(){
		// Reset the player's x-axis speed 
	    this.avatar.body.velocity.x = 0;

		// Check the collisions with the earth blocks in the garden
		game.physics.arcade.collide(this.avatar, this.gardenRef.earth);
		// Check the collisions with the vines
		game.physics.arcade.collide(this.avatar, this.gardenRef.vines);
		// Check the collisions with the earth blocks in the garden
		game.physics.arcade.collide(this.avatar, this.gardenRef.platforms);
		// Check the collisions with the earth blocks in the garden
		game.physics.arcade.collide(this.avatar, this.gardenRef.monuments);

	    // Move the player acordly with the collected input
		if(this.controlCursors.left.isDown){ this.moveLeft();  }
		else if(this.controlCursors.right.isDown){ this.moveRight(); }
		else if(this.controlCursors.up.isDown){ this.climb(); }
    	else{ this.idle(); }
    	// Only jump if are stepping in something
    	if(this.controlButtons.jump.isDown && this.avatar.body.touching.down){ this.jump(); }
	},

	// Actions
	moveLeft: function(){
		this.facing = "left";
        this.avatar.body.velocity.x = -170;
        this.avatar.scale.x = -1;
        this.avatar.animations.play("walk");
	},
	moveRight: function(){
		this.facing = "right";
        this.avatar.body.velocity.x = 170;
        this.avatar.scale.x = 1;
        this.avatar.animations.play("walk");
	},
	idle: function(){ this.avatar.animations.play("idle"); },
	jump: function(){ this.avatar.body.velocity.y = -400; },
	climb: function(){
		game.physics.arcade.overlap(
	    		this.avatar,
	    		this.gardenRef.vines,
	    		function(player, vine){
					player.body.velocity.y = -80;
					player.animations.play("climb");
	    		},
	    		null,
	    		this
	    	);
	},
	act1: function(){
		// Create a vertical vine
		if(this.avatar.body.touching.down){
			Vine(this.avatar.x-12, this.avatar.y-32, this.gardenRef.vines, "vertical", this.facing, Math.floor(Math.random()*4)+1, Math.floor(Math.random()*10)+1);
		}
	},
	act2: function(){
		// Create a horizontal vine
		if(this.avatar.body.touching.down){
			if(this.facing === "right") Vine(this.avatar.x+16, this.avatar.y-32, this.gardenRef.vines, "horizontal", this.facing, Math.floor(Math.random()*4)+1, Math.floor(Math.random()*10)+1);
			else  Vine(this.avatar.x-16, this.avatar.y-32, this.gardenRef.vines, "horizontal", this.facing, Math.floor(Math.random()*4)+1, Math.floor(Math.random()*10)+1);
		}
	},
	act3: function(){
		// Check overlap with monuments
		game.physics.arcade.overlap(
	    		this.avatar,
	    		this.gardenRef.monuments,
	    		function(player, monument){
	    			player.sound.play();
	    			monument.destroy();
	    			monumentsCount++;
					player.frame = 4;
	    		},
	    		null,
	    		this
	    	);

		// Check overlap with the final door
		game.physics.arcade.overlap(
	    		this.avatar,
	    		this.gardenRef.door,
	    		function(player, door){
					if(monumentsCount == 10){
						player.sound.play();
						door.frame = 1;
					}
					player.frame = 4;;
	    		},
	    		null,
	    		this
	    	);
	},
	msgUp: function(){ webSocketConnection.send(JSON.stringify({ type: "up", "x": this.avatar.x-12, "y":this.avatar.y-32 })); },
	msgDown: function(){ webSocketConnection.send(JSON.stringify({ type: "down", "x": this.avatar.x-12, "y":this.avatar.y-32 })); },
	msgLeft: function(){ webSocketConnection.send(JSON.stringify({ type: "left", "x": this.avatar.x-12, "y":this.avatar.y-32 })); },
	msgRight: function(){ webSocketConnection.send(JSON.stringify({ type: "right", "x": this.avatar.x-12, "y":this.avatar.y-32 })); },
}



//#===========#
// MAP
//#===========#
Glitchgarden = function(){
	// Sound-part
	this.windSound = game.add.audio("wind");
	this.windSound.loopFull(0.25);
	this.windSound.play();

	// Group of objects in the map
	this.earth = game.add.group();
	this.vines = game.add.group();
	this.platforms = game.add.group();
	this.monuments = game.add.group();

	// The final door
	this.door;

	// Set physics properties to all objects in same group
	this.earth.enableBody = true;
	this.vines.enableBody = true;
	this.platforms.enableBody = true;
	this.monuments.enableBody = true;

	// Create the floor with earth blocks
	var block;
	for(var i=0; i<48; i++){
		block = this.earth.create(32*i, (5000-32), "earth");
		block.body.immovable = true;
	}

	// Create platforms in the air
	// The initial positions came from the server
	for(var i=0; i<60; i++){
		posX = platforms[i].x;
		posY = platforms[i].y;

		block = this.platforms.create(posX, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+32, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+64, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+96, posY, "platform");
		block.body.immovable = true;
	}

	// Create the monuments
	for(var i=0; i<10; i++){
		posX = monuments[i].x;
		posY = monuments[i].y;

		// Platform that hold the monument
		block = this.platforms.create(posX, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+32, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+64, posY, "platform");
		block.body.immovable = true;
		block = this.platforms.create(posX+96, posY, "platform");
		block.body.immovable = true;

		// The monument thenselve
		block = this.monuments.create(posX+48, posY-64, "monument");
		block.body.immovable = true;
		block.body.checkCollision.left = false;
		block.body.checkCollision.right = false;
	}

	// Create de final door
	// Platform that hold the door
	block = this.platforms.create(400, 100, "platform");
	block.body.immovable = true;
	block = this.platforms.create(400+32, 100, "platform");
	block.body.immovable = true;
	block = this.platforms.create(400+64, 100, "platform");
	block.body.immovable = true;
	block = this.platforms.create(400+96, 100, "platform");
	block.body.immovable = true;

	// The door
	this.door = game.add.sprite(445, 60, "door");
	this.door.frame = 0;

	// Physic properties of the door
	game.physics.arcade.enable(this.door);

	// Create the old signs
	for(var i=0; i<oldSigns.length; i++){ game.add.sprite(oldSigns[i].x, oldSigns[i].y, oldSigns[i].type); }

	// A sign to guide the newcommers
	game.add.sprite(750, 5000-64, "up");
}



//#===========#
// VINES
//#===========#
Vine = function(x, y, group, orientation, direction, type, length){
	// Set the vine properties
	this.vineOrientation = orientation; 
	this.vineType = type;
	this.vineLength = length;
	this.vineDirection = direction;

	// Create the vines, based in the direction
	if(orientation === "vertical"){
		// First element
		var vine = group.create(x, y, "vine_"+orientation);
		vine.frame = 0;
		vine.body.immovable = true;
		// You can walk trought vines and climb
		vine.body.checkCollision.left = false;
		vine.body.checkCollision.right = false;
		vine.body.checkCollision.up = false;
		vine.body.checkCollision.down = false;
		// Middle elements
		for(var i=1; i<this.vineLength; i++){
			vine = group.create(x, y-(i*32), "vine_"+orientation);
			vine.frame = type;
			vine.body.immovable = true;
			vine.body.checkCollision.left = false;
			vine.body.checkCollision.right = false;
			vine.body.checkCollision.up = false;
			vine.body.checkCollision.down = false;
		}
		// Last element
		vine = group.create(x, y-(this.vineLength*32), "vine_"+orientation);
		vine.frame = 5;
		vine.body.immovable = true;
		// In the last part, you can stand up in the vine 
		vine.body.checkCollision.down = false;
		vine.body.checkCollision.left = false;
		vine.body.checkCollision.right = false;
	}
	else if(orientation === "horizontal" && direction === "left"){
		// First element
		var vine = group.create(x, y, "vine_"+orientation);
		vine.frame = 0;
		vine.scale.x = -1;
		vine.body.immovable = true;
		// You can walk in the horizontal vines
		vine.body.checkCollision.down = false;
		
		// Middle elements
		for(var i=1; i<length; i++){
			vine = group.create(x-(i*32), y, "vine_"+orientation);
			vine.frame = type;
			vine.scale.x = -1;
			vine.body.immovable = true;
			vine.body.checkCollision.down = false;
		}

		// Last element
		vine = group.create(x-(this.vineLength*32), y, "vine_"+orientation);
		vine.frame = 5;
		vine.scale.x = -1;
		vine.body.immovable = true;
		vine.body.checkCollision.down = false;
	}
	else if(orientation === "horizontal" && direction === "right"){
		// First element
		var vine = group.create(x, y, "vine_"+orientation);
		vine.frame = 0;
		vine.body.checkCollision.down = false;
		vine.body.immovable = true;

		// Middle elements
		for(var i=1; i<length; i++){
			vine = group.create(x+(i*32), y, "vine_"+orientation);
			vine.frame = type;
			vine.body.immovable = true;
			vine.body.checkCollision.down = false;
		}

		// Last element
		vine = group.create(x+(this.vineLength*32), y, "vine_"+orientation);
		vine.frame = 5;
		vine.body.immovable = true;
		vine.body.checkCollision.down = false;
	}
}



//#===========#
// HUD
//#===========#
Hud = function(player){
	// Hold a player reference
	this.playerRef = player;

	// The HUD
	this.hud = game.add.sprite(610, 10, "hud");
	this.heightText = game.add.text(705, 50,(5000-this.playerRef.avatar.body.y.toFixed(0)-64)/10 + "m");
	this.monumentText = game.add.text(625, 20, "m: "+monumentsCount+"/10");

	// Config the texts
	this.heightText.font = "Press Start 2P";
	this.monumentText.font = "Press Start 2P";

	this.heightText.fill = "#FF0044";
	this.monumentText.fill = "#FF0044";

	this.heightText.fontSize = 18;
	this.monumentText.fontSize = 18;

	// Fix the HUD and its components in the camera
	this.hud.fixedToCamera = true;
	this.heightText.fixedToCamera = true;
	this.monumentText.fixedToCamera = true;
}
Hud.prototype = {
	update: function(){
		this.heightText.setText(((5000-this.playerRef.avatar.body.y.toFixed(0)-64)/10).toFixed(0) + "m");
		this.monumentText.setText("m: "+monumentsCount+"/10");
	}
}
