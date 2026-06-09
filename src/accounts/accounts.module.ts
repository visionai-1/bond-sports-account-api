import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountRepository } from './repositories/account.repository';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), TransactionsModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountRepository],
})
export class AccountsModule {}
