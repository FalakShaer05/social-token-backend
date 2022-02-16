require("@nomiclabs/hardhat-waffle");
const fs = require('fs')
const privateKey = fs.readFileSync(".hardhat_secret").toString().trim()

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337
        },
        mumbai: {
            url: "https://rpc-mumbai.maticvigil.com",
            accounts: [privateKey]
        },
        mainnet: {
            url: "https://rpc-mainnet.matic.network",
            accounts: [privateKey]
        }
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