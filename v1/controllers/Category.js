const CategoryModel = require(`./models/CategoryModel`);
const CollectionModel = require(`./models/CollectionModel`);
const NFTTokenModel = require(`./models/NFTTokenModel`);

const controller = {};

controller.GetCategory = async function (req, res) {
  try {
    if (!req.params.id) {
      return res.status(400).send({
        success: false,
        message: "Category id is a required parameter"
      });
    }

    const category = await CategoryModel.findById(req.params.id);
    return res.status(200).send({
      success: true,
      message: "Category retrieved successfully",
      data: category
    });
  } catch (ex) {
    return res.status(500).send({
      success: false,
      message: ex.message
    });
  }
};

controller.createCategory = async function (req, res) {
  try {
    let data = {
      name: req.body.name,
      description: req.body.description
    };

    const exist = await CategoryModel.find({ name: data.name });
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "Category already exist" });
    }

    const category = new CategoryModel(data);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category saved successfully",
      data: category
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: "error"
    });
  }
};

controller.updateCollection = async function (req, res) {
  try {
    let data = {
      name: req.body.name,
      description: req.body.description
    };
    const model = await CategoryModel.findByIdAndUpdate(req.params.id, data, { new: true, useFindAndModify: false });

    return res.status(200).json({
      success: true,
      message: "Category saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: "error"
    });
  }
};

controller.DeleteCategory = async function (req, res) {
  try {
    let category = await CategoryModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Deleted"
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.GetAllCategories = async function (req, res) {
  try {
    let categories = await CategoryModel.find();

    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.GetCollectionByCategory = async function (req, res) {
  try {
    const {id} = req.params
    let collection = await CollectionModel.findOne({category_id: id});
    if(!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    let nfts = await NFTTokenModel.find({collection_id: collection._id})
    return res.status(200).json({
      success: true,
      message: "NFT's retrived",
      data: nfts
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

module.exports = controller;
