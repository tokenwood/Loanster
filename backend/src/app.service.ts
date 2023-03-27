import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world!';
  }

  getDiego() {
    return {'value':'Diego'};
  }
}
