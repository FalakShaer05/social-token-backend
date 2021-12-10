const router = require(`express`).Router()
const NFTToken = require(`../controllers/NFTToken`)
const authentication = require('../middleware/validateJWT')
const upload = require("../config/uploadConfig");
const RequestsModel = require('../controllers/models/RequestRecord')

module.exports = function RouterPrivate(database, settings) {
    router.use(authentication.authenticate)
    // router.use(async (req, res, next) => {
    //     const bearerHeader = req.headers['authorization']
    //     const bearer = bearerHeader?.split(' ')
    //     const bearerToken = bearer ? bearer[1] : null
    //     if (bearerToken) {
    //         const rm = await RequestsModel.findOne({jwtToken: bearerToken})
    //         if (rm !== null) {
    //             if (rm.isExpired) {
    //                 return res
    //                     .status(502)
    //                     .json({status: `Expired`, error: `Use the last ott sent to you.`})
    //             } else {
    //                 rm.lastReq = Date.now()
    //                 await rm.save()
    //                 next()
    //             }
    //         } else {
    //             return res
    //                 .status(502)
    //                 .json({status: `Error`, error: `Please verify your OTT first.`})
    //         }
    //     }
    // })

    router.post("/token", upload.single("img"), NFTToken.createToken)

    return router;
}

