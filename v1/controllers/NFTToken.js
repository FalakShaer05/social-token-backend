const NFTTokenModel = require(`./models/NFTTokenModel`);
const UserModel = require("./models/UsersModel");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const settings = require(`../../server-settings`);
const Usermodel = require("./models/UsersModel");

const controller = {};

controller.GetToken = async function (req, res) {
  const tokenID = req.params.id;
  try {
    if (!tokenID) {
      return res.status(400).send({
        success: false,
        message: "Token id is a required parameter"
      });
    }

    const token = await NFTTokenModel.findById(tokenID).populate(["user", "collection_id"]).exec();
    if (token) {
      return res.status(200).send({
        success: true,
        message: "Token retrieved successfully",
        data: token
      });
    }
  } catch (ex) {
    return res.status(500).send({
      success: false,
      message: ex.message
    });
  }
};

controller.GetArt = async function (req, res) {
  const artID = req.params.id;
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
    return res.status(500).send({
      success: false,
      message: ex.message
    });
  }
};

controller.GetUserNFTTokens = async function (req, res) {
  try {
    const tokens = await NFTTokenModel.find({ user: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Token retrieved successfully",
      data: tokens
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.GetAllNFTTokens = async function (req, res) {
  if (req.query.is_trending) {
    try {
      let limit = 20;
      let filter = { is_private: false };
      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.name) {
        filter.name = { $regex: req.query.name };
      }

      const tokens = await NFTTokenModel.find(filter).limit(limit);

      return res.status(200).json({
        success: true,
        message: "Trending tokens retrieved successfully",
        data: { next: false, tokens }
      });
    } catch (ex) {
      return res.status(502).json({
        success: false,
        message: ex.message
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

    if (req.query.collection) {
      filter.collection_id = req.query.collection;
    }

    const tokens = await NFTTokenModel.find(filter)
      .skip(pageNumber > 0 ? (pageNumber - 1) * limit : 0)
      .limit(limit);

    let numberOfPages = await NFTTokenModel.count(filter);
    numberOfPages = Math.ceil(numberOfPages / limit);

    return res.status(200).json({
      success: true,
      message: "Token retrieved successfully",
      data: { next: pageNumber < numberOfPages ? true : false, tokens }
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.createToken = async function (req, res) {
  try {
    const { path } = req.file;
    const { name, description, tags, collection_id, category_id, is_private, price, is_traded } = req.body;
    if (!name || !description || !collection_id) {
      return res.status(400).json({ success: false, message: "Name, Description & Collection Id is required" });
    }

    let data = {
      name,
      description,
      tags,
      is_private: is_private,
      collection_id,
      image: `${settings.server.serverURL}/${path.replace(/\\/g, "/")}`,
      share_url: `${settings.server.siteURL}/${path.replace(/\\/g, "/")}`,
      user: req.user._id,
      category: category_id,
      price: price,
      is_traded: is_traded
    };

    const exist = await NFTTokenModel.find({ name: data.name, user: data.user });
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "NFT with same name already exist" });
    }

    let model = new NFTTokenModel(data);
    await model.save();
    model = await NFTTokenModel.findById(model.id).populate("category").exec();
    return res.status(200).json({
      success: true,
      message: "Token saved successfully",
      data: model
    });
  } catch (ex) {
    return res.status(500).json({
      success: false,
      message: ex.message
    });
  }
};

controller.SellNFT = async function (req, res) {
  try {
    let nft = await NFTTokenModel.findById(req.params.id);
    return res.status(200).json({ success: true, message: `${nft.name} nft is now public` });
  } catch (ex) {
    return res.status(502).json({ success: false, message: ex.message });
  }
};

controller.BuyNFT = async function (req, res) {
  try {
    const wallet_auth_token = req.body.wallet_auth_token;
    // const user = await Usermodel.findOne({ wallet_auth_token: wallet_auth_token });
    let nft = await NFTTokenModel.findById(req.params.id);
    nft.is_private = true;
    await nft.save();
    return res.status(200).json({ success: true, message: `${nft.name} sold to ${req.user.username}` });
  } catch (ex) {
    return res.status(502).json({ success: false, message: ex.message });
  }
};

module.exports = controller;
