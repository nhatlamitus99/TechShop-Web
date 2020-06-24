const express = require('express')
const app = express()
const router = require('./router')
const passport = require('passport')
const config = require('./config')
const FacebookStrategy  = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session  = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const user = require('./models/User')
const bcrypt = require('bcrypt')
const path = require('path')

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs')

app.use(cookieParser()); //Parse cookie
app.use(bodyParser.urlencoded({ extended: false })); //Parse body để get data
app.use(session({ secret: 'keyboard cat', key: 'sid'}));  //Save user login
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
//app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router)


// Passport session setup. 
passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
  
  // Sử dụng FacebookStrategy cùng Passport.
passport.use(new FacebookStrategy({
      clientID: config.facebook_key,
      clientSecret:config.facebook_secret ,
      callbackURL: config.callback_url_facebook,
      profileFields: ['email', 'displayName']
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        user.findOne({ where:{
          email: profile._json.email
        }
      })
        .then(result=>{
          if(!result){
            var hash = bcrypt.hashSync(profile._json.id, 10);
            user.create({
              fullname: profile._json.name,
              username: profile._json.name,
              email: profile._json.email, 
              phone: "",
              password: hash,
              //type: false
          })
          }
        }).catch(err=> console.log(err))
        return done(null, profile);
      });
    }
));

passport.use(new GoogleStrategy({
  clientID: config.google_key,
  clientSecret: config.google_secret,
  callbackURL: config.callback_url_google,
  profileFields: ['email', 'displayName']
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    user.findOne({ where:{
      email: profile._json.email
    }
  })
    .then(result=>{
      if(!result){
        var hash = bcrypt.hashSync(profile._json.sub, 10);
        user.create({
          fullname: profile._json.email,
          username: profile._json.email,
          email: profile._json.email, 
          phone: "",
          password: hash,
          //type: false
      })
      
      }
    }).catch(err=> console.log(err))
    return done(null, profile);
  });
}
));
  



var PORT = process.env.PORT || 3000
app.listen(PORT)