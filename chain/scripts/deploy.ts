import { ethers } from "hardhat";
import {
  buyToken,
  deploySupply,
  deployTroveManager,
  depositWETH,
  getUniUtilsAddress,
} from "./utils";
import {
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

  const supply = await deploySupply();
  console.log(`supply deployed to ${supply.address}`);

  const troveManager = await deployTroveManager(
    supply.address,
    WETH_TOKEN.address
  );
  console.log(`trove manager deployed to ${troveManager.address}`);

  await troveManager.addSupplyToken(USDC_TOKEN.address, 9000, 500);
  await troveManager.addSupplyToken(LUSD_TOKEN.address, 9000, 500);
  await troveManager.addSupplyToken(WBTC_TOKEN.address, 8000, 500);

  await troveManager.addCollateralToken(WETH_TOKEN.address, 10000, 0);
  await troveManager.addCollateralToken(RETH_TOKEN.address, 9000, 500);

  const deployments = {
    uniUtils: getUniUtilsAddress(),
    supply: supply.address,
    troveManager: troveManager.address,
  };

  var fs = require("fs");
  fs.writeFile(
    "./cache/deployments.json",
    JSON.stringify(deployments),
    function (err: any) {
      if (err) {
        console.log(err);
      }
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
