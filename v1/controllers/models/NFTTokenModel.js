const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const NFTToken = Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: true },
  share_url: { type: String, required: false },
  price: { type: Number, required: true },
  tags: { type: Array, default: [] },
  is_private: { type: Boolean, required: true },
  is_traded: { type: Boolean, default: false },
  collection_id: { type: mongoose.Types.ObjectId, required: true, ref: "Collections" },
  user: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
  category: { type: mongoose.Types.ObjectId, required: true, ref: "Category" },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

const NFTTokenModel = mongoose.model(`NFTToken`, NFTToken);
module.exports = NFTTokenModel;
