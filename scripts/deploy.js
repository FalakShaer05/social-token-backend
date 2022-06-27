const hre = require("hardhat");

async function main() {
  const _ERC721A = await hre.ethers.getContractFactory("ERC721A");
  const _ERC721Ad = await _ERC721A.deploy();
  await _ERC721Ad.deployed();
  console.log("nftMarket deployed to:", _ERC721Ad.address);

  const _Context = await hre.ethers.getContractFactory("Context");
  const _Contextd = await _Context.deploy();
  await _Contextd.deployed();
  console.log("nftMarket deployed to:", _Contextd.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
