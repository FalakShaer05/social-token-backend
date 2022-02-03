const CollectionModel = require(`./models/CollectionModel`);
const NFTTokenModel = require("./models/NFTTokenModel");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const settings = require("../../server-settings.json");

const controller = {};

controller.GetArt = async function (req, res) {
  const artID = req.params.artID;
  try {
    if (!artID) {
      return res.status(400).send({
        success: false,
        message: "Art id is a required parameter"
      });
    }

    let filePath = path.resolve(__dirname, `../digital-assets/${artID}`);
    let stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": mime.lookup(filePath),
      "Content-Length": stat.size
    });

    let readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(res);
  } catch (ex) {
    console.log(ex);
    return res.status(500).send({
      success: false,
      message: "error"
    });
  }
};

controller.createCollection = async function (req, res) {
  try {
    const thumbnail_image = `${settings.server.serverURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    const timeline_image = `${settings.server.serverURL}/${req.files["timeline_image"][0].path.replace(/\\/g, "/")}`;
    const share_url = `${settings.server.siteURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    let data = {
      name: req.body.collection_name,
      thumbnail_image: thumbnail_image,
      timeline_image: timeline_image,
      user: req.body.user,
      category: req.body.category,
      is_private: req.body.is_private,
      share_url: share_url
    };

    const exist = await CollectionModel.find({ user: req.user._id, name: data.name });
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
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.updateCollection = async function (req, res) {
  try {
    const thumbnail_image = `${settings.server.serverURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    const timeline_image = `${settings.server.serverURL}/${req.files["timeline_image"][0].path.replace(/\\/g, "/")}`;
    const share_url = `${settings.server.siteURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    let data = {
      name: req.body.collection_name,
      thumbnail_image: thumbnail_image,
      timeline_image: timeline_image,
      category: req.body.category,
      is_private: req.body.is_private,
      share_url: share_url
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
      message: "error"
    });
  }
};

controller.GetCollectionDetail = async function (req, res) {
  try {
    let collection = await CollectionModel.findById(req.params.id);
    let nfts = await NFTTokenModel.find({ collection_id: collection._id });
    let data = {
      total_nfts_count: nfts.length,
      total_nft_price: nfts.reduce((acc, curr) => acc + curr.price, 0),
      traded_nft_price: nfts.reduce((acc, curr) => {
        return curr.is_traded ? acc + curr.price : acc;
      }, 0)
    };

    data.collection = collection;

    return res.status(200).json({
      success: true,
      message: "Collection retrieved successfully",
      data: data
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.GetCollections = async function (req, res) {
  if (req.query.is_trending) {
    try {
      let limit = 20;
      let filter = { is_private: false };
      if (req.query.category) {
        filter.category = req.query.category;
      }

      let collections = await CollectionModel.find(filter).limit(limit);

      return res.status(200).json({
        success: true,
        message: "Trending collections retrieved successfully",
        data: collections
      });
    } catch (ex) {
      return res.status(502).json({
        success: false,
        message: "error"
      });
    }
  }

  try {
    let pageNumber = req.query.page;
    let limit = 20;
    let filter = { is_private: false };
    if (req.query.user) {
      filter.user = req.query.user;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.name) {
      filter.name = { $regex: req.query.name };
    }

    let collections = await CollectionModel.find(filter)
      .skip(pageNumber > 0 ? (pageNumber - 1) * limit : 0)
      .limit(limit);

    let numberOfPages = await CollectionModel.count(filter);
    numberOfPages = Math.ceil(numberOfPages / limit);

    return res.status(200).json({
      success: true,
      message: "Collections retrieved successfully",
      data: { next: pageNumber < numberOfPages ? true : false, collections }
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: "error"
    });
  }
};

module.exports = controller;
