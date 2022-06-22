const router = require(`express`).Router();
const NFTToken = require(`../controllers/NFTToken`);
const Collections = require(`../controllers/Collections`);
const User = require("../controllers/Users");
const Category = require("../controllers/Category");
const authentication = require("../middleware/validateJWT");
const upload = require("../config/uploadConfig");
const CollectionMulerSettings = upload.fields([
    {name: `thumbnail_image`, maxCount: 1},
    {name: `timeline_image`, maxCount: 1}
]);

module.exports = function RouterPrivate(database, settings) {
    router.use(authentication.authenticate);

    // Collections
    router.get("/collections", Collections.GetAll);
    router.post("/collections", CollectionMulerSettings, Collections.Create);

    // Category
    router.route("/category").post(Category.createCategory);
    router.route("/category/:id").put(Category.updateCollection).delete(Category.DeleteCategory);

    return router;
};
