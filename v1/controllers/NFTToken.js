const NFTTokenModel = require(`./models/NFTTokenModel`);
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");

const controller = {};

controller.GetToken = async function (req, res) {
  const tokenID = req.params.tokenID;
  try {
    if (!tokenID) {
      return res.status(400).send({
        status: "error",
        error: "Token id is a required parameter"
      });
    }

    const token = await NFTTokenModel.findOne({ tokenId: tokenID });
    if (token) {
      return res.status(200).send({
        status: "sucess",
        message: "Token retrieved successfully",
        data: token
      });
    }
  } catch (ex) {
    console.log(ex);
    return res.status(500).send({
      status: "error",
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
        status: "error",
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
      status: "error",
      error: "server internal error",
      message: ex
    });
  }
};

controller.GetUserNFTTokens = async function (req, res) {
  try {
    const tokens = await NFTTokenModel.find({ user: req.user._id });

    return res.status(200).json({
      status: "success",
      message: "Token retrieved successfully",
      data: tokens
    });
  } catch (ex) {
    return res.status(502).json({
      status: "error",
      message: ex.message
    });
  }
};

controller.createToken = async function (req, res) {
  try {
    const { path } = req.file;
    const { name, description } = req.body;
    let data = {
      name,
      description,
      image: `${req.protocol}://${req.get("host")}/${path.replace(/\\/g, "/")}`,
      user: req.user._id
    };

    const model = new NFTTokenModel(data);
    await model.save();

    return res.status(200).json({
      status: "sucess",
      message: "Token saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(500).json({
      status: "error",
      error: ex.message
    });
  }
};

module.exports = controller;
