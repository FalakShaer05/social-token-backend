const NFTTokenModel = require(`./models/NFTTokenModel`);
const settings = require(`../../server-settings`);
const fs = require("fs");

// Preparing IPFS Client
const { create } = require("ipfs-http-client");
const ipfs = create(
  `https://${
    process.env.InfuraIpfsProectId + ":" + process.env.infuraipfsproectsecret
  }@ipfs.infura.io:5001/api/v0`
);

const controller = {};

controller.GetAll = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(400).send({
        success: false,
        message: "User object not found",
      });
    }
    let nfts = await NFTTokenModel.find({ is_traded: true })
      .populate(["collection_id"])
      .exec();
    return res.status(200).send({
      success: true,
      message: "NFT's retrived successfully",
      data: nfts,
    });
  } catch (ex) {
    return res.status(500).send({
      success: false,
      message: ex.message,
    });
  }
};

controller.GetMyAllNFTs = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(400).send({
        success: false,
        message: "User object not found",
      });
    }
    let nfts = await NFTTokenModel.find({ created_by: req.user._id })
      .populate(["collection_id"])
      .exec();
    return res.status(200).send({
      success: true,
      message: "NFT's retrived successfully",
      data: nfts,
    });
  } catch (ex) {
    return res.status(500).send({
      success: false,
      message: ex.message,
    });
  }
};

controller.Create = async function (req, res) {
  try {
    const { path } = req.file;
    const {
      name,
      description,
      external_link,
      collection_id,
      is_private,
      is_traded,
    } = req.body;

    if (!name || !description || !collection_id) {
      return res.status(400).json({
        success: false,
        message: "Name, Description & Collection Id is required",
      });
    }

    fs.readFile(path, "utf8", async function (err, file) {
      if (err) throw err;
      const ipfsData = await ipfs.add(file);
      const ipfsUrl = `https://ipfs.infura.io/ipfs/${ipfsData.path}`;

      let data = {
        name,
        description,
        external_link,
        collection_id,
        is_private: is_private,
        is_traded: is_traded,
        mintable: `${settings.server.serverURL}/${path.replace(/\\/g, "/")}`,
        ipfsUrl: "",
        created_by: req.user._id,
        price: 0,
      };

      const is_exist = await NFTTokenModel.find({
        name: data.name,
        created_by: data.created_by,
      });
      if (is_exist.length > 0) {
        return res.status(400).json({
          success: false,
          message: "NFT with same name already exist",
        });
      }

      let model = new NFTTokenModel(data);
      await model.save();

      const NFTMetaData = JSON.stringify({
        name,
        description,
        external_link,
        image: ipfsUrl,
      });

      const resp = await ipfs.add(NFTMetaData);
      if (!resp) {
        return res.status(400).json({
          success: false,
          message: "Something went wrong please try again later",
        });
      }

      let IPFS_PATH = `https://ipfs.infura.io/ipfs/${resp.path}`;
      await NFTTokenModel.findByIdAndUpdate(model.id, { ipfsUrl: IPFS_PATH });

      let result = await NFTTokenModel.findById(model.id)
        .populate("collection_id")
        .exec();
      return res.status(200).json({
        success: true,
        message: "Token saved successfully",
        data: result,
      });
    });
  } catch (ex) {
    return res.status(500).json({
      success: false,
      message: ex.message,
    });
  }
};

controller.GetOne = async function (req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is required",
      });
    }

    let nft = await NFTTokenModel.findById(id)
      .populate(["collection_id"])
      .exec();
    if (!nft) {
      return res.status(400).send({
        success: false,
        message: "No nft found with this id",
      });
    }

    return res.status(200).send({
      success: true,
      message: "NFT retrived successfully",
      data: nft,
    });
  } catch (ex) {
    return res.status(500).json({
      success: false,
      message: ex.message,
    });
  }
};

module.exports = controller;
