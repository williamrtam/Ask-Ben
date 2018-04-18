var mongoose = require('mongoose');
var Schema = mongoose.Schema;


const userSchema = new Schema({
	facebookID: String,
	username: String,
	email: String
});


const User = mongoose.model('user', userSchema);


module.exports = User;