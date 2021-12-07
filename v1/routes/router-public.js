const router = require(`express`).Router();
const _auth = require(`../auth`);
const users = require(`../controllers/Users`);
const RequestsModel = require('../controllers/models/RequestRecord')

module.exports = function RouterPublic(database, settings) {
    const db = database;
    const auth = _auth();
    router.use(async (req, res, next) => {
        const bearerHeader = req.headers["authorization"];
        const bearer = bearerHeader?.split(" ");
        const bearerToken = bearer ? bearer[1] : null;
        if (bearerToken) {
            const rm = await RequestsModel.findOne({jwtToken: bearerToken});
            if (rm !== null) {
                if (rm.isExpired) {
                    console.log(`Use the last ott sent to you.`);
                    return next();
                }
                rm.lastReq = Date.now();
                await rm.save();
            }
        }
        next();
    });

    router.get(`/login`, auth.isUserAuthenticated, async (req, res) => {
        res.status(200).json({
            status: `success`,
            message: `Login successful!`,
            data: req.user,
        });
    });

    router.route(`/signup`).post(users.AddUser);

    return router;
};
