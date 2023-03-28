import { expect } from "chai";
import { ethers } from "hardhat";
import {
  WETH_TOKEN,
  USDC_TOKEN,
  DAI_TOKEN,
  CRV_TOKEN,
} from "../../webapp/src/libs/constants";
import { BigNumber } from "ethers";

describe("UniUtils", function () {
  it("oracle test", async function () {
    const UniUtils = await ethers.getContractFactory("UniUtils");
    const uniUtils = await UniUtils.deploy();
    await uniUtils.deployed();
    console.log("deployed");

    const amount = ethers.utils.parseUnits("1000", USDC_TOKEN.decimals);
    console.log("amount: " + amount);
    const value: BigNumber = await uniUtils.getTWAPValueEth(
      amount,
      USDC_TOKEN.address,
      500,
      300
    );

    console.log("1000 USDC = " + ethers.utils.formatEther(value) + " ETH");

    const amount_CRV = ethers.utils.parseUnits("1000", CRV_TOKEN.decimals);
    const value2: BigNumber = await uniUtils.getTWAPValueEth(
      amount_CRV,
      CRV_TOKEN.address,
      3000,
      300
    );

    console.log("1000 CRV = " + ethers.utils.formatEther(value2) + " ETH");

    //   const [owner, account1, account2] = await ethers.getSigners();

    //   const { token, token2 } = await loadFixture(deployTokensFixture);
    //   const { supply } = await loadFixture(deploySupplyFixture);
  });
});
