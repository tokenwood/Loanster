import { Injectable } from '@nestjs/common';
import axios from 'axios';

let eth_price: EtherPrice = undefined;

interface EtherPrice {
  timestamp: number;
  usd: number;
}

@Injectable()
export class AppService {
  async getEthPriceAsync(): Promise<number> {
    const now = Date.now();
    if (eth_price && now - eth_price.timestamp <= 1000 * 60) {
      return eth_price.usd;
    }
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    );
    eth_price = {
      timestamp: now,
      usd: response.data.ethereum,
    };
    return eth_price.usd;
  }
}
