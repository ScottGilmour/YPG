var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var host     = 'localhost';
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var request = require('request');
var cheerio = require('cheerio');

var https = require('https');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var key = fs.readFileSync('ssl/key.pem');
var cert = fs.readFileSync('ssl/cert.pem');

var https_options = {
    key: key,
    cert: cert
};

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.use(express.static('views'));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'scottythegreatest' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport



server = https.createServer(https_options, app).listen(port, host);
console.log('HTTPS Server listening on %s:%s', port, host);

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);