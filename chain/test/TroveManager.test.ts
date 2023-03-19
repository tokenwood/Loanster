import { expect } from "chai";
import { ethers } from "hardhat";
import {
  WETH_TOKEN,
  USDC_TOKEN,
  V3_SWAP_ROUTER_ADDRESS,
} from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { Token } from "@uniswap/sdk-core";

import "../scripts/utils";
import {
  deployTroveManager,
  deploySupply,
  deployTokensFixture,
} from "../scripts/utils";

import hre from "hardhat";
import { BigNumber } from "ethers";
const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

async function log_balance(token: Token, address: string) {
  const wethERC20 = await ethers.getContractAt("ERC20", token.address);
  const balance = await wethERC20.balanceOf(address);

  console.log(
    token.symbol +
      " balance :" +
      ethers.utils.formatUnits(balance, token.decimals)
  );
}

describe("TroveManager", function () {
  const TIMESTAMP_2030 = 1893452400;

  async function deployTroveManagerFixture() {
    const supply = await deploySupply();
    const troveManager = await deployTroveManager(
      supply.address,
      WETH_TOKEN.address
    );
    await supply.setTroveManager(troveManager.address);

    console.log(`supply and troveManager deployed`);
    return { troveManager, supply };
  }

  async function BuyTokensFixture() {
    const [account] = await ethers.getSigners();

    console.log("eth balance: " + (await account.getBalance()));

    const swapRouter = await ethers.getContractAt(
      "ISwapRouter",
      V3_SWAP_ROUTER_ADDRESS
    );
    const weth = await ethers.getContractAt("IWETH", WETH_TOKEN.address);

    await weth.deposit({
      value: ethers.utils.parseEther("20.0"),
    });

    await weth.approve(swapRouter.address, ethers.utils.parseUnits("100", 18));

    const swap = await swapRouter.exactInputSingle({
      tokenIn: WETH_TOKEN.address,
      tokenOut: USDC_TOKEN.address,
      fee: 500,
      recipient: account.address,
      deadline: TIMESTAMP_2030,
      amountIn: ethers.utils.parseEther("10.0"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    });

    await log_balance(USDC_TOKEN, account.address);
    await log_balance(WETH_TOKEN, account.address);
  }

  it("add and remove token should only work if owner", async function () {
    const [owner, account1] = await ethers.getSigners();
    const { token } = await loadFixture(deployTokensFixture);
    // const supply = await loadFixture(deploySupply);
    const { troveManager } = await loadFixture(deployTroveManagerFixture);

    await expect(
      troveManager.connect(owner).addSupplyToken(token.address, 10000)
    ).to.not.be.reverted;
    await expect(
      troveManager.connect(account1).addSupplyToken(token.address, 10000)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(troveManager.connect(owner).removeSupplyToken(token.address))
      .to.not.be.reverted;
    await expect(
      troveManager.connect(account1).removeSupplyToken(token.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("deposit and withdraw usdc collateral should work", async function () {
    expect(networkName).to.equal("localhost");
    await loadFixture(BuyTokensFixture);
    const [account, account2] = await ethers.getSigners();
    const { troveManager } = await loadFixture(deployTroveManagerFixture);

    const usdc = await ethers.getContractAt("ERC20", USDC_TOKEN.address);
    await troveManager.addCollateralToken(
      usdc.address,
      BigNumber.from(9000),
      500
    );

    await usdc.approve(
      troveManager.address,
      ethers.utils.parseUnits("100000", 6)
    );

    await expect(
      troveManager.openTrove(usdc.address, 10000)
    ).to.changeTokenBalances(usdc, [account, troveManager], [-10000, +10000]);

    const troveId = await troveManager.tokenOfOwnerByIndex(account.address, 0); // may fail if already opened trove (in other tests?)
    console.log("trove id: " + troveId);

    await expect(
      troveManager.connect(account2).closeTrove(troveId)
    ).to.be.revertedWith("sender not owner of trove");

    // todo fix: contract doesn't have authorisation to send usdc
    // await expect(troveManager.closeTrove(troveId)).to.changeTokenBalances(
    //   usdc,
    //   [account, troveManager],
    //   [+10000, -10000]
    // );
  });
});
