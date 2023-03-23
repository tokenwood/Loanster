import { ethers } from "hardhat";
import {
  buyToken,
  deploySupply,
  deployTroveManager,
  depositWETH,
  getSupplyContract,
  getTroveManagerContract,
  getUniUtilsAddress,
  ONE_DAY_IN_SECS,
  ONE_MONTH_IN_SECS,
  ONE_YEAR_IN_SECS,
  openTrove,
} from "./utils";
import {
  AGEUR_TOKEN,
  CRV_TOKEN,
  LUSD_TOKEN,
  RETH_TOKEN,
  USDC_TOKEN,
  WBTC_TOKEN,
  WETH_TOKEN,
} from "../../webapp/src/libs/constants";
import hre from "hardhat";
import { error } from "console";
import { LoanOfferStruct } from "../typechain-types/contracts/TroveManager";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

async function main() {
  if (networkName !== "localhost") {
    throw error("should deploy to localhost");
  }
  const [owner, account1, account2] = await ethers.getSigners();

  console.log("buying usdc");
  await buyToken(owner.address, USDC_TOKEN.address, 10);
  console.log("buying lusd");
  await buyToken(owner.address, LUSD_TOKEN.address, 10, 10000);
  console.log("buying wbtc");
  await buyToken(owner.address, WBTC_TOKEN.address, 10);
  console.log("buying reth");
  await buyToken(owner.address, RETH_TOKEN.address, 10);
  console.log("depositing weth");
  await depositWETH(10);

  // open 1 troves
  console.log("opening trove");
  const troveId = await openTrove(
    owner,
    WETH_TOKEN.address,
    ethers.utils.parseEther("1"),
    await getTroveManagerContract()
  );

  const expiration = (await time.latest()) + 7 * ONE_DAY_IN_SECS;

  // open 1 loan
  console.log("creating loan offer");
  const offer: LoanOfferStruct = {
    owner: owner.address,
    token: USDC_TOKEN.address,
    offerId: BigNumber.from(100),
    nonce: BigNumber.from(0),
    minLoanAmount: BigNumber.from(0),
    amount: BigNumber.from(ethers.utils.parseUnits("1000", 6)),
    interestRateBPS: BigNumber.from(500),
    expiration: BigNumber.from(expiration),
    minLoanDuration: BigNumber.from(0),
    maxLoanDuration: BigNumber.from(ONE_MONTH_IN_SECS),
  };
  const supply = await getSupplyContract();
  const troveManager = await getTroveManagerContract();
  const offerMessage = await supply.buildLoanOfferMessage(offer);
  const signature = await owner.signMessage(
    ethers.utils.arrayify(offerMessage)
  );

  console.log("opening loan");
  const openLoanTx = await troveManager.connect(owner).openLoan(
    offer,
    signature,
    BigNumber.from(ethers.utils.parseUnits("100", 6)), // amount
    BigNumber.from(10 * ONE_DAY_IN_SECS), // duration
    troveId // troveId
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
