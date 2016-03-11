var stripe = require("stripe")("sk_test_4Z6MsyQ0i4xl0Zm6JWR5wwrq");
var Contact = require('../app/models/contact');
var User = require('../app/models/user');
var moment = require('moment');

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


    app.get('/contacts', isLoggedIn, function(req, res) {


        res.render('contacts.ejs', {
            user : req.user // get the user out of session and pass to template
        });
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

    app.post('/add_list', isLoggedIn, function(req, res) {
        var user = req.user;
        var list = req.body.list;

        if (user) {

        }
    });

    app.post('/add_contact', isLoggedIn, function(req, res) {
        var user = req.user;
        var contact = req.body.contact;

        console.log(contact);

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
        successRedirect : '/', // redirect to the secure profile section
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

        //Get the corresponding user for id
        User.find({
            'local.subscription.id' : cus_id
        }).exec(function(err, user) {
            if (err) {
                throw err;
                res.sendStatus(403);
            }

            if (!user) {
                res.sendStatus(403);
            }

            //Handle event type
            if (event_json.type == 'charge.succeeded') {
                //Set active_until one month from today
                var new_date = new Date();

                var moment_date = moment(new_date);
                moment_date.add(1, 'months');

                user.local.member = true;
                user.local.active_until = moment_date;
            } else if (event_json.type == 'charge.failed' || event_json.type == 'charge.refunded') {
                user.local.member = false;
                user.local.active_until = new Date();
            }

            //Save user object and return 200
            user.save(function(err) {
                if (err)
                    throw err;
            });


            res.sendStatus(200);
        });
      }

      // Do something with event_json
      console.log(event_json);

      response.sendStatus(403);
    });

    app.post('/create_subscription', isLoggedIn, function(req, res) {
        var user = req.user;
        var stripeToken = req.body.stripeToken;

        if (!user) {
            res.redirect('/');
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