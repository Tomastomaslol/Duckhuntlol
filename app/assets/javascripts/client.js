$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
    
    var score = null;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://127.0.0.1:1337');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose name:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.</p>' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.dir(message);
        	//console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        if (json.type === 'color') { // first response from the server with user's color
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, json.data[i].score);
            }
        } else if (json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
            console.log(json);
            addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time),  json.data.score, json.data.healthpoints, json.data.ammo);
        }else if (json.type === 'mousemove') {           
        

	          	if($('#' + json.data.author).length == 0){ 
	            	$('#gamearea').append('<p id="' + json.data.author + '">X</p>');
	        	}
	        	else {
						$('#' + json.data.author).attr('style', "position:relative;top:" + json.data.y + "px;left:" + json.data.x + "px;color:" + json.data.color  + ";");
	        	}        
        	}
        	else if (json.type === 'boom') {   
        				alert("boom");
        		alert("time :" + json.data.time + "\n y :" + json.data.y  + "\n  x :" + json.data.x + "\n author :" + json.data.author + "\n");       
    
        }
        else {
        //    console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        		console.dir( message.data);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
          connection.send("type:chat;msg:" + msg + ";");
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });
    $("div#gamearea").mousemove( function (e) {
    	var mouse =  "type:mousemove;offsetX:" + e.offsetX + ";offsetY:" + e.offsetY + ";";
    	connection.send(mouse);
    });


    $("div#gamearea").click( function (e) {

    	var mouse =  "type:boom;offsetX:" + e.offsetX + ";offsetY:" + e.offsetY + ";";
    	connection.send(mouse);
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt, score, hp, ammo) {
        content.append('<p><span style="color:' + color + '">' + author + ' : </span>' + message + '</p>  <p>score : ' + score + '</p> <p>hp : ' + hp + '</p> <p>ammo : ' + ammo + '</p>');
    }
});