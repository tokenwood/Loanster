import { deployUniUtils } from "./utils";
import hre from "hardhat";
import { error } from "console";

const networkName = hre.network.name;
const chainId = hre.network.config.chainId;

async function main() {
  if (networkName !== "localhost") {
    throw error("should deploy to localhost");
  }

  const uniUtils = await deployUniUtils();
  console.log(`uni utils deployed to ${uniUtils.address}`);

  const deployments = {
    uniUtils: uniUtils.address,
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
