const moment = require(`moment`);
const UsersModel = require(`./models/UsersModel`);
const ForgetPasswordModel = require("./models/ForgottenPasswordModel");
const settings = require(`../../server-settings`);
const mailer = require("../helpers/mailer");
const bcrypt = require(`bcrypt-nodejs`);
const common = require("./Common");
const jwt = require(`jsonwebtoken`);
const Usermodel = require("./models/UsersModel");

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
    return res.status(400).json({ success: false, message: `That username already exists` });
  }

  const model = new UsersModel(user);
  const promise = model.save();
  const token = jwt.sign({ sub: model._id }, settings.server.secret, {
    algorithm: "HS512"
  });
  promise
    .then(user => {
      let resp = {
        success: true,
        message: "User created successfully.",
        data: { user: user, token: token }
      };
      res.json(resp);
    })
    .catch(ex => {
      console.log(ex);
      
      let resp = {
        success: false,
        message: "error"
      };
      res.status(400).json(resp);
    });
};

controller.GetUsersList = function (req, res) {
  UsersModel.find({}, (err, users) => {
    if (err) {
      res.status(400).json({ success: false, message: "Something went wrong. Please try again later" });
    } else {
      res.json({ success: true, message: "users listed successfully", data: users });
    }
  });
};

controller.GetTraders = function (req, res) {
  UsersModel.find({ is_wallet_connected: true, roles: "trader", status: "Active" }, (err, users) => {
    if (err) {
      return res.status(400).json({ success: false, message: "Traders not found" });
    } else {
      return res.status(200).json({ success: true, message: "traders listed successfully", data: users });
    }
  });
};

controller.GetUserProfile = function (req, res) {
  const query = UsersModel.findById(req.params.id);
  const promise = query.exec();
  promise
    .then(user => {
      res.status(200).json({ success: true, message: "Success", data: user });
    })
    .catch(ex => {
      res.status(400).json({ success: false, message: "error" });
    });
};

controller.UpdateUser = async function (req, res) {
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
      user.phoneNo = req.body.phoneNo || user.phoneNo;
      user.picture = req.body.picture || user.picture;

      return await user.save();
    })
    .then(user => {
      res.status(200).json({ success: true, message: "Success", data: user });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "error" });
    });
};

controller.ActivateUser = async function (req, res) {
  UsersModel.findById(req.params.id)
    .then(async user => {
      if (user === null) {
        throw `User not found with that ID`;
      }
      user.status = "Active";

      return await user.save();
    })
    .then(user => {
      res.status(200).json({ success: true, message: "Success", data: user });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "Error" });
    });
};

controller.DeactivateUser = async function (req, res) {
  UsersModel.findById(req.params.id)
    .then(async user => {
      if (user === null) {
        throw `User not found with that ID`;
      }
      user.status = "Inactive";

      return await user.save();
    })
    .then(user => {
      res.status(200).json({ success: true, message: "Success", data: user });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "error" });
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
      res.status(200).json({ success: true, message: `User ${name} removed` });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "error" });
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
    return res.status(200).json({ success: true, message: "Wallet connected", data: user });
  } catch (ex) {
    return res.status(500).json({ success: false, message: "error" });
  }
};

controller.GetUsersAfterDate = function (req, res) {
  const promise = UsersModel.find({
    updated: { $gte: moment.unix(req.params.time) }
  }).exec();

  promise
    .then(users => {
      res.json({ success: true, message: "Retrieved", data: users });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "error" });
    });
  if (!req.body.phoneNo || req.body.phoneNo.length != 10) {
    return res.status(400).send({
      success: false,
      message: "Phone number should 10 characters"
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
      res.status(200).json({ success: true, message: "Retrieved", data: user });
    })
    .catch(ex => {
      res.status(500).json({ success: false, message: "error" });
    });
};

controller.ForgetPassword = async function (req, res) {
  const email = req.body.email;
  const user = await UsersModel.findOne({ email: email }).exec();

  if (!user) {
    res.status(500).json({ success: false, message: "something went wrong please try again later" });
  } else {
    let code = await common.generateCode(6);
    let subject = "reset password";
    let message = `Here is a 6 digit verification code ${code}`;

    let exist = await ForgetPasswordModel.findOne({ user: user._id });
    if (exist) {
      await ForgetPasswordModel.deleteOne({ _id: exist._id });
    }

    let is_sent = await mailer.sendMail(user.email, subject, message);
    if (is_sent) {
      const fpass = new ForgetPasswordModel();
      fpass.user = user._id;
      fpass.code = code;
      await fpass.save();
      res.status(200).json({ success: true, message: "verification code has been sent to your registered email" });
    } else {
      res.status(500).json({ success: false, message: "Something went wrong. Please try again later" });
    }
  }
};

controller.ForgetPasswordVerify = async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const code = req.body.code;

    if (!email || !password || !code) {
      return res.status(400).json({ success: false, message: "Email, Password & Code is required" });
    }

    const user = await UsersModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ success: false, message: `We do not have record for ${email}` });
    }

    const is_code_valid = await ForgetPasswordModel.findOne({ code: code, user: user._id });
    if (!is_code_valid) {
      return res.status(400).json({ success: false, message: `Your code ${code} is invalid. Please add valid code` });
    }

    const update = await UsersModel.findOneAndUpdate({ _id: user._id }, { password: password });
    if (update) {
      await ForgetPasswordModel.deleteOne({ _id: is_code_valid._id });
      return res.status(200).json({ success: true, message: "You are all done. New password has been updated" });
    } else {
      return res.status(502).json({ success: false, message: "Something went wrong please try again later" });
    }
  } catch (ex) {
    return res.status(502).json({ success: false, message: "error" });
  }
};

controller.uploadImage = async function (req, res) {
  try {
    const { path } = req.file;
    let data = {
      image: `${settings.server.serverURL}/${path.replace(/\\/g, "/")}`
    };

    const user = await UsersModel.findById(req.params.id);
    user.picture = data.image;
    await user.save();
    return res.status(200).json({ success: true, message: "Image uploaded", data: data });
  } catch (ex) {
    return res.status(502).json({ success: false, message: "error" });
  }
};

module.exports = controller;
