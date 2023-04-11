import { SupportedChainId, Token } from "@uniswap/sdk-core";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import troveManagerJSON from "../../../chain/artifacts/contracts/TroveManager.sol/TroveManager.json";
import { TroveManager } from "../../../chain/typechain-types/contracts/TroveManager";
import { Supply } from "../../../chain/typechain-types/contracts/Supply";
import { Provider } from "@wagmi/core";
import { ethers } from "ethers";
import { Address } from "wagmi";
import deployments from "../../../chain/cache/deployments.json";

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

export const LUSD_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
  18,
  "LUSD",
  "Liquity USD"
);

export const WBTC_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  18,
  "WBTC",
  "Wrapped Bitcoin"
);

export const RETH_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xae78736Cd615f374D3085123A210448E74Fc6393",
  18,
  "rETH",
  "Rocket Pool ETH"
);

export const AGEUR_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
  18,
  "AGEUR",
  "Angle EUR"
);

export const CRV_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xD533a949740bb3306d119CC777fa900bA034cd52",
  18,
  "CRV",
  "Curve DAO Token"
);

//compute from token list instead
export const ADDRESS_TO_TOKEN: { [key: string]: Token } = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": USDC_TOKEN,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": DAI_TOKEN,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": WETH_TOKEN,
};

export function getTroveManagerContract(provider: Provider) {
  return new ethers.Contract(
    getTroveManagerAddress(),
    getTroveManagerABI(),
    provider
  ) as TroveManager;
}

export function getSupplyContract(provider: Provider) {
  return new ethers.Contract(
    getSupplyAddress(),
    getSupplyABI(),
    provider
  ) as Supply;
}

export function getSupplyAddress(): Address {
  return deployments.supply as Address;
}

export function getSupplyABI(): any {
  return supplyContractJSON.abi;
}

export function getTroveManagerAddress(): Address {
  return deployments.troveManager as Address;
}

export function getTroveManagerABI(): any {
  return troveManagerJSON.abi;
}
