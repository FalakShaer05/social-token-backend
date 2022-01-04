const mongoose = require(`mongoose`)

mongoose.Promise = global.Promise
const {Schema} = mongoose

const Collection = Schema({
    name: {type: String, required: true},
    thumbnail_image: {type: String, required: false},
    timeline_image: {type: String, required: false},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
})

Collection.pre(`save`, function (callback) {
    const user = this
    user.updated = new Date(Date.now())
})

const model = mongoose.model(`Collections`, Collection)
module.exports = model
