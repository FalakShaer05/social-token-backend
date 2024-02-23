const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const SavedNFT = Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "Users" },
  token: { type: String, },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SavedNFT.set("toJSON", {});
const model = mongoose.model("savednft", SavedNFT);
module.exports = model;
