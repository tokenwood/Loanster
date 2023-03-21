import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import troveManagerJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { BigNumber } from "ethers";
import { ADDRESS_TO_TOKEN, WETH_TOKEN } from "./constants";
import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { CurrencyAmount } from "@uniswap/sdk-core";

import {
  LoanOfferStructOutput,
  LoanStructOutput,
} from "../../../chain/typechain-types/contracts/Supply";
import { FullOfferInfo } from "./backend";

export interface LoanParameters {
  tokenAddress: Address;
  amount: number;
  duration: number; // seconds
}

export interface TroveStats {
  collateralValueEth: CurrencyAmount<Token>;
  loanValueEth: CurrencyAmount<Token>; // timestamp
  healthFactor: number;
}

export interface LoanStats {
  loans: [FullOfferInfo, BigNumber][];
  amount: BigNumber;
  rate: BigNumber; // timestamp
  token: Token;
}

export interface TroveInfo {
  token: Address;
  amount: BigNumber;
}

export interface TokenBalanceInfo {
  amount: BigNumber;
  token: Token;
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

export function getLoanStats(loans: [FullOfferInfo, BigNumber][]): LoanStats {
  //   let minInterest = BigNumber.from(0);
  let totalAmount = BigNumber.from(0);
  let totalInterest = BigNumber.from(0);

  for (let i = 0; i < loans.length; i++) {
    totalAmount = totalAmount.add(loans[i][1]);
    totalInterest = totalInterest.add(
      loans[i][0].offer.interestRateBPS.mul(loans[i][1])
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

export function getTokenName(address: string) {
  if (ADDRESS_TO_TOKEN[address] !== undefined) {
    return ADDRESS_TO_TOKEN[address].symbol!;
  } else {
    return address;
  }
}

export async function getToken(provider: Provider, tokenAddress: string) {
  if (ADDRESS_TO_TOKEN[tokenAddress] !== undefined) {
    return ADDRESS_TO_TOKEN[tokenAddress];
  } else {
    // throw new Error("unknown token " + address);
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
    const decimals: number = await tokenContract.decimals();
    const symbol: string = await tokenContract.symbol();

    return new Token(
      SupportedChainId.MAINNET,
      tokenAddress,
      decimals,
      symbol,
      symbol
    );
  }
}

export async function getTokenBalance(
  provider: Provider,
  tokenAddress: Address,
  account: Address
): Promise<TokenBalanceInfo> {
  const token = await getToken(provider, tokenAddress);
  console.log("fetching token balance " + token.symbol);

  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  const balance: BigNumber = await tokenContract.balanceOf(account);

  return {
    token: token,
    amount: balance,
  };
}

export function getTroveManagerContract(provider: Provider) {
  return new ethers.Contract(
    getTroveManagerAddress(),
    getTroveManagerABI(),
    provider
  );
}

export function getSupplyContract(provider: Provider) {
  return new ethers.Contract(getSupplyAddress(), getSupplyABI(), provider);
}

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
}

export function getSupplyABI(): any {
  return supplyContractJSON.abi;
}

export function getTroveManagerAddress(): Address {
  return deployments.troveManager as Address;
}

export function getTroveManagerABI(): any {
  return troveManagerJSON.abi;
}

export async function getSupplyTokenAddresses(
  provider: Provider
): Promise<Address[]> {
  console.log("fetching supply tokens");
  const supplyContract = getTroveManagerContract(provider);
  let eventFilter = supplyContract.filters.SupplyTokenChanged();
  let events = await supplyContract.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
}

export async function getSupplyTokens(provider: Provider) {
  const addresses = await getSupplyTokenAddresses(provider);
  const queries = addresses.map((value) => getToken(provider, value));
  return await Promise.all(queries);
}

export async function getCollateralTokens(
  provider: Provider
): Promise<Address[]> {
  const troveManager = getTroveManagerContract(provider);
  let eventFilter = troveManager.filters.CollateralTokenChange();
  let events = await troveManager.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
}

export async function getTroveInfo(
  id: number,
  provider: Provider
): Promise<TroveInfo> {
  console.log("fetching trove info");
  const troveManager = getTroveManagerContract(provider);
  const troveInfo: TroveInfo = await troveManager.getTrove(id);
  return troveInfo;
}

export function getAllowedTokensFromEvents(events: ethers.Event[]) {
  let allowedTokens = new Set<Address>();

  events.forEach((event) => {
    let address = event.args!.token;
    let isAllowed = event.args!.isAllowed;

    if (isAllowed) {
      allowedTokens.add(address);
    } else {
      if (allowedTokens.has(address)) {
        allowedTokens.delete(address);
      } else {
        console.log("removing unadded token");
      }
    }
  });

  return Array.from(allowedTokens.values());
}

export async function getTroveIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const troveManager = getTroveManagerContract(provider);
  console.log(troveManager.address);
  return getERC721Ids(troveManager, account);
}

export async function getTroveLoanIds(
  provider: Provider,
  troveId: number
): Promise<number[]> {
  const troveManager = getTroveManagerContract(provider);
  console.log("fetching loan ids");

  const numLoans: number = await troveManager.getNumLoansForTroveId(troveId);
  const loanIds = [];
  for (let i = 0; i < numLoans; i++) {
    const tokenOfOwnerByIndex: BigNumber =
      await troveManager.getLoanIdByIndexForTroveId(troveId, i);
    loanIds.push(tokenOfOwnerByIndex.toNumber());
  }
  return loanIds;
}

export async function getLoanIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyContract = getSupplyContract(provider);
  console.log("fetching supply deposit ids" + supplyContract.address);
  return getERC721Ids(supplyContract, account);
}

//todo use Promise.All() to parallelize
export async function getERC721Ids(
  contract: ethers.Contract,
  account: Address
): Promise<number[]> {
  console.log("hello");
  const balance: number = await contract.balanceOf(account);
  const requests = [];
  for (let i = 0; i < balance; i++) {
    requests.push(contract.tokenOfOwnerByIndex(account, i));
  }
  const tokenIdsBN: BigNumber[] = await Promise.all(requests);
  return tokenIdsBN.map((value) => value.toNumber());
}

export function floatToBigNumber(floatString: string, decimals: number) {
  let i = floatString.indexOf(".");
  if (i == -1) {
    i = floatString.length;
  }
  let numberString = floatString.replace(".", "");
  numberString = numberString + "0".repeat(decimals);
  numberString = numberString.substring(0, i + decimals);
  return BigNumber.from(numberString);
}

export function formatDate(timestamp: BigNumber) {
  const date = new Date(timestamp.toNumber());
  return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDay();
}
