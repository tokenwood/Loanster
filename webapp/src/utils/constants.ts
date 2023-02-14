import { SupportedChainId, Token } from "@uniswap/sdk-core";

// Addresses // https://docs.uniswap.org/contracts/v3/reference/deployments

export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS =
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
export const V3_SWAP_ROUTER_2_ADDRESS =
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
export const V3_SWAP_ROUTER_ADDRESS =
  "0xE592427A0AEce92De3Edee1F18E0157C05861564";

export const WETH_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
);
// Currencies and Tokens

export const USDC_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6,
  "USDC",
  "USD//C"
);

export const DAI_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18,
  "DAI",
  "Dai Stablecoin"
);

export const ADDRESS_TO_TOKEN: { [key: string]: Token } = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": USDC_TOKEN,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": DAI_TOKEN,
};
