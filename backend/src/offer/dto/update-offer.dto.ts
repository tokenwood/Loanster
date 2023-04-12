import { PartialType } from '@nestjs/mapped-types';
import { OfferDto } from './offer.dto';

export class UpdateOfferDto extends PartialType(OfferDto) {
  // PartialType is a helper type from NestJS that makes all fields optional
}
