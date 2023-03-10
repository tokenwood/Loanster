import { Address } from "wagmi";
import {
  DepositInfo,
  floatToBigNumber,
  FullDepositInfo,
  getAmountAvailableForDepositInfo,
  getFullDepositInfo,
  getSupplyContract,
  getToken,
  getTroveManagerContract,
} from "./unilend_utils";
import { Provider } from "@wagmi/core";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import { Token } from "@uniswap/sdk-core";
import { WETH_TOKEN } from "./constants";

let cachedDeposits: Map<number, FullDepositInfo> | undefined = undefined;
let sortedIds: number[] | undefined = undefined;

//todo: update all deposits if stale.
export interface LoanParameters {
  tokenAddress: Address;
  amount: number;
  term: number; // timestamp
}

export interface TroveStats {
  collateralValueEth: CurrencyAmount<Token>;
  loanValueEth: CurrencyAmount<Token>; // timestamp
  healthFactor: number;
}

export async function getNewTroveStats(
  provider: Provider,
  loanStats: LoanStats,
  troveId: number
): Promise<TroveStats> {
  console.log("fetching trove stats");
  const contract = getTroveManagerContract(provider);

  // collateral value
  const [collateralValue, collateralFactorBPS]: [BigNumber, BigNumber] =
    await contract.getTroveCollateralValue(troveId);

  // total loans value
  const loansValue: BigNumber = await contract.getTroveLoansValue(
    troveId,
    loanStats.amount,
    loanStats.token.address
  );

  // new health factor
  const healthFactor: BigNumber = await contract.getHealthFactorBPS(
    troveId,
    loanStats.amount,
    loanStats.token.address
  );

  return {
    collateralValueEth: CurrencyAmount.fromRawAmount(
      WETH_TOKEN,
      collateralValue.toString()
    ),
    loanValueEth: CurrencyAmount.fromRawAmount(
      WETH_TOKEN,
      loansValue.toString()
    ),
    healthFactor: healthFactor.toNumber() / 10000,
  };
}

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}

export interface LoanStats {
  loans: [FullDepositInfo, BigNumber][];
  amount: BigNumber;
  rate: BigNumber; // timestamp
  token: Token;
}

export function getLoanStats(loans: [FullDepositInfo, BigNumber][]) {
  //   let minInterest = BigNumber.from(0);
  let totalAmount = BigNumber.from(0);
  let totalInterest = BigNumber.from(0);

  for (let i = 0; i < loans.length; i++) {
    totalAmount = totalAmount.add(loans[i][1]);
    totalInterest = totalInterest.add(
      loans[i][0].depositInfo.interestRateBPS.mul(loans[i][1])
    );
    // minInterest = minInterest.add(loans[i][0].depositInfo.minLoanDuration.mul(loans[i][0].depositInfo.interestRateBPS).mod())
  }
  let averageRate = totalInterest.div(totalAmount);
  return {
    loans: loans,
    amount: totalAmount,
    rate: averageRate,
    token: loans[0][0].token,
  };
}

export async function getLoans(provider: Provider, params: LoanParameters) {
  const { cachedDeposits, sortedIds } = await getAllDeposits(provider);
  const loans: [FullDepositInfo, BigNumber][] = [];
  const token = await getToken(provider, params.tokenAddress);

  let toLoan = floatToBigNumber(params.amount.toString(), token.decimals);

  for (let i = 0; i < sortedIds.length && toLoan.gt(BigNumber.from(0)); i++) {
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
