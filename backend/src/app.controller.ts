import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
// import { LoanOfferType } from '@webapp/libs/types';
import { BigNumber } from 'ethers';

export type LoanOfferType = {
  owner: string;
  token: string;
  offerId: number;
  nonce: number;
  minLoanAmount: BigNumber;
  amount: BigNumber;
  interestRateBPS: number;
  expiration: number;
  minLoanDuration: number;
  maxLoanDuration: number;
};

function parseBigNumberInResponse(response: [key: any]): any {
  for (const key in response) {
    const value = response[key];
    if (value.type === 'BigNumber') {
      response[key] = BigNumber.from(value.hex);
    }
  }
  return response;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/api/submit_offer')
  postSubmitOffer(@Body() data: any) {
    console.log('Request data:', data);

    // Use JSON.parse to convert the JSON string into a TypeScript object
    const parsedData = parseBigNumberInResponse(data);

    // Return a response
    return {
      message: 'Data received successfully',
      data: data,
    };

    // return this.appService.postSubmitOffer();
  }
}
