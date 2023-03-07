import { Address, useBalance } from "wagmi";
import { DepositInfo, getSupplyContract } from "./unilend_utils";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import troveManagerJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { BigNumber } from "ethers";
import { FetchBalanceResult } from "@wagmi/core";
import { ADDRESS_TO_TOKEN } from "./constants";
import { SupportedChainId, Token } from "@uniswap/sdk-core";

let cachedDeposits: Map<number, DepositInfo> | undefined = undefined;
let sortedIds: number[] | undefined = undefined;

//todo: update all deposits if stale. in future: save to disk?

async function getAllDeposits(provider: Provider) {
  if (cachedDeposits && sortedIds) {
    console.log("returning cached deposits");
    return { cachedDeposits, sortedIds };
  }
  console.log("loading all supply deposits");

  const supplyContract = getSupplyContract(provider);
  const totalSupply: number = (await supplyContract.totalSupply()).toNumber();

  const idQueries = [];
  for (let i = 0; i < totalSupply; i++) {
    idQueries.push(supplyContract.tokenByIndex(i));
  }
  const supplyIdsBN: BigNumber[] = await Promise.all(idQueries);
  const supplyIds = supplyIdsBN.map((value) => value.toNumber());

  let deposits = new Map<number, DepositInfo>();

  await Promise.all(
    supplyIds.map(async (id) => {
      const depositInfo = await supplyContract.getDeposit(id);
      deposits.set(id, depositInfo);
    })
  );

  sortedIds = supplyIds.sort(
    (a, b) =>
      deposits.get(a)!.interestRateBPS.toNumber() -
      deposits.get(b)!.interestRateBPS.toNumber()
  );
  cachedDeposits = deposits;

  return { cachedDeposits, sortedIds };
}

export async function getSortedSupply(
  provider: Provider,
  filter?: (info: DepositInfo) => boolean
) {
  const { cachedDeposits, sortedIds } = await getAllDeposits(provider);
  let filtered = sortedIds;
  if (filter) {
    filtered = sortedIds.filter((value) => filter(cachedDeposits.get(value)!));
  }

  return filtered.map((value) => cachedDeposits.get(value)!);
}
