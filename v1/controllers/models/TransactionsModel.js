const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const {Schema} = mongoose;

const TransactionsModel = Schema({
    tokenLocalId: {type: mongoose.Types.ObjectId, required: true, ref: "NFTToken"},
    nftHash: {type: String, required: true},
    from: {type: JSON, required: false},
    to: {type: JSON, required: false},
    transaction: {type: JSON, required: true},
    transaction_type: {type: String, required: false, default: 'transaction'},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now}
});

TransactionsModel.set("toJSON", {});
const model = mongoose.model(`Transactions`, TransactionsModel);
module.exports = model;
