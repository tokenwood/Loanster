import { Address, Provider } from "@wagmi/core";
import { BigNumber, ethers, utils } from "ethers";
import { Token } from "@uniswap/sdk-core";
import {
  getOfferKey,
  parseBigNumberInResponse,
  TokenOfferStatsResponse,
} from "./sharedUtils";
import { bigNumberMin, floatToBigNumber } from "./helperFunctions";
import { LoanOfferType, LoanParameters } from "./types";
import { getERC20BalanceAndAllowance, getNetwork, getToken } from "./fetchers";
import { getSupplyAddress, getSupplyContract } from "./chainUtils";

// todo: update offer state (amountBorrowed, cancelled) by listening to events
// todo: make sure offers are valid by verifying owner balance and allowance

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT;
const fullBackendUrl = `${backendUrl}:${backendPort}`;

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

export async function submitOffer(
  offer: LoanOfferType,
  signature: string,
  chainId: number
) {
  const offerWithSignature = {
    ...offer,
    ...{ signature: signature, chainId: chainId },
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
      chain_id: provider.network.chainId.toString(),
    }
  );
  return response;
}

export async function getTokenOfferStats(token: Token) {
  const response: TokenOfferStatsResponse = await callBackend(
    "offer/stats",
    "GET",
    {
      token: token.address,
      chain_id: token.chainId.toString(),
    }
  );

  return { ...response, token: token };
}

export async function getOffersForLoanParams(
  provider: Provider,
  params: LoanParameters
) {
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
  let response: OfferResponse[];
  let params: { [key: string]: string } = {
    chain_id: provider.network.chainId.toString(),
  };
  if (token !== undefined) {
    params["token"] = token;
  }
  response = await callBackend("offer", "GET", params);
  for (const item of response) {
    output.push(await offerResponseToFullOfferInfo(provider, item));
  }
  return output;
}

export async function getUnhealthyTroves(amount: number) {
  // todo return trove
}

export async function offerRevoked(data: FullOfferInfo) {
  //todo: this should be done on backend by listening for nonce update events or checking nonce on-chain because may not get called
}

let eth_price_cached: number | undefined = undefined;
export async function getEthPrice() {
  if (eth_price_cached == undefined) {
    const response: { usd: number } = await callBackend(
      "api/eth_price_usd",
      "GET"
    );
    eth_price_cached = response.usd;
  }
  return eth_price_cached!;
}

async function callBackend(
  path: string,
  method: string,
  params?: { [key: string]: string }
): Promise<any> {
  try {
    const url = new URL(`${fullBackendUrl}/${path}`);
    for (let key in params) {
      url.searchParams.append(key, params[key]);
    }
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      // body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const responseJSON = await response.json();
    parseBigNumberInResponse(responseJSON);

    return responseJSON;
  } catch (error) {
    console.error("Failed to fetch:", error);
    // Handle the error as needed, e.g., return an error object or re-throw the error
    return null;
  }
}

export async function offerResponseToFullOfferInfo(
  provider: Provider,
  response: OfferResponse
) {
  response.amount = BigNumber.from(response.amount);
  response.minLoanAmount = BigNumber.from(response.minLoanAmount);

  const key = getOfferKey(response.owner, response.token, response.offerId);
  const [nonce, amountBorrowed] = await (
    await getSupplyContract(provider)
  ).getOfferInfo(key);

  const [balance, allowance] = await getERC20BalanceAndAllowance(
    provider,
    response.owner as Address,
    getSupplyAddress(provider),
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
