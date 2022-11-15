const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./model/user');

function initialize (passport) {
    const authenticateUser = async function authenticateUser(email, password, done) {
        const query =  User.findOne({ email : email });
        const user = await query.exec();
        if (user == null) {
            return done(null, false, {message : 'No user with that email.'});
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, {message : 'Password incorrect!'});
            }
        } catch (error) {
            return done(error);
        }
    }
    passport.use(new localStrategy({ usernameField : 'email'}, authenticateUser));
    passport.serializeUser(function(user, done){
        return done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
        return done(null, async function(id){
            const query = User.findById({ id : id });
            const user = await query.exec();
            return user
        })
    })
}

module.exports = initialize;