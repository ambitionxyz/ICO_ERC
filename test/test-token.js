const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20-BEP@) sample token", function () {
  let [accA, accB, accC] = [];
  let token;
  let amount = 1100;
  let totalSupply = 1000000;
  this.beforeEach(async () => {
    [accA, accB, accC] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SampleToken");
    token = await Token.deploy();
    await token.deployed();
  });
  //view
  describe("common", function () {
    it("total supply  should return right value", async function () {
      expect(await token.totalSupply()).to.be.equal(totalSupply);
    });
    it("balance of account A should return  right  value", async function () {
      expect(await token.balanceOf(accA.address)).to.be.equal(totalSupply);
    });
    it("balance of account B should return  right  value", async function () {
      expect(await token.balanceOf(accB.address)).to.be.equal(0);
    });

    it("allowance of account  A to account B should return right value", async function () {
      expect(await token.allowance(accA.address, accB.address)).to.be.equal(0);
    });
  });

  describe("transfer", function () {
    it("transfer should revert  if amount exceeds balance", async () => {
      await expect(token.transfer(accB.address, totalSupply + 11)).to.be
        .reverted;
    });

    it("transfer shold work correctly", async () => {
      let transferTx = await token.transfer(accB.address, amount);
      expect(await token.balanceOf(accA.address)).to.be.equal(
        totalSupply - amount
      );
      expect(await token.balanceOf(accB.address)).to.be.equal(amount);
      await expect(transferTx)
        .to.emit(token, "Transfer")
        .withArgs(accA.address, accB.address, amount);
    });
  });
  describe("transferFrom", function () {
    it("transferFrom  should revert if amount exceeds balance", async () => {
      await expect(
        token
          .connect(accB)
          .transferFrom(accA.address, accC.address, totalSupply + 1)
      ).to.be.reverted;
    });

    it("transferFrom should revert if amount exceeds  allowance amount", async () => {
      await expect(
        token.connect(accB).transferFrom(accA.address, accC.address, amount)
      ).to.be.reverted;
    });

    it("transferFrom should work correctly", async () => {
      await token.approve(accB.address, amount);
      let transferFromTx = await token
        .connect(accB)
        .transferFrom(accA.address, accC.address, amount);

      expect(await token.balanceOf(accA.address)).to.be.equal(
        totalSupply - amount
      );

      expect(await token.balanceOf(accC.address)).to.be.equal(amount);

      await expect(transferFromTx)
        .to.be.emit(token, "Transfer")
        .withArgs(accA.address, accC.address, amount);
    });
  });
  describe("approve", function () {
    it("approve should work correctly", async () => {
      const approveTx = await token.approve(accB.address, amount);
      expect(await token.allowance(accA.address, accB.address)).to.be.equal(
        amount
      );
      await expect(approveTx)
        .to.emit(token, "Approval")
        .withArgs(accA.address, accB.address, amount);
    });
  });
});
