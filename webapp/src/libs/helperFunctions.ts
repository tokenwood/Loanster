import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { Address } from "wagmi";
import { FullOfferInfo } from "./backend";
import { LoanStats } from "./types";

export function bigNumberString(amount: BigNumber, token: Token) {
  let number = Number(ethers.utils.formatUnits(amount, token.decimals));

  // number = number.toFixed(2); // Round to 2 decimal places
  const parts = number.toString().split("."); // Split into integer and decimal parts
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
