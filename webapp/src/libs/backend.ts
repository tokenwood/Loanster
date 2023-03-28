import {
  floatToBigNumber,
  getToken,
  LoanParameters,
  LoanType,
  LoanOfferType,
  getTroveManagerContract,
} from "./unilend_utils";
import { Address, Provider } from "@wagmi/core";
import { BigNumber, ethers, utils } from "ethers";
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

export async function getOffersFrom(provider: Provider, account: Address) {
  let output: FullOfferInfo[] = [];

  console.log("getting offers from owner");
  try {
    const url = new URL("http://localhost:3030/offer/from_owner");
    url.searchParams.append("owner", account);
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

// should this be done on back-end?
export async function getUnusedLoanId(provider: Provider, account: Address) {
  console.log("getting unused loan id");
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
    return acc;
  }, 0);

  return Math.max(maxUsedId, maxOfferId) + 1;
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
