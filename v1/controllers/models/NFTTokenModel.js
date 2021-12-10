const mongoose = require(`mongoose`)

mongoose.Promise = global.Promise
const {Schema} = mongoose

const NFTToken = Schema({
    name: {type: String, required: false},
    description: {type: String, required: false},
    image: {type: String, required: true, unique: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
})

const NFTTokenModel = mongoose.model(`NFTToken`, NFTToken)
module.exports = NFTTokenModel
