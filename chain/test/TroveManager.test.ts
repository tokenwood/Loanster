import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import {
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  WETH_TOKEN,
  USDC_TOKEN,
  V3_SWAP_ROUTER_ADDRESS,
} from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { Token } from "@uniswap/sdk-core";
import {
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
} from "@uniswap/v3-sdk";

import "../scripts/utils";
import {
  deployTroveManager,
  deploySupply,
  deployUniUtils,
} from "../scripts/utils";
async function log_balance(token: Token, address: string) {
  const wethERC20 = await ethers.getContractAt("ERC20", token.address);
  const balance = await wethERC20.balanceOf(address);

  console.log(
    token.symbol +
      " balance :" +
      ethers.utils.formatUnits(balance, token.decimals)
  );
}

// FEE_LIST = [500, 3000, 10000]
// TICK_SPACING_LIST = [10, 60, 200]
function get_tick(amount0: BigNumber, amount1: BigNumber, spacing: number) {
  const ratio = encodeSqrtRatioX96(amount1.toString(), amount0.toString());
  return nearestUsableTick(TickMath.getTickAtSqrtRatio(ratio), spacing);
}

describe("TroveManager", function () {
  const TIMESTAMP_2030 = 1893452400;

  async function deployTroveManagerFixture() {
    const supply = await deploySupply();
    const uniUtils = await deployUniUtils();
    const troveManager = await deployTroveManager(
      supply.address,
      WETH_TOKEN.address,
      uniUtils.address
    );

    console.log(`supply, uniUtils and troveManager deployed`);
    return { troveManager, supply, uniUtils };
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

  it("deposit and withdraw uniswap v3 position should work", async function () {
    const [account, account2] = await ethers.getSigners();

    await loadFixture(BuyTokensFixture);
    const { troveManager } = await loadFixture(deployTroveManagerFixture);

    const posManager = await ethers.getContractAt(
      "INonfungiblePositionManager",
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
    );

    const weth = await ethers.getContractAt("IWETH", WETH_TOKEN.address);
    await weth.approve(posManager.address, ethers.utils.parseUnits("100", 18));
    const usdc = await ethers.getContractAt("ERC20", USDC_TOKEN.address);
    await usdc.approve(
      posManager.address,
      ethers.utils.parseUnits("100000", 6)
    );

    const tick_spacing = 10;
    const tick_lower = get_tick(
      ethers.utils.parseUnits("2000", 6),
      ethers.utils.parseUnits("1", 18),
      tick_spacing
    );
    const tick_upper = get_tick(
      ethers.utils.parseUnits("1000", 6),
      ethers.utils.parseUnits("1", 18),
      tick_spacing
    );

    await posManager.mint(
      {
        token0: USDC_TOKEN.address,
        token1: WETH_TOKEN.address,
        fee: 500,
        tickLower: tick_lower,
        tickUpper: tick_upper,
        amount0Desired: ethers.utils.parseUnits("1000", 6),
        amount1Desired: ethers.utils.parseEther("1"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: account.address,
        deadline: TIMESTAMP_2030,
      },
      { gasLimit: 10000000 }
    );

    const numPositions = await posManager.balanceOf(account.address);
    console.log("num positions: " + numPositions);
    const positionId = await posManager.tokenOfOwnerByIndex(account.address, 0);
    console.log("position Id: " + positionId);

    await posManager.approve(troveManager.address, positionId);
    console.log("approved");

    await expect(
      troveManager.openTrove(
        NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        positionId
      )
    ).to.changeTokenBalances(posManager, [account, troveManager], [-1, +1]);

    const troveId = await troveManager.tokenOfOwnerByIndex(account.address, 0); // may fail if already opened trove (in other tests?)
    console.log("trove id: " + troveId);

    await expect(
      troveManager.connect(account2).closeTrove(troveId)
    ).to.be.revertedWith("sender not owner of trove");

    await expect(troveManager.closeTrove(troveId)).to.changeTokenBalances(
      posManager,
      [account, troveManager],
      [+1, -1]
    );
  });
});