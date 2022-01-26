const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const Category = Schema({
  name: { type: String, required: true },
  description: { type: String, required: false }
});

const CategoryModel = mongoose.model(`Category`, Category);
module.exports = CategoryModel;
