import { deployUniUtils } from "./utils";
import hre from "hardhat";
import { error } from "console";
import { ethers } from "hardhat";
import { WETH_TOKEN_GOERLI, WETH_TOKEN } from "../../webapp/src/libs/constants";

const networkName = hre.network.name;

async function main() {
  if (!["localhost", "goerli"].includes(networkName)) {
    throw error("unknown network: " + networkName);
  }

  console.log("deploying to network: ", networkName);
  const [deployer] = await ethers.getSigners();
  console.log("deployer address: ", deployer.address);

  const wethAddress =
    networkName === "goerli" ? WETH_TOKEN_GOERLI.address : WETH_TOKEN.address;

  console.log("weth address: " + wethAddress);
  const uniUtils = await deployUniUtils(wethAddress!);
  console.log(`uni utils deployed to ${uniUtils.address}`);

  const deployments = {
    uniUtils: uniUtils.address,
  };

  var fs = require("fs");
  fs.writeFile(
    "./cache/deployments_" + networkName + ".json",
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
