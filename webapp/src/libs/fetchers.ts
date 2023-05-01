import { Address } from "wagmi";
import { erc20ABI, erc721ABI, Provider } from "@wagmi/core";
import { Contract, ethers, utils } from "ethers";
import { BigNumber } from "ethers";
import { UNI_TOKEN_GOERLI, WETH_TOKEN, WETH_TOKEN_GOERLI } from "./constants";
import { getSupplyContract, getTroveManagerContract } from "./chainUtils";
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
import { hexZeroPad } from "ethers/lib/utils.js";

export async function getNetwork(provider: Provider) {
  return (await provider.getNetwork()).name;
}

export async function getNewAccountStats(
  provider: Provider,
  loanStats: LoanStats,
  account: Address
): Promise<AccountStats> {
  const contract = await getTroveManagerContract(provider);

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
  account?: Address,
  token?: Address,
  amount?: BigNumber
) {
  if (account == undefined) {
    return undefined;
  }
  const contract = await getTroveManagerContract(provider);
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
  account?: Address
) {
  if (account == undefined) {
    return {
      healthFactor: undefined,
      collateralValueEth: undefined,
      loanValueEth: undefined,
    };
  }
  const contract = await getTroveManagerContract(provider);
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
  token: Address,
  account?: Address,
  addCollateral?: BigNumber,
  removeCollateral?: BigNumber,
  addLoan?: BigNumber,
  removeLoan?: BigNumber
) {
  if (account == undefined) {
    return undefined;
  }
  const contract = await getTroveManagerContract(provider);
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
    const [, adjustedValue] = await contract.getLoanValueEth(token, addLoan);
    adjustedLoanValue = adjustedLoanValue.add(adjustedValue);
  }
  if (removeLoan) {
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
  amount?: BigNumber
) {
  if (amount == undefined) {
    return undefined;
  }
  const contract = await getTroveManagerContract(provider);
  const eth_value = await contract.getOracleValueEth(token, amount);
  const price = await getEthPrice();
  return Number.parseFloat(ethers.utils.formatEther(eth_value)) * price;
}

let cached_tokens: { [key: string]: Token } = {};
export async function getToken(provider: Provider, tokenAddress: string) {
  if (cached_tokens[tokenAddress] !== undefined) {
    //todo add tokens from constants to cached_tokens
    return cached_tokens[tokenAddress];
  } else {
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
    const decimals: number = await tokenContract.decimals();
    const symbol: string = await tokenContract.symbol();

    const token = new Token(
      provider.network.chainId,
      tokenAddress,
      decimals,
      symbol,
      symbol
    );
    cached_tokens[tokenAddress] = token;
    return token;
  }
}

export async function getTokenBalance(
  provider: Provider,
  tokenAddress: Address,
  account?: Address
): Promise<TokenAmount> {
  const token = await getToken(provider, tokenAddress);
  console.log("fetching token balance " + token.symbol);

  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  return {
    token,
    amount: account ? await tokenContract.balanceOf(account) : undefined,
  };
}

export async function getSupplyTokenAddresses(
  provider: Provider
): Promise<Address[]> {
  console.log("fetching supply tokens");
  const supplyContract = await getTroveManagerContract(provider);
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
  const troveManager = await getTroveManagerContract(provider);
  let eventFilter = troveManager.filters.CollateralTokenChange();
  let events = await troveManager.queryFilter(eventFilter);
  return getAllowedTokensFromEvents(events);
}

