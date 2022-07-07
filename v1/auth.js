const passport = require(`passport`);
const LocalStrategy = require(`passport-local`).Strategy;
const bcrypt = require(`bcryptjs`);
const UsersModel = require(`./controllers/models/UsersModel`);
const jwt = require(`jsonwebtoken`);
const config = require(`../server-settings.json`);

module.exports = function Auth() {
  const verifyUserPassword = async (request, username, password, cb) => {
    UsersModel.findOne({ username }, (err, user) => {
      if (err) {
        cb(err);
      } else if (!user) {
        return cb(`Username not found or password did not match`);
      } else {
        bcrypt.compare(password, user.password, async (err, isMatch) => {
          if (err) {
            return cb(err);
          }
          if (!isMatch) {
            return cb(`Username not found or password did not match`);
          }

          const token = jwt.sign({ sub: user._id }, config.server.secret, {
            algorithm: "HS512"
          });
          const data = {
            user: user,
            token: token
          };

          cb(null, data);
        });
      }
    });
  };

  passport.use(
    `user-basic`,
    new LocalStrategy(
      {
        usernameField: `username`,
        passwordField: `password`,
        passReqToCallback: true
      },
      async (req, username, password, done) => {
        verifyUserPassword(req, username, password, (err, data) => {
          if (err) {
            return done(err);
          }

          if (!data) {
            return done(null, false);
          }

          return done(null, data);
        });
      }
    )
  );

  this.isUserAuthenticated = async function (req, res, next) {
    return passport.authenticate(`user-basic`, { session: false })(req, res, next);
  };

  return this;
};
