import { ethers } from "hardhat";

import {NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS} from "../../webapp/src/utils/constants"

async function main() {

  const Supply = await ethers.getContractFactory("Supply");
  const supply = await Supply.deploy(NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS);

  await supply.deployed();

  console.log(`supply deployed to ${supply.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
