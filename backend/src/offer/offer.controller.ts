import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BigNumber, ethers } from 'ethers';
import { concat } from 'ethers/lib/utils';

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    console.log('offer received: ');
    console.log(createOfferDto);

    createOfferDto.key = getOfferKey(
      createOfferDto.owner,
      createOfferDto.offerId,
    );
    return this.offerService.create(createOfferDto);
  }

  @Get()
  findAll() {
    return this.offerService.findAll();
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

function getOfferKey(owner: string, offerId: number) {
  const a = ethers.utils.toUtf8Bytes(owner);
  const b = ethers.utils.toUtf8Bytes(BigNumber.from(offerId).toHexString());

  return ethers.utils.keccak256(concat([a, b]));
}
