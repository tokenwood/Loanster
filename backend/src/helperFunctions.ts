import { getOfferKey } from './sharedUtils';
import { BigNumber, ethers } from 'ethers';
import { TroveManager } from '../../chain/typechain-types/contracts/TroveManager';
import { Supply } from '../../chain/typechain-types/contracts/Supply';
import * as fs from 'fs-extra';
import { CreateOfferDto } from './offer/dto/create-offer.dto';

const erc20Abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

function deployments() {
  const deploymentsPath = '../chain/deployments/localhost/deployments.json';
  return fs.readJsonSync(deploymentsPath);
}

export function getProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
}

export function getTroveManagerContract() {
  return new ethers.Contract(
    getTroveManagerAddress(),
    getTroveManagerABI(),
    getProvider(),
  ) as TroveManager;
}

export function getSupplyContract() {
  return new ethers.Contract(
    getSupplyAddress(),
    getSupplyABI(),
    getProvider(),
  ) as Supply;
}

export function getSupplyAddress(): string {
  return deployments().supply as string;
}

export function getSupplyABI(): any {
  const jsonpath = '../chain/artifacts/contracts/Supply.sol/Supply.json';
  return fs.readJsonSync(jsonpath).abi;
}

export function getTroveManagerABI(): any {
  const jsonpath =
    '../chain/artifacts/contracts/TroveManager.sol/TroveManager.json';
  return fs.readJsonSync(jsonpath).abi;
}

export function getTroveManagerAddress(): string {
  return deployments().troveManager as string;
}

export async function getERC20BalanceAndAllowance(
  account: string,
  spender: string,
  tokenAddress: string,
) {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20Abi,
    getProvider(),
  );

  const [balance, allowance]: [BigNumber, BigNumber] = await Promise.all([
    tokenContract.balanceOf(account),
    tokenContract.allowance(account, spender),
  ]);

  return [balance, allowance];
}

export async function getOfferOnChainData(
  owner: string,
  token: string,
  offerId: number,
) {
  const key = getOfferKey(owner, token, offerId);

  const [offerInfo, balanceAndAllowance] = await Promise.all([
    getSupplyContract().getOfferInfo(key),
    getERC20BalanceAndAllowance(owner, getSupplyAddress(), token),
  ]);

  const [nonce, amountBorrowed] = offerInfo;
  const [balance, allowance] = balanceAndAllowance;

  return [nonce, amountBorrowed, balance, allowance];
}

export function parseBigNumbers(response: CreateOfferDto): any {
  for (const key in response) {
    const value = response[key];
    if (value.type === 'BigNumber') {
      response[key] = value.hex;
    }
  }
  return response;
}
