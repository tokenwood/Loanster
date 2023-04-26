import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import {
  V3_SWAP_ROUTER_ADDRESS,
  WETH_TOKEN,
} from "../../webapp/src/libs/constants";
import fs from "fs";
import { TroveManager } from "../typechain-types/contracts/TroveManager";

export const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
export const ONE_MONTH_IN_SECS = 30 * 24 * 60 * 60;
export const ONE_DAY_IN_SECS = 24 * 60 * 60;

const TIMESTAMP_2030 = 1893452400;

export function getDeployments(networkName: string) {
  return readJson(`deployments/${networkName}/deployments.json`);
}

function readJson(filePath: string): any {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    throw new Error(
      `Failed to read or parse JSON file at path ${filePath}: ${error.message}`
    );
  }
}

export function getUniUtilsAddress(networkName: string) {
  return readJson("../unilib/cache/deployments_" + networkName + ".json")
    .uniUtils;
}

export function getWETHContract() {
  return ethers.getContractAt("IWETH", WETH_TOKEN.address);
}

export function getERC20Contract(address: string) {
  return ethers.getContractAt("ERC20", address);
}

export function getTroveManagerContract(networkName: string) {
  const deployments = getDeployments(networkName);
  return ethers.getContractAt("TroveManager", deployments.troveManager);
}

export function getSupplyContract(networkName: string) {
  const deployments = getDeployments(networkName);
  return ethers.getContractAt("Supply", deployments.supply);
}

export async function deployTokensFixture() {
  const [owner, account1, account2] = await ethers.getSigners();
  const TestToken = await ethers.getContractFactory("TestToken");
  const tokens = [];

  for (let i = 0; i < 2; i++) {
    const testToken = await TestToken.deploy();
    console.log("deploying token " + i);

    await testToken.mint(account1.address, 1000);
    await testToken.mint(account2.address, 1000);
    tokens.push(testToken);
  }
  return { token: tokens[0], token2: tokens[1] };
}

export async function deploySupply() {
  const Supply = await ethers.getContractFactory("Supply");
  const supply = await Supply.deploy();
  await supply.deployed();
  return supply;
}

export async function deployTroveManager(
  supplyAddress: string,
  networkName: string
) {
  // verify uni utils is deployed
  const code = await ethers.provider.getCode(getUniUtilsAddress(networkName));
  if (code == "0x") {
    throw Error("uniutils address is not a contract");
  }

  const TroveManager = await ethers.getContractFactory("TroveManager");
  const troveManager = await TroveManager.deploy(
    supplyAddress,
    getUniUtilsAddress(networkName)
  );

  return troveManager;
}

export async function depositWETH(amountETH: number) {
  const [owner] = await ethers.getSigners();
  const weth = await getWETHContract();
  await weth.connect(owner).deposit({
    value: ethers.utils.parseEther(amountETH.toString()),
  });
}

export async function buyToken(
  recipientAddress: string,
  tokenAddress: string,
  amountETH: number,
  fee?: number
) {
  const [owner] = await ethers.getSigners();

  const swapRouter = await ethers.getContractAt(
    "ISwapRouter",
    V3_SWAP_ROUTER_ADDRESS
  );

  await depositWETH(amountETH);

  const weth = await (await getWETHContract())
    .connect(owner)
    .approve(
      swapRouter.address,
      ethers.utils.parseUnits(amountETH.toString(), 18)
    );

  console.log("swapping");

  const swap = await swapRouter.connect(owner).exactInputSingle({
    tokenIn: WETH_TOKEN.address,
    tokenOut: tokenAddress,
    fee: fee ? fee : 500,
    recipient: recipientAddress,
    deadline: TIMESTAMP_2030,
    amountIn: ethers.utils.parseEther(amountETH.toString()),
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  });

  // await log_balance(WETH_TOKEN, account1.address);
  // await log_balance(USDC_TOKEN, account2.address);
}

export async function depositCollateral(
  account: SignerWithAddress,
  collateralToken: string,
  collateralAmount: BigNumber,
  troveManager: TroveManager
) {
  const tokenContract = await getERC20Contract(collateralToken);

  await tokenContract
    .connect(account)
    .approve(troveManager.address, collateralAmount);

  await troveManager
    .connect(account)
    .deposit(collateralToken, collateralAmount);
}
