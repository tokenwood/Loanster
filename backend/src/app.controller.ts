import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { BigNumber } from 'ethers';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/api/eth_price_usd')
  getEthPrice() {
    return this.appService.getEthPriceAsync();
  }

  // @Post('/api/submit_offer')
  // postSubmitOffer(@Body() data: any) {
  //   console.log('Request data:', data);

  //   // Return a response
  //   return {
  //     message: 'Data received successfully',
  //     data: data,
  //   };

  //   // return this.appService.postSubmitOffer();
  // }
}
