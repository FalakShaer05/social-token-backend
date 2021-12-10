const NFTTokenModel = require(`./models/NFTTokenModel`);
const fileSystem = require('fs');
const path = require('path');
const mime = require('mime-types');

const controller = {};

controller.GetToken = async function (req, res) {
    const tokenID = req.params.tokenID;
    try {
        if (!tokenID) {
            return res.status(400).send({
                status: "error",
                error: "Token id is a required parameter",
            });
        }

        const token = await NFTTokenModel.findOne({tokenId: tokenID})
        if (token) {
            return res.status(200).send({
                status: "sucess",
                message: "Token retrieved successfully",
                data: token
            });
        }
    } catch (ex) {
        console.log(ex)
        return res.status(500).send({
            status: "error",
            error: "server internal error",
            message: ex,
        });
    }
};

controller.GetArt = async function (req, res) {
    const artID = req.params.artID;
    try {
        if (!artID) {
            return res.status(400).send({
                status: "error",
                error: "Art id is a required parameter",
            });
        }

        let filePath = path.resolve(__dirname, `../digital-assets/${artID}`)
        let stat = fileSystem.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': mime.lookup(filePath),
            'Content-Length': stat.size
        });

        let readStream = fileSystem.createReadStream(filePath);
        readStream.pipe(res);
    } catch (ex) {
        console.log(ex)
        return res.status(500).send({
            status: "error",
            error: "server internal error",
            message: ex,
        });
    }
};

controller.createToken = async function (req, res) {
    const {filename} = req.file;
    const {tokenId, name, description} = req.body;

    try {
        let data = {
            name,
            description,
            image: req.protocol + "://" + req.get("host") + "/v1/arts/" + filename,
        };

        const model = new NFTTokenModel(data);
        const promise = await model.save();

        if (promise) {
            let fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl + "/" + tokenId;
            return res.status(200).send({
                status: "sucess",
                message: "Token retrieved successfully",
                data: fullUrl
            });
        }
    } catch (ex) {
        return res.status(500).send({
            status: "error",
            error: ex,
        });
    }
};

module.exports = controller;
