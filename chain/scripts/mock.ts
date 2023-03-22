import { ethers } from "hardhat";
import {
  buyToken,
  deploySupply,
  deployTroveManager,
  depositWETH,
  getUniUtilsAddress,
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
