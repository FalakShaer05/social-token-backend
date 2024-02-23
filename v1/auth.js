const passport = require(`passport`);
const LocalStrategy = require(`passport-local`).Strategy;
const bcrypt = require(`bcryptjs`);
const UsersModel = require(`./controllers/models/UsersModel`);
const AppsModel = require(`./controllers/models/AppsModel`);
const jwt = require(`jsonwebtoken`);
const config = require(`../server-settings.json`);
const SavedNFTModel = require("./controllers/models/SavedNFT");

module.exports = function Auth() {
  const verifyUserPassword = async (request, username, password, cb) => {
    UsersModel.findOne({username}, (err, user) => {
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

          const token = jwt.sign({sub: user._id}, config.server.secret, {
            algorithm: "HS512",
          });
          // const savedNft = await SavedNFTModel.find({userId: user._id}).exec();
          const data = {
            user: user,
            token: token,
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
        passReqToCallback: true,
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

  // passport.serializeUser((user, done) => {
  //   done(null, {
  //     id: user.userId || user.appId,
  //     isUser: user.isUser || false,
  //     isApp: user.isApp || false
  //   });
  // });

  // passport.deserializeUser((user, done) => {
  //   if (user.isApp) {
  //     const query = AppsModel.findOne({ _id: user.id });
  //     const promise = query.exec();

  //     promise.then(app => {
  //       if (user) {
  //         const data = {
  //           appId: user._id,
  //           appname: app.name,
  //           permissions: app.permissions,
  //           isApp: true
  //         };

  //         done(null, data);
  //       } else {
  //         done(`Session not found`, false);
  //       }
  //     });
  //   } else if (user.isUser) {
  //     const query = UsersModel.findOne({ _id: user.id });
  //     const promise = query.exec();

  //     promise.then(user => {
  //       if (user) {
  //         const data = {
  //           userId: user._id,
  //           username: user.username,
  //           email: user.email,
  //           roles: user.roles,
  //           isUser: true
  //         };

  //         done(null, data);
  //       } else {
  //         done(`Session not found`, false);
  //       }
  //     });
  //   }
  // });

  this.isUserAuthenticated = async function (req, res, next) {
    return passport.authenticate(`user-basic`, {session: false})(
      req,
      res,
      next
    );
  };

  return this;
};
