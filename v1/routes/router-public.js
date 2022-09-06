const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const NFTToken = require(`../controllers/NFTToken`);
const upload = require("../config/uploadConfig");
const Common = require("../controllers/Common");
const privacy = require("../controllers/PrivacyPolicy")

module.exports = function RouterPublic(database, settings) {
    const db = database;
    const auth = _auth();

    // Auth
    router.get(`/login`, auth.isUserAuthenticated, async (req, res) => {
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: req.user
        });
    });
    router.route(`/signup`).post(users.AddUser);
    router.route(`/upload/:id`).post(upload.single("img"), users.uploadImage);
    router.route(`/forget-password`).post(users.ForgetPassword);
    router.route(`/forget-password-verify`).post(users.ForgetPasswordVerify);

    // Media Arts
    router.route(`/digital-assets/:artID`).get(Common.GetArt);

    // Common
    router.route("/countries").get(Common.getCountries);
    

    //NFT Share View
    router.get("/nft/shareview/:id", NFTToken.NftShareView);
    router.get("/send/shareview/:nft_id", NFTToken.NftSendShareView);
    //router.get("/sharedviews", NFTToken.NftGetSharedView);
    router.get("/privacy",privacy.privacyPolicy)

    return router;
};
