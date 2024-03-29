import { Module, OnModuleInit } from '@nestjs/common';
import { createConnection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as url from 'url';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class DatabaseTestModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;
    const parsedUrl = url.parse(databaseUrl);

    try {
      const connection = await createConnection({
        type: 'postgres',
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
        username: parsedUrl.auth.split(':')[0],
        password: parsedUrl.auth.split(':')[1],
        database: parsedUrl.pathname.slice(1),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Use false in production: this creates tables and columns automatically
        ssl:
          process.env.ENABLE_SSL === 'true'
            ? {
                rejectUnauthorized: false,
              }
            : false,
      });
      console.log('Database connection successful');
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  }
}
