// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        firstname    : String,
        lastname     : String,
        email        : String,
        password     : String,
        member       : Boolean,
        locale       : String,
        active_until : Date,
        credits      : Number,
        subscription : mongoose.Schema.Types.Mixed
    },
    emails           : {
        list         : [String],
        date_created : { type: Date, default: Date.now },
        keyword      : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    salesforce       : {
        active       : Boolean,
        id           : String,
        org_id       : String,
        conn         : {
            access_token  : String,
            refresh_token : String,
            instance_url  : String
        }
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);