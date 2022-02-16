const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const nftviews = Schema({
  user: { type: mongoose.Types.ObjectId, ref: "Users" },
  token: { type: mongoose.Types.ObjectId, ref: "NFTToken" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

nftviews.set("toJSON", {});
const model = mongoose.model("nftviews", nftviews);
module.exports = model;
