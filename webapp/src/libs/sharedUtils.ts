import { BigNumber, ethers } from "ethers";
import { concat } from "ethers/lib/utils.js";

//this file contains shared classes between the front-end and back-end. Should be a module instead?

export interface TokenOfferStatsResponse {
  minAPY: number;
  total: BigNumber;
}

export function getOfferKey(owner: string, token: string, offerId: number) {
  return ethers.utils.solidityKeccak256(
    ["address", "address", "uint256"],
    [owner, token, BigNumber.from(offerId)]
  );
}
