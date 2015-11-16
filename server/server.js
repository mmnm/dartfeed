var express = require('express'); 
var session = require('express-session');
var mongoose = require('mongoose'); 
var router = require('./router.js'); 
var bodyParser = require('body-parser'); 
var cookieParser = require('cookie-parser'); 
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./config.js'); 
var User = require('./users/userModel.js'); 
var logger = require('./middleware/logger');
var defaultUser = require('./middleware/defaultUser');

mongoose.connect('mongodb://localhost/dartfeed'); 

var app = express();
var expressRouter = express.Router(); 
app.use(express.static(__dirname + '/../client'));

//cookie parser
app.use(cookieParser());

// parse application/x-www-form-urlencoded and application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set up facebook auth
app.use(session({secret: 'marmot'}));  
app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new FacebookStrategy({
    clientID: config.fbClientID,
    clientSecret: config.fbClientSecret,
    callbackURL: config.fbCallback 
    //profileFields: ['email', 'profileUrl']
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(accessToken);
      console.log(profile);

      ///store in the db 
      User.findOne({fbId:profile.id}, function(err, user){
        if(!user){
          return User.create({
            username: profile.displayName,
            fbToken: accessToken, 
            fbId: profile.id
          });

        } else {
          //return existing user
          return user; 
        }
      })
      .then(function (user){
        console.log("then user ", user);
        done(null, user); 
      });
  }
));

app.use(logger);
app.use(bodyParser.json());
//app.use('/', expressRouter); 

//get called after login - updates session with user.id 
passport.serializeUser(function(user, done) {
  console.log("login uid", user.id);
  done(null, user.id);
});

//called on subsequent requests to server
passport.deserializeUser(function(id, done) {
  console.log("deserializeUser", id);

  User.findById(id, function (err, user){
    if(user){
      console.log("found user");
      //if id exists in DB - call done with id - id will be on req.user going forward
      done(null, user); 
    } else {
      console.log("didn't find user");
      //if not, call done with false 
      done(null, false); 
    }
  });
});

app.use(function (req, res, next){
  console.log("user setting conditional");
  console.log(req.originalUrl);
  console.log(req.user);
  if(req.originalUrl === '/api/auth/callback'){
    next();
  }
  if(!req.user){
    console.log("true!");
    defaultUser(req, res, next);
  } else {
    next();
  }
});

//set up router 
app.use('/', expressRouter); 
router(expressRouter); 

app.listen(8000); 

module.exports = app; 

