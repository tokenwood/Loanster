import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import collateralContractJSON from "../../../chain/artifacts/contracts/CollateralVault.sol/CollateralVault.json";
import { BigNumber } from "ethers";

export interface DepositInfo {
  token: Address;
  amountDeposited: BigNumber;
  amountBorrowed: BigNumber;
  expiration: BigNumber;
  interestRateBPS: BigNumber;
}

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
}

export function getSupplyABI(): any {
  return supplyContractJSON.abi;
}

export function getCollateralAddress(): Address {
  return deployments.collateralVault as Address;
}

export function getCollateralABI(): any {
  return collateralContractJSON.abi;
}

export async function getSupplyTokens(provider: Provider): Promise<Address[]> {
  const supplyAddress = getSupplyAddress();
  const supplyContract = new ethers.Contract(
    supplyAddress,
    supplyContractJSON.abi,
    provider
  );

  let eventFilter = supplyContract.filters.DepositTokenChange();
  let events = await supplyContract.queryFilter(eventFilter);
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

export async function getSupplyDepositIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyAddress = getSupplyAddress();
  const supplyContract = new ethers.Contract(
    supplyAddress,
    supplyContractJSON.abi,
    provider
  );

  console.log("fetching supply deposit ids");
  const balance: number = await supplyContract.balanceOf(account);

  // Get all positions
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number =
      await supplyContract.tokenOfOwnerByIndex(account, i);
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
