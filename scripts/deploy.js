const hre = require("hardhat");

async function main() {
    const SocialNFT = await hre.ethers.getContractFactory("SocialNFT");
    const socialnft = await SocialNFT.deploy();
    await socialnft.deployed();
    console.log("nftMarket deployed to:", socialnft.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
