import { Address } from "wagmi";
import {
  DepositInfo,
  floatToBigNumber,
  FullDepositInfo,
  getAmountAvailableForDepositInfo,
  getFullDepositInfo,
  getSupplyContract,
  getToken,
} from "./unilend_utils";
import { Provider } from "@wagmi/core";

import { BigNumber } from "ethers";

let cachedDeposits: Map<number, FullDepositInfo> | undefined = undefined;
let sortedIds: number[] | undefined = undefined;

//todo: update all deposits if stale.
export interface LoanParameters {
  tokenAddress: Address;
  amount: number;
  term: number; // timestamp
  troveId?: number;
}

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}

export async function getLoans(provider: Provider, params: LoanParameters) {
  const { cachedDeposits, sortedIds } = await getAllDeposits(provider);
  const loans: [FullDepositInfo, BigNumber][] = [];
  const token = await getToken(provider, params.tokenAddress);

  let toLoan = floatToBigNumber(params.amount.toString(), token.decimals);

  for (let i = 0; i < (sortedIds.length && toLoan.gt(BigNumber.from(0))); i++) {
    const depositId = sortedIds[i];
    const deposit = cachedDeposits.get(depositId)!;
    //todo implement duration filters
    if (deposit.token.address == params.tokenAddress) {
      const toLoanDeposit = bigNumberMin(
        getAmountAvailableForDepositInfo(deposit),
        toLoan
      );
      loans.push([deposit, toLoanDeposit]);
      toLoan = toLoan.sub(toLoanDeposit);
    }
  }

  return loans;
}

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

  let deposits = new Map<number, FullDepositInfo>();

  await Promise.all(
    supplyIds.map(async (id) => {
      const depositInfo = await getFullDepositInfo(provider, id);
      deposits.set(id, depositInfo);
    })
  );

  sortedIds = supplyIds.sort(
    (a, b) =>
      deposits.get(a)!.depositInfo.interestRateBPS.toNumber() -
      deposits.get(b)!.depositInfo.interestRateBPS.toNumber()
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
    filtered = sortedIds.filter((value) =>
      filter(cachedDeposits.get(value)!.depositInfo)
    );
  }

  return filtered.map((value) => cachedDeposits.get(value)!);
}
