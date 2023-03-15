import { ethers } from "hardhat";

export async function deployUniUtils() {
  const UniUtils = await ethers.getContractFactory("UniUtils");
  const uniUtils = await UniUtils.deploy();
  return uniUtils;
}
