import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnection } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
  ],
})
export class DatabaseTestModule implements OnModuleInit {
  async onModuleInit() {
    try {
      const connection = getConnection();
      console.log('Database connection successful');
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  }
}
