const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const User = require("../controllers/Users");
const authentication = require("../middleware/validateJWT");
const upload = require("../config/uploadConfig");
const RequestsModel = require("../controllers/models/RequestRecord");

module.exports = function RouterPrivate(database, settings) {
  router.use(authentication.authenticate);

  router.post("/token", upload.single("img"), NFTToken.createToken);
  router.put("/connect/:id/wallet/:wallet_token", User.connectWallet);
  router.route("/traders").get(User.GetTraders);

  return router;
};
