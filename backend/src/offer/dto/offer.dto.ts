import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class OfferDto {
    // This is the dto (Data Transfer Object) that is used to validate the data that is sent to the backend

    @IsNotEmpty()
    @IsNumber()
    id: number;  // offerId, BigNumber

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
    @IsString()
    nonce: string;  // BigNumber
    
    @IsNotEmpty()
    @IsString()
    minLoanAmount: string;  // BigNumber
    
    @IsNotEmpty()
    @IsString()
    amount: string;  // BigNumber
    
    @IsNotEmpty()
    @IsString()
    interestRateBPS: string;  // BigNumber
    
    @IsNotEmpty()
    @IsString()
    expiration: string;  // BigNumber
    
    @IsNotEmpty()
    @IsString()
    minLoanDuration: string;  // BigNumber

    @IsNotEmpty()
    @IsString()
    maxLoanDuration: string;  // BigNumber
}