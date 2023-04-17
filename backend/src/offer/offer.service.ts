import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BigNumber, ethers } from 'ethers';
import { getOfferKey, TokenOfferStatsResponse } from '../sharedUtils';
import { getOfferOnChainData } from '../helperFunctions';
import { OfferDto } from './dto/offer.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
  ) {}

  async create(offer: CreateOfferDto): Promise<OfferDto> {
    // TODO
    // check that signature is the signature of the offer.owner
    // todo verify on-chain that offer key doesn't already exist => use insert instead of save?
    // verify there is no other current offer with same key (= hash(owner, id))
    // if this fails, propagate error to front-end

    offer.key = getOfferKey(offer.owner, offer.token, offer.offerId);
    const [nonce, borrowed, balance, allowance] = await getOfferOnChainData(
      offer.owner,
      offer.token,
      offer.offerId,
    );
    offer.borrowed = borrowed.toHexString();
    offer.balance = balance.toHexString();
    offer.allowance = allowance.toHexString();
    if (nonce.toNumber() > offer.nonce) {
      throw new HttpException('Nonce is too low', 400);
    }

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
    return output;
  }

  async getTokenOfferStats(token: string): Promise<TokenOfferStatsResponse> {
    const tokenOffers = await this.findAllByToken(token);

    const minAPY =
      tokenOffers.length > 0 ? tokenOffers[0].interestRateBPS : undefined;
    const total = tokenOffers
      .map((x) => BigNumber.from(x.amount).sub(x.borrowed))
      .reduce((a, b) => a.add(b), BigNumber.from(0));

    return {
      minAPY: minAPY,
      total: total,
    };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async refreshAllOffers() {
    console.log('refreshing all offers');
    const offers = await this.offerRepository.find();
    for (const offer of offers) {
      const [nonce, borrowed, balance, allowance] = await getOfferOnChainData(
        offer.owner,
        offer.token,
        offer.offerId,
      );
      offer.borrowed = borrowed.toHexString();
      offer.balance = balance.toHexString();
      offer.allowance = allowance.toHexString();

      if (nonce.toNumber() > offer.nonce) {
        // offer is cancelled
        console.log('removing cancelled offer');
        await this.offerRepository.delete(offer);
      } else if (BigNumber.from(borrowed).eq(BigNumber.from(offer.amount))) {
        // offer is fully borrowed
        console.log('removing fully borrowed offer');
        await this.offerRepository.delete(offer);
      } else {
        await this.offerRepository.update(offer.key, offer);
      }
    }
  }
}

function bigNumberMin(a: BigNumber, b: BigNumber) {
  return a.lt(b) ? a : b;
}
