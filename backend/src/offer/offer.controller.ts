import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { parseBigNumbers } from '../helperFunctions';

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    parseBigNumbers(createOfferDto);
    return this.offerService.create(createOfferDto);
  }

  @Get('from_owner')
  findOffersFromOwner(@Query('owner') owner: string) {
    return this.offerService.findOffersFromOwner(owner);
  }

  @Get()
  findAllByToken(@Query('token') token?: string) {
    return this.offerService.findAllByToken(token);
  }

  @Get('stats')
  getTokenOfferStats(@Query('token') token: string) {
    return this.offerService.getTokenOfferStats(token);
  }

  // @Get(':id')
  // findOne(@Param('id') id: number) {
  //   return this.offerService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: number, @Body() updateOfferDto: UpdateOfferDto) {
  //   return this.offerService.update(+id, updateOfferDto);
  // }

  // @Delete(':id')
  // delete(@Param('id') id: number) {
  //   return this.offerService.delete(+id);
  // }
}
