import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber, ContractReceipt } from "ethers";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "../../webapp/src/libs/constants";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

export async function deployTokensFixture() {
  const [owner, account1, account2] = await ethers.getSigners();
  const TestToken = await ethers.getContractFactory("TestToken");
  const tokens = [];

  for (let i = 0; i < 2; i++) {
    const testToken = await TestToken.deploy();
    console.log("deploying token " + i);

    await testToken.mint(account1.address, 1000);
    await testToken.mint(account2.address, 1000);
    tokens.push(testToken);
  }
  return { token: tokens[0], token2: tokens[1] };
}

export async function deploySupplyFixture() {
  const Supply = await ethers.getContractFactory("Supply");
  const supply = await Supply.deploy();
  await supply.deployed();

  return { supply };
}

export async function deployCollateralVault() {
  const CollateralVault = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVault.deploy(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
  );
  await collateralVault.deployed();

  return { collateralVault };
}
