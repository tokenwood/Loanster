import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "../../webapp/src/utils/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Supply", function () {
  async function deployTokensFixture() {
    const [owner, account1, account2] = await ethers.getSigners();
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokens = [];

    for (let i = 0; i < 2; i++) {
      const testToken = await TestToken.deploy();
      console.log("deploying token " + i);

      await testToken.mint(account1.address, 1000);
      await testToken.mint(account2.address, 1000);
      tokens.push(testToken);
    }
    return { token: tokens[0], token2: tokens[1] };
  }

  async function deploySupplyFixture() {
    const Supply = await ethers.getContractFactory("Supply");
    const supply = await Supply.deploy(
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
    );
    await supply.deployed();

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

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    await supply.addDepositToken(token.address);
    await token.connect(account1).approve(supply.address, 1000);
    await expect(
      supply.connect(account1).makeDeposit(token.address, 800, unlockTime, 0)
    ).to.changeTokenBalance(token, account1, -800);

    await expect(
      supply.connect(account1).makeDeposit(token.address, 1200, unlockTime, 0)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    await expect(
      supply.connect(account1).makeDeposit(token2.address, 800, unlockTime, 0)
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
      .makeDeposit(token.address, 500, unlockTime, 0);

    const receipt: ContractReceipt = await deposit.wait();
    const depositId: BigNumber = receipt.events?.filter((x) => {
      return x.event == "NewDeposit";
    })[0].args!["depositId"];

    // add to deposit
    await expect(
      supply.connect(account1).changeAmountDeposited(depositId, 800)
    ).to.changeTokenBalance(token, account1, -300);

    // remove from deposit
    await expect(
      supply.connect(account1).changeAmountDeposited(depositId, 0)
    ).to.changeTokenBalance(token, account1, 800);

    // wrong account
    await expect(
      supply.connect(account2).changeAmountDeposited(depositId, 0)
    ).to.be.revertedWith("sender is not owner of deposit");
  });

  // test make deposit

  // it("make deposit should work with allowed token", async function () {
  //   const initialSupply = ethers.utils.parseEther('10000.0')
  //   const ClassToken = await ethers.getContractFactory("ClassToken");
  //   const token = await ClassToken.deploy(initialSupply);
  //   await token.deployed();

  //   expect(await token.totalSupply()).to.equal(initialSupply);
  // });
});
