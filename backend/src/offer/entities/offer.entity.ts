import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Offer {

    @PrimaryColumn() // TODO: @PrimaryGeneratedColumn() ?
    id: number;  // offerId, BigNumber

    @Column()
    owner: string;
    
    @Column()
    token: string;
    
    @Column()
    nonce: string;  // BigNumber
    
    @Column()
    minLoanAmount: string;  // BigNumber
    
    @Column()
    amount: string;  // BigNumber
    
    @Column()
    interestRateBPS: string;  // BigNumber
    
    @Column()
    expiration: string;  // BigNumber
    
    @Column()
    minLoanDuration: string;  // BigNumber

    @Column()
    maxLoanDuration: string;  // BigNumber
}
