const fileSystem = require("fs");
const path = require("path");
const settings = require("../../server-settings.json");

const controller = {};

controller.HomeFunction = async function (req, res) {
    res.render('Home', {
        title: 'Web3 Page'
    })
};

module.exports = controller;
