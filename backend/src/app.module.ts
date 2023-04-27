import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OfferModule } from './offer/offer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseTestModule } from './database-test.module';

const url = require('url');

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = process.env.DATABASE_URL;
        const parsedUrl = url.parse(databaseUrl);
      
        return {
          type: 'postgres',
          host: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
          username: parsedUrl.auth.split(':')[0],
          password: parsedUrl.auth.split(':')[1],
          database: parsedUrl.pathname.slice(1),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Use false in production: this creates tables and columns automatically
          ssl: {
            rejectUnauthorized: false
          }
        };
      },
    }),
    DatabaseTestModule,
    OfferModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
