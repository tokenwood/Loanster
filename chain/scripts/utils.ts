import { ethers } from "hardhat";

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

export async function deployUniUtils() {
  const UniUtils = await ethers.getContractFactory("UniUtils");
  const uniUtils = await UniUtils.deploy();
  return uniUtils;
}

export async function deployTroveManager(
  supplyAddress: string,
  wethAddress: string,
  uniUtilsAddress: string
) {
  const TroveManager = await ethers.getContractFactory("TroveManager", {
    libraries: {
      UniUtils: uniUtilsAddress,
    },
  });

  const troveManager = await TroveManager.deploy(wethAddress, supplyAddress);

  return troveManager;
}
