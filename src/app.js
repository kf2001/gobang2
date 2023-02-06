

var express = require('express');

var app = express();
var server = require('http').createServer(app);


const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));


var allClients = [];
var nicks = "";
var attende = null;
var io = require('socket.io').listen(server);

app.use(express.static('./public'));

/*
  app.get('/', function (request, response) {
  response.render(__dirname + "/public/gobang.html");
  console.log("spedita");
});
*/


var activeClients = 0;


io.sockets.on('connection', function (socket) {

  allClients.push(socket);

  if (activeClients < 20) {

    activeClients += 1;
    console.log(activeClients);
    io.sockets.emit('message', { clients: activeClients });
    socket.emit('numero', activeClients % 2 + 1);


    socket.on('disconnect', function () {
      activeClients -= 1;
      var i = allClients.indexOf(socket);

      if (activeClients % 2 == 1) attende = allClients[i].avversario; else attende = null;
      allClients[i].avversario.emit('andato');
      io.sockets.emit('message', { clients: activeClients });
      delete allClients[i];


    });

    socket.on('daclient', function (msg) {
      console.log("ricevuta");
    
      socket.emit('draw', msg);
      socket.avversario.emit('draw', msg);

    });
    socket.on('join', function (msg) {
      console.log("nick arrivato: " + msg);
      socket.nickname = msg;
      nicks += msg + "-";
      console.log("connesso " + msg);

      io.sockets.emit('lista', nicks);

      if (activeClients % 2 == 1) {// cerca avversario 
        attende = socket;
     
      }
      if (activeClients % 2 == 0) {// trovato avversario 
        socket.avversario = attende;
        attende.avversario = socket;

        socket.emit('start', socket.avversario.nickname, 1);
        socket.avversario.emit('start', socket.nickname, 2);

      }
    });
  }
});

//var portnumber = 8040;
var portnumber=3000;
//if (!isNaN(process.argv[2])) portnumber = process.argv[2];
server.listen(portnumber, "0.0.0.0");
console.log("Server in ascolto alla porta " + portnumber);



module.exports = app;
