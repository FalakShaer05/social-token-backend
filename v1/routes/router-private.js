const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const Collections = require(`../controllers/Collections`);
const User = require("../controllers/Users");
const authentication = require("../middleware/validateJWT");
const upload = require("../config/uploadConfig");
const uploaderSettings = upload.fields([
  { name: `thumbnail_image`, maxCount: 1 },
  { name: `timeline_image`, maxCount: 1 }
]);

module.exports = function RouterPrivate(database, settings) {
  router.use(authentication.authenticate);

  router.post("/token", upload.single("img"), NFTToken.createToken);
  router.post("/createcollection", uploaderSettings, Collections.createCollection);
  router.put("/updatecollection/:id", uploaderSettings, Collections.updateCollection);
  router.put("/connect/:id/wallet/:wallet_token", User.connectWallet);
  router.route("/traders").get(User.GetTraders);
  router.route("/user/:id").get(User.GetUserByID).put(User.UpdateUser);
  router.put("/activateuser/:id", User.ActivateUser);
  router.put("/deactivateuser/:id", User.DeactivateUser);

  return router;
};
