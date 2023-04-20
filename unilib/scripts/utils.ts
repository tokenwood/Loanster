import { ethers } from "hardhat";

export async function deployUniUtils(wethAddress: string) {
  const UniUtils = await ethers.getContractFactory("UniUtils");
  const uniUtils = await UniUtils.deploy(wethAddress);
  return uniUtils;
}
