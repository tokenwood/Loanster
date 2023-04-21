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
import fs from "fs";

const networkName = hre.network.name;

async function main() {
  if (!["localhost", "goerli"].includes(networkName)) {
    throw error("unknown network: " + networkName);
  }
  console.log("deploying to network: ", networkName);
  const [deployer] = await ethers.getSigners();
  console.log("deployer address: ", deployer.address);

  const supply = await deploySupply();
  console.log(`supply deployed to ${supply.address}`);

  const troveManager = await deployTroveManager(supply.address, networkName);
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

  // save deployment artifacts
  save_deployment_artifacts(troveManager.address, supply.address, networkName);
}

function save_deployment_artifacts(
  troveManagerAddress: string,
  supplyAddress: string,
  networkName: string
) {
  const deployments = {
    uniUtils: getUniUtilsAddress(networkName),
    supply: supplyAddress,
    troveManager: troveManagerAddress,
  };
  const deployment_path = `deployments/${networkName}`;
  if (!fs.existsSync(deployment_path)) {
    fs.mkdirSync(deployment_path);
  }
  if (!fs.existsSync(deployment_path + "/typechain-types")) {
    fs.mkdirSync(deployment_path + "/typechain-types");
  }
  if (!fs.existsSync(deployment_path + "/typechain-types/contracts")) {
    fs.mkdirSync(deployment_path + "/typechain-types/contracts");
  }

  fs.copyFileSync(
    "artifacts/contracts/Supply.sol/Supply.json",
    deployment_path + "/Supply.json"
  );
  fs.copyFileSync(
    "typechain-types/contracts/Supply.ts",
    deployment_path + "/typechain-types/contracts/Supply.ts"
  );
  fs.copyFileSync(
    "artifacts/contracts/TroveManager.sol/TroveManager.json",
    deployment_path + "/TroveManager.json"
  );
  fs.copyFileSync(
    "typechain-types/contracts/TroveManager.ts",
    deployment_path + "/typechain-types/contracts/TroveManager.ts"
  );
  fs.copyFileSync(
    "typechain-types/common.ts",
    deployment_path + "/typechain-types/common.ts"
  );

  // var fs = require("fs");
  fs.writeFile(
    deployment_path + `/deployments.json`,
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
