import { Address, Provider } from "@wagmi/core";
import { BigNumber, ethers, utils } from "ethers";
import { Token } from "@uniswap/sdk-core";
import { concat } from "ethers/lib/utils.js";
import { getOfferKey, TokenOfferStatsResponse } from "./sharedUtils";
import { floatToBigNumber } from "./helperFunctions";
import { LoanOfferType, LoanParameters } from "./types";
import { getERC20BalanceAndAllowance, getToken } from "./fetchers";
import { getSupplyAddress, getSupplyContract } from "./constants";

// todo: update offer state (amountBorrowed, cancelled) by listening to events
// todo: make sure offers are valid by verifying owner balance and allowance

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT;
const fullBackendUrl = `${backendUrl}:${backendPort}`;

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL;
}

export interface FullOfferInfo {
  offer: LoanOfferType;
  signature: string;
  amountBorrowed: BigNumber;
  isCancelled: boolean;
  balance: BigNumber;
  allowance: BigNumber;
  token: Token;
}

export type OfferResponse = LoanOfferType & { signature: string };

export async function offerRevoked(data: FullOfferInfo) {
  //todo: this should be done on backend by listening for nonce update events or checking nonce on-chain because may not get called
}

export async function submitOffer(offer: LoanOfferType, signature: string) {
  const offerWithSignature = {
    ...offer,
    ...{ signature: signature },
  };

  try {
    const response = await fetch(`${fullBackendUrl}/offer/`, {
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
  console.log("getting offers from owner");
  const response: OfferResponse[] = await callBackend(
    "offer/from_owner",
    "GET",
    {
      owner: account,
    }
  );
  const output = await Promise.all(
    response.map((value) => offerResponseToFullOfferInfo(provider, value))
  );
  return output;
}

export async function getTokenOfferStats(token: Token) {
  const response: TokenOfferStatsResponse = await callBackend(
    "offer/stats",
    "GET",
    {
      token: token.address,
    }
  );

  return { ...response, token: token };
}

async function offerResponseToFullOfferInfo(
  provider: Provider,
  response: OfferResponse
) {
  response.amount = BigNumber.from(response.amount);
  response.minLoanAmount = BigNumber.from(response.minLoanAmount);

  const key = getOfferKey(response.owner, response.token, response.offerId);
  const [nonce, amountBorrowed] = await getSupplyContract(
    provider
  ).getOfferInfo(key);

  const [balance, allowance] = await getERC20BalanceAndAllowance(
    provider,
    response.owner as Address,
    getSupplyAddress(),
    response.token as Address
  );

  return {
    offer: response,
    signature: response.signature,
    amountBorrowed: amountBorrowed,
    isCancelled: nonce.toNumber() > response.nonce,
    balance: balance,
    allowance: allowance,
    token: await getToken(provider, response.token),
  };
}

async function callBackend(
  path: string,
  method: string,
  params?: { [key: string]: string }
): Promise<any> {
  const url = new URL(`${fullBackendUrl}/${path}`);
  for (let key in params) {
    url.searchParams.append(key, params[key]);
  }
  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });

  const responseJSON = await response.json();
  parseBigNumberInResponse(responseJSON);

  return responseJSON;
}

export async function getOffers(provider: Provider, params: LoanParameters) {
  const loans: [FullOfferInfo, BigNumber][] = [];
  const token = await getToken(provider, params.token.address);
  console.log("getting offers for loan amount " + params.amount);

  const sortedOffers = await getSortedOffers(
    provider,
    params.token.address as Address
  );

  sortedOffers.filter((value) => {
    return (
      params.token.address == value.offer.token &&
      params.duration <= value.offer.maxLoanDuration &&
      params.duration >= value.offer.minLoanDuration
    );
  });

  let toLoan = params.amount;

  for (let i = 0; i < sortedOffers.length && toLoan.gt(0); i++) {
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

export async function getSortedOffers(provider: Provider, token?: Address) {
  let output: FullOfferInfo[] = [];
  try {
    let response: OfferResponse[];
    if (token !== undefined) {
      response = await callBackend("offer", "GET", { token: token });
    } else {
      response = await callBackend("offer", "GET");
    }
    for (const item of response) {
      output.push(await offerResponseToFullOfferInfo(provider, item));
    }
  } catch (error) {
    console.error("Error fetching offers from owner:", error);
  }
  return output;
}

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}

export async function getUnhealthyTroves(amount: number) {
  // todo return trove
}

export function parseBigNumberInResponse(response: [key: any]): any {
  for (const key in response) {
    const value = response[key];
    if (value.type === "BigNumber") {
      response[key] = BigNumber.from(value.hex);
    }
  }
  return response;
}
