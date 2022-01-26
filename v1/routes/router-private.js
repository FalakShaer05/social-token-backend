const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const Collections = require(`../controllers/Collections`);
const User = require("../controllers/Users");
const Category = require("../controllers/Category");
const authentication = require("../middleware/validateJWT");
const upload = require("../config/uploadConfig");
const uploaderSettings = upload.fields([
  { name: `thumbnail_image`, maxCount: 1 },
  { name: `timeline_image`, maxCount: 1 }
]);

module.exports = function RouterPrivate(database, settings) {
  router.use(authentication.authenticate);

  //NFT Tokens
  router.route("/token").post(upload.single("img"), NFTToken.createToken).get(NFTToken.GetAllNFTTokens);
  router.route("/token/:id").get(NFTToken.GetUserNFTTokens);
  // Collections
  router.post("/createcollection", uploaderSettings, Collections.createCollection);
  router.put("/updatecollection/:id", uploaderSettings, Collections.updateCollection);
  router.get("/collections/:id", Collections.GetCollectionsByUser);

  // Wallet
  router.put("/connect/:id/wallet/:wallet_token", User.connectWallet);

  // Users
  router.route("/traders").get(User.GetTraders);
  router.route("/user/:id").get(User.GetUserProfile).put(User.UpdateUser);
  router.put("/activateuser/:id", User.ActivateUser);
  router.put("/deactivateuser/:id", User.DeactivateUser);

  //Category
  router.route("/category").post(Category.createCategory);
  router.route("/category/:id").put(Category.updateCollection).delete(Category.DeleteCategory);

  return router;
};
