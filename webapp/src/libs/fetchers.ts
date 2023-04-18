import { Address } from "wagmi";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { ethers, utils } from "ethers";
import { BigNumber } from "ethers";
import {
  ADDRESS_TO_TOKEN,
  getSupplyContract,
  getTroveManagerContract,
  WETH_TOKEN,
} from "./constants";
import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { FullOfferInfo, getEthPrice, getOffersFrom } from "./backend";
import { ADDRESS_ZERO } from "@uniswap/v3-sdk";
import {
  LoanStats,
  AccountStats,
  TokenAmount,
  FullLoanInfo,
  TokenDepositInfo,
  LoanOfferType,
} from "./types";
import { getAllowedTokensFromEvents } from "./helperFunctions";

export async function getNewAccountStats(
  provider: Provider,
  loanStats: LoanStats,
  account: Address
): Promise<AccountStats> {
  const contract = getTroveManagerContract(provider);

  // collateral value
  const [collateralValue, collateralFactorBPS]: [BigNumber, BigNumber] =
    await contract.getAccountCollateralValueEth(account);

  // total loans value
  const [loansValue, adjustedLoansValue] =
    await contract.getAccountLoansValueEth(account);

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

export async function getHealthFactor(
  provider: Provider,
  account: Address,
  token?: Address,
  amount?: BigNumber
) {
  const contract = getTroveManagerContract(provider);
  const healthFactor: BigNumber = await contract.getHealthFactorBPS(
    account,
    amount ?? BigNumber.from(0),
    token ?? ADDRESS_ZERO
  );

  if (ethers.constants.MaxUint256.eq(healthFactor)) {
    return Number.POSITIVE_INFINITY;
  } else {
    return healthFactor.toNumber() / 10000;
  }
}

export async function getDetailedHealthFactor(
  provider: Provider,
  account: Address
) {
  const contract = getTroveManagerContract(provider);
  let [collateralValue] = await contract.getAccountCollateralValueEth(account);
  let [loanValue] = await contract.getAccountLoansValueEth(account);
  const healthFactor = await getHealthFactor(provider, account);

  return {
    healthFactor: healthFactor,
    collateralValueEth: collateralValue,
    loanValueEth: loanValue,
  };
}

export async function getNewHealthFactor(
  provider: Provider,
  account: Address,
  token: Address,
  addCollateral?: BigNumber,
  removeCollateral?: BigNumber,
  addLoan?: BigNumber,
  removeLoan?: BigNumber
) {
  const contract = getTroveManagerContract(provider);
  let [, adjustedCollateralValue] = await contract.getAccountCollateralValueEth(
    account
  );
  let [, adjustedLoanValue] = await contract.getAccountLoansValueEth(account);
  if (addCollateral) {
    const [, adjustedValue] = await contract.getCollateralValueEth(
      token,
      addCollateral
    );
    adjustedCollateralValue = adjustedCollateralValue.add(adjustedValue);
  }
  if (removeCollateral) {
    const [, adjustedValue] = await contract.getCollateralValueEth(
      token,
      removeCollateral
    );
    adjustedCollateralValue = adjustedCollateralValue.sub(adjustedValue);
  }
  if (addLoan) {
    console.log("2 token: " + token + " amount " + addLoan);
    const [, adjustedValue] = await contract.getLoanValueEth(token, addLoan);
    adjustedLoanValue = adjustedLoanValue.add(adjustedValue);
  }
  if (removeLoan) {
    console.log("2 token: " + token + " amount " + addLoan);
    const [_, adjustedValue] = await contract.getLoanValueEth(
      token,
      removeLoan
    );
    adjustedLoanValue = adjustedLoanValue.sub(adjustedValue);
  }
  if (adjustedLoanValue.gt(0)) {
    return (
      adjustedCollateralValue.mul(10000).div(adjustedLoanValue).toNumber() /
      10000
    );
  } else {
    return Number.POSITIVE_INFINITY;
  }
}

export async function getTokenPrice(
  provider: Provider,
  token: Address,
  amount: BigNumber
): Promise<number> {
  const contract = getTroveManagerContract(provider);
  console.log("token: " + token + " amount " + amount);
  const eth_value = await contract.getOracleValueEth(token, amount);
  console.log("eth_value: " + eth_value);
  const price = await getEthPrice();
  return Number.parseFloat(ethers.utils.formatEther(eth_value)) * price;
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
): Promise<TokenAmount> {
  const token = await getToken(provider, tokenAddress);
  console.log("fetching token balance " + token.symbol);

  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  const balance: BigNumber = await tokenContract.balanceOf(account);

  return {
    token: token,
    amount: balance,
  };
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

export async function getFullLoanInfo(
  provider: Provider,
  loanId: number
): Promise<FullLoanInfo> {
  const supply = getSupplyContract(provider);
  const [loan, claimable] = await supply.getLoan(loanId);
  const [token, amount, minInterest] = await supply.getLoanAmountAndMinInterest(
    loanId
  );

  return {
    loan: loan,
    loanId: loanId,
    interest: minInterest,
    claimable: claimable,
    token: await getToken(provider, loan.token),
  };
}

export async function getCollateralDeposits(
  provider: Provider,
  account: Address
): Promise<TokenDepositInfo[]> {
  const tokenAddresses = await getCollateralTokens(provider);
  const tokenBalances = await Promise.all(
    tokenAddresses.map((address) => getTokenBalance(provider, address, account))
  );
  let infoDict: { [key: string]: TokenDepositInfo } = Object.fromEntries(
    tokenBalances.map((balanceInfo) => {
      return [
        balanceInfo.token.address,
        {
          token: balanceInfo.token,
          wallet_amount: balanceInfo.amount,
        },
      ];
    })
  );
  const troveManager = getTroveManagerContract(provider);
  const numDeposits = await troveManager.getNumDepositsForAccount(account);
  for (let i = 0; i < numDeposits.toNumber(); i++) {
    const [tokenAddress, amount] =
      await troveManager.getDepositByIndexForAccount(account, i);
    infoDict[tokenAddress] = {
      ...infoDict[tokenAddress],
      deposit_amount: amount,
    };
  }
  return Object.values(infoDict);
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

export async function getAccounts(provider: Provider) {
  const troveManager = getTroveManagerContract(provider);
  const topics = [utils.id("NewLoan(address,uint256,uint256, address)")];

  const events = await troveManager.queryFilter({ topics });

  const accounts = events.reduce((acc: Set<Address>, event) => {
    const account: Address = event.args![3];
    acc.add(account);
    return acc;
  }, new Set<Address>());

  return Array.from(accounts);
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

  const [balance, allowance] = await Promise.all([
    tokenContract.balanceOf(account),
    tokenContract.allowance(account, spender),
  ]);

  return [balance, allowance];
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
