const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const Views = Schema({
  user: { type: mongoose.Types.ObjectId, require: true, ref: "Users" },
  nft: { type: mongoose.Types.ObjectId, require: true, ref: "NFTToken" },
});

const AddViewModel = mongoose.model(`AddViews`, Views);
module.exports = AddViewModel;
