const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const NFTToken = require(`../controllers/NFTToken`);
const upload = require("../config/uploadConfig");
const Category = require("../controllers/Category");
const Collections = require("../controllers/Collections");
const authentication = require("../middleware/validateJWT");

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
  router.get("/user/:id", users.GetOtherUserProfile);
  router.route(`/upload/:id`).post(upload.single("img"), users.uploadImage);
  router.route(`/forget-password`).post(users.ForgetPassword);
  router.route(`/forget-password-verify`).post(users.ForgetPasswordVerify);

  // NFT
  router.route(`/get-token/:id`).get(authentication.authenticateOptional, NFTToken.GetToken);
  // Media Arts
  router.route(`/digital-assets/:id`).get(NFTToken.GetArt);

  router.route("/category").get(Category.GetAllCategories);
  router.route("/category/:id").get(Category.GetCategory);

  router.get("/collections", Collections.GetCollections);
  router.route("/tokens").get(authentication.authenticateOptional, NFTToken.GetAllNFTTokens);
  router.get("/history/:id", NFTToken.GetNFTHistory);

  return router;
};
