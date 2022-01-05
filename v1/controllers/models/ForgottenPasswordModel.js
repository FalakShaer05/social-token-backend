const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const ForgetPasswordSch = Schema({
  user: { type: mongoose.Types.ObjectId, required: true, unique: true, ref: "Users" },
  code: { type: String, required: true }
});

ForgetPasswordSch.set("toJSON", {});
const model = mongoose.model(`ForgetPasswords`, ForgetPasswordSch);
module.exports = model;