export async function getFullLoanInfo(
  provider: Provider,
  loanId: number
): Promise<FullLoanInfo> {
  const supply = await getSupplyContract(provider);
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
  account?: Address
): Promise<TokenDepositInfo[]> {
  const tokenAddresses = await getCollateralTokens(provider);

  if (account == undefined) {
    const tokens = await Promise.all(
      tokenAddresses.map((address) => getToken(provider, address))
    );

    return tokens.map((token) => {
      return {
        token: token,
      };
    });
  } else {
    const tokenBalances = await Promise.all(
      tokenAddresses.map((address) =>
        getTokenBalance(provider, address, account)
      )
    );
    let infoDict: { [key: string]: TokenDepositInfo } = Object.fromEntries(
      tokenBalances.map((balanceInfo) => {
        return [
          balanceInfo.token.address,
          {
            token: balanceInfo.token,
            wallet_amount: balanceInfo.amount,
            deposit_amount: BigNumber.from(0),
          },
        ];
      })
    );
    const troveManager = await getTroveManagerContract(provider);
    const numDeposits = await troveManager.getNumDepositsForAccount(account);
    for (let i = 0; i < numDeposits.toNumber(); i++) {
      const [tokenAddress, amount] =
        await troveManager.getDepositByIndexForAccount(account, i);
      infoDict[tokenAddress]["deposit_amount"] = amount;
    }
    return Object.values(infoDict);
  }
}

export async function getBorrowerLoanIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const troveManager = await getTroveManagerContract(provider);
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

export async function getOpenLoans(provider: Provider, account: Address) {
  const loanIds = await getLenderLoanIds(provider, account);
  const loanInfos = await Promise.all(
    loanIds.map((id) => getFullLoanInfo(provider, id))
  );

  return loanInfos.filter(
    (info) =>
      !(info.claimable.eq(0) && info.loan.amount.add(info.interest).eq(0))
  );
}

export async function getLenderLoanIds(
  provider: Provider,
  account: Address
): Promise<number[]> {
  const supplyContract = await getSupplyContract(provider);
  console.log("fetching loans for lender " + account);
  return getERC721Ids(supplyContract, account);
}

export async function getAccounts(provider: Provider) {
  const troveManager = await getTroveManagerContract(provider);

  const topics = [utils.id("NewLoan(address,uint256,uint256,address)")];

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

  const [balance, allowance]: BigNumber[] = await Promise.all([
    tokenContract.balanceOf(account),
    tokenContract.allowance(account, spender),
  ]);

  return [balance, allowance];
}

export async function getOfferMessageToSign(
  provider: Provider,
  offer: LoanOfferType
) {
  const contract = await getSupplyContract(provider);
  const message: string = await contract.buildLoanOfferMessage(offer);
  return message;
}

export async function getUnusedOfferId(provider: Provider, account: Address) {
  console.log("getting unused offer id");
  const offerResponses = await getOffersFrom(provider, account); // should be cached

  let maxOfferId = 0;
  if (Array.isArray(offerResponses)) {
    maxOfferId = Math.max(
      ...offerResponses.map((offerResponse) => offerResponse.offerId)
    );
  } else {
    console.log("Error: Backend is not working");
    // Handle the error case when the backend is not working
    // You can return an error, throw an error, or use a default value depending on your use case
  }

  const troveManager = getTroveManagerContract(provider);
  const addressBytes32 = ethers.utils.hexZeroPad(account, 32);

  const topics = [
    [
      ethers.utils.id("NewLoan(address,uint256,uint256,address)"),
      addressBytes32,
    ],
  ];
  const newLoanEvents = await troveManager.queryFilter({ topics }); // should be cached
  const maxUsedId = newLoanEvents.reduce((acc: number, event) => {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ["address", "uint256", "uint256", "address"],
      event.data
    );
    const offerId = decodedData[1];
    return Math.max(offerId.toNumber(), acc);
  }, 0);

  // console.log("max used id", maxUsedId, "max offer id", maxOfferId);

  return Math.max(maxUsedId, maxOfferId) + 1;
}

export function getWethToken(provider: Provider) {
  if (
    provider.network.name == "mainnet" ||
    provider.network.name == "hardhat"
  ) {
    return WETH_TOKEN;
  } else if (provider.network.name == "goerli") {
    return WETH_TOKEN_GOERLI;
  } else {
    throw new Error("Unsupported network: " + provider.network.name);
  }
}

export function getTokenIconPath(token: Token) {
  let chain = undefined;
  if (token.chainId == 1 || token.chainId == 31337) {
    chain = "mainnet";
  } else if (token.chainId == 5) {
    chain = "goerli";
  } else {
    throw new Error("Unknown token chainid: " + token.chainId);
  }
  return "token_icons/" + chain + "/" + token.address + ".png";
}
