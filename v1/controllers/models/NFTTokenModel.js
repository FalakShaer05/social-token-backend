const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const NFTToken = Schema({
  name: { type: String, required: false },
  description: { type: String, required: false },
  image: { type: String, required: true, unique: false },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  user: { type: mongoose.Types.ObjectId, required: true, ref: "Users" }
});

const NFTTokenModel = mongoose.model(`NFTToken`, NFTToken);
module.exports = NFTTokenModel;
