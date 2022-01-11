const CollectionModel = require(`./models/CollectionModel`);
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");

const controller = {};

controller.GetToken = async function (req, res) {
  const tokenID = req.params.tokenID;
  try {
    if (!tokenID) {
      return res.status(400).send({
        success: false,
        error: "Token id is a required parameter"
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
      error: "server internal error",
      message: ex
    });
  }
};

controller.GetArt = async function (req, res) {
  const artID = req.params.artID;
  try {
    if (!artID) {
      return res.status(400).send({
        success: false,
        error: "Art id is a required parameter"
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
      error: "server internal error",
      message: ex
    });
  }
};

controller.createCollection = async function (req, res) {
  try {
    let data = {
      name: req.body.collection_name,
      thumbnail_image: req.files["thumbnail_image"][0].path,
      timeline_image: req.files["timeline_image"][0].path,
      user: req.user._id
    };
    const model = new CollectionModel(data);
    await model.save();
    return res.status(200).json({
      success: true,
      message: "Collection saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      error: ex.message
    });
  }
};

controller.updateCollection = async function (req, res) {
  try {
    let data = {
      name: req.body.collection_name,
      thumbnail_image: req.files["thumbnail_image"][0].path,
      timeline_image: req.files["timeline_image"][0].path
    };
    const model = await CollectionModel.findByIdAndUpdate(req.params.id, data, { new: true });

    return res.status(200).json({
      success: true,
      message: "Collection saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      error: ex.message
    });
  }
};

controller.GetCollectionsByUser = async function (req, res) {
  try {
    let collections = await CollectionModel.find({ user: req.params.id });

    return res.status(200).json({
      success: true,
      data: collections
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      error: ex.message
    });
  }
};

module.exports = controller;
