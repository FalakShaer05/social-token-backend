const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const { Schema } = mongoose;

const Requests = Schema({
  jwtToken: { type: String, required: true },
  lastReq: { type: Date, default: Date.now },
  isExpired: { type: Boolean, default: false },
});

Requests.set("toJSON", {});

const requestModel = mongoose.model("Requests", Requests);

module.exports = requestModel;
