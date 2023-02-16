import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import { BigNumber } from "ethers";

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
}

export function getCollateralAddress(): Address {
  return deployments.collateralVault as Address;
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
