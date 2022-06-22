const CollectionModel = require(`./models/CollectionModel`);
const NFTTokenModel = require("./models/NFTTokenModel");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const settings = require("../../server-settings.json");

const controller = {};

controller.GetAll = async function (req, res) {
  try {
    if(!req.user){
      return res.status(404).json({success: false, message: "User object not found"});
    }

    let collections = await CollectionModel.find({created_by: req.user._id}).populate("category").exec();
    return res.status(200).json({
      success: true,
      message: "Collections retrieved successfully",
      data: collections
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: "error"
    });
  }
};

controller.Create = async function (req, res) {
  try {
    const thumbnail_image = `${settings.server.serverURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    const timeline_image = `${settings.server.serverURL}/${req.files["timeline_image"][0].path.replace(/\\/g, "/")}`;
    let data = {
      name: req.body.collection_name,
      description: req.body.description,
      thumbnail_image: thumbnail_image,
      timeline_image: timeline_image,
      category_id: req.body.category_id,
      created_by: req.body.created_by,
    };

    const exist = await CollectionModel.find({ created_by: req.user._id, name: data.name });
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "Collection already exist" });
    }

    const collection = new CollectionModel(data);
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection saved successfully",
      data: collection
    });
  } catch (ex) {
    console.log(ex)
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.Update = async function (req, res) {
  try {
    let record = await CollectionModel.findById(req.params.id);
    const thumbnail_image = `${settings.server.serverURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    const timeline_image = `${settings.server.serverURL}/${req.files["timeline_image"][0].path.replace(/\\/g, "/")}`;
    const share_url = `${settings.server.siteURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    let data = {
      name: req.body.collection_name || record.name,
      description: req.body.description || record.description,
      thumbnail_image: thumbnail_image || record.thumbnail_image,
      timeline_image: timeline_image || record.timeline_image,
      category: req.body.category || record.category,
      is_private: req.body.is_private || record.is_private,
      share_url: share_url || record.share_url
    };
    const model = await CollectionModel.findByIdAndUpdate(req.params.id, data, { new: true, useFindAndModify: false });

    return res.status(200).json({
      success: true,
      message: "Collection saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.GetOne = async function (req, res) {
  try {
    let collection = await CollectionModel.findById(req.params.id).lean();
    let nfts = await NFTTokenModel.find({ collection_id: collection._id });
    let other = {
      total_nfts_count: nfts.length,
      total_nft_price: nfts.reduce((acc, curr) => acc + curr.price, 0),
      traded_nft_price: nfts.reduce((acc, curr) => {
        return curr.is_traded ? acc + curr.price : acc;
      }, 0)
    };

    collection = { ...collection, ...other };

    return res.status(200).json({
      success: true,
      message: "Collection retrieved successfully",
      data: collection
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};



module.exports = controller;
