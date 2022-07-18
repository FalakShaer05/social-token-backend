const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;

const { Schema } = mongoose;

const NFTToken = Schema({
  name: { type: String, required: true },
  token_id: { type: String, required: false },
  current_owner: { type: String, required: false },
  current_owner_username: { type: String, required: false },
  external_link: { type: String, required: false },
  collection_id: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Collections",
  },
  is_private: { type: Boolean, required: true },
  is_traded: { type: Boolean, default: false },
  is_minted: { type: Boolean, default: false },
  mintable: { type: String, required: true },
  ipfsUrl: { type: String, required: false },
  price: { type: String, required: true },
  views: { type: Number, required: false, default: 0 },
  created_by: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

const NFTTokenModel = mongoose.model(`NFTToken`, NFTToken);
module.exports = NFTTokenModel;
