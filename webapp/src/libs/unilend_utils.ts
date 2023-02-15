import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
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
