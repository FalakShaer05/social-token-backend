const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const upload = require("../config/uploadConfig");
const Common = require("../controllers/Common");

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
    router.route(`/digital-assets/:id`).get(Common.GetArt);

    // Common
    router.route("/countries").get(Common.getCountries);

    return router;
};
