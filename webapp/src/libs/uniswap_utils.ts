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
import { getToken } from "./unilend_utils";
import { Token } from "@uniswap/sdk-core";

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
  provider: Provider,
  tokenId: number
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

export interface FullPositionInfo {
  token0: Token;
  token1: Token;
  balance0: BigNumber;
  balance1: BigNumber;
}

export async function getFullPositionInfo(
  provider: Provider,
  tokenId: number
): Promise<FullPositionInfo> {
  const position = await getPositionInfo(provider, tokenId);
  const token0 = await getToken(provider, position.token0);
  const token1 = await getToken(provider, position.token1);

  return {
    token0: token0,
    token1: token1,
    balance0: BigNumber.from(0),
    balance1: BigNumber.from(0),
  };
}
