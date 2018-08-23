const  express= require('express'),
path = require('path'),
http = require('http'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
engine = require('ejs-locals'),
socketIO =require('socket.io');

let app = express();
/** Start Custom Code here */
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
require('./routes/index.js').apply(app);

let server = http.createServer(app).listen(4000, () => {
  console.log('Server is started on port * 40000');
});

let io = socketIO(server);

io.on('connection', socket => {

    // error handle
    socket.on('error', error => {
        console.error(`Connection %s error : %s`, socket.id, error);
    });

    socket.on('disconnect', data => {
        console.log(`Connection : %s disconnect`, data);
    });

    socket.on('message', message => {
        console.log(`Connection: %s receive message`, message.id);

        switch (message.id) {
           case 'test':
                console.log("Test call");
                socket.emit({id: 'test', msg: `Test call`});
                break;
           case 'test1':
               console.log("Test1 call");
               socket.emit({id: 'test1', msg: `Test1 call`});
               break;
            default:
                socket.emit({id: 'error', msg: `Invalid message ${message}`});
        }
    });
});
