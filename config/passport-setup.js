var passport = require('passport');
var FacebookStrategy = require('passport-facebook');
var User = require('../models/user-model')

var fbEmail = "";

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

passport.use(new FacebookStrategy({
	// options for strategy
	clientID: '2094040393971800',
  	clientSecret: 'a2d89aad908277c5db26ffc68761ff31',
  	callbackURL: "http://localhost:8080/auth/facebook",
  	profileFields: ['email', 'displayName']
}, function(accessToken, refreshToken, profile, done) {
	console.log('Working now');
	console.log(profile);
	var user = new User({
		facebookID: profile.id,
		username: profile.displayName,
		email: profile.emails[0].value
	})
	console.log('New User' + user);
	done(null, user);
}));

