import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import collateralContractJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { BigNumber } from "ethers";

export interface DepositInfo {
  token: Address;
  amountDeposited: BigNumber;
  amountBorrowed: BigNumber;
  expiration: BigNumber;
  interestRateBPS: BigNumber;
}

function getTroveManagerContract(provider: Provider) {
  return new ethers.Contract(
    getTroveManagerAddress(),
    getTroveManagerABI(),
    provider
  );
}

function getSupplyContract(provider: Provider) {
  return new ethers.Contract(getSupplyAddress(), getSupplyABI(), provider);
}

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
}

export function getSupplyABI(): any {
  return supplyContractJSON.abi;
}

export function getTroveManagerAddress(): Address {
  return deployments.troveManager as Address;
}

export function getTroveManagerABI(): any {
  return collateralContractJSON.abi;
}

export async function getSupplyTokens(provider: Provider): Promise<Address[]> {
  const supplyContract = getSupplyContract(provider);
  let eventFilter = supplyContract.filters.DepositTokenChange();
  let events = await supplyContract.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
}

export async function getCollateralTokens(
  provider: Provider
): Promise<Address[]> {
  const troveManager = getTroveManagerContract(provider);
  let eventFilter = troveManager.filters.CollateralTokenChange();
  let events = await troveManager.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
}

export function getAllowedTokensFromEvents(events: ethers.Event[]) {
  let allowedTokens = new Set<Address>();

  events.forEach((event) => {
    let address = event.args!.token;
    let isAllowed = event.args!.isAllowed;

    if (isAllowed) {
      allowedTokens.add(address);
    } else {
      if (allowedTokens.has(address)) {
        allowedTokens.delete(address);
      } else {
        console.log("removing unadded token");
      }
    }
  });

  return Array.from(allowedTokens.values());
}

export async function getTroveIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const troveManager = getTroveManagerContract(provider);
  return getERC721Ids(troveManager, account);
}

export async function getSupplyDepositIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyContract = getSupplyContract(provider);
  console.log("fetching supply deposit ids");
  return getERC721Ids(supplyContract, account);
}

export async function getERC721Ids(
  contract: ethers.Contract,
  account: Address
) {
  const balance: number = await contract.balanceOf(account);
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number = await contract.tokenOfOwnerByIndex(
      account,
      i
    );
    tokenIds.push(tokenOfOwnerByIndex);
  }
  return tokenIds;
}

export function floatToBigNumber(floatString: string, decimals: number) {
  let i = floatString.indexOf(".");
  if (i == -1) {
    i = floatString.length;
  }
  let numberString = floatString.replace(".", "");
  numberString = numberString + "0".repeat(decimals);
  numberString = numberString.substring(0, i + decimals);
  return BigNumber.from(numberString);
}
