import { ethers, network } from "hardhat";
import {
  buyToken,
  deploySupply,
  deployTroveManager,
  depositWETH,
  getUniUtilsAddress,
} from "./utils";
import {
  CHAINLINK_TOKEN_GOERLI,
  LUSD_TOKEN,
  RETH_TOKEN,
  RETH_TOKEN_GOERLI,
  UNI_TOKEN_GOERLI,
  USDC_TOKEN,
  USDC_TOKEN_GOERLI,
  WBTC_TOKEN,
  WETH_TOKEN,
  WETH_TOKEN_GOERLI,
} from "../../webapp/src/libs/constants";
import hre from "hardhat";
import { error } from "console";

const networkName = hre.network.name;

async function main() {
  if (!["localhost", "goerli"].includes(networkName)) {
    throw error("unknown network: " + networkName);
  }
  console.log("deploying to network: ", networkName);
  const [deployer] = await ethers.getSigners();
  console.log("deployer address: ", deployer.address);

  // const supply = await deploySupply();
  // console.log(`supply deployed to ${supply.address}`);

  const supplyAddress = "0xb579d65f781224A0d7fa8d5e845426FE3083ffF0"; //supply.address;
  const troveManager = await deployTroveManager(supplyAddress, networkName);
  console.log(`trove manager deployed to ${troveManager.address}`);

  if (networkName === "goerli") {
    console.log("adding collateral tokens");
    await troveManager.addCollateralToken(WETH_TOKEN_GOERLI.address, 10000, 0);
    await troveManager.addCollateralToken(RETH_TOKEN_GOERLI.address, 9000, 500);
    console.log("adding supply tokens");
    await troveManager.addSupplyToken(USDC_TOKEN_GOERLI.address, 9000, 500);
    await troveManager.addSupplyToken(UNI_TOKEN_GOERLI.address, 8000, 3000);
    await troveManager.addSupplyToken(
      CHAINLINK_TOKEN_GOERLI.address,
      8000,
      3000
    );
  } else if (networkName === "localhost") {
    await troveManager.addSupplyToken(USDC_TOKEN.address, 9000, 500);
    await troveManager.addSupplyToken(LUSD_TOKEN.address, 9000, 500);
    await troveManager.addSupplyToken(WBTC_TOKEN.address, 8000, 500);

    await troveManager.addCollateralToken(WETH_TOKEN.address, 10000, 0);
    await troveManager.addCollateralToken(RETH_TOKEN.address, 9000, 500);
  }

  const deployments = {
    uniUtils: getUniUtilsAddress(networkName),
    supply: supplyAddress,
    troveManager: troveManager.address,
  };

  var fs = require("fs");
  fs.writeFile(
    "./deployments/deployments_" + networkName + ".json",
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
