import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';

export interface CreateTransactionData {
  accountId: string;
  value: string;
  type: TransactionType;
}

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  // Creates a transaction record using the transactional EntityManager.
  createInTransaction(
    manager: EntityManager,
    data: CreateTransactionData,
  ): Promise<Transaction> {
    const transaction = manager.create(Transaction, data);
    return manager.save(transaction);
  }

  // Sums WITHDRAWAL values for an account within a date range, computed DB-side
  // (numeric SUM) to avoid JavaScript floating-point arithmetic. Returns a
  // numeric(19,4) string, or "0.0000" when there are no withdrawals.
  async getTotalWithdrawals(
    manager: EntityManager,
    accountId: string,
    from: Date,
    to: Date,
  ): Promise<string> {
    const result = await manager
      .createQueryBuilder(Transaction, 't')
      .select('COALESCE(SUM(t.value), 0)', 'total')
      .where('t.account_id = :accountId', { accountId })
      .andWhere('t.type = :type', { type: TransactionType.WITHDRAWAL })
      .andWhere('t.transaction_date BETWEEN :from AND :to', { from, to })
      .getRawOne<{ total: string }>();
    return result?.total ?? '0.0000';
  }

  // Returns transactions in [from, toExclusive): inclusive lower bound, exclusive
  // upper bound, so a whole-day `to` includes every transaction on that day.
  findByAccountAndPeriod(
    accountId: string,
    from: Date,
    toExclusive: Date,
  ): Promise<Transaction[]> {
    return this.repo
      .createQueryBuilder('t')
      .where('t.account_id = :accountId', { accountId })
      .andWhere('t.transaction_date >= :from', { from })
      .andWhere('t.transaction_date < :toExclusive', { toExclusive })
      .orderBy('t.transaction_date', 'ASC')
      .getMany();
  }
}
