const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const {Schema} = mongoose;

const NFTTransactions = Schema({
    tokenId: {type: mongoose.Types.ObjectId, required: true, ref: "NFTToken"},
    nftTokenId: {type: String, required: false},
    transaction: {type: JSON, required: true},
    transaction_type: {type: String, required: false, default: 'transaction'},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
});

NFTTransactions.set("toJSON", {});
const model = mongoose.model(`NFTTransactionsHistory`, NFTTransactions);
module.exports = model;
