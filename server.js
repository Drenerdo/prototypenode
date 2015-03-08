var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var expressSession = require('express-session');
var flash = require('connect-flash');

var dbConfig = require('./server/db');
var mongoose = require('mongoose');
// Connecting to database
mongoose.connect(dbConfig.url);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Passport
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

// Router
var routes = require('./routes/index')(passport);
app.use('/', routes);

// Catching 404 error
app.use(function(req, res, next){
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

if(app.get('env') === 'development') {
	app.use(function(err, req, res, next){
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

module.exports = app;