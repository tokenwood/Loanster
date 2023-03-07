import { Address, useBalance } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { ethers } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import troveManagerJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { BigNumber } from "ethers";
import { FetchBalanceResult } from "@wagmi/core";
import { ADDRESS_TO_TOKEN } from "./constants";
import { SupportedChainId, Token } from "@uniswap/sdk-core";

export interface DepositInfo {
  token: Address;
  amountDeposited: BigNumber;
  interestRateBPS: BigNumber;
  expiration: BigNumber;
  maxLoanDuration: BigNumber;
  minLoanDuration: BigNumber;
  claimableInterest: BigNumber;
}

export interface TroveInfo {
  token: Address;
  amountOrId: BigNumber;
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

export async function getERC721Allowance(
  provider: Provider,
  tokenAddress: Address,
  tokenId: number
) {
  const tokenContract = new ethers.Contract(tokenAddress, erc721ABI, provider);
  const approved: Address = await tokenContract.getApproved(tokenId);

  return approved;
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

export interface TokenBalanceInfo {
  // symbol: string;
  amount: BigNumber;
  token: Token;
  // decimals: number;
}

export async function getSupplyTokens(provider: Provider): Promise<Address[]> {
  console.log("fetching supply tokens");
  const supplyContract = getSupplyContract(provider);
  let eventFilter = supplyContract.filters.DepositTokenChange();
  let events = await supplyContract.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
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

export async function getDepositInfo(provider: Provider, id: number) {
  const supplyContract = getSupplyContract(provider);
  const depositInfo: DepositInfo = await supplyContract.getDeposit(id);
  return depositInfo;
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
  return getERC721Ids(troveManager, account);
}

export async function getLoanIds(
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

export async function getSupplyDepositIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyContract = getSupplyContract(provider);
  console.log("fetching supply deposit ids");
  return getERC721Ids(supplyContract, account);
}

//todo use Promise.All() to parallelize
export async function getERC721Ids(
  contract: ethers.Contract,
  account: Address
) {
  const balance: number = await contract.balanceOf(account);
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: BigNumber = await contract.tokenOfOwnerByIndex(
      account,
      i
    );
    tokenIds.push(tokenOfOwnerByIndex.toNumber());
  }
  return tokenIds;
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
