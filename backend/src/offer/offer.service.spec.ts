import { Test, TestingModule } from '@nestjs/testing';
import { OfferService } from './offer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { Repository } from 'typeorm';
import { CreateOfferDto } from './dto/create-offer.dto';

describe('OfferService', () => {
  let offerService: OfferService;
  let offerRepository: Repository<Offer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    offerService = module.get<OfferService>(OfferService);
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
  });

  it('should be defined', () => {
    expect(offerService).toBeDefined();
  });

  it('should create an offer and store it in the database', async () => {
    const testOffer: CreateOfferDto = {
      key: 'some_key',
      offerId: 1,
      owner: 'some_owner',
      signature: 'some_signature',
      token: 'some_token',
      nonce: 42,
      minLoanAmount: '1000',
      amount: '5000',
      interestRateBPS: 500,
      expiration: 1620000000,
      minLoanDuration: 7,
      maxLoanDuration: 30,
    };

    const savedOffer = new Offer();
    Object.assign(savedOffer, testOffer);
    savedOffer.key = 'some_key'; // Assuming the database will generate an ID

    jest.spyOn(offerRepository, 'save').mockResolvedValue(savedOffer);

    // Act
    const result = await offerService.create(testOffer);

    // Assert
    expect(offerRepository.save).toHaveBeenCalledWith(testOffer);
    expect(result).toEqual(savedOffer);
  });
});
