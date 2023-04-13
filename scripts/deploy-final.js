const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  let petty;
  let gold;
  let tokenSale;
  let reserve;
  let marketplace;
  let defaultFeeRate = 0;
  let defaultFeeDecimal = 0;
  //deploy petty
  const Petty = await ethers.getContractFactory("Petty");
  petty = await Petty.deploy();
  await petty.deployed();
  console.log("Petty deployed to: ", petty.address);
  //deploy gold
  const Gold = await ethers.getContractFactory("Gold");
  gold = await Gold.deploy();
  await gold.deployed();
  console.log(`Gold deployed  to: ${gold.address}`);

  //deploy token sale
  const TokenSale = await ethers.getContractFactory("TokenSale");
  tokenSale = await TokenSale.deploy(gold.address);
  await tokenSale.deployed();
  const transferTx = await gold.transfer(
    tokenSale.address,
    ethers.utils.parseUnits("1000000", "ether")
  );
  await transferTx.wait();
  console.log(`tokenSale deployed to: ${tokenSale.address}`);

  //deploy reserve
  const Reserve = await ethers.getContractFactory("Reselve");
  reserve = await Reserve.deploy(gold.address);
  console.log(`Reserve deployed to: ${reserve.address}`);

  //deploy marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  marketplace = await Marketplace.deploy(
    petty.address,
    defaultFeeDecimal,
    defaultFeeRate,
    reserve.address
  );
  await marketplace.deployed();
  console.log(`Marketplace deployed to: ${marketplace.address}`);

  const addPaymentTokenTx = await marketplace.addPaymentToken(gold.address);
  await addPaymentTokenTx.wait();
  console.log(
    "Gold is  payment token? true of false",
    await marketplace.isPaymentTokenSupported(gold.address)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
