const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "v1/digital-assets/");
    },
    filename: (request, file, callback) => {
        const fileExtension = file.originalname.split(".")[1];

        const newNameFile = require("crypto").randomBytes(16).toString("hex");

        callback(null, `${newNameFile}.${fileExtension}`);
    },
});

const upload = multer({storage});
module.exports = upload;
