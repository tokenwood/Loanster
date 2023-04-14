import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BigNumber, ethers } from 'ethers';
import { concat } from 'ethers/lib/utils';
import { getOfferKey, TokenOfferStatsResponse } from 'src/shared_utils';

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

    offer.key = getOfferKey(offer.owner, offer.token, offer.offerId);

    return this.offerRepository.save(offer);
  }

  findOffersFromOwner(account: string): Promise<Offer[]> {
    return this.offerRepository.find({
      where: {
        owner: account,
      },
    });
  }

  findAllByToken(token?: string) {
    const output = this.offerRepository.find({
      where: {
        token: token,
      },
      order: {
        token: 'ASC',
        interestRateBPS: 'ASC',
      },
    });
    console.log('token output: ');
    console.log(output);
    return output;
  }

  async getTokenOfferStats(token: string): Promise<TokenOfferStatsResponse> {
    const tokenOffers = await this.findAllByToken(token);

    const minAPY =
      tokenOffers.length > 0 ? tokenOffers[0].interestRateBPS : undefined;
    const total = tokenOffers
      .map((x) => BigNumber.from(x.amount)) // should be available amount
      .reduce((a, b) => a.add(b), BigNumber.from(0));

    return {
      minAPY: minAPY,
      total: total,
    };
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

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}
