const {create} = require('ipfs-http-client')
const fs = require('fs');

const ipfs = create({
    host: 'https://socialtoken.infura-ipfs.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: 'Bearer SocialToken7@gmail.com:SocialToken2569'
    }
})

const service = {};

service.addfile = async function (req, res) {
    try {

    } catch (ex) {
        return res.status(500).json({
            success: false,
            message: ex.message
        });
    }
};

service.getfile = async function (req, res) {
    try {

    } catch (ex) {
        return res.status(500).json({
            success: false,
            message: ex.message
        });
    }
};

module.exports = service;