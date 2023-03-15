import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { deployTokensFixture, deploySupply } from "../scripts/utils";

const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
const ONE_MONTH_IN_SECS = 30 * 24 * 60 * 60;

describe("Supply", function () {
  async function deploySupplyFixture() {
    const supply = await deploySupply();
    return { supply };
  }

  it("add and remove token should only work if owner", async function () {
    const [owner, account1] = await ethers.getSigners();
    const { token } = await loadFixture(deployTokensFixture);
    const { supply } = await loadFixture(deploySupplyFixture);

    await expect(supply.connect(owner).addDepositToken(token.address)).to.not.be
      .reverted;
    await expect(
      supply.connect(account1).addDepositToken(token.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(supply.connect(owner).removeDepositToken(token.address)).to.not
      .be.reverted;
    await expect(
      supply.connect(account1).removeDepositToken(token.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("deposit token should work if enough balance and is allowed token", async function () {
    const [owner, account1, account2] = await ethers.getSigners();

    const { token, token2 } = await loadFixture(deployTokensFixture);
    const { supply } = await loadFixture(deploySupplyFixture);

    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    await supply.addDepositToken(token.address);
    await token.connect(account1).approve(supply.address, 10000);
    await expect(
      supply
        .connect(account1)
        .makeDeposit(token.address, 800, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    ).to.changeTokenBalance(token, account1, -800);

    await expect(
      supply
        .connect(account1)
        .makeDeposit(token.address, 1200, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    await expect(
      supply
        .connect(account1)
        .makeDeposit(token2.address, 800, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    ).to.be.revertedWith("unauthorized deposit token");
  });

  it("withdraw token should work", async function () {
    const [owner, account1, account2] = await ethers.getSigners();

    const { token } = await loadFixture(deployTokensFixture);
    const { supply } = await loadFixture(deploySupplyFixture);

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    await supply.addDepositToken(token.address);
    await token.connect(account1).approve(supply.address, 1000);

    const deposit = await supply
      .connect(account1)
      .makeDeposit(token.address, 500, unlockTime, 0, ONE_MONTH_IN_SECS, 0);

    const receipt = await deposit.wait();
    const depositId: BigNumber = receipt.events?.filter((x) => {
      return x.event == "NewDeposit";
    })[0].args!["depositId"];

    // add to deposit
    await expect(
      supply.connect(account1).changeAmountDeposited(depositId, 800)
    ).to.changeTokenBalance(token, account1, -300);

    // wrong account
    await expect(
      supply.connect(account2).changeAmountDeposited(depositId, 0)
    ).to.be.revertedWith("sender is not owner of deposit");

    // remove from deposit
    await expect(
      supply.connect(account1).changeAmountDeposited(depositId, 0)
    ).to.changeTokenBalance(token, account1, 800);
  });
});
