import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { Provider } from "react";
import { Address, Chain } from "wagmi";
import { mainnet, arbitrum, hardhat, goerli, localhost } from "wagmi/chains";
import { FullOfferInfo } from "./backend";
import { WETH_TOKEN, WETH_TOKEN_GOERLI } from "./constants";
import { LoanStats } from "./types";

export function bigNumberString(amount?: BigNumber, token?: Token) {
  if (amount == undefined || token == undefined) {
    return "-";
  }

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

export function dollarString(num: number) {
  if (num >= 1000000) {
    return "$" + (num / 1000000).toFixed(1) + "m";
  } else if (num >= 1000) {
    return "$" + (num / 1000).toFixed(1) + "k";
  } else {
    return "$" + num.toFixed(1);
  }
}

export function splitThousands(number: number, decimals: number) {
  if (number === undefined || number === null) {
    return "0";
  }

  const parts = (Math.round(number * 10 ** decimals) / 10 ** decimals)
    .toString()
    .split("."); // Split into integer and decimal parts
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Add space between thousands
  return parts.join(".");
}

export function formatTimeRemaining(timestamp: number): string {
  const now = new Date().getTime();
  const difference = timestamp - now;

  // Calculate the time remaining in days, hours, and minutes
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  // Construct the time remaining string
  let timeRemaining = "";
  if (days > 0) {
    timeRemaining += `${days} days `;
  }
  if (days < 2) {
    if (hours > 0) {
      timeRemaining += `${hours} hours `;
    }
    if (minutes > 0) {
      timeRemaining += `${minutes} minutes`;
    }
  }

  return timeRemaining.trim();
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

export function getChains() {
  if (process.env.NEXT_PUBLIC_CHAIN_IDS == undefined) {
    throw Error("No chains specified");
  }
  const chainIds = process.env.NEXT_PUBLIC_CHAIN_IDS.split(",");

  const chains: Chain[] = chainIds.map((chainId) => {
    switch (chainId) {
      case "1":
        return mainnet;
      case "5":
        return goerli;
      case "31337":
        return hardhat;
      default:
        throw Error("Invalid chainId: " + chainId);
    }
  });
  return chains;
}

export function makeUniqueKey(object: any, suffix?: string) {
  return suffix + JSON.stringify(object);
}
interface SortableObject {
  [key: string]: string | number | BigNumber; // define the properties of the objects in the array
}
export function sortByAttribute(
  arr: SortableObject[],
  attr: string
): SortableObject[] {
  return arr.sort((a, b) => {
    if (a[attr] < b[attr]) {
      return -1;
    } else if (a[attr] > b[attr]) {
      return 1;
    } else {
      return 0;
    }
  });
}
