const TransactionsModel = require(`./models/TransactionsModel`);
const NFTTokenModel = require(`./models/NFTTokenModel`);

const controller = {};

controller.Create = async function (req, res) {
  try {
    const nft_id = req.params.id;
    const { nftHash, transaction, transaction_type, price } = req.body;

    if (!nftHash || !transaction || !transaction_type || !price) {
      return res.status(400).json({
        success: false,
        message: "NFT Hash, Transcation Object & Transcation Type is required",
      });
    }

    let saveable = new TransactionsModel({
      tokenLocalId: nft_id,
      nftHash: nftHash,
      transaction: transaction,
      transaction_type: transaction_type
    })

    let result = await saveable.save();
    if(result) {
      await NFTTokenModel.findOneAndUpdate({_id: nft_id} , {is_minted: true, is_traded: true, price: price}).exec();
      return res.status(200).json({
        success: true,
        message: "Transaction stored",
        data: result,
      });
    }
  } catch (ex) {
    return res.status(500).json({
      success: false,
      message: ex.message,
    });
  }
};

module.exports = controller;
