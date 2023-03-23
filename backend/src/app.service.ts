import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world!';
  }

  getDiego(): string {
    return 'Hello Diego!';
  }

}
