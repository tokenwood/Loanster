import { BigNumber } from "ethers";

//this file contains shared classes between the front-end and back-end. Should be a module instead?

export interface TokenOfferStatsResponse {
  minAPY: number;
  total: BigNumber;
}
