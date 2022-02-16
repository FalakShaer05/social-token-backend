const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const NFTToken = require(`../controllers/NFTToken`);
const Web3 = require(`../controllers/Web3`);
const upload = require("../config/uploadConfig");

module.exports = function RouterPublic(database, settings) {
    const db = database;
    const auth = _auth();

    router.get(`/login`, auth.isUserAuthenticated, async (req, res) => {
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: req.user
        });
    });

    // Users
    router.route(`/signup`).post(users.AddUser);
    router.route(`/upload/:id`).post(upload.single("img"), users.uploadImage);
    router.route(`/forget-password`).post(users.ForgetPassword);
    router.route(`/forget-password-verify`).post(users.ForgetPasswordVerify);


    // NFT
    router.route(`/token/listed`).get(NFTToken.GetAllNFTTokensForSale);
    router.route(`/token/:tokenID`).get(NFTToken.GetToken);

    // Media Arts
    router.route(`/digital-assets/:artID`).get(NFTToken.GetArt);

    //Web3
    router.route(`/web3/home`).get(Web3.HomeFunction);

    return router;
};
