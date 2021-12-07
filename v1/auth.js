const passport = require(`passport`);
const LocalStrategy = require(`passport-local`).Strategy;
const bcrypt = require(`bcryptjs`);
const UsersModel = require(`./controllers/models/UsersModel`);
const AppsModel = require(`./controllers/models/AppsModel`);
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
            algorithm: "HS512",
          });
          const data = {
            user: user,
            token: token,
          };

          cb(null, data);
        });
      }
    });
  };

  const verifyAppPassword = function (appname, password, cb) {
    AppsModel.findOne({ name: appname }, (err, app) => {
      if (err) {
        cb(err);
      } else if (!app) {
        return cb(`Invalid credentials`);
      } else {
        bcrypt.compare(password, app.password, (err, isMatch) => {
          if (err) {
            return cb(err);
          }
          if (!isMatch) {
            return cb(`Invalid credentials`);
          }
          const data = {
            isApp: true,
            appId: app._id,
            name: app.name,
            permissions: app.permissions,
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

  passport.use(
    `app-basic`,
    new LocalStrategy((appname, password, done) => {
      verifyAppPassword(appname, password, (err, data) => {
        if (err) {
          return done(err);
        }

        if (!data) {
          return done(null, false);
        }

        return done(null, data);
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, {
      id: user.userId || user.appId,
      isUser: user.isUser || false,
      isApp: user.isApp || false,
    });
  });

  passport.deserializeUser((user, done) => {
    if (user.isApp) {
      const query = AppsModel.findOne({ _id: user.id });
      const promise = query.exec();

      promise.then((app) => {
        if (user) {
          const data = {
            appId: user._id,
            appname: app.name,
            permissions: app.permissions,
            isApp: true,
          };

          done(null, data);
        } else {
          done(`Session not found`, false);
        }
      });
    } else if (user.isUser) {
      const query = UsersModel.findOne({ _id: user.id });
      const promise = query.exec();

      promise.then((user) => {
        if (user) {
          const data = {
            userId: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            isUser: true,
          };

          done(null, data);
        } else {
          done(`Session not found`, false);
        }
      });
    }
  });

  this.isUserAuthenticated = async function (req, res, next) {
    return passport.authenticate(`user-basic`, { session: false })(
      req,
      res,
      next
    );
  };

  this.isAppAuthenticated = function (req, res, next) {
    if (req.user && req.user.isApp) {
      return next();
    }

    return passport.authenticate(`app-basic`, { session: false })(
      req,
      res,
      next
    );
  };

  this.isAnyAuthenticated = function (req, res, next) {
    passport.authenticate(`user-basic`, { session: false })(req, res, (err) => {
      if (err) {
        passport.authenticate(`app-basic`, { session: false })(req, res, next);
      } else {
        return next();
      }
    });
  };

  return this;
};
