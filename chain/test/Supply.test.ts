import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  deployTokensFixture,
  deploySupply,
  ONE_DAY_IN_SECS,
  ONE_MONTH_IN_SECS,
  ONE_YEAR_IN_SECS,
} from "../scripts/utils";

import { LoanOfferStruct } from "../typechain-types/contracts/Supply";

describe("Supply", function () {
  async function deploySupplyFixture() {
    const supply = await deploySupply();
    return { supply };
  }

  it("open and close loan", async function () {
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

    // await supply.verifyLoanOfferSignature(offer, signature);

    const openLoanTx = supply.openLoan(
      offer,
      signature,
      BigNumber.from(300),
      BigNumber.from(10 * ONE_DAY_IN_SECS),
      account2.address
    );
    await expect(openLoanTx).to.changeTokenBalances(
      token,
      [account1, account2],
      [-300, +300]
    );

    const loanId = 1;

    await token.connect(account2).approve(supply.address, BigNumber.from(1000));
    const repayLoanTx = supply.repayLoan(account2.address, loanId, 0);

    await expect(repayLoanTx).to.changeTokenBalance(token, account2, -300);
  });
});
