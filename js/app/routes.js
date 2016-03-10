var Contact = require('../app/models/contact');

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

    app.post('/create_subscription', isLoggedIn, function(req, res) {
        var user = req.user;
        var stripe = require("stripe")("sk_test_4Z6MsyQ0i4xl0Zm6JWR5wwrq");
        var stripeToken = req.body.stripeToken;

        if (!user) {
            res.redirect('/');
        } else {
            var charge = stripe.charges.create({
                amount: 5000, // amount in cents, again
                currency: "cad",
                source: stripeToken,
                description: "YellowPageCrawler"
            }, function(err, charge) {
              if (err && err.type === 'StripeCardError') {
                console.log('declined');
                res.redirect('/payment');
              } else {
                console.log('accepted');
                user.local.member = true;

                // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                });

                res.redirect('/scraper');
              }
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