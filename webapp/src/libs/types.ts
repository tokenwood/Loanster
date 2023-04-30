import { Token, CurrencyAmount } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import { FullOfferInfo } from "./backend";

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
  token: Token;
  amount: BigNumber;
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
  deposits: TokenAmount[];
  loanIds: number[];
}

export interface FullLoanInfo {
  loan: LoanType;
  loanId: number;
  interest: BigNumber;
  claimable: BigNumber;
  token: Token;
}

export interface TokenAmount {
  amount: BigNumber | undefined;
  token: Token;
}

export interface Timestamp {
  timestamp: number;
}

export interface TokenDepositInfo {
  wallet_amount?: BigNumber;
  deposit_amount?: BigNumber;
  token: Token;
}
