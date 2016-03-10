var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var request = require('request');
var cheerio = require('cheerio');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

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

app.get('/scrape', function(req, res) {
        var keyword = req.query.keyword;
        var location = req.query.location;
        var page = req.query.page;

        console.log(keyword + ', ' + location + ', ' + page);

        if (!keyword || !location || !page) {
            res.send('No keyword or location');
            return;
        }

        url = 'http://www.yellowpages.ca/search/si/' + page + '/' + keyword + '/' + location;

        var json = {};

        request(url, function(error, response, html) {
            console.log('Making request...');

            if(!error) {
                console.log('Scraping...');
                var $ = cheerio.load(html);
                
                json = [];
                
                console.log('Found ' + $('.listing').length + ' results');


                if ($('.listing').length == 0) {
                    json.error = 'No results found';
                } else {
                    //For every listing
                    $('.resultList .listing').each(function(index) {
                        var json_obj = {};

                        json_obj.title = $(this).find('.listing__content .listing__content__wrap .listing__right > h3 > a').html();

                        $(this).find('.listing__address--full > span').each(function(index, el) {
                            if ($(this).prop('itemprop') == 'postalCode') {
                                json_obj.postal = $(this).html();
                                if (!json_obj.postal) json_obj.postal = '';
                            } else if ($(this).prop('itemprop') == 'addressRegion') {
                                json_obj.region = $(this).html();
                                if (!json_obj.region) json_obj.region = '';
                            } else if ($(this).prop('itemprop') == 'streetAddress') {
                                json_obj.addr = $(this).html();
                                if (!json_obj.addr) json_obj.addr = '';
                            } else if ($(this).prop('itemprop') == 'addressLocality') {
                                json_obj.city = $(this).html();
                                if (!json_obj.city) json_obj.city = '';
                            }
                        });

                        json_obj.phone = $(this).find('.mlr__submenu__item > h4').html();
                        json_obj.website = $(this).find('.mlr__item--website > a').attr('href');

                        if (json_obj.website) {
                            json_obj.website = json_obj.website.substring(7);
                        } 

                        if (!json_obj.title) json_obj.title = ' ';
                        if (!json_obj.addr) json_obj.addr = ' ';
                        if (!json_obj.city) json_obj.city = ' ';
                        if (!json_obj.region) json_obj.region = ' ';
                        if (!json_obj.postal) json_obj.postal = ' ';
                        if (!json_obj.phone) json_obj.phone = ' ';
                        if (!json_obj.website) json_obj.website = ' ';
                        

                        json.push(json_obj);

                    }); 
                }  
                res.send(json);
            }
        })
    });

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);