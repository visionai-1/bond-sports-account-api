import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountRepository } from './repositories/account.repository';
import { TransactionRepository } from '../transactions/repositories/transaction.repository';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { Account } from './entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AccountType } from './enums/account-type.enum';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import {
  Money,
  statementUtcRange,
  todayUtcRange,
} from '../common/helpers';
import {
  AccountInactiveError,
  AccountNotFoundError,
  DailyWithdrawalLimitExceededError,
  InsufficientFundsError,
  InvalidAmountError,
  InvalidStatementPeriodError,
} from '../common/errors';
import { AppLoggerService } from '../common/logging';

const CONTEXT = 'AccountsService';

export interface AccountResponse {
  accountId: string;
  personId: string;
  balance: string;
  dailyWithdrawalLimit: string;
  activeFlag: boolean;
  accountType: AccountType;
  createDate: Date;
}

export interface TransactionView {
  transactionId: string;
  type: TransactionType;
  value: string;
  transactionDate: Date;
}

export interface OperationResponse {
  accountId: string;
  balance: string;
  transaction: TransactionView;
}

export interface StatementResponse {
  accountId: string;
  from: string;
  to: string;
  transactions: TransactionView[];
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async createAccount(dto: CreateAccountDto): Promise<AccountResponse> {
    const account = await this.accountRepository.createAccount({
      personId: dto.personId,
      accountType: dto.accountType,
      dailyWithdrawalLimit: dto.dailyWithdrawalLimit,
    });
    this.logger.log('account created', CONTEXT, {
      accountId: account.accountId,
      accountType: account.accountType,
    });
    return this.toAccountResponse(account);
  }

  async getAccount(accountId: string): Promise<AccountResponse> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      this.logger.warn('account not found', CONTEXT, { accountId });
      throw new AccountNotFoundError(accountId);
    }
    this.logger.log('account fetched', CONTEXT, { accountId });
    return this.toAccountResponse(account);
  }

  async deposit(accountId: string, dto: DepositDto): Promise<OperationResponse> {
    return this.dataSource.transaction(async (manager) => {
      const account = await this.accountRepository.findByIdForUpdate(
        manager,
        accountId,
      );
      if (!account) {
        this.logger.warn('account not found', CONTEXT, { accountId });
        throw new AccountNotFoundError(accountId);
      }
      if (!account.activeFlag) {
        this.logger.warn('inactive account', CONTEXT, { accountId });
        throw new AccountInactiveError();
      }
      if (!Money.isPositive(dto.amount)) {
        throw new InvalidAmountError();
      }

      account.balance = Money.add(account.balance, dto.amount);
      const saved = await this.accountRepository.save(manager, account);
      const transaction = await this.transactionRepository.createInTransaction(
        manager,
        { accountId, value: dto.amount, type: TransactionType.DEPOSIT },
      );

      this.logger.log('deposit completed', CONTEXT, {
        accountId,
        transactionId: transaction.transactionId,
        transactionType: transaction.type,
        amount: transaction.value,
        balance: saved.balance,
      });
      return this.toOperationResponse(saved, transaction);
    });
  }

  async withdraw(
    accountId: string,
    dto: WithdrawDto,
  ): Promise<OperationResponse> {
    return this.dataSource.transaction(async (manager) => {
      const account = await this.accountRepository.findByIdForUpdate(
        manager,
        accountId,
      );
      if (!account) {
        this.logger.warn('account not found', CONTEXT, { accountId });
        throw new AccountNotFoundError(accountId);
      }
      if (!account.activeFlag) {
        this.logger.warn('inactive account', CONTEXT, { accountId });
        throw new AccountInactiveError();
      }
      if (!Money.isPositive(dto.amount)) {
        throw new InvalidAmountError();
      }
      if (!Money.gte(account.balance, dto.amount)) {
        this.logger.warn('insufficient funds', CONTEXT, { accountId });
        throw new InsufficientFundsError();
      }

      const { start, end } = todayUtcRange();
      const withdrawnToday = await this.transactionRepository.getTotalWithdrawals(
        manager,
        accountId,
        start,
        end,
      );
      if (
        !Money.lte(
          Money.add(withdrawnToday, dto.amount),
          account.dailyWithdrawalLimit,
        )
      ) {
        this.logger.warn('daily withdrawal limit exceeded', CONTEXT, {
          accountId,
        });
        throw new DailyWithdrawalLimitExceededError();
      }

      account.balance = Money.subtract(account.balance, dto.amount);
      const saved = await this.accountRepository.save(manager, account);
      const transaction = await this.transactionRepository.createInTransaction(
        manager,
        { accountId, value: dto.amount, type: TransactionType.WITHDRAWAL },
      );

      this.logger.log('withdrawal completed', CONTEXT, {
        accountId,
        transactionId: transaction.transactionId,
        transactionType: transaction.type,
        amount: transaction.value,
        balance: saved.balance,
      });
      return this.toOperationResponse(saved, transaction);
    });
  }

  async getStatement(
    accountId: string,
    query: StatementQueryDto,
  ): Promise<StatementResponse> {
    const { from, toExclusive } = statementUtcRange(query.from, query.to);
    if (from >= toExclusive) {
      this.logger.warn('invalid statement period', CONTEXT, {
        accountId,
        from: query.from,
        to: query.to,
      });
      throw new InvalidStatementPeriodError();
    }

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      this.logger.warn('account not found', CONTEXT, { accountId });
      throw new AccountNotFoundError(accountId);
    }

    const transactions =
      await this.transactionRepository.findByAccountAndPeriod(
        accountId,
        from,
        toExclusive,
      );

    this.logger.log('statement requested', CONTEXT, {
      accountId,
      from: query.from,
      to: query.to,
      count: transactions.length,
    });
    return {
      accountId,
      from: query.from,
      to: query.to,
      transactions: transactions.map((t) => this.toTransactionView(t)),
    };
  }

  private toAccountResponse(account: Account): AccountResponse {
    return {
      accountId: account.accountId,
      personId: account.personId,
      balance: account.balance,
      dailyWithdrawalLimit: account.dailyWithdrawalLimit,
      activeFlag: account.activeFlag,
      accountType: account.accountType,
      createDate: account.createDate,
    };
  }

  private toOperationResponse(
    account: Account,
    transaction: Transaction,
  ): OperationResponse {
    return {
      accountId: account.accountId,
      balance: account.balance,
      transaction: this.toTransactionView(transaction),
    };
  }

  private toTransactionView(transaction: Transaction): TransactionView {
    return {
      transactionId: transaction.transactionId,
      type: transaction.type,
      value: transaction.value,
      transactionDate: transaction.transactionDate,
    };
  }
}
