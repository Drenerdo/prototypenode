var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){
  passport.use('signup', new LocalStrategy({
    PassReqToCallback : true
  },
    function(req, username, password, done) {
      findOrCreateUser = function() {
        User.findOne({ 'username' : username}, function(err, user){
          if(err) {
            console.log('Error in SignUp:' + err);
            return done(err);
          }
          if(user) {
            console.log('User already exists with username:' + username);
            return done(null, false, req.flash('message', 'User Already Exists'));
          } else {
            var newUser = new User();

            newUser.username = username;
            newUser.password = createHash(password);
            newUser.email = req.param('email');
            newUser.firstName = req.param('firstName');
            newUser.lastName = req.param('lastName');

            // Save the user
            newUser.save(function(err) {
              if(err) {
                console.log('Error in saving user:' + err);
                throw err;
              }
              console.log('User registration successful');
              return done(null, newUser);
            });
          }
        });
      };
      process.nextTick(findorCreateUser);
    })
  );

  var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  }
}
