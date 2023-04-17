import { ethers } from "hardhat";
import deployments from "../cache/deployments.json";

export function getSupplyContract() {
  return ethers.getContractAt("Supply", deployments.supply);
}
