var express = require('express');
var path = require('path');
var index = require('./routes/index');

var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

var passport = require('passport');

app.set('view engine', 'ejs');

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sessions
app.use(session({secret: "dksljdflsajsfdljkflasd", resave: false, saveUninitialized: false}));

app.use(passport.initialize());
app.use(passport.session());

// Serve static content
app.use(express.static(path.join(__dirname, 'public')));

// Setup routers
app.use('/', index);


// app.post('/postQuestion', index);

// app.post('/signup', index);

var server = app.listen(8080, function () {
  console.log('Server running on port 8080.');
});

var socket = require('socket.io');
var io = socket(server);

io.on('connection', function(socket) {
	console.log('Connected...');
});

module.exports = app;