import { Controller, Get, Post, Body, Query } from '@nestjs/common';
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
  findOffersFromOwner(
    @Query('chain_id') chainId: number,
    @Query('owner') owner: string,
  ) {
    return this.offerService.findOffersFromOwner(chainId, owner);
  }

  @Get()
  findAllByToken(
    @Query('chain_id') chainId: number,
    @Query('token') token?: string,
  ) {
    return this.offerService.findAllByToken(chainId, token);
  }

  @Get('stats')
  getTokenOfferStats(
    @Query('chain_id') chainId: number,
    @Query('token') token: string,
  ) {
    return this.offerService.getTokenOfferStats(chainId, token);
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
