import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { ethers, utils } from "ethers";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import troveManagerJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { TroveManager } from "../../../chain/typechain-types/contracts/TroveManager";
import { Supply } from "../../../chain/typechain-types/contracts/Supply";
import { BigNumber } from "ethers";
import { ADDRESS_TO_TOKEN, WETH_TOKEN } from "./constants";
import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { FullOfferInfo, getOffersFrom } from "./backend";

export type LoanOfferType = {
  owner: string;
  token: string;
  offerId: number;
  nonce: number;
  minLoanAmount: BigNumber;
  amount: BigNumber;
  interestRateBPS: number;
  expiration: number;
  minLoanDuration: number;
  maxLoanDuration: number;
};

export type LoanType = {
  token: string;
  amount: BigNumber;
  startTime: number;
  minRepayTime: number;
  expiration: number;
  interestRateBPS: number;
};

export interface LoanParameters {
  tokenAddress: Address;
  amount: number;
  duration: number; // seconds
}

export interface AccountStats {
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

export interface FullAccountInfo {
  deposits: TokenBalanceInfo[];
  loanIds: number[];
}

export interface FullLoanInfo {
  loan: LoanType;
  loanId: number;
  interest: BigNumber;
  claimable: BigNumber;
  token: Token;
}

export interface TokenBalanceInfo {
  amount: BigNumber;
  token: Token;
}

export async function getNewAccountStats(
  provider: Provider,
  loanStats: LoanStats,
  account: Address
): Promise<AccountStats> {
  const contract = getTroveManagerContract(provider);

  // collateral value
  const [collateralValue, collateralFactorBPS]: [BigNumber, BigNumber] =
    await contract.getCollateralValueEth(account);

  // total loans value
  const [loansValue, adjustedLoansValue] = await contract.getLoansValueEth(
    account
  );

  // new health factor
  const healthFactor: BigNumber = await contract.getHealthFactorBPS(
    account,
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

export function getLoanStats(
  loans: [FullOfferInfo, BigNumber][]
): LoanStats | undefined {
  if (loans.length == 0) {
    return undefined;
  }
  //   let minInterest = BigNumber.from(0);
  let totalAmount = BigNumber.from(0);
  let totalInterest = BigNumber.from(0);

  for (let i = 0; i < loans.length; i++) {
    totalAmount = totalAmount.add(loans[i][1]);
    totalInterest = totalInterest.add(
      BigNumber.from(loans[i][0].offer.interestRateBPS).mul(loans[i][1])
    );
    // minInterest = minInterest.add(loans[i][0].depositInfo.minLoanDuration.mul(loans[i][0].depositInfo.interestRateBPS).mod())
  }
  let averageRate = BigNumber.from(0);
  if (totalAmount.gt(BigNumber.from(0))) {
    averageRate = totalInterest.div(totalAmount);
  }

  let token = undefined;
  if (loans.length > 0) {
    token = loans[0][0].token;
  }
  return {
    loans: loans,
    amount: totalAmount,
    rate: averageRate,
    token: loans[0][0].token,
  };
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
  ) as TroveManager;
}

export function getSupplyContract(provider: Provider) {
  return new ethers.Contract(
    getSupplyAddress(),
    getSupplyABI(),
    provider
  ) as Supply;
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

export async function getFullAccountInfo(
  account: Address,
  provider: Provider
): Promise<FullAccountInfo> {
  console.log("fetching trove info");
  return {
    deposits: await getCollateralDeposits(provider, account),
    loanIds: await getBorrowerLoanIds(provider, account),
  };
}

export async function getFullLoanInfo(
  provider: Provider,
  loanId: number
): Promise<FullLoanInfo> {
  const supply = getSupplyContract(provider);
  const loan = await supply.getLoan(loanId);
  const [amount, minInterest] = await supply.getLoanAmountAndMinInterest(
    loanId
  );
  return {
    loan: loan,
    loanId: loanId,
    interest: minInterest,
    claimable: BigNumber.from(0),
    token: await getToken(provider, loan.token),
  };
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

export async function getCollateralDeposits(
  provider: Provider,
  account: Address
): Promise<TokenBalanceInfo[]> {
  const troveManager = getTroveManagerContract(provider);
  console.log("fetching collateral deposits");

  const numLoans = await troveManager.getNumDepositsForAccount(account);
  const deposits = [];
  for (let i = 0; i < numLoans.toNumber(); i++) {
    const [tokenAddress, amount] =
      await troveManager.getDepositByIndexForAccount(account, i);
    deposits.push({
      token: await getToken(provider, tokenAddress),
      amount: amount,
    });
  }
  return deposits;
}

export async function getBorrowerLoanIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const troveManager = getTroveManagerContract(provider);
  console.log("fetching loan ids");

  const numLoans = await troveManager.getNumLoansForAccount(account);
  const loanIds = [];
  for (let i = 0; i < numLoans.toNumber(); i++) {
    const tokenOfOwnerByIndex: BigNumber =
      await troveManager.getLoanIdByIndexForAccount(account, i);
    loanIds.push(tokenOfOwnerByIndex.toNumber());
  }
  return loanIds;
}

export async function getLenderLoanIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyContract = getSupplyContract(provider);
  console.log("fetching loans for lender " + account);
  return getERC721Ids(supplyContract, account);
}

export async function getERC721Ids(
  contract: ethers.Contract,
  account: Address
): Promise<number[]> {
  const addressBytes32 = ethers.utils.hexZeroPad(account, 32);
  const topics = [
    utils.id("Transfer(address,address,uint256)"),
    [addressBytes32, ethers.constants.HashZero],
    [ethers.constants.HashZero, addressBytes32],
  ];

  // Query the blockchain for Transfer events to or from the specified address
  const transferEvents = await contract.queryFilter({ topics });
  transferEvents.sort((a, b) => a.blockNumber - b.blockNumber);

  // Extract the token IDs from the Transfer events
  const tokenIds = transferEvents.reduce((acc: Set<number>, event) => {
    const from = event.args![0];
    const to = event.args![1];
    const tokenId = event.args![2].toString();

    if (from.toLowerCase() === account.toLowerCase()) {
      acc.delete(Number(tokenId));
    } else if (to.toLowerCase() === account.toLowerCase()) {
      acc.add(Number(tokenId));
    }

    return acc;
  }, new Set<number>());

  return Array.from(tokenIds);
}

export async function getERC20BalanceAndAllowance(
  provider: Provider,
  account: Address,
  spender: Address,
  tokenAddress: Address
) {
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  const balance: BigNumber = await tokenContract.balanceOf(account);
  const allowance: BigNumber = await tokenContract.allowance(account, spender);

  return [balance, allowance];
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

export function formatDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return (
    date.getUTCFullYear() +
    "-" +
    (date.getUTCMonth() + 1).toLocaleString("en-US", {
      minimumIntegerDigits: 2,
    }) +
    "-" +
    date.getUTCDate().toLocaleString("en-US", { minimumIntegerDigits: 2 })
  );
}

export async function getOfferMessageToSign(
  provider: Provider,
  offer: LoanOfferType
) {
  const contract = getSupplyContract(provider);
  const message: string = await contract.buildLoanOfferMessage(offer);
  return message;
}

export async function getUnusedOfferId(provider: Provider, account: Address) {
  console.log("getting unused offer id");
  const offerResponses = await getOffersFrom(provider, account); // should be cached

  const maxOfferId = Math.max(
    ...offerResponses.map((offerResponse) => offerResponse.offer.offerId)
  );

  const troveManager = await getTroveManagerContract(provider);
  const addressBytes32 = ethers.utils.hexZeroPad(account, 32);
  const topics = [
    utils.id("NewLoan(address,uint256,uint256,uint256)"),
    addressBytes32,
  ];
  const newLoanEvents = await troveManager.queryFilter({ topics }); // should be cached

  const maxUsedId = newLoanEvents.reduce((acc: number, event) => {
    const owner = event.args![0];
    const offerId = event.args![1];
    return Math.max(offerId, acc);
  }, 0);

  return Math.max(maxUsedId, maxOfferId) + 1;
}
