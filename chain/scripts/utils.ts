import { ethers } from "hardhat";
import deployments from "../../unilib/cache/deployments.json";

export function getUniUtilsAddress() {
  if (deployments == undefined) {
    throw Error("uni utils not deployed");
  }
  return deployments.uniUtils;
}

export function getUniUtilsContract() {
  const contract = ethers.getContractAt("IUniUtils", getUniUtilsAddress());
  return contract;
}

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

export async function deploySupply() {
  const Supply = await ethers.getContractFactory("Supply");
  const supply = await Supply.deploy();
  await supply.deployed();

  return supply;
}

export async function deployTroveManager(
  supplyAddress: string,
  wethAddress: string
) {
  const TroveManager = await ethers.getContractFactory("TroveManager");

  const troveManager = await TroveManager.deploy(
    wethAddress,
    supplyAddress,
    getUniUtilsAddress()
  );

  return troveManager;
}
