/*
 * Krishna Kendre
 * CMPSC 421, HW 7
 */

// Module dependencies.
var express = require('express');
var session = require('express-session');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');

// Create Server
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


var sessionStore = session({
    secret: 'Secrectpass!',
    cookie: {
	maxAge: 600000
    },
    resave: true,
    saveUninitialized: true,
});

app.use(sessionStore);

app.use(express.static(__dirname, {index:'/public/processLogin.html'}));

app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    console.log("%s %s", req.method, req.url);
    next();
});

var myMethods = require("./methods.js");
myMethods(app, express);

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(6007);

console.log('Server started on localhost:6007; Ctrl-C to terminate. ');
