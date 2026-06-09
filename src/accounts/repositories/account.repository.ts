import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { AccountType } from '../enums/account-type.enum';

export interface CreateAccountData {
  personId: string;
  accountType: AccountType;
  dailyWithdrawalLimit: string;
}

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
  ) {}

  createAccount(data: CreateAccountData): Promise<Account> {
    const account = this.repo.create({
      personId: data.personId,
      accountType: data.accountType,
      dailyWithdrawalLimit: data.dailyWithdrawalLimit,
    });
    return this.repo.save(account);
  }

  findById(accountId: string): Promise<Account | null> {
    return this.repo.findOne({ where: { accountId } });
  }

  // Loads the account row with a pessimistic write lock (SELECT ... FOR UPDATE).
  // Must be called inside a transaction (uses the transactional EntityManager).
  findByIdForUpdate(
    manager: EntityManager,
    accountId: string,
  ): Promise<Account | null> {
    return manager.findOne(Account, {
      where: { accountId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  // Persists the account using the transactional EntityManager.
  save(manager: EntityManager, account: Account): Promise<Account> {
    return manager.save(account);
  }
}
