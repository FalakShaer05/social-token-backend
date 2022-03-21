const NFTTokenModel = require(`./models/NFTTokenModel`);
const nftViewerShipModel = require("./models/NFTView");
const CollectionModel = require("./models/CollectionModel");
const categoryModel = require("./models/CategoryModel");
const nftHistoryModel = require("../controllers/models/NFTOwnershipModel");
const nftTransactionsModel = require("../controllers/models/NFTTransactions");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const settings = require(`../../server-settings`);
const fs = require("fs");
const {ethers} = require('ethers');

// Preparing IPFS Client
const {create} = require('ipfs-http-client')
const ipfs = create(`https://${(process.env.InfuraIpfsProectId + ":" + process.env.infuraipfsproectsecret)}@ipfs.infura.io`)

// Importing Artifacts Contracts
const NFT = require('../../artifacts/contracts/NFT.sol/NFT.json')
const Market = require('../../artifacts/contracts/NFTMarket.sol/NFTMarket.json')

const controller = {};

controller.createToken = async function (req, res) {
    try {
        const {path} = req.file;
        const {name, description, tags, collection_id, category_id, is_private, price, is_traded} = req.body;
        if (!name || !description || !collection_id) {
            return res.status(400).json({success: false, message: "Name, Description & Collection Id is required"});
        }

        fs.readFile(path, 'utf8', async function (err, data) {
            if (err) throw err;
            const ipfsData = await ipfs.add(path)
            const ipfsUrl = `https://ipfs.infura.io/ipfs/${ipfsData.path}`

            let saveAble = {
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

            const exist = await NFTTokenModel.find({name: saveAble.name, user: saveAble.user});
            if (exist.length > 0) {
                return res.status(400).json({success: false, message: "NFT with same name already exist"});
            }

            let model = new NFTTokenModel(saveAble);
            await model.save();

            const metaData = JSON.stringify({
                name, description, image: ipfsUrl, id: model.id, collection: collection_id
            })

            const addingMarketData = await ipfs.add(metaData)
            if (!addingMarketData) {
                return res.status(400).json({success: false, message: "Something went wrong please try again later"});
            }

            let saveAblePath = `https://ipfs.infura.io/ipfs/${addingMarketData.path}`;
            await NFTTokenModel.findByIdAndUpdate(model.id, {ipfsUrl: saveAblePath});

            model = await NFTTokenModel.findById(model.id).populate("category").exec();
            return res.status(200).json({
                success: true,
                message: "Token saved successfully",
                data: model
            });
        });
    } catch (ex) {
        return res.status(500).json({
            success: false,
            message: ex.message
        });
    }
};

controller.SellNFT = async function (req, res) {
    try {
        let nft = await NFTTokenModel.findById(req.params.id);
        if (!nft)
            return res.status(404).json({success: false, message: "Found nothing for minting "});
        if (!nft.price)
            return res.status(400).json({success: false, message: "Price is required"});

        let web3 = new web3(new web3.providers.WebsocketProvider('wss://palm-testnet.infura.io/v3/8031b681fe9f440ba9dedc43c6d3e780'));
        let traderAddress = req.body.token;
        
        const walletKey = req.body.walletKey;

        const provider = new ethers.providers.JsonRpcProvider(process.env.rpcProvider)
        const wallet = new ethers.Wallet(walletKey, provider);
        const price = ethers.utils.parseUnits((nft.price).toString(), 'ether');
        const balancePromise = wallet.getBalance();
        let availableBalance = 0;

        await balancePromise.then((balance) => {
            availableBalance = balance
        });

        if (price > availableBalance && availableBalance === 0) {
            return res.status(400).json({success: false, message: "Insufficient funds, Please recharge your wallet before transcation"});
        }

        let contract = new ethers.Contract(process.env.nftaddress, NFT.abi, wallet);
        let transaction = await contract.createToken(nft.ipfsUrl)
        let tx = await transaction.wait()
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        contract = new ethers.Contract(process.env.nftmarketaddress, Market.abi, wallet)
        let listingFee = await contract.getlistingFee()
        listingFee = listingFee.toString()

        transaction = await contract.createMarketItem(process.env.nftaddress, tokenId, price, {value: listingFee})
        await transaction.wait()

        let transactionSaveAble = {
            tokenId: nft._id,
            nftTokenId: tokenId,
            transaction: transaction,
            transaction_type: 'minted'
        };

        const transactionHistory = new nftTransactionsModel(transactionSaveAble);
        await transactionHistory.save();

        nft.is_private = false;
        nft.tokenID = tokenId;
        nft.transaction = transactionHistory._id;
        await nft.save();

        return res.status(200).json({success: true, message: `${nft.name} nft is now public`});
    } catch (ex) {
        console.log(ex)
        return res.status(502).json({success: false, message: ex.message});
    }
};

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
        if (!token)
            return res.status(404).send({success: false, message: `NFT not found`});

        let transactions = await nftTransactionsModel.find({tokenId: token._id}).exec();

        if (req.user) {
            let exist = await nftViewerShipModel.findOne({user: req.user._id, token: token.id});
            if (!exist) {
                let nftview = new nftViewerShipModel({user: req.user._id, token: token.id});
                await nftview.save();
                token.views++;
            }
        }
        await token.save();

        return res.status(200).send({
            success: true,
            message: "Token retrieved successfully",
            data: token,
            transactions: transactions
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
        const tokens = await NFTTokenModel.find({user: req.params.id});
        return res.status(200).json({
            success: true,
            message: "Token retrieved successfully",
            data: tokens,
        });
    } catch (ex) {
        return res.status(502).json({
            success: false,
            message: ex.message
        });
    }
};

controller.GetAllNFTTokens = async function (req, res) {
    if (req.query.is_trending) {
        try {
            let limit = 20;
            let filter = {is_private: false};
            if (req.query.category) {
                filter.category = req.query.category;
            }

            if (req.query.name) {
                filter.name = {$regex: req.query.name};
            }

            const tokens = await NFTTokenModel.find(filter).limit(limit);

            return res.status(200).json({
                success: true,
                message: "Trending tokens retrieved successfully",
                data: {next: false, tokens}
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
        let filter = {is_private: false};

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
            filter.name = {$regex: req.query.name};
        }

        if (req.query.collection) {
            filter.collection_id = req.query.collection;
        }
        const tokens = await NFTTokenModel.find(filter)
            .skip(pageNumber > 0 ? (pageNumber - 1) * limit : 0)
            .limit(limit);

        let numberOfPages = await NFTTokenModel.count(filter);
        numberOfPages = Math.ceil(numberOfPages / limit);

        return res.status(200).json({
            success: true,
            message: "Token retrieved successfully",
            data: {next: pageNumber < numberOfPages ? true : false, tokens},
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
        let history = await nftHistoryModel.find({token: req.params.id});
        return res.status(200).json({
            success: true,
            message: history
        });
    } catch (ex) {
        return res.status(502).json({
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
        const {name, description, tags, collection_id, category_id, price, is_private} = req.body;
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

        let nft = await NFTTokenModel.findByIdAndUpdate(req.params.id, data, {useFindAndModify: false, new: true});
        return res.status(200).json({
            success: true,
            message: "Token saved successfully",
            data: nft
        });
    } catch (ex) {
        return res.status(500).json({success: false, message: ex.message});
    }
};

controller.seedTokens = async function (req, res) {
    try {
        if (req.query.delete_previous) {
            await NFTTokenModel.collection.drop();
        }

        const {path} = req.file;
        const allcollections = await CollectionModel.find();
        const allcategories = await categoryModel.find();
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

controller.BuyNFT = async function (req, res) {
    try {
        const wallet_auth_token = req.body.wallet_auth_token;
        let nfthistory = new nftHistoryModel();
        let nft = await NFTTokenModel.findById(req.params.id);
        nft.is_private = true;
        let prevOwner = nft.user;
        nfthistory.owner = prevOwner;
        nfthistory.token = nft.id;
        await nfthistory.save();
        nft.user = req.user._id;
        nft.owners++;
        await nft.save();

        return res.status(200).json({success: true, message: `${nft.name} sold to ${req.user.username}`});
    } catch (ex) {
        return res.status(502).json({success: false, message: ex.message});
    }
};

module.exports = controller;
