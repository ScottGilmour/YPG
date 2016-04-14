var stripe = require("stripe")("sk_live_ChhCY4SuQzZSewMCEx5cKsaG");
var Contact = require('../app/models/contact');
var User = require('../app/models/user');
var moment = require('moment');
var jsforce = require('jsforce');
var request = require('request');
var cheerio = require('cheerio');

var oauth2 = new jsforce.OAuth2({
    // you can change loginUrl to connect to sandbox or prerelease env.
    // loginUrl : 'https://test.salesforce.com',
    clientId : '3MVG9uudbyLbNPZN.UL.mDZeCNIMVdjlGauIHb_9IqtxIpXj7mrGQ1v7Wk3diWFhTYfSpVm0vfwltZikP3y58',
    clientSecret : '5114707190587120721',
    redirectUri : 'https://104.196.23.57/oauth_callback'
});

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs', {
            user : req.user
        }); // load the index.ejs file
    });

    app.get('/scraper', isLoggedIn, function(req, res) {
        res.render('scrape.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/settings', isLoggedIn, function(req, res) {
        res.render('settings.ejs', {
            user : req.user
        });
    });

    app.get('/contacts', isLoggedIn, function(req, res) {


        res.render('contacts.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/oauth_callback', isLoggedIn, function(req, res) {
        var error_msg = req.query.error;
        var error_desc = req.query.error_description;
        var user = req.user;

        if (error_msg) {

        }


        var conn = new jsforce.Connection({ oauth2 : oauth2 });
        var code = req.query.code;

        console.log(code);



        conn.authorize(code, function(err, userInfo) {
        if (err) { return console.error(err); }
            // Now you can get the access token, refresh token, and instance URL information.
            // Save them to establish connection next time.
            console.log(conn.accessToken);
            console.log(conn.refreshToken);
            console.log(conn.instanceUrl);
            console.log("User ID: " + userInfo.id);
            console.log("Org ID: " + userInfo.organizationId);

            //Save the information to user model
            user.salesforce.active = true;

            user.salesforce.id = userInfo.id;
            user.salesforce.org_id = userInfo.organizationId;
            user.salesforce.conn.access_token = conn.accessToken;
            user.salesforce.conn.refresh_token = conn.refreshToken;
            user.salesforce.conn.instance_url = conn.instanceUrl;


            //Save the user
            user.save(function(err) {
                if (err)
                    throw err;
            });

        });

        res.sendStatus(200);
        res.redirect('/scraper');
    });
    
    app.post('/sf/create_lead', isLoggedIn, function(req, res) {
        var user = req.user;
        var lead = req.body.lead;

        if (user && user.salesforce.active && lead) {

            //Create conn
            var conn = new jsforce.Connection({
                oauth2 : {
                    clientId : '3MVG9uudbyLbNPZN.UL.mDZeCNIMVdjlGauIHb_9IqtxIpXj7mrGQ1v7Wk3diWFhTYfSpVm0vfwltZikP3y58',
                    clientSecret : '5114707190587120721',
                    redirectUri : 'https://104.196.23.57/oauth_callback'
                },
                instanceUrl : user.salesforce.conn.instance_url,
                accessToken : user.salesforce.conn.access_token,
                refreshToken: user.salesforce.conn.refresh_token
            });



            //created at date - CreatedDate
            //NumberOfEmployees
            //AnnualRevenue
            //firstName + LastName
            //Industry
            //Lead Source
            //Title
            //Company
            //Website
            //Email
            //Phone
            //Street
            //City
            //State/Province
            //Postal
            //Country

            console.log(lead);

            // Single record creation
            conn.sobject("Lead").create(
                lead, 
                function(err, rets) {
                    if (err) { res.sendStatus(403); }
                        for (var i=0; i < rets.length; i++) {
                            if (rets[i].success) {
                                console.log("Created record id : " + rets[i].id);
                            }
                        }
                        res.sendStatus(200);
                    });

        } else {
            res.send('ERR: No user found');
        }

        res.sendStatus(300);
    });

    //
    // Get authz url and redirect to it.
    //
    app.get('/oauth2/auth', function(req, res) {
        res.redirect(oauth2.getAuthorizationUrl());
    });

    app.post('/delete_contact', isLoggedIn, function(req, res) {
        var id = req.body.id;

        if (id) {
            Contact.find({
                '_id' : id
            }).remove(function() {
                res.send('success');
            });
        }
    });

    app.post('/delete_emails', isLoggedIn, function(req, res) {
        var user = req.user;

        if (user.emails.list) {
            user.emails.list = [];

            user.save(function(err) {
                if (err)
                    throw err;

                console.log('Deleted emails');
            });

            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });

    app.get('/get_emails_csv', isLoggedIn, function(req, res) {
        var user = req.user;

        if (user.emails.list) {
            //var json = JSON.stringify(user.emails.list); // so let's encode it
            

            var result = '';

            for (var i = 0; i < user.emails.list.length; i++) {
                result += user.emails.list[i] + '/n';
            };


            var filename = 'emails.json'; // or whatever
            var mimetype = 'application/json';

            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);
            res.send(result); 


        } else {
            res.sendStatus(400);
        }
        

    });

    app.get('/get_emails', isLoggedIn, function(req, res) {
        var user = req.user;

        if (user.emails.list) {
            res.send(user.emails.list);
        } else {
            res.sendStatus(400);
        }
    });

    app.post('/delete_emails', isLoggedIn, function(req, res) {
        var user = req.user;

        if (user) {
            user.emails.list = [];
            res.sendStatus(200);
        } else {
            res.send('No user found');
        }
    });

    app.post('/crawl', isLoggedIn, function(req, res) {
        var urls = req.body.urls;
        var user = req.user;
        var new_url_list = [];

        var completed_requests = 0;

        for (var i = 0; i < urls.length; i++) {
            if (new_url_list.indexOf(urls[i]) == -1) {
                new_url_list.push(urls[i]);
            }
        }

        console.log('Crawling ' + new_url_list.length + ' urls');

        //Take in a website url
        if (new_url_list) {
            for (var i = 0; i < new_url_list.length; i++) {

                //Request page html
                request(new_url_list[i], function(error, response, html) {
                    completed_requests++;
                    if (!error) {
                        var e_regex = /[^\s@:?/'."\\<>]+@[^\s@:?/.'"\\<>]+\.[^\s@:/"'.?\\<>]+/;
                        
                    

                        var results = html.match(e_regex);
            
                        if (results) {
                            results[0].replace(/[^a-zA-Z0-9 .@]/g, "");
                            user.emails.list.push(results[0]);
                            console.log(results[0]);
                        } 
                    } else {
                        console.log(error);
                    }

                    if (completed_requests == new_url_list.length) {
                        user.save(function(err) {
                            if (err)
                                throw err;

                            console.log('Saved user emails');
                        });
                    }
                });
            };
            
            res.sendStatus(200);
        } else {
            res.sendStatus(403);
        }
    });

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


                if ($('.listing').length == 0 || page > 5) {
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
                        if (!json_obj.website) json_obj.website = ' ';
                        if (!json_obj.phone) json_obj.phone = ' ';
                        
                        json.push(json_obj);
                    }); 
                }  
                res.send(json);
            }
        })
    });

    app.get('/fetch_contacts', isLoggedIn, function(req, res) {
        var user = req.user;

        if (user.local.email) {
            Contact.find({
                'user_email': user.local.email
            }).limit(50).exec(function(err, contacts) {
                if (err) {
                    throw err;
                }

                res.send(contacts);
            });
        }
    });

    app.post('/add_contact', isLoggedIn, function(req, res) {
        var user = req.user;
        var contact = req.body.contact;

        console.log(contact);
        res.sendStatus(200);

        if (user && contact) {

            var rawContacts = [];

            for (var i = 0; i < contact.length; i++) {
                var newContact = new Contact();

                newContact.title = contact[i].title;
                newContact.address = contact[i].addr;
                newContact.postal = contact[i].postal;
                newContact.region = contact[i].region;
                newContact.city = contact[i].city;
                newContact.phone = contact[i].phone;
                newContact.website = contact[i].website;

                newContact.user_email = user.local.email;
                newContact.active = true;
                
                rawContacts.push(newContact);  
                   
            };

            Contact.create(rawContacts, function (err, res) {
                if (err) {
                    console.log(err);
                }

                console.log('Saved contacts');
            });


        }

        res.sendStatus(200);

        /*
        if (user && contact) {


            var newContact = new Contact();

            newContact.title = contact.title;
            newContact.address = contact.addr;
            newContact.postal = contact.postal;
            newContact.region = contact.region;
            newContact.city = contact.city;
            newContact.phone = contact.phone;
            newContact.website = contact.website;

            newContact.user_email = user.local.email;
            newContact.active = true;

            newContact.save(function(err) {
                if (err)
                    throw err;

                res.send('added contact');
            });
        }
        */
    });


    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // =====================================
    // PAYMENT SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/payment', isLoggedIn, function(req, res) {
        res.render('payment.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });



    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/scraper', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

     // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/payment', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.post('/change_locale', isLoggedIn, function(req, res) {
        var user = req.user;
        var new_locale = req.query.locale;

        if (user) {
            user.locale = new_locale;

            // save the user
            user.save(function(err) {
                if (err)
                    throw err;
            });
        }
    });

    //Webhook callback for stripe, sends event data
    app.post("/10kleads/webhook", function(request, response) {
      // Retrieve the request's body and parse it as JSON
      var event_json = request.body;

      if (event_json) {
        //Get the customer ID
        var cus_id = event_json.data.object.customer; 

        console.log(cus_id);

        //Get the corresponding user for id
        User.findOne({
            'local.subscription.id' : cus_id
        }).exec(function(err, user_obj) {

            if (err) {
                console.log(err);
                response.sendStatus(403);
            }

            if (!user_obj) {
                console.log('No user found');
                response.sendStatus(403);
            } else {
                //Handle event type
                if (event_json.type == 'charge.succeeded') {
                    //Set active_until one month from today
                    var new_date = new Date();

                    var moment_date = moment(new_date);
                    moment_date.add(1, 'months');

                    user_obj.local.member = true;
                    user_obj.local.active_until = moment_date;
                } else if (event_json.type == 'charge.failed' || event_json.type == 'charge.refunded') {
                    user_obj.local.member = false;
                    user_obj.local.active_until = new Date();
                }

                //Save user object and return 200
                user_obj.save(function(err) {
                    if (err)
                        throw err;
                });


                response.sendStatus(200);
            }
        });
      }

      // Do something with event_json
      console.log(event_json);
    });
    
    app.post('/delete_subscription', isLoggedIn, function(req, res) {
        var user = req.user;

        console.log(user);

        if (!user) {
            res.redirect('/login');
        } else if (user.local.subscription) {
            stripe.customers.cancelSubscription(
              user.local.subscription.id,
              user.local.subscription.subscriptions.data[0].id,
              function(err, confirmation) {
                // asynchronously called
                if (err)
                    throw err;

                res.send('Confirmed');
                res.sendStatus(200);
              }
            );
        } else {
            res.send('No subscription found');
            res.sendStatus(403);
        }
    });

    app.post('/create_subscription', isLoggedIn, function(req, res) {
        var user = req.user;
        var stripeToken = req.body.stripeToken;

        if (!user) {
            res.redirect('/login');
        } else {

            //Create the customer
            stripe.customers.create({
              source: stripeToken, // obtained with Stripe.js
              plan: "unlimited",
              email: user.local.email
            }, function(err, customer) {
              // asynchronously called

              if (err) {
                res.send(err);
              } 

              console.log(customer);

              //Set customer object to user model
              user.local.subscription = customer;

              //Set active_until one month from today
              var new_date = new Date();

              var moment_date = moment(new_date);
              moment_date.add(1, 'months');

              user.local.member = true;
              user.local.active_until = moment_date;

              // save the user
              user.save(function(err) {
                if (err)
                    throw err;
              });

              res.redirect('/scraper');

            });
        }
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}