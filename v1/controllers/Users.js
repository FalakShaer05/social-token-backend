const moment = require(`moment`);
const UsersModel = require(`./models/UsersModel`);
const controller = {};
const settings = require(`../../server-settings`);

const validateUserName = async function (name) {
  let result = false;
  const p = UsersModel.findOne({ username: name }).exec();

  await p.then((user) => {
    if (user === null) {
      result = true;
    }
  });

  return result;
};

controller.AddUser = async function (req, res) {
  if (!req.body.phoneNo || req.body.phoneNo.length !== 10) {
    return res.status(500).send({
      status: "error",
      error: "Phone number should 10 characters",
    });
  }

  const user = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo,
  };

  if (typeof user.username !== `undefined`) {
    user.username = user.username.slice(0, 60);
  }

  if ((await validateUserName(user.username)) === false) {
    return res.status(400).json({ error: `That username already exists` });
  }

  const model = new UsersModel(user);
  const promise = model.save();

  promise.then((user) => {
      let resp = {
        success: true,
        message: 'user created successfully',
        data: user
      }
      res.json(resp);
    }).catch((ex) => {
      let resp = {
        success: false,
        message: 'Something went wrong. Please try again later',
        data: ex
      }
      res.status(400).json(resp);
    });
};

controller.GetUsersList = function (req, res) {
  UsersModel.find({}, (err, users) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(users);
    }
  });
};

controller.GetUserByID = function (req, res) {
  const query = UsersModel.findById(req.params.id);
  const promise = query.exec();
  promise
    .then((user) => {
      res.json(user);
    })
    .catch((ex) => {
      res.status(500).json(ex);
    });
};

controller.UpdateUser = async function (req, res) {
  if (!req.body.phoneNo || req.body.phoneNo.length != 10) {
    return res.status(500).send({
      status: "error",
      error: "Phone number should 10 characters",
    });
  }

  UsersModel.findById(req.params.id)
    .then(async (user) => {
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
    .then((user) => {
      res.status(200).json(user);
    })
    .catch((ex) => {
      res.status(500).json(ex);
    });
};

controller.DeleteUser = function (req, res) {
  const query = UsersModel.findById(req.params.id).exec();
  let name;

  query
    .then((user) => {
      if (user !== null) {
        name = user.username;
        return user.deleteOne();
      }
      throw `User not found with that ID`;
    })
    .then(() => {
      res.status(200).json({ message: `User ${name} removed` });
    })
    .catch((ex) => {
      res.status(500).json(ex);
    });
};

controller.GetUsersAfterDate = function (req, res) {
  const promise = UsersModel.find({
    updated: { $gte: moment.unix(req.params.time) },
  }).exec();

  promise
    .then((users) => {
      res.json(users);
    })
    .catch((ex) => {
      res.status(500).json(ex);
    });
};

module.exports = controller;
