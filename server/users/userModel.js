var mongoose = require('mongoose');

var UserProfileSchema = new mongoose.Schema({
 username: String,
 fbToken: String,
 fbId: Number, 
 categories: [ {categoryID: Number} ],
 history: [ {articleID: Number} ],
 following: [ {userID: Number} ],
 followers: [ {userID: Number} ]
});

UserProfileSchema.pre('save', function(next){
  console.log("pre save");
  next(); 
})

module.exports = mongoose.model('UserProfiles', UserProfileSchema);
