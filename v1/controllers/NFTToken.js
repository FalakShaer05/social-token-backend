const NFTTokenModel = require(`./models/NFTTokenModel`);
const Usermodel = require("./models/UsersModel");
const nftviewershipmodel = require("./models/NFTView");
const CollectionModel = require("./models/CollectionModel");
const categorymodel = require("./models/CategoryModel");
const nfthistorymodel = require("../controllers/models/NFTOwnershipModel");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const settings = require(`../../server-settings`);

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

    let token = await NFTTokenModel.findById(tokenID).populate(["user", "collection_id", "created_by"]).exec();

    if (!token) {
      return res.status(404).send();
    }
    if (req.user) {
      let exist = await nftviewershipmodel.findOne({ user: req.user._id, token: token.id });
      if (!exist) {
        let nftview = new nftviewershipmodel({ user: req.user._id, token: token.id });
        await nftview.save();
        token.views++;
      }
    }
    await token.save();

    return res.status(200).send({
      success: true,
      message: "Token retrieved successfully",
      data: token
    });
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
  if (req.query.earnings) {
    try {
      const tokens = await nfthistorymodel.find({owner: req.user._id});

      return res.status(200).json({
        success: true,
        message: "Earnings retrieved successfully",
        data: tokens
      });
    } catch (ex) {
      return res.status(503).json({
        success: false,
        message: ex.message
      });
    }
  }

  if (req.query.is_top_ranked) {
    try {
      let filter = { is_private: false };
      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.name) {
        filter.name = { $regex: req.query.name };
      }

      const tokens = await NFTTokenModel.findOne(filter).populate("created_by").exec();

      return res.status(200).json({
        success: true,
        message: "Top token retrieved successfully",
        data: { tokens }
      });
    } catch (ex) {
      return res.status(502).json({
        success: false,
        message: ex.message
      });
    }
  }

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

      const tokens = await NFTTokenModel.find(filter).limit(limit).populate("created_by").exec();

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
      if (req.user && req.user._id == req.query.user) {
        delete filter["is_private"];
      }
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
      .limit(limit)
      .populate("created_by")
      .exec();

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

controller.GetNFTHistory = async function (req, res) {
  try {
    let filters = { token: req.params.id };
    if (req.query.date) {
      filters.created = {
        $gte: dayjs(req.query.date, "DD-MM-YYYY").utc(true).startOf("day").toDate(),
        $lte: dayjs(req.query.date, "DD-MM-YYYY").utc(true).endOf("day").toDate()
      };
    }

    let history = await nfthistorymodel.find(filters).populate({ path: "token", populate: "collection_id" });
    return res.status(200).json({
      success: true,
      data: history
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
      created_by: req.user._id,
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

controller.updateToken = async function (req, res) {
  try {
    const record = await NFTTokenModel.findById(req.params.id);
    let path = null;
    if (req.file) {
      path = req.file.path;
    }
    const { name, description, tags, collection_id, category_id, price, is_private } = req.body;
    let data = {
      name: name || record.name,
      description: description || record.description,
      tags: tags || record.tags,
      is_private: is_private,
      collection_id: collection_id || record.collection_id,
      category: category_id || record.category,
      image: path ? `${settings.server.serverURL}/${path.replace(/\\/g, "/")}` : record.image,
      share_url: path ? `${settings.server.siteURL}/${path.replace(/\\/g, "/")}` : record.share_url,
      price: price || record.price,
      editions: record.editions + 1
    };

    let nft = await NFTTokenModel.findByIdAndUpdate(req.params.id, data, { useFindAndModify: false, new: true });
    return res.status(200).json({
      success: true,
      message: "Token saved successfully",
      data: nft
    });
  } catch (ex) {
    return res.status(500).json({ success: false, message: ex.message });
  }
};

controller.seedTokens = async function (req, res) {
  try {
    if (req.query.delete_previous) {
      await NFTTokenModel.collection.drop();
    }

    const { path } = req.file;
    const allcollections = await CollectionModel.find();
    const allcategories = await categorymodel.find();
    for (const collection of allcollections) {
      for (const category of allcategories) {
        for (let i = 0; i < 3; i++) {
          let data = {
            name: `test token ${i}${collection._id}${category._id}`,
            description: `test description ${i}${collection._id}${category._id}`,
            tags: [`${collection.name}`, `${category.name}`],
            is_private: false,
            collection_id: collection._id,
            image: `${settings.server.serverURL}/${path.replace(/\\/g, "/")}`,
            share_url: `${settings.server.siteURL}/${path.replace(/\\/g, "/")}`,
            user: req.user._id,
            created_by: req.user._id,
            category: category._id,
            price: Math.floor(Math.random() * 100) + 1,
            is_traded: false
          };

          const nft = new NFTTokenModel(data);
          await nft.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Seed success"
    });
  } catch (ex) {
    return res.status(502).json({
      success: false,
      message: ex.message
    });
  }
};

controller.SellNFT = async function (req, res) {
  try {
    let nft = await NFTTokenModel.findById(req.params.id);
    nft.is_private = false;
    await nft.save();
    return res.status(200).json({ success: true, message: `${nft.name} nft is now public` });
  } catch (ex) {
    return res.status(502).json({ success: false, message: ex.message });
  }
};

controller.BuyNFT = async function (req, res) {
  try {
    const wallet_auth_token = req.body.wallet_auth_token;
    let nfthistory = new nfthistorymodel();
    let nft = await NFTTokenModel.findById(req.params.id);
    nft.is_private = true;
    let prevOwner = nft.user;
    nfthistory.owner = prevOwner;
    nfthistory.token = nft.id;
    nfthistory.amount = nft.price;
    await nfthistory.save();
    nft.user = req.user._id;
    nft.owners++;
    await nft.save();

    return res.status(200).json({ success: true, message: `${nft.name} sold to ${req.user.username}` });
  } catch (ex) {
    return res.status(502).json({ success: false, message: ex.message });
  }
};

module.exports = controller;
