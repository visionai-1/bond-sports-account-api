import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './repositories/transaction.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionRepository],
  exports: [TransactionRepository],
})
export class TransactionsModule {}
