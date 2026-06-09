import { DataSource } from 'typeorm';
import { Account } from '../../../src/accounts/entities/account.entity';
import { AppLoggerService } from '../../../src/common/logging';
import { buildTransaction } from '../builders/transaction.builder';
import {
  MockedAccountRepository,
  MockedTransactionRepository,
} from '../types/test.types';

export function createMockAccountRepository(): MockedAccountRepository {
  return {
    createAccount: jest.fn(),
    findById: jest.fn(),
    findByIdForUpdate: jest.fn(),
    save: jest.fn((_manager, account: Account) => Promise.resolve(account)),
  };
}

export function createMockTransactionRepository(): MockedTransactionRepository {
  return {
    createInTransaction: jest.fn((_manager, data) =>
      Promise.resolve(buildTransaction({ type: data.type, value: data.value })),
    ),
    getTotalWithdrawals: jest.fn(),
    findByAccountAndPeriod: jest.fn(),
  };
}

// transaction() simply runs the callback with a stub manager (no real DB).
export function createMockDataSource(): DataSource {
  return {
    transaction: jest.fn((cb: (manager: unknown) => unknown) => cb({})),
  } as unknown as DataSource;
}

export function createMockLogger(): AppLoggerService {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as AppLoggerService;
}
