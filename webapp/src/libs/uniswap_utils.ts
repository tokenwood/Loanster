import { BigNumber } from "ethers";
import {
  ADDRESS_TO_TOKEN,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from "./constants";
import { Address } from "wagmi";
import { Provider } from "@wagmi/core";
import { nonfungiblePositionManagerABI } from "abi/NonfungiblePositionManagerABI";
import { ethers } from "ethers";
import { erc721ABI } from "@wagmi/core";
import { Position } from "@uniswap/v3-sdk";

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

export async function getPositionIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  if (!provider) {
    throw new Error("No provider available");
  }

  console.log("fetching uniswap position ids");
  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    nonfungiblePositionManagerABI,
    provider
  );

  // Get number of positions
  const balance: number = await positionContract.balanceOf(account);

  // Get all positions
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number =
      await positionContract.tokenOfOwnerByIndex(account, i);
    tokenIds.push(tokenOfOwnerByIndex);
  }

  return tokenIds;
}

export async function getPositionInfo(
  tokenId: number,
  provider: Provider
): Promise<PositionInfo> {
  if (!provider) {
    throw new Error("No provider available");
  }

  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    nonfungiblePositionManagerABI,
    provider
  );

  const position: PositionInfo = await positionContract.positions(tokenId);

  return position;
}
