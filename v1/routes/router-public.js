const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const NFTToken = require(`../controllers/NFTToken`);
const upload = require("../config/uploadConfig");

module.exports = function RouterPublic(database, settings) {
    const db = database;
    const auth = _auth();

    router.get(`/login`, auth.isUserAuthenticated, async (req, res) => {
        res.status(200).json({
            success: true,
            data: req.user
        });
    });

    // Users
    router.route(`/signup`).post(users.AddUser);
    router.route(`/upload`).post(upload.single("img"), users.uploadImage);
    router.route(`/forget-password`).post(users.ForgetPassword);
    router.route(`/forget-password-verify`).post(users.ForgetPasswordVerify);

    // NFT
    router.route(`/token/:tokenID`).get(NFTToken.GetToken);

    // Media Arts
    router.route(`/digital-assets/:artID`).get(NFTToken.GetArt);

    return router;
};
