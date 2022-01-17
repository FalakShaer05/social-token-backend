const CollectionModel = require(`./models/CollectionModel`);
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const settings = require("../../server-settings.json");

const controller = {};

controller.GetToken = async function (req, res) {
  const tokenID = req.params.tokenID;
  try {
    if (!tokenID) {
      return res.status(400).send({
        success: false,
        message: "Token id is a required parameter"
      });
    }

    const token = await NFTTokenModel.findOne({ tokenId: tokenID });
    if (token) {
      return res.status(200).send({
        success: true,
        message: "Token retrieved successfully",
        data: token
      });
    }
  } catch (ex) {
    console.log(ex);
    return res.status(500).send({
      success: false,
      message: "error"
    });
  }
};

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

    let data = {
      name: req.body.collection_name,
      thumbnail_image: thumbnail_image,
      timeline_image: timeline_image,
      user: req.user._id
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
      message: "error"
    });
  }
};

controller.updateCollection = async function (req, res) {
  try {
    const thumbnail_image = `${settings.server.serverURL}/${req.files["thumbnail_image"][0].path.replace(/\\/g, "/")}`;
    const timeline_image = `${settings.server.serverURL}/${req.files["timeline_image"][0].path.replace(/\\/g, "/")}`;
    let data = {
      name: req.body.collection_name,
      thumbnail_image: thumbnail_image,
      timeline_image: timeline_image
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

controller.GetCollectionsByUser = async function (req, res) {
  try {
    let collections = await CollectionModel.find({ user: req.params.id });

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

module.exports = controller;
