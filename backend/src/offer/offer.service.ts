import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { BigNumber } from 'ethers';
import { getOfferKey, TokenOfferStatsResponse } from '../sharedUtils';
import { getOfferOnChainData } from '../helperFunctions';
import { OfferDto } from './dto/offer.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { take } from 'rxjs';

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
      offer.chainId,
    );
    offer.borrowed = borrowed.toHexString();
    offer.balance = balance.toHexString();
    offer.allowance = allowance.toHexString();
    console.log(
      'onChainNonce: ',
      nonce.toNumber(),
      'offerNonce: ',
      offer.nonce,
    );
    if (nonce.toNumber() > offer.nonce) {
      throw new HttpException('Nonce is too low', 400);
    }

    return this.offerRepository.save(offer);
  }

  findOffersFromOwner(chainId: number, account: string): Promise<Offer[]> {
    return this.offerRepository.find({
      where: {
        owner: account,
        chainId: chainId,
      },
    });
  }

  findAllByToken(
    chainId: number,
    token?: string,
    duration?: number,
    take?: number,
  ): Promise<Offer[]> {
    const output = this.offerRepository.find({
      where: {
        token: token,
        chainId: chainId,
        maxLoanDuration: duration ? MoreThanOrEqual(duration) : undefined,
        minLoanDuration: duration ? LessThanOrEqual(duration) : undefined,
      },
      order: {
        token: 'ASC',
        interestRateBPS: 'ASC',
      },
      take: take,
    });
    return output;
  }

  async getTokenOfferStats(
    chainId: number,
    token: string,
  ): Promise<TokenOfferStatsResponse> {
    async function getBestAPY(duration: number, service: OfferService) {
      const offer7d = await service.findAllByToken(chainId, token, duration, 1);
      return offer7d.length > 0 ? offer7d[0].interestRateBPS : undefined;
    }

    const tokenOffers = await this.findAllByToken(chainId, token);
    const total = tokenOffers
      .map((x) => BigNumber.from(x.amount).sub(x.borrowed))
      .reduce((a, b) => a.add(b), BigNumber.from(0));

    return {
      apy7d: await getBestAPY(7 * 24 * 60 * 60, this),
      apy30d: await getBestAPY(30 * 24 * 60 * 60, this),
      apy90d: await getBestAPY(90 * 24 * 60 * 60, this),
      total: total,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async refreshAllOffers() {
    console.log('refreshing all offers');
    const offers = await this.offerRepository.find();

    //todo remove expired offers
    for (const offer of offers) {
      const [nonce, borrowed, balance, allowance] = await getOfferOnChainData(
        offer.owner,
        offer.token,
        offer.offerId,
        offer.chainId,
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
