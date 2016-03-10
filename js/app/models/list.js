// app/models/list.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our contact model
var listSchema = mongoose.Schema({
    title           : String,
    contacts        : [Schema.Types.Mixed],
    date_created    : { type: Date, default: Date.now },
    active          : Boolean,
    user_email      : String 
});

// create the model for users and expose it to our app
module.exports = mongoose.model('List', listSchema);