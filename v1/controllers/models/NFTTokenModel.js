const mongoose = require(`mongoose`);

mongoose.Promise = global.Promise;
const {Schema} = mongoose;

const NFTToken = Schema({
    name: {type: String, required: false},
    description: {type: String, required: false},
    image: {type: String, required: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    tags: {type: Array, default: []},
    collection_id: {type: mongoose.Types.ObjectId, required: true, ref: "Collections"},
    user: {type: mongoose.Types.ObjectId, required: true, ref: "Users"}
});

const NFTTokenModel = mongoose.model(`NFTToken`, NFTToken);
module.exports = NFTTokenModel;
