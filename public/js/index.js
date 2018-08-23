
var socket = io('http://' + location.host);

socket.on('connect', () => {
	console.log('ws connect success');

	let message = {
		id : 'test1',
		msg : "Call message"
	}
	sendMessage(message);
});

socket.on('message', parsedMessage => {

	console.info('Received message: ' + parsedMessage.id);

	switch (parsedMessage.id) {

		case 'test':
			console.log("Response from Server =>",parsedMessage);;
			break;
		case 'test1':
			console.log("Response from Server =>",parsedMessage);;
			break;
		default:
			console.error('Unrecognized message', parsedMessage);
	}
});

function sendMessage(message) {
	//console.log('Senging message: ' + message.id);
	socket.emit('message', message);
}
