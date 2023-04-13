const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GOLD", () => {
  let [accA, accB, accC] = [];
  let token;
  let amount = ethers.utils.parseUnits("100", "ether");
  let address0 = "0x0000000000000000000000000000000000000000";
  let totalSupply = ethers.utils.parseUnits("1000000000", "ether");

  beforeEach(async () => {
    [accA, accB, accC] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Gold");
    token = await Token.deploy();
    await token.deployed();
  });

  //test
  describe("common", () => {
    it("total supply should return right value", async () => {
      console.log("address: ", accA.address);

      expect(await token.totalSupply()).to.be.equal(totalSupply);
    });

    it("balance of account A should return right value", async () => {
      expect(await token.balanceOf(accA.address)).to.be.equal(totalSupply);
    });

    it("balance of account B should return right value", async () => {
      expect(await token.balanceOf(accB.address)).to.be.equal(0);
    });

    it("allowance of account A should return right value", async () => {
      expect(await token.allowance(accA.address, accB.address)).to.be.equal(0);
    });
  });

  describe("pause", () => {
    it("should revert if not pauser role", async () => {
      await expect(token.connect(accB).pause()).to.be.reverted;
    });

    it("should revert if contract has been paused", async () => {
      await token.pause();
      await expect(token.pause()).to.be.revertedWith("Pausable: paused");
    });

    it("should pause contract correctly", async () => {
      const pauseTx = await token.pause();
      await expect(pauseTx).to.be.emit(token, "Paused").withArgs(accA.address);
      await expect(token.transfer(accB.address, amount)).to.be.revertedWith(
        "Pausable: paused"
      );
    });
  });

  describe("unpause", () => {
    beforeEach(async () => {
      await token.pause();
    });

    it("should revert if not pauser role", async () => {
      await expect(token.connect(accB).unpause()).to.be.reverted;
    });

    it("should revert if contract has been unpause", async () => {
      await token.unpause();
      await expect(token.unpause()).to.be.revertedWith("Pausable: not paused");
    });

    it("should pause contract correctly", async () => {
      const unpauseTx = await token.unpause();
      await expect(unpauseTx).to.emit(token, "Unpaused").withArgs(accA.address);
    });
  });

  describe("add to black list", async () => {
    it("should revert if address have no right to DEFAULT_ADMIN_ROLE", async () => {
      await expect(token.connect(accB).addToBlacklist(accC.address)).to.be
        .reverted;
    });
    it("should revert if add sender to blacklist", async () => {
      expect(await token.addToBlacklist(accA.address)).to.be.revertedWith(
        "Gold: must not add sender  to  blacklist"
      );
    });

    it("should revert if account was on black list", async () => {
      await token.addToBlacklist(accC.address);
      expect(await token.addToBlacklist(accC.address)).to.be.revertedWith(
        "Gold account was on blacklist"
      );
    });

    it("addToBlacklist correctly", async () => {
      const addToBlackTx = await token.addToBlacklist(accC.address);
      await expect(addToBlackTx)
        .to.be.emit(token, "BlacklistAdded")
        .withArgs(accC.address);
    });
  });

  describe("remove to black list", async () => {
    it("should revert if address have no right to DEFAULT_ADMIN_ROLE", async () => {
      await expect(token.connect(accB).removeFromBlackList(accC.address)).to.be
        .reverted;
    });

    it("should revert if account was not on black list", async () => {
      expect(await token.removeFromBlackList(accC.address)).to.be.revertedWith(
        "Gold account was not on blacklist"
      );
    });

    it("removeFromBlackList correctly", async () => {
      await token.addToBlacklist(accC.address);
      const removeToBlackTx = await token.removeFromBlackList(accC.address);
      await expect(removeToBlackTx)
        .to.be.emit(token, "BlacklistRemoved")
        .withArgs(accC.address);
    });
  });

  describe("transfer", async () => {
    it("should revert if receiver was on blacklist ", async () => {
      let defaulBalance = ethers.utils.parseEther("100");
      await token.addToBlacklist(accB.address);
      await expect(
        token.transfer(accB.address, defaulBalance)
      ).to.be.revertedWith("Gold: account receiver was on blacklist");
    });

    it("should revert if sender was on blacklist ", async () => {
      let defaulBalance = ethers.utils.parseEther("100");
      await token.transfer(accB.address, defaulBalance);
      await token.addToBlacklist(accB.address);
      await expect(token.connect(accB).transfer(accC.address, defaulBalance)).to
        .be.reverted;
    });

    it("transfer correctly", async () => {
      await gold.transfer(seller.address, defaulBalance);
    });
  });
});
