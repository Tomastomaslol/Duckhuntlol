// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. To be honest I don't understand why.
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin); 
    
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
	var score = null;
    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
		//console.log(message);
		var object = {};
		var n = message.utf8Data.split(";")
		for (i=0; i < (n.length - 1); i = i + 1) {
			  var split = n[i].split(":");	
			 object[split[0]] =  split[1]; 
		 }
		console.log(object.type);
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(object.msg);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
				score = 0;

            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
                // we want to keep history of all sent messages
                if(object.type == "chat") {   
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(object.msg),
                    author: userName,
                    color: userColor,
                    score : score
                };
                
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
              }
              else if (object.type == "mousemove"){
              var obj = {
                    time: (new Date()).getTime(),
                    y:  object.offsetY,
                    x: object.offsetX,
                    author: userName,
                    color: userColor
                };
              	var json = JSON.stringify({ type:'mousemove', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
              	
               }
               else if (object.type == "boom"){
              var obj = {
                    time: (new Date()).getTime(),
                    y:  object.offsetY,
                    x: object.offsetX,
                    author: userName,
                    color: userColor
                };
              	var json = JSON.stringify({ type:'boom', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
              	
               }
            }
        }
    });
    
        connection.on('mousemove', function(mousemove){
	 		console.log("my object: %o", mousemove);
	    	console.dir(mousemove);

        
        });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});