const moment = require(`moment`);
const UsersModel = require(`./models/UsersModel`);
const settings = require(`../../server-settings`);
const mailer = require("../helpers/mailer");
const bcrypt = require(`bcrypt-nodejs`);
const common = require("./Common");

const controller = {};
const validateUserName = async function (name) {
  let result = false;
  const p = UsersModel.findOne({ username: name }).exec();
  await p.then(user => {
    if (user === null) {
      result = true;
    }
  });
  return result;
};

controller.AddUser = async function (req, res) {
  const user = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo
  };

  if (typeof user.username !== `undefined`) {
    user.username = user.username.slice(0, 60);
  }

  if ((await validateUserName(user.username)) === false) {
    return res.status(400).json({ error: `That username already exists` });
  }

  const model = new UsersModel(user);
  const promise = model.save();

  promise
    .then(user => {
      let resp = {
        success: true,
        message: "user created successfully",
        data: user
      };
      res.json(resp);
    })
    .catch(ex => {
      let resp = {
        success: false,
        message: "Something went wrong. Please try again later",
        data: ex
      };
      res.status(400).json(resp);
    });
};

controller.GetUsersList = function (req, res) {
  UsersModel.find({}, (err, users) => {
    if (err) {
      res.status(400).json({ success: false, message: "Something went wrong. Please try again later" });
    } else {
      res.json({ success: true, message: "users listed successfully", data: user });
    }
  });
};

controller.GetTraders = function (req, res) {
  UsersModel.find({ is_wallet_connected: true, roles: "trader", status: "Active" }, (err, users) => {
    if (err) {
      return res.status(500).json(err);
    } else {
      return res.status(200).json(users);
    }
  });
};

controller.GetUserByID = function (req, res) {
  const query = UsersModel.findById(req.params.id);
  const promise = query.exec();
  promise
    .then(user => {
      res.json({ success: true, message: "user listed successfully", data: user });
    })
    .catch(ex => {
      res.status(400).json({ success: false, message: "Something went wrong. Please try again later" });
    });
};

controller.UpdateUser = async function (req, res) {
  if (!req.body.phoneNo || req.body.phoneNo.length != 10) {
    return res.status(500).send({
      status: "error",
      error: "Phone number should 10 characters"
    });
  }

  UsersModel.findById(req.params.id)
    .then(async user => {
      if (user === null) {
        throw `User not found with that ID`;
      }
      user.first_name = req.body.first_name || user.first_name;
      user.last_name = req.body.last_name || user.last_name;
      user.username = req.body.username || user.username;
      user.password = req.body.password || user.password;
      user.email = req.body.email || user.email;
      user.picture = req.body.picture || user.picture;
      user.is_deleted = req.body.is_deleted || user.is_deleted;
      user.status = req.body.status || user.status;
      user.roles = req.body.roles || user.roles;
      user.phoneNo = req.body.phoneNo || user.phoneNo;

      return await user.save();
    })
    .then(user => {
      res.status(200).json(user);
    })
    .catch(ex => {
      res.status(500).json(ex);
    });
};

controller.DeleteUser = function (req, res) {
  const query = UsersModel.findById(req.params.id).exec();
  let name;

  query
    .then(user => {
      if (user !== null) {
        name = user.username;
        return user.deleteOne();
      }
      throw `User not found with that ID`;
    })
    .then(() => {
      res.status(200).json({ message: `User ${name} removed` });
    })
    .catch(ex => {
      res.status(500).json(ex);
    });
};

controller.connectWallet = async (req, res) => {
  try {
    if (!req.params.wallet_token) {
      throw "Wallet token not found in request.";
    }
    const user = await UsersModel.findById(req.params.id);
    user.is_wallet_connected = true;
    user.wallet_auth_token = req.params.wallet_token;
    await user.save();
    return res.status(200).json({ status: "success", data: user });
  } catch (ex) {
    return res.status(500).json({ status: "error", error: ex });
  }
};

controller.GetUsersAfterDate = function (req, res) {
  const promise = UsersModel.find({
    updated: { $gte: moment.unix(req.params.time) }
  }).exec();

  promise
    .then(users => {
      res.json(users);
    })
    .catch(ex => {
      res.status(500).json(ex);
    });
  if (!req.body.phoneNo || req.body.phoneNo.length != 10) {
    return res.status(400).send({
      status: "error",
      error: "Phone number should 10 characters"
    });
  }

  UsersModel.findById(req.params.id)
    .then(async user => {
      if (user === null) {
        throw `User not found with that ID`;
      }
      user.first_name = req.body.first_name || user.first_name;
      user.last_name = req.body.last_name || user.last_name;
      user.username = req.body.username || user.username;
      user.password = req.body.password || user.password;
      user.email = req.body.email || user.email;
      user.picture = req.body.picture || user.picture;
      user.is_deleted = req.body.is_deleted || user.is_deleted;
      user.status = req.body.status || user.status;
      user.roles = req.body.roles || user.roles;
      user.phoneNo = req.body.phoneNo || user.phoneNo;

      return await user.save();
    })
    .then(user => {
      res.status(200).json(user);
    })
    .catch(ex => {
      res.status(500).json(ex);
    });
};

controller.ForgetPassword = async function (req, res) {
  const email = req.body.email;
  const user = await UsersModel.findOne({ email: email }).exec();

  if (!user) {
    res.status(500).json({ success: false, message: "something went wrong please try again later" });
  } else {
    let randomPassword = await common.generateRandomPassword(15);
    let subject = "reset password";
    let message = "You random password to login is" + randomPassword;

    const resp = await UsersModel.updateOne({ email: email }, { password: randomPassword }).exec();
    if (resp) {
      let is_sent = await mailer.sendMail(user.email, subject, message);
      if (is_sent) {
        res.status(200).json({ success: true, message: "random password has been sent to your registred email" });
      } else {
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later" });
      }
    }
  }
};

module.exports = controller;
