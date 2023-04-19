import { Module, OnModuleInit } from '@nestjs/common';
import { createConnection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
  ],
})
export class DatabaseTestModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const connection = await createConnection({
        type: 'postgres',
        host: this.configService.get('DB_HOST'),
        port: parseInt(this.configService.get('DB_PORT') as string, 10),
        username: this.configService.get('DB_USERNAME'),
        password: this.configService.get('DB_PASSWORD'),
        database: this.configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Use false in production: this creates tables and columns automatically
      });
      console.log('Database connection successful');
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  }
}
