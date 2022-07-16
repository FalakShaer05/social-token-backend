const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const Transaction = require(`../controllers/Transactions`);
const Collections = require(`../controllers/Collections`);
const Category = require("../controllers/Category");
const authentication = require("../middleware/validateJWT");
const upload = require("../config/uploadConfig");

const CollectionMulerSettings = upload.fields([
  { name: `thumbnail_image`, maxCount: 1 },
  { name: `timeline_image`, maxCount: 1 },
]);

module.exports = function RouterPrivate(database, settings) {
  router.use(authentication.authenticate);

  // Get collections by category
  router.get("/collections/category/:id", Category.GetCollectionByCategory);

  // Collections
  router.get("/collections", Collections.GetAll);
  router.get("/collections/:id", Collections.GetOne);
  router.post("/collections", CollectionMulerSettings, Collections.Create);
  router.delete("/collections/:id", Collections.Delete);

  // Category
  router.get("/category", Category.GetAllCategories);
  router.get("/category/:id", Category.GetCategory);
  router.post("/category", Category.createCategory);
  router.delete("/category/:id", Category.DeleteCategory);

  // NFT
  router.get("/nft", NFTToken.GetAll);
  router.get("/nft/:id", NFTToken.GetOne);
  router.post("/nft", upload.single("mintable_art"), NFTToken.Create);

  // NFT Search
  router.get("/nft/search/:key", NFTToken.SearchNFT);

  // Mint
  router.post("/transaction/:id", Transaction.Create);

  // Views
  router.post("/views/:id", NFTToken.AddView);

  // Profile
  router.get("/my-nfts", NFTToken.GetMyAllNFTs);

  return router;
};
