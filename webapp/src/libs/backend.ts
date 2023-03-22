import {
  LoanOfferStructOutput,
  LoanStructOutput,
} from "../../../chain/typechain-types/contracts/Supply";
import { floatToBigNumber, getToken, LoanParameters } from "./unilend_utils";
import { Address, Provider } from "@wagmi/core";
import { BigNumber, ethers } from "ethers";
import { Token } from "@uniswap/sdk-core";

// todo: update offer state (amountBorrowed, cancelled) by listening to events

export interface FullOfferInfo {
  offer: LoanOfferStructOutput;
  signature: string;
  amountBorrowed: BigNumber;
  isCancelled: boolean;
  token: Token;
}

let offers = new Map<string, FullOfferInfo>();
let accountOffers = new Map<Address, Set<string>>();

function getOfferKey(offer: LoanOfferStructOutput) {
  const a = ethers.utils.toUtf8Bytes(offer.owner);
  const b = ethers.utils.toUtf8Bytes(offer.offerId.toHexString());

  const array = new Uint8Array(a.byteLength + b.byteLength);
  array.set(a);
  array.set(b, a.length);

  return ethers.utils.keccak256(array);
}

export async function getOffers(provider: Provider, params: LoanParameters) {
  const loans: [FullOfferInfo, BigNumber][] = [];
  const token = await getToken(provider, params.tokenAddress);

  const sortedOffers = await getSortedOffers((info) => {
    return (
      params.tokenAddress == info.offer.token &&
      params.duration <= info.offer.maxLoanDuration.toNumber() &&
      params.duration >= info.offer.minLoanDuration.toNumber()
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

export async function submitOffer(
  provider: Provider,
  offer: LoanOfferStructOutput,
  signature: string
) {
  const key = getOfferKey(offer);
  if (offers.get(key)) {
    throw new Error("offer id already used");
  }
  //todo verify on-chain that offer key doesn't already exist
  const owner = offer.owner as Address;
  if (!accountOffers.has(owner)) {
    accountOffers.set(owner, new Set<string>());
  }
  accountOffers.get(owner)?.add(key);

  offers.set(key, {
    offer: offer,
    signature: signature,
    amountBorrowed: BigNumber.from(0),
    isCancelled: false,
    token: await getToken(provider, offer.token),
  });
}

export async function getOffersFromOwner(address: Address) {
  let output: FullOfferInfo[] = [];
  const a = accountOffers.get(address)?.forEach((key) => {
    output.push(offers.get(key)!);
  });
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