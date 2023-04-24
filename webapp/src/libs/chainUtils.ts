import { TroveManager } from "../../../chain/deployments/localhost/typechain-types/contracts/TroveManager";
import { Supply } from "../../../chain/deployments/localhost/typechain-types/contracts/Supply";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import { Address } from "wagmi";
import supplyContractJSON from "../../../chain/deployments/localhost/Supply.json";
import troveManagerJSON from "../../../chain/deployments/localhost/TroveManager.json";
import deploymentsLocalhost from "../../../chain/deployments/localhost/deployments.json";
import deploymentsGoerli from "../../../chain/deployments/goerli/deployments.json";

export function getDeployments(provider: Provider) {
  const network = provider.network.name;
  switch (network) {
    case "hardhat":
      return deploymentsLocalhost;
    case "goerli":
      return deploymentsGoerli;
    default:
      throw new Error("Unknown network");
  }
}

export function getTroveManagerContract(provider: Provider) {
  return new ethers.Contract(
    getTroveManagerAddress(provider),
    getTroveManagerABI(),
    provider
  ) as TroveManager;
}

export function getSupplyContract(provider: Provider) {
  return new ethers.Contract(
    getSupplyAddress(provider),
    getSupplyABI(),
    provider
  ) as Supply;
}

export function getSupplyAddress(provider: Provider): Address {
  return getDeployments(provider).supply as Address;
}

export function getSupplyABI(): any {
  return supplyContractJSON.abi;
}

export function getTroveManagerAddress(provider: Provider): Address {
  return getDeployments(provider).troveManager as Address;
}

export function getTroveManagerABI(): any {
  return troveManagerJSON.abi;
}
