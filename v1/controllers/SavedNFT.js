const SavedNFTModel = require(`./models/SavedNFT`);

const controller = {};

controller.saveNFT = async function (req, res) {
  try {
    const {token, userId} = req.body;
    const tokenData = await SavedNFTModel.findOne({token, userId}).exec();
    if (tokenData) {
      await SavedNFTModel.deleteOne({token, userId});
      return res
        .status(200)
        .json({success: true, message: "NFT Token removed Successfully"});
    } else {
      const savedNft = new SavedNFTModel({token, userId});
      await savedNft.save();
      return res
        .status(200)
        .json({success: true, message: "NFT Token saved Successfully"});
    }
  } catch (ex) {
    return res.status(502).json({success: false, message: "error"});
  }
};

controller.getSavedNFT = async function (req, res) {
  try {
    const tokenData = await SavedNFTModel.find({userId: req.params.id}).exec();
    return res
      .status(200)
      .json({
        success: true,
        message: "Saved NFT Fetched Successfully",
        data: tokenData,
      });
  } catch (ex) {
    return res.status(502).json({success: false, message: "error"});
  }
};

module.exports = controller;
