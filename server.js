// server.js
// Server for Glitchgarden, my entry to Ludum Dare 37.
// The server was built using Websockets from node.js
// To run, use node server.js in the project folder
//
// Any questions, just call me
// Cheers :)
//
// Paulo Henrique da Silva Ferreira
// phenry.ferreira@gmail.com

// ================ HTTP SERVER ================== //
// Here we used finalhandler and serve-static to serve the page with de game

// Inital calls
var http = require("http");
var fs = require("fs");
var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");

// Set the root of the server
var serve = serveStatic("./");

// Start the server, listening to the port 8000 (or default service port)
var httpServer = http.createServer(function(req, res){
	var done = finalhandler(req, res);
	serve(req, res, done);
}).listen(process.env.PORT || 8000);

// ================ WEBSOCKET SERVER ================== //
// Websocket server to broadcast messages across game sessions. Works in the same port of HTTP server
var WebSocket = require("ws").Server;
var webSocketServer = new WebSocket({ server : httpServer });

// This array will keep the reference from players ID and position int this.clients
var clientIDs = [];

// This array will keep the coordinates of the platforms in the game map
var platforms = [];

// And this array will keep the coordinates of the platforms with monuments
var monuments = [];

// And this array will keep the signs
var signs = [];

// When a connection is estabilished...
webSocketServer.on("connection", function (ws){	
	
	// If its the first person to enter in the game, create a new map
	if(this.clients.length == 1){
		// Remove anterior informations
		platforms.length = 0;
		monuments.length = 0;
		signs.length = 0;
		clientIDs.length = 0;

		// Add the reference to clientIDs
		var pos = ws.upgradeReq.headers["sec-websocket-key"];
		if(clientIDs[pos] != 0){ clientIDs[pos] = this.clients.length - 1; }

		// Generate the coordinates of the platforms and save in platforms array
		for(var i=0; i<60; i++){
			var obj = {
				x: Math.floor(Math.random()*1450) + 50,
				y: Math.floor(Math.random()*4050) + 300
			};
			platforms.push(obj);
		}

		// Generate the coordinates of the platforms that holds the monument. The position of the monument can be deduced from this coordinates
		for(var i=0; i<10; i++){
			var obj = {
				x: Math.floor(Math.random()*1450) + 50,
				y: Math.floor(Math.random()*4050) + 300
			};
			monuments.push(obj);
		}
	}
	// If not, only add the reference to clientIDs
	else{
		var pos = ws.upgradeReq.headers["sec-websocket-key"];
		if(clientIDs[pos] != 0){ clientIDs[pos] = this.clients.length - 1; }
	}

	// When someone send a message...
	ws.on('message', function (message){
		// Parse the message
		var msg = JSON.parse(message);

		// If a sign, store it in the signs array
		if(msg.type){
			signs.push({
				type: msg.type,
				x: msg.x,
				y: msg.y
			});
		}

		// If the message have the 'mapRequest', send the map
		if(msg.mapRequest){
			webSocketServer.clients[clientIDs[pos]].send(
				JSON.stringify({
					"platforms": platforms,
					"monuments": monuments,
					"signs": signs
				})
			);
		}
		// If its a message from a player, send to all players via broadcast
		else{ webSocketServer.broadcast(message); }
	});
});

// Broadcast function
webSocketServer.broadcast = function(data){
	// Discover the number of clients connected
	var nClients = this.clients ? this.clients.length : 0;
	var client = null;
  	
  	// Send the message to all clients
  	for (var i=0; i<nClients; i++){
		// Take the actual client
		client = this.clients[i];
		
		// If possible, send the message
		if(client.readyState === client.OPEN){ client.send(data); }

		// If not, show the error in the console
		else console.error("Error: Actual client("+ i +") state: "+client.readyState);
  }
};
