const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const Collection = Schema({
  name: { type: String, required: true },
  description: {type: String, required: false},
  thumbnail_image: { type: String, required: false },
  timeline_image: { type: String, required: false },
  created_by: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
  category_id: { type: mongoose.Types.ObjectId, require: true, ref: "Category" },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

Collection.set("toJSON", {});
const model = mongoose.model(`Collections`, Collection);
module.exports = model;
