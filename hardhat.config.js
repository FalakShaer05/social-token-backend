require("@nomiclabs/hardhat-waffle");
const fs = require('fs')
const privateKey = fs.readFileSync(".myWalletKey").toString().trim()

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337
        },
        ropsten: {
            url: "https://ropsten.infura.io/v3/8031b681fe9f440ba9dedc43c6d3e780",
            accounts: [privateKey]
        },
        mainnet: {
            url: "https://mainnet.infura.io/v3/8031b681fe9f440ba9dedc43c6d3e780",
            accounts: [privateKey]
        },
    },
    solidity: {
        version: "0.8.4",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
}