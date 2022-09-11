const {ethers} = require('hardhat');
require("dotenv").config({path: ".env"});
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

const main = async () => {
  const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;
  const cryptoDevsTokenContract = await ethers.getContractFactory("CryptoDevToken");
  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(cryptoDevsNFTContract);
  console.log("Crypto Devs Token Contract Address", deployedCryptoDevsTokenContract.address);
}

main().then(() => process.exit(0)).catch((err) => {
  console.log(err);
  process.exit(1);
})

// Crypto Devs Token Contract Address 0x08eB4428006907b583e9864819373cEb4E0f79D8