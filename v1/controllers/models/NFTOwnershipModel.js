const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const NFThistory = Schema({
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
  token: { type: mongoose.Types.ObjectId, required: true, ref: "NFTToken" },
  amount: { type: Number, required: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

NFThistory.set("toJSON", {});
const model = mongoose.model(`NFTOwnershipHistory`, NFThistory);
module.exports = model;
