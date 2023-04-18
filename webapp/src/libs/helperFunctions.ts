import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { Address } from "wagmi";
import { FullOfferInfo } from "./backend";
import { WETH_TOKEN } from "./constants";
import { LoanStats } from "./types";

export function bigNumberString(amount: BigNumber, token: Token) {
  if (ethers.constants.MaxUint256.eq(amount)) {
    return "∞";
  }

  let number = Number(ethers.utils.formatUnits(amount, token.decimals));

  let decimals = 2;
  if (token == WETH_TOKEN) {
    decimals = 3;
  }

  return splitThousands(number, decimals);
}

export function splitThousands(number: number, decimals: number) {
  const parts = number.toFixed(decimals).split("."); // Split into integer and decimal parts
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Add space between thousands
  return parts.join(".");
}

export function BNToPrecision(
  number: BigNumber,
  decimals: number,
  precision: number
) {
  return parseFloat(ethers.utils.formatUnits(number, decimals)).toPrecision(
    precision
  );
}

export function healthFactorColor(number?: number) {
  if (number == undefined) {
    return "black";
  } else if (number < 1.1) {
    return "red";
  } else if (number < 2.0) {
    return "orange";
  } else {
    return "green";
  }
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

export function isValidOffer(fullOfferInfo: FullOfferInfo) {
  return (
    offerHasEnoughAllowance(fullOfferInfo) &&
    offerHasEnoughBalance(fullOfferInfo) &&
    fullOfferInfo.isCancelled == false
  );
}

export function offerHasEnoughAllowance(fullOfferInfo: FullOfferInfo) {
  return fullOfferInfo.allowance.gte(
    fullOfferInfo.offer.amount.sub(fullOfferInfo.amountBorrowed)
  );
}

export function offerHasEnoughBalance(fullOfferInfo: FullOfferInfo) {
  return fullOfferInfo.balance.gte(
    fullOfferInfo.offer.amount.sub(fullOfferInfo.amountBorrowed)
  );
}

export function offerAmountAvailable(fullOfferInfo: FullOfferInfo) {
  return bigNumberMin(
    fullOfferInfo.offer.amount.sub(fullOfferInfo.amountBorrowed),
    fullOfferInfo.balance
  );
}

export function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}

export function bigNumberMax(a: BigNumber, b: BigNumber) {
  return a.gt(b) ? a : b;
}
