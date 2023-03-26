import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
  ) {}


  create(offer: CreateOfferDto): Promise<CreateOfferDto> {
    return this.offerRepository.save(offer);
  }

  findAll() {
    return this.offerRepository.find();
  }

  findOne(id: number): Promise<Offer> {
    return this.offerRepository.findOneBy({id});
  }

  async update(id: number, updatedOffer: UpdateOfferDto): Promise<void> {
    await this.offerRepository.update(id, updatedOffer);
  }

  async delete(id: number): Promise<void> {
    await this.offerRepository.delete(id);
  }
}
