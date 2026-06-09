import { AccountsService } from '../../../src/accounts/accounts.service';
import { AccountRepository } from '../../../src/accounts/repositories/account.repository';
import { TransactionRepository } from '../../../src/transactions/repositories/transaction.repository';
import {
  createMockAccountRepository,
  createMockTransactionRepository,
  createMockDataSource,
  createMockLogger,
} from '../mocks/repositories.mock';
import { AccountsServiceHarness } from '../types/test.types';

// Wires the mocked dependencies into a real AccountsService and returns the
// service plus the mocked repositories so tests can arrange/assert on them.
export function createAccountsServiceHarness(): AccountsServiceHarness {
  const accountRepo = createMockAccountRepository();
  const txRepo = createMockTransactionRepository();
  const service = new AccountsService(
    createMockDataSource(),
    accountRepo as unknown as AccountRepository,
    txRepo as unknown as TransactionRepository,
    createMockLogger(),
  );
  return { service, accountRepo, txRepo };
}
