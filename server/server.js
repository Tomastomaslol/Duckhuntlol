var datahandlers = {  
    messagetoobject:function(message){  
    	var object = {};
		var message = message.utf8Data.split(";");
		for (i=0; i < (message.length - 1); i = i + 1) {
			  var split = message[i].split(":");	
			 object[split[0]] =  split[1]; 
		 }		  
		 return object;
    }
}  

var gameevent = {  
    chat:function(object, userName, userColor, score, ammo){  
     var obj = {
         time: (new Date()).getTime(),
         text: htmlEntities(object.msg),
         author: userName,
         color: userColor,
         score : score,
         healthpoints : 100,
         ammo : ammo
     };     
     history.push(obj);
     history = history.slice(-100);

     // broadcast message to all connected clients
     var json = JSON.stringify({ type:'message', data: obj });
     for (var i=0; i < clients.length; i++) {
         clients[i].sendUTF(json);
     }
    },  
    mousemove: function(object){  
    	var json = JSON.stringify({ type:'mousemove', data: object });
        	for (var i=0; i < clients.length; i++) {
        	    clients[i].sendUTF(json);
        	}
    },
    hittarget: function(shootat){
     	 
		if(shootat === "target") {
			return 1;
		} else {
			return 0;
		}
    },
    boom: function(object){  
    	var json = JSON.stringify({ type:'boom', data: object });
	        for (var i=0; i < clients.length; i++) {
	            clients[i].sendUTF(json);
	        }        	
    },
    reload: function(){  
    		var clipsize = 6;
			return clipsize;
			var obj = {
				ammo : users.ammo	                   
		    };	
			var json = JSON.stringify({ type:'reloaded', data: obj});
			for (var i=0; i < clients.length; i++) {
	            clients[i].sendUTF(json);
	        }    
    }  
}  

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
    var users = {  		
		    i : index,
    		userName : false,
		    userColor : false,
			score : 0,
			hp : 100,
			ammo : 6
		};
    console.log((new Date()) + ' Connection accepted.');
    // send back chat history

    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
		var object = datahandlers.messagetoobject(message);
		console.log(object);
        if (message.type === 'utf8') { // accept only text
            if (users.userName === false) { // first message sent by user is their name
                // remember user name
                users.userName = htmlEntities(object.msg);
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                var obj = {
		                    time: (new Date()).getTime(),
		                    y:  object.offsetY,
		                    x: object.offsetX,
		                    author: users.userName,
		                    color: users.userColor, 
		                    score: users.score,
		                    hp : users.hp,
							ammo : users.ammo	                    

		            };
               	  gameevent.boom(obj);

            } else { // log and broadcast the message
                // we want to keep history of all sent messages
                if(object.type == "chat") {   
					gameevent.chat(object, users.userName, users.userColor, users.score, users.ammo);
             	}
              else if (object.type == "mousemove"){
              var obj = {
                    time: (new Date()).getTime(),
                    y:  object.offsetY,
                    x: object.offsetX,
                    author: users.userName,
                    color: userColor
                };
              	gameevent.mousemove(obj);
               }
               else if (object.type == "boom"){
	              var hit = gameevent.hittarget(object.shootat);
	              if (hit == 1) {
	              	users.score++;
	              }
				  users.ammo--;
				  console.log(users.ammo);
			              var obj = {
			                    time: (new Date()).getTime(),
			                    y:  object.offsetY,
			                    x: object.offsetX,
			                    author: users.userName,
			                    color: users.userColor, 
			                    score: 	users.score,
			                    hp : users.hp,
								ammo : users.ammo	                    
	
			            };
			      
			              if(users.ammo >= 0){
	               		  	gameevent.boom(obj);
						}
               }
               else if (object.type == "reload"){
               	 	users.ammo = gameevent.reload();

           		}
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (users.userName !== false && users.userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});