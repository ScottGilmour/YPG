// app/models/contact.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our contact model
var contactSchema = mongoose.Schema({
    title           : String,
    address         : String,
    postal          : String,
    city            : String,
    region          : String,
    website         : String,
    phone           : String,
    notes           : [String],
    date_created    : { type: Date, default: Date.now },
    active          : Boolean,
    user_email      : String 
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Contact', contactSchema);