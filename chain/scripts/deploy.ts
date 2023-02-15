import { ethers } from "hardhat";

import {
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  USDC_TOKEN,
  WETH_TOKEN,
} from "../../webapp/src/libs/constants";

async function main() {
  const Supply = await ethers.getContractFactory("Supply");
  const supply = await Supply.deploy();

  const CollateralVault = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVault.deploy(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
  );

  await supply.deployed();
  await collateralVault.deployed();

  await supply.addDepositToken(USDC_TOKEN.address);
  await supply.addDepositToken(WETH_TOKEN.address);

  console.log(`supply deployed to ${supply.address}`);
  console.log(`collateral vault deployed to ${collateralVault.address}`);

  const deployments = {
    supply: supply.address,
    collateralVault: collateralVault.address,
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
