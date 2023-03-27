import {
  floatToBigNumber,
  getToken,
  LoanParameters,
  LoanType,
  LoanOfferType,
} from "./unilend_utils";
import { Address, Provider } from "@wagmi/core";
import { BigNumber, ethers } from "ethers";
import { Token } from "@uniswap/sdk-core";
import { concat } from "ethers/lib/utils.js";

// todo: update offer state (amountBorrowed, cancelled) by listening to events
// todo: make sure offers are valid by verifying owner balance and allowance

export interface FullOfferInfo {
  offer: LoanOfferType;
  signature: string;
  amountBorrowed: BigNumber;
  isCancelled: boolean;
  token: Token;
}

export type OfferResponse = LoanOfferType & { signature: string };

let offers = new Map<string, FullOfferInfo>();
let accountOffers = new Map<Address, Set<string>>();

export function getOfferKey(offer: LoanOfferType) {
  const a = ethers.utils.toUtf8Bytes(offer.owner);
  const b = ethers.utils.toUtf8Bytes(
    BigNumber.from(offer.offerId).toHexString()
  );

  return ethers.utils.keccak256(concat([a, b]));
}

export async function getOffers(provider: Provider, params: LoanParameters) {
  const loans: [FullOfferInfo, BigNumber][] = [];
  const token = await getToken(provider, params.tokenAddress);

  const sortedOffers = await getSortedOffers((info) => {
    return (
      params.tokenAddress == info.offer.token &&
      params.duration <= info.offer.maxLoanDuration &&
      params.duration >= info.offer.minLoanDuration
    );
  });

  let toLoan = floatToBigNumber(params.amount.toString(), token.decimals);

  for (
    let i = 0;
    i < sortedOffers.length && toLoan.gt(BigNumber.from(0));
    i++
  ) {
    const offerInfo = sortedOffers[i];

    if (offerInfo.offer.minLoanAmount.lte(toLoan)) {
      const toLoanFromOffer = bigNumberMin(
        offerInfo.offer.amount.sub(offerInfo.amountBorrowed),
        toLoan
      );
      loans.push([offerInfo, toLoanFromOffer]);
      toLoan = toLoan.sub(toLoanFromOffer);
    }
  }

  return loans;
}

// this should be done by listening for nonce update events or checking nonce on-chain because may not get called
export async function offerRevoked(data: FullOfferInfo) {
  const key = getOfferKey(data.offer);
  accountOffers.get(data.offer.owner as Address)?.delete(key);
  offers.delete(key);
}

export async function submitOffer(offer: LoanOfferType, signature: string) {
  const offerWithSignature = {
    ...offer,
    ...{ signature: signature },
  };

  try {
    const response = await fetch("http://localhost:3030/offer/", {
      method: "POST",
      body: JSON.stringify(offerWithSignature),
      headers: { "Content-Type": "application/json; charset=UTF-8" },
    });
    const data = await response.json();
  } catch (error) {
    console.error("Error submitting offer:", error);
  }
}

export async function getOffersFromOwner(provider: Provider, address: Address) {
  let output: FullOfferInfo[] = [];

  console.log("getting offers from owner");
  try {
    const url = new URL("http://localhost:3030/offer/from_owner");
    url.searchParams.append("owner", address);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
    });

    const data: OfferResponse[] = await response.json();
    for (const item of data) {
      item.amount = BigNumber.from(item.amount);
      item.minLoanAmount = BigNumber.from(item.minLoanAmount);
      output.push({
        offer: item,
        signature: item.signature,
        amountBorrowed: BigNumber.from(0),
        isCancelled: false,
        token: await getToken(provider, item.token),
      });
    }
  } catch (error) {
    console.error("Error fetching offers from owner:", error);
  }
  return output;
}

export async function getSortedOffers(
  filter?: (info: FullOfferInfo) => boolean
) {
  //todo offers shouldn't be filtered every time this function is called
  let filtered = Array.from(offers!.keys());
  if (filter) {
    filtered = filtered.filter((value) => filter(offers.get(value)!));
  }
  return filtered.map((value) => offers.get(value)!);
}

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}

export async function getUnhealthyTroves(amount: number) {
  // todo return trove
}

interface DiegoResponse {
  value: string;
}

export async function getDiego(): Promise<string> {
  try {
    const response = await fetch("http://localhost:3030/api/diego");
    console.log("loging response from backend");

    const data: DiegoResponse = await response.json();
    console.log(data);
    return data.value;
  } catch (error) {
    console.error("Error fetching data:", error);
    return "";
  }
}
