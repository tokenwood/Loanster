import { isBigNumberish } from '@ethersproject/bignumber/lib/bignumber';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class OfferDto {
  // This is the dto (Data Transfer Object) that is used to validate the data that is sent to the backend

  @IsNotEmpty()
  @IsString()
  key: string; // hash of (owner, offerId)

  @IsNotEmpty()
  @IsNumber()
  chainId: number;

  @IsNotEmpty()
  @IsNumber()
  offerId: number;

  @IsNotEmpty()
  @IsString()
  owner: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsNumber()
  nonce: number;

  @IsNotEmpty()
  @IsString()
  minLoanAmount: string; // BigNumber

  @IsNotEmpty()
  @IsString()
  amount: string; // BigNumber

  @IsNotEmpty()
  @IsNumber()
  interestRateBPS: number;

  @IsNotEmpty()
  @IsNumber()
  expiration: number;

  @IsNotEmpty()
  @IsNumber()
  minLoanDuration: number;

  @IsNotEmpty()
  @IsNumber()
  maxLoanDuration: number;

  @IsOptional()
  @IsString()
  borrowed?: string; // BigNumber

  @IsOptional()
  @IsString()
  allowance?: string; // BigNumber

  @IsOptional()
  @IsString()
  balance?: string; // BigNumber
}
