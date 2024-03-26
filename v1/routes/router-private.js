const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const Collections = require(`../controllers/Collections`);
const User = require("../controllers/Users");
const SavedNFT = require("../controllers/SavedNFT");
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
  router.route("/token").post(upload.single("img"), NFTToken.createToken);
  router.route("/seedtoken").post(upload.single("img"), NFTToken.seedTokens);
  router.route("/token/:id").get(NFTToken.GetUserNFTTokens).put(upload.single("img"), NFTToken.updateToken);
  router.put("/sell-nft/:id", NFTToken.SellNFT);
  router.put("/buy-nft/:id", NFTToken.BuyNFT);

  // Collections
  router.post("/createcollection", uploaderSettings, Collections.createCollection);
  router.post("/seedCollection", uploaderSettings, Collections.seedCollection);
  router.put("/updatecollection/:id", uploaderSettings, Collections.updateCollection);
  router.get("/collection/:id", Collections.GetCollectionDetail);

  // Wallet
  router.put("/connect/:id/wallet/:wallet_token", User.connectWallet);

  // Users
  router.route("/traders").get(User.GetTraders);
  router.route("/user").get(User.GetUserProfile);
  router.route("/user-with-wallet-address").put(User.GetUserWithWalletAddress);
  router.route("/user/:id").patch(upload.single("img"),User.UpdateUser);
  router.route("/update-wallet-address/:id").patch(User.UpdateUserWalletAddress);
  router.route("/user-update-password/:id").put(User.UpdateUserPassword);
  router.route("/save-nft").post(SavedNFT.saveNFT);
  router.route("/get-save-nft/:id").get(SavedNFT.getSavedNFT);

  router.put("/activateuser/:id", User.ActivateUser);
  router.put("/deactivateuser/:id", User.DeactivateUser);

  //Category
  router.route("/category").post(Category.createCategory);
  router.route("/category/:id").put(Category.updateCollection).delete(Category.DeleteCategory);

  return router;
};
