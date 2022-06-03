const e = require("express");
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

module.exports = controller;
