const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Reserved", () => {
  let [admin, receiver, seller, buyer] = [];
  let gold;
  let reserve;
  let address0 = "0x0000000000000000000000000000000000000000";
  let reserveBalance = ethers.utils.parseEther("1000");
  let oneWeek = 86400 * 7;
  beforeEach(async () => {
    [admin, receiver, seller, buyer] = await ethers.getSigners();
    const Gold = await ethers.getContractFactory("Gold");
    gold = await Gold.deploy();
    await gold.deployed();
    const Reserve = await ethers.getContractFactory("Reselve");
    reserve = await Reserve.deploy(gold.address);
    await reserve.deployed();
  });

  describe("withdrawTo", () => {
    beforeEach(async () => {
      await gold.transfer(reserve.address, reserveBalance);
    });

    it("should revert if not owner", async () => {
      await expect(
        reserve.connect(receiver).withdrawTo(receiver.address, reserveBalance)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if not exceed unlock time", async () => {
      await expect(
        reserve.withdrawTo(receiver.address, reserveBalance)
      ).to.be.revertedWith("Reserve: Can not Trade");
    });

    it("should revert if to is address 0", async () => {
      await network.provider.send("evm_increaseTime", [oneWeek * 24]);
      //tua thoi gian kieu kieu v
      //nhận được một số giây sẽ được thêm vào dấu thời gian của khối mới nhất
      //kieu 24 tuan sau moi trans
      await expect(
        reserve.withdrawTo(address0, reserveBalance)
      ).to.be.revertedWith("Reserve: transfer to zero address");
    });

    it("should revert if exceed contract balance", async () => {
      await network.provider.send("evm_increaseTime", [oneWeek * 24]);
      await expect(
        reserve.withdrawTo(receiver.address, reserveBalance + 1)
      ).to.be.revertedWith("Reserve: exceeds contract balence");
    });

    it("should withdraw correctly", async () => {
      await network.provider.send("evm_increaseTime", [oneWeek * 24]);
      expect(await gold.balanceOf(reserve.address)).to.be.equal(reserveBalance);
      await reserve.withdrawTo(receiver.address, reserveBalance);
      expect(await gold.balanceOf(reserve.address)).to.be.equal(0);
    });
  });

  describe("Combined with contract marketplace", function () {
    it("should withdraw correctly with fee from marketplace", async () => {
      let defaultFeeRate = 10;
      let defaultFeeDecimal = 0;
      let feeRecipientAddress = reserve.address;
      let defaultPrice = ethers.utils.parseEther("100");
      let defaultBalance = ethers.utils.parseEther("10000");
      const Petty = await ethers.getContractFactory("Petty");
      petty = await Petty.deploy();
      await petty.deployed();
      const Marketplace = await ethers.getContractFactory("Marketplace");
      marketplace = await Marketplace.deploy(
        petty.address,
        defaultFeeDecimal,
        defaultFeeRate,
        feeRecipientAddress
      );
      await marketplace.deployed();

      await gold.transfer(buyer.address, defaultBalance);

      await marketplace.addPaymentToken(gold.address);
      await petty.mint(seller.address);
      await petty.connect(seller).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(seller).addOrder(1, gold.address, defaultPrice);
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
      await marketplace.connect(buyer).executeOrder(1);

      const reserveBalanceFee = defaultPrice.mul(10).div(100); //10%
      await network.provider.send("evm_increaseTime", [oneWeek * 24]);
      expect(await gold.balanceOf(reserve.address)).to.be.equal(
        reserveBalanceFee
      );
      await reserve.withdrawTo(receiver.address, reserveBalanceFee);
      expect(await gold.balanceOf(reserve.address)).to.be.equal(0);
    });
  });
});
