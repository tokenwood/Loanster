import { BigNumber } from "ethers";
import { ADDRESS_TO_TOKEN } from "./constants";

export interface PositionInfo {
  tickLower: number;
  tickUpper: number;
  liquidity: BigNumber;
  feeGrowthInside0LastX128: BigNumber;
  feeGrowthInside1LastX128: BigNumber;
  tokensOwed0: BigNumber;
  tokensOwed1: BigNumber;
  token0: string;
  token1: string;
}

export function getTokenName(address: string) {
  if (ADDRESS_TO_TOKEN[address] !== undefined) {
    return ADDRESS_TO_TOKEN[address].symbol!;
  } else {
    return address;
  }
}
