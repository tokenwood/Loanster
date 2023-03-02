import { BigNumber } from "ethers";
import {
  ADDRESS_TO_TOKEN,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  POOL_FACTORY_CONTRACT_ADDRESS,
} from "./constants";
import { Address } from "wagmi";
import { Provider } from "@wagmi/core";
import { nonfungiblePositionManagerABI } from "abi/NonfungiblePositionManagerABI";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { computePoolAddress, tickToPrice } from "@uniswap/v3-sdk";
import { FeeAmount, Pool } from "@uniswap/v3-sdk";
import { ethers } from "ethers";
import { Position } from "@uniswap/v3-sdk";
import { getToken } from "./unilend_utils";
import { Fraction, Price, Token } from "@uniswap/sdk-core";
import { TickMath } from "@uniswap/v3-sdk";
import { erc721ABI } from "@wagmi/core";

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
  fee: number;
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
  fee: number;
  priceLower: number;
  priceUpper: number;
  currentPrice: number;
}

export async function getFullPositionInfo(
  provider: Provider,
  tokenId: number
): Promise<FullPositionInfo> {
  const positionInfo = await getPositionInfo(provider, tokenId);
  const token0 = await getToken(provider, positionInfo.token0);
  const token1 = await getToken(provider, positionInfo.token1);
  const pool = await getPool(provider, token0, token1, positionInfo.fee);

  const position = new Position({
    pool,
    liquidity: positionInfo.liquidity.toString(),
    tickLower: positionInfo.tickLower,
    tickUpper: positionInfo.tickUpper,
  });

  //todo
  // eth value
  // claimable fees
  const priceLower = tickToPrice(token1, token0, positionInfo.tickLower);
  const priceUpper = tickToPrice(token1, token0, positionInfo.tickUpper);
  const currentPrice = tickToPrice(token1, token0, pool.tickCurrent);

  return {
    token0: token0,
    token1: token1,
    balance0: BigNumber.from(position.amount0.numerator.toString()),
    balance1: BigNumber.from(position.amount1.numerator.toString()),
    fee: positionInfo.fee,
    priceLower: parseFloat(priceLower.toSignificant(4)),
    priceUpper: parseFloat(priceUpper.toSignificant(4)),
    currentPrice: parseFloat(currentPrice.toSignificant(4)),
  };
}

export async function getPool(
  provider: Provider,
  tokenA: Token,
  tokenB: Token,
  fee: FeeAmount
): Promise<Pool> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokenA,
    tokenB: tokenB,
    fee: fee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );

  const [liquidity, slot0] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const pool = new Pool(tokenA, tokenB, fee, slot0[0], liquidity, slot0[1]);
  return pool;
}
