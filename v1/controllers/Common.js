const e = require("express");
const fileSystem = require("fs");
const path = require("path");
const mime = require("mime-types");
const CountriesModal = require("./models/Countries");

const controller = {};

controller.generateRandomPassword = async function (count) {
  const letter =
    "0123456789ABCDEFGHIJabcdefghijklmnopqrstuvwxyzKLMNOPQRSTUVWXYZ0123456789abcdefghiABCDEFGHIJKLMNOPQRST0123456789jklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < count; i++) {
    const randomStringNumber = Math.floor(1 + Math.random() * (letter.length - 1));
    randomString += letter.substring(randomStringNumber, randomStringNumber + 1);
  }
  return randomString;
};

controller.generateCode = async function (count) {
  const letter = "0123456789";
  let randomString = "";
  for (let i = 0; i < count; i++) {
    const randomStringNumber = Math.floor(1 + Math.random() * (letter.length - 1));
    randomString += letter.substring(randomStringNumber, randomStringNumber + 1);
  }
  return randomString;
};

controller.getCountries = async function (req, res) {
  try {
    const countries = await CountriesModal.find();
    if(countries.length > 0) {
      return res.status(200).send({
        success: true,
        message: "Countries list",
        data: countries
      });
    } else {
      return res.status(404).send({
        success: false,
        message: "Data not found",
        data: countries
      });
    }
  } catch (ex) {
    return res.status(500).send({
      success: false,
      message: ex.message
    });
  }
};

controller.GetArt = async function (req, res) {
  const artID = req.params.artID;
  try {
    if (!artID) {
      return res.status(400).send({
        success: false,
        message: "Art id is a required parameter"
      });
    }

    let filePath = path.resolve(__dirname, `../digital-assets/${artID}`);
    let stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": mime.lookup(filePath),
      "Content-Length": stat.size
    });

    let readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(res);
  } catch (ex) {
    console.log(ex);
    return res.status(500).send({
      success: false,
      message: "error"
    });
  }
};

module.exports = controller;
