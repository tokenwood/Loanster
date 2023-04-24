import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Offer {
  @PrimaryColumn() // TODO: @PrimaryGeneratedColumn() ?
  key: string;

  @Column()
  chainId: number;

  @Column()
  offerId: number;

  @Column()
  owner: string;

  @Column()
  signature: string;

  @Column()
  token: string;

  @Column()
  nonce: number;

  @Column()
  minLoanAmount: string; // BigNumber

  @Column()
  amount: string; // BigNumber

  @Column()
  interestRateBPS: number;

  @Column()
  expiration: number;

  @Column()
  minLoanDuration: number;

  @Column()
  maxLoanDuration: number;

  @Column({ nullable: true })
  borrowed?: string; // BigNumber

  @Column({ nullable: true })
  allowance?: string; // BigNumber

  @Column({ nullable: true })
  balance?: string; // BigNumber
}
