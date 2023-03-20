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
  ONE_DAY_IN_SECS,
  ONE_MONTH_IN_SECS,
  ONE_YEAR_IN_SECS,
} from "../scripts/utils";

import hre from "hardhat";
import { BigNumber } from "ethers";
import { LoanOfferStruct } from "../typechain-types/contracts/Supply";
import { token } from "../typechain-types/@openzeppelin/contracts";
const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

async function log_balance(token: Token, address: string) {
  const wethERC20 = await ethers.getContractAt("ERC20", token.address);
  const balance = await wethERC20.connect(address).balanceOf(address);

  console.log(
    address +
      " " +
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

  async function BuyTokens() {
    const [owner, account1, account2] = await ethers.getSigners();

    console.log(
      "account1 eth balance: " +
        ethers.utils.formatEther(await account1.getBalance())
    );

    const swapRouter = await ethers.getContractAt(
      "ISwapRouter",
      V3_SWAP_ROUTER_ADDRESS
    );
    const weth = await ethers.getContractAt("IWETH", WETH_TOKEN.address);

    await weth.connect(account1).deposit({
      value: ethers.utils.parseEther("20.0"),
    });

    await weth
      .connect(account1)
      .approve(swapRouter.address, ethers.utils.parseUnits("100", 18));

    const swap = await swapRouter.connect(account1).exactInputSingle({
      tokenIn: WETH_TOKEN.address,
      tokenOut: USDC_TOKEN.address,
      fee: 500,
      recipient: account2.address,
      deadline: TIMESTAMP_2030,
      amountIn: ethers.utils.parseEther("10.0"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    });

    // await log_balance(WETH_TOKEN, account1.address);
    // await log_balance(USDC_TOKEN, account2.address);
  }

  it("add and remove token should only work if owner", async function () {
    const [owner, account1] = await ethers.getSigners();
    const { token } = await loadFixture(deployTokensFixture);
    // const supply = await loadFixture(deploySupply);
    const { troveManager } = await loadFixture(deployTroveManagerFixture);

    await expect(
      troveManager.connect(owner).addSupplyToken(token.address, 10000, 500)
    ).to.not.be.reverted;
    await expect(
      troveManager.connect(account1).addSupplyToken(token.address, 10000, 500)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(troveManager.connect(owner).removeSupplyToken(token.address))
      .to.not.be.reverted;
    await expect(
      troveManager.connect(account1).removeSupplyToken(token.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("deposit and withdraw usdc collateral should work", async function () {
    console.log("blabla");
    expect(networkName).to.equal("localhost");
    const [owner, account1, account2] = await ethers.getSigners();
    const { troveManager, supply } = await loadFixture(
      deployTroveManagerFixture
    );
    console.log("buying tokens");
    await BuyTokens(); // acct1 has weth and account2 has USDC
    console.log("tokens bought");
    const usdc = await ethers.getContractAt("ERC20", USDC_TOKEN.address);
    const weth = await ethers.getContractAt("ERC20", WETH_TOKEN.address);
    await troveManager.addSupplyToken(usdc.address, BigNumber.from(9000), 500);
    await troveManager.addCollateralToken(
      WETH_TOKEN.address,
      BigNumber.from(10000),
      500
    );

    // account1 opens trove with WETH as collateral
    await weth
      .connect(account1)
      .approve(troveManager.address, ethers.utils.parseEther("100000"));

    await expect(
      troveManager
        .connect(account1)
        .openTrove(WETH_TOKEN.address, ethers.utils.parseEther("1"))
    ).to.changeTokenBalance(weth, troveManager, ethers.utils.parseEther("1"));

    const troveId = await troveManager.tokenOfOwnerByIndex(account1.address, 0); // may fail if already opened trove (in other tests?)

    // account1 borrows USDC from account2
    const expiration = (await time.latest()) + ONE_YEAR_IN_SECS;
    const offer: LoanOfferStruct = {
      owner: account2.address,
      token: usdc.address,
      offerId: BigNumber.from(1),
      nonce: BigNumber.from(1),
      minLoanAmount: BigNumber.from(0),
      amount: BigNumber.from(ethers.utils.parseUnits("1000", 6)),
      interestRateBPS: BigNumber.from(500),
      expiration: BigNumber.from(expiration),
      minLoanDuration: BigNumber.from(0),
      maxLoanDuration: BigNumber.from(ONE_MONTH_IN_SECS),
    };
    const offerMessage = await supply.buildLoanOfferMessage(offer);
    const signature = await account2.signMessage(
      ethers.utils.arrayify(offerMessage)
    );
    await usdc
      .connect(account2)
      .approve(supply.address, ethers.utils.parseUnits("100000", 6));

    console.log("opening loan");
    const openLoanTx = await troveManager.connect(account1).openLoan(
      offer,
      signature,
      BigNumber.from(ethers.utils.parseUnits("100", 6)), // amount
      BigNumber.from(10 * ONE_DAY_IN_SECS), // duration
      troveId // troveId
    );

    await expect(openLoanTx).to.changeTokenBalances(
      usdc,
      [account1, account2],
      [100000000, -100000000]
    );

    const loanId: BigNumber = (await openLoanTx.wait()).events?.filter((x) => {
      return x.event == "NewLoan";
    })[0].args!["loanId"];

    console.log("loanId " + loanId);

    await usdc
      .connect(account1)
      .approve(supply.address, ethers.utils.parseUnits("10000", 6));

    const repayLoanTx = await troveManager
      .connect(account1)
      .repayLoan(troveId, loanId, BigNumber.from(0));

    await expect(repayLoanTx).to.changeTokenBalances(
      usdc,
      [account1, supply.address],
      [-100000000, 100000000]
    );

    // await expect(
    //   troveManager.connect(account2).closeTrove(troveId)
    // ).to.be.revertedWith("sender not owner of trove");

    // todo fix: contract doesn't have authorisation to send usdc
    await expect(
      troveManager.connect(account1).closeTrove(troveId)
    ).to.changeTokenBalance(weth, account1, ethers.utils.parseEther("1"));
  });
});
