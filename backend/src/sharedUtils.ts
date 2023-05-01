import { BigNumber, ethers } from 'ethers';

//this file contains shared classes between the front-end and back-end. Should be a module instead? TODO: Refactor

export interface TokenOfferStatsResponse {
  apy7d: number;
  apy30d: number;
  apy90d: number;
  total: BigNumber;
}

export function getOfferKey(owner: string, token: string, offerId: number) {
  return ethers.utils.solidityKeccak256(
    ['address', 'address', 'uint256'],
    [owner, token, BigNumber.from(offerId)],
  );
}
