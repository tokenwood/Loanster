import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { BigNumber } from 'ethers';
import { parseBigNumberInResponse } from './shared_utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/api/diego')
  getDiego() {
    return this.appService.getDiego();
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
