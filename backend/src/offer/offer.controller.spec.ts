import { Test, TestingModule } from '@nestjs/testing';
import { Offer } from './entities/offer.entity';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('OfferController', () => {
  let controller: OfferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferController],
      providers: [
        OfferService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OfferController>(OfferController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
