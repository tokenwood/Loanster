import { BigNumber, ethers } from "ethers";
import { concat } from "ethers/lib/utils.js";

//this file contains shared classes between the front-end and back-end. Should be a module instead?

export interface TokenOfferStatsResponse {
  minAPY: number;
  total: BigNumber;
}

export function getOfferKey(owner: string, token: string, offerId: number) {
  const a = ethers.utils.toUtf8Bytes(owner);
  const b = ethers.utils.toUtf8Bytes(token);
  const c = ethers.utils.toUtf8Bytes(BigNumber.from(offerId).toHexString());

  return ethers.utils.keccak256(concat([a, b, c]));
}
