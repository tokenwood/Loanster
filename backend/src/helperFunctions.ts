import { getOfferKey } from './sharedUtils';
import { BigNumber, ethers } from 'ethers';
import { TroveManager } from '../../chain/deployments/localhost/typechain-types/contracts/TroveManager';
import { Supply } from '../../chain/deployments/localhost/typechain-types/contracts/Supply';
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

function deployments(chainId: number) {
  let deploymentsPath: string;
  switch (chainId) {
    case 31337:
      deploymentsPath = '../chain/deployments/localhost/deployments.json';
      break;
    case 5:
      deploymentsPath = '../chain/deployments/goerli/deployments.json';
      break;
    default:
      throw new Error('Unknown chainId');
  }
  return fs.readJsonSync(deploymentsPath);
}

export function getProvider(chainId: number): ethers.providers.JsonRpcProvider {
  // console.log('getting provider with chainid: ', chainId);
  if (chainId == 31337) {
    return new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  } else if (chainId == 5) {
    return new ethers.providers.InfuraProvider(
      'goerli',
      process.env.MY_INFURA_KEY,
    );
  } else {
    throw new Error('Unknown chainId');
  }
}

export function getTroveManagerContract(chainId: number) {
  return new ethers.Contract(
    getTroveManagerAddress(chainId),
    getTroveManagerABI(),
    getProvider(chainId),
  ) as TroveManager;
}

export function getSupplyContract(chainId: number) {
  return new ethers.Contract(
    getSupplyAddress(chainId),
    getSupplyABI(),
    getProvider(chainId),
  ) as Supply;
}

export function getSupplyAddress(chainId: number): string {
  return deployments(chainId).supply as string;
}

export function getSupplyABI(): any {
  const jsonpath = '../chain/deployments/localhost/Supply.json';
  return fs.readJsonSync(jsonpath).abi;
}

export function getTroveManagerABI(): any {
  const jsonpath = '../chain/deployments/localhost/TroveManager.json';
  return fs.readJsonSync(jsonpath).abi;
}

export function getTroveManagerAddress(chainId: number): string {
  return deployments(chainId).troveManager as string;
}

export async function getERC20BalanceAndAllowance(
  account: string,
  spender: string,
  tokenAddress: string,
  chainId: number,
) {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20Abi,
    getProvider(chainId),
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
  chainId: number,
) {
  const key = getOfferKey(owner, token, offerId);

  const [offerInfo, balanceAndAllowance] = await Promise.all([
    getSupplyContract(chainId).getOfferInfo(key),
    getERC20BalanceAndAllowance(
      owner,
      getSupplyAddress(chainId),
      token,
      chainId,
    ),
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
