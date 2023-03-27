import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BigNumber, ethers } from 'ethers';
import { concat } from 'ethers/lib/utils';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
  ) {}

  create(offer: CreateOfferDto): Promise<CreateOfferDto> {
    // TODO
    // check that signature is the signature of the offer.owner
    // todo verify on-chain that offer key doesn't already exist => use insert instead of save?
    // verify there is no other current offer with same key (= hash(owner, id))
    // if this fails, propagate error to front-end

    // console.log('offer received: ');
    // console.log(offer);

    offer.key = getOfferKey(offer.owner, offer.offerId);

    return this.offerRepository.save(offer);
  }

  findOffersFromOwner(account: string): Promise<Offer[]> {
    return this.offerRepository.find({
      where: {
        owner: account,
      },
    });
  }

  findAll() {
    return this.offerRepository.find();
  }

  // findOne(id: number): Promise<Offer> {
  //   return this.offerRepository.findOneBy({id});
  // }

  // async update(id: number, updatedOffer: UpdateOfferDto): Promise<void> {
  //   await this.offerRepository.update(id, updatedOffer);
  // }

  // async delete(id: number): Promise<void> {
  //   await this.offerRepository.delete(id);
  // }
}

function getOfferKey(owner: string, offerId: number) {
  const a = ethers.utils.toUtf8Bytes(owner);
  const b = ethers.utils.toUtf8Bytes(BigNumber.from(offerId).toHexString());

  return ethers.utils.keccak256(concat([a, b]));
}
