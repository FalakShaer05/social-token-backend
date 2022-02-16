const NFTTokenModel = require(`./models/NFTTokenModel`);
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const axios = require('axios');
const settings = require(`../../server-settings`);
const {ethers} = require('ethers');
const fs = require("fs");

// Preparing IPFS Client
const {urlSource, create} = require('ipfs-http-client')
const ipfs = create('https://ipfs.infura.io:5001/api/v0')

// Importing Artifacts Contracts
const NFT = require('../../artifacts/contracts/NFT.sol/NFT.json')
const Market = require('../../artifacts/contracts/NFTMarket.sol/NFTMarket.json')

const controller = {};

controller.GetToken = async function (req, res) {
    const tokenID = req.params.tokenID;
    try {
        if (!tokenID) {
            return res.status(400).send({
                success: false,
                message: "Token id is a required parameter"
            });
        }

        const token = await NFTTokenModel.findOne({tokenId: tokenID});
        if (token) {
            return res.status(200).send({
                success: true,
                message: "Token retrieved successfully",
                data: token
            });
        }
    } catch (ex) {
        console.log(ex);
        return res.status(500).send({
            success: false,
            message: "error"
        });
    }
};

controller.GetArt = async function (req, res) {
    const artID = req.params.artID;
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
            message: "error"
        });
    }
};

controller.GetAllNFTTokensForSale = async function (req, res) {
    try {
        /* create a generic provider and query for unsold market items */
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com")
        const tokenContract = new ethers.Contract(settings.NFTStoreConfig.nftaddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(settings.NFTStoreConfig.nftmarketaddress, Market.abi, provider)
        const data = await marketContract.fetchMarketItems()

        /*
        *  map over items returned from smart contract and format
        *  them as well as fetch their token metadata
        */
        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description,
            }
            return item
        }))

        return res.status(200).json({
            success: true,
            message: "Token retrieved successfully",
            data: items
        });
    } catch (ex) {
        console.log(ex)
        return res.status(502).json({
            success: false,
            message: "error"
        });
    }
};

controller.GetUserCreatedNFTTokens = async function (req, res) {
    try {
        const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com")
        const signer = new ethers.VoidSigner(walletAddress, provider)

        const marketContract = new ethers.Contract(settings.NFTStoreConfig.nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(settings.NFTStoreConfig.nftaddress, NFT.abi, provider)
        const data = await marketContract.fetchItemsCreated()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return item
        }))

        return res.status(200).json({
            success: true,
            message: "Token retrieved successfully",
            data: items
        });
    } catch (ex) {
        console.log(ex)
        return res.status(502).json({
            success: false,
            message: "error"
        });
    }
};

controller.GetUserOwnedNFTTokens = async function (req, res) {
    try {
        const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com")
        const signer = new ethers.VoidSigner(walletAddress, provider)

        const marketContract = new ethers.Contract(settings.NFTStoreConfig.nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(settings.NFTStoreConfig.nftaddress, NFT.abi, provider)
        const data = await marketContract.fetchMyNFTs()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return item
        }))

        return res.status(200).json({
            success: true,
            message: "Token retrieved successfully",
            data: items
        });
    } catch (ex) {
        console.log(ex)
        return res.status(502).json({
            success: false,
            message: "error"
        });
    }
};

controller.createToken = async function (req, res) {
    try {
        const {path} = req.file;
        const {name, description, tags, collection_id} = req.body;
        if (!name || !description || !collection_id) {
            return res.status(400).json({success: false, message: "Name, Description & Collection Id is required"});
        }
        fs.readFile(path, 'utf8', async function (err, data) {
            if (err) throw err;
            const ipfsData = await ipfs.add(data)
            const ipfsUrl = `https://ipfs.infura.io/ipfs/${ipfsData.path}`

            const metaData = JSON.stringify({
                name, description, image: ipfsUrl
            })

            const addingMarketData = await ipfs.add(metaData)
            if (!addingMarketData) {
                return res.status(400).json({success: false, message: "Something went wrong please try again later"});
            }

            let saveAble = {
                name,
                description,
                tags,
                collection_id,
                image: `${settings.server.serverURL}/${path.replace(/\\/g, "/")}`,
                ipfsUrl: `https://ipfs.infura.io/ipfs/${addingMarketData.path}`,
                user: req.user._id
            };

            const model = new NFTTokenModel(saveAble);
            await model.save().then(doc => {
                return res.status(200).json({
                    success: true,
                    message: "Token saved successfully",
                    data: doc
                });
            }).catch(err => {
                return res.status(500).json({success: false, message: "Something went wrong please try again later"});
            });


        });
    } catch (ex) {
        return res.status(500).json({
            success: false,
            message: "error"
        });
    }
};

controller.listForSale = async function (req, res) {
    try {
        const {price, _id} = req.body;
        if (!price || !_id) {
            return res.status(400).json({success: false, message: "Price & Art Id is required"});
        }

        let mintAble = await NFTTokenModel.findOne({_id: _id})
        if (!mintAble) {
            return res.status(404).json({success: false, message: "Art not found for minting "});
        }

        const privateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com")
        const wallet = new ethers.Wallet(privateKey, provider);
        const listingPrice = ethers.utils.parseUnits(price.toString(), 'ether');
        let availableBalance = 0;

        const balancePromise = wallet.getBalance();
        await balancePromise.then((balance) => {
            availableBalance = balance
        });

        if (listingPrice > availableBalance && availableBalance === 0) {
            return res.status(400).json({success: false, message: "Insufficient funds, Please recharge your wallet before transcation"});
        }

        /* next, create the item */
        let contract = new ethers.Contract(settings.NFTStoreConfig.nftaddress, NFT.abi, wallet);
        let transaction = await contract.createToken(mintAble.ipfsUrl)
        let tx = await transaction.wait()
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()

        /* then list the item for sale on the marketplace */
        contract = new ethers.Contract(settings.NFTStoreConfig.nftmarketaddress, Market.abi, wallet)
        let listingFee = await contract.getListingPrice()
        listingFee = listingFee.toString()

        transaction = await contract.createMarketItem(settings.NFTStoreConfig.nftaddress, tokenId, listingPrice, {value: listingFee})
        await transaction.wait()

        let updateStatus = await NFTTokenModel.updateOne({_id: _id}, {is_public: true})
        if (!updateStatus) {
            return res.status(500).json({success: false, message: "Something went wrong. Please try again later"});
        }

        return res.status(200).json({success: true, message: "Art minted successfully"});
    } catch (ex) {
        console.log(ex)
        return res.status(500).json({
            success: false,
            message: "error"
        });
    }
};

module.exports = controller;
