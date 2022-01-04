const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const NFTToken = require(`../controllers/NFTToken`);
const RequestsModel = require("../controllers/models/RequestRecord");

module.exports = function RouterPublic(database, settings) {
  const db = database;
  const auth = _auth();

  router.get(`/login`, auth.isUserAuthenticated, async (req, res) => {
    res.status(200).json({
      status: `success`,
      message: `Login successful!`,
      data: req.user
    });
  });

  router.route(`/signup`).post(users.AddUser);
  router.route(`/forget-password`).post(users.ForgetPassword);
  router.route(`/token/:tokenID`).get(NFTToken.GetToken);
  router.route(`/arts/:artID`).get(NFTToken.GetArt);

  return router;
};
