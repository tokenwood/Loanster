import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { deployTokensFixture, deploySupply } from "../scripts/utils";

import { LoanOfferStruct } from "../typechain-types/contracts/Supply";

const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
const ONE_MONTH_IN_SECS = 30 * 24 * 60 * 60;
const ONE_DAY_IN_SECS = 24 * 60 * 60;

// export interface LoanOffer {
//   owner: string;
//   token: string;
//   offerId: BigNumber;
//   nonce: BigNumber;
//   minLoanAmount: BigNumber;
//   amount: BigNumber;
//   interestRateBPS: BigNumber;
//   expiration: BigNumber;
//   minLoanDuration: BigNumber;
//   maxLoanDuration: BigNumber;
// }

describe("Supply", function () {
  async function deploySupplyFixture() {
    const supply = await deploySupply();
    return { supply };
  }

  it("loan should be opened", async function () {
    const [owner, account1, account2] = await ethers.getSigners();

    const { token, token2 } = await loadFixture(deployTokensFixture);
    const { supply } = await loadFixture(deploySupplyFixture);

    await supply.setTroveManager(owner.address);
    const expiration = (await time.latest()) + ONE_YEAR_IN_SECS;

    const offer: LoanOfferStruct = {
      owner: account1.address,
      token: token.address,
      offerId: BigNumber.from(1),
      nonce: BigNumber.from(1),
      minLoanAmount: BigNumber.from(0),
      amount: BigNumber.from(800),
      interestRateBPS: BigNumber.from(500),
      expiration: BigNumber.from(expiration),
      minLoanDuration: BigNumber.from(ONE_DAY_IN_SECS),
      maxLoanDuration: BigNumber.from(ONE_MONTH_IN_SECS),
    };

    const offerMessage = await supply.buildLoanOfferMessage(offer);
    await token.connect(account1).approve(supply.address, BigNumber.from(1000));

    const signature = await account1.signMessage(
      ethers.utils.arrayify(offerMessage)
    );

    const output = await supply.verifyLoanOfferSignature(offer, signature);

    const loanId = await expect(
      supply.openLoan(
        offer,
        signature,
        BigNumber.from(300),
        BigNumber.from(10 * ONE_DAY_IN_SECS),
        account2.address,
        BigNumber.from(1)
      )
    ).to.changeTokenBalances(token, [account1, account2], [-300, +300]);

    console.log(loanId);

    // await supply.addSupplyToken(token.address, 10000);
    // await token.connect(account1).approve(supply.address, 10000);

    // await expect(
    //   supply
    //     .connect(account1)
    //     .makeDeposit(token.address, 800, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    // ).to.changeTokenBalance(token, account1, -800);

    // await expect(
    //   supply
    //     .connect(account1)
    //     .makeDeposit(token.address, 1200, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    // ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    // await expect(
    //   supply
    //     .connect(account1)
    //     .makeDeposit(token2.address, 800, unlockTime, 0, ONE_MONTH_IN_SECS, 0)
    // ).to.be.revertedWith("unauthorized deposit token");
  });

  //   it("withdraw token should work", async function () {
  //     const [owner, account1, account2] = await ethers.getSigners();

  //     const { token } = await loadFixture(deployTokensFixture);
  //     const { supply } = await loadFixture(deploySupplyFixture);

  //     const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  //     const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

  //     await supply.addSupplyToken(token.address, 50);
  //     await token.connect(account1).approve(supply.address, 1000);

  //     const deposit = await supply
  //       .connect(account1)
  //       .makeDeposit(token.address, 500, unlockTime, 0, ONE_MONTH_IN_SECS, 0);

  //     const receipt = await deposit.wait();
  //     const depositId: BigNumber = receipt.events?.filter((x) => {
  //       return x.event == "NewDeposit";
  //     })[0].args!["depositId"];

  //     // add to deposit
  //     await expect(
  //       supply.connect(account1).changeAmountDeposited(depositId, 800)
  //     ).to.changeTokenBalance(token, account1, -300);

  //     // wrong account
  //     await expect(
  //       supply.connect(account2).changeAmountDeposited(depositId, 0)
  //     ).to.be.revertedWith("sender is not owner of deposit");

  //     // remove from deposit
  //     await expect(
  //       supply.connect(account1).changeAmountDeposited(depositId, 0)
  //     ).to.changeTokenBalance(token, account1, 800);
  //   });
});
