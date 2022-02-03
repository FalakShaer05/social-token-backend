const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const Collection = Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
  thumbnail_image: { type: String, required: false },
  timeline_image: { type: String, required: false },
  share_url: { type: String, required: false },
  is_private: { type: Boolean, require: true },
  category: { type: mongoose.Types.ObjectId, require: true, ref: "Category" },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

// Collection.pre(`save`, function (callback) {
//   const user = this;
//   user.updated = new Date(Date.now());
// });
Collection.set("toJSON", {});
const model = mongoose.model(`Collections`, Collection);
module.exports = model;
