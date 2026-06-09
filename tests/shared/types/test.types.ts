import { AccountsService } from '../../../src/accounts/accounts.service';
import { AccountRepository } from '../../../src/accounts/repositories/account.repository';
import { TransactionRepository } from '../../../src/transactions/repositories/transaction.repository';

export type MockedAccountRepository = jest.Mocked<
  Pick<
    AccountRepository,
    'createAccount' | 'findById' | 'findByIdForUpdate' | 'save'
  >
>;

export type MockedTransactionRepository = jest.Mocked<
  Pick<
    TransactionRepository,
    'createInTransaction' | 'getTotalWithdrawals' | 'findByAccountAndPeriod'
  >
>;

export interface AccountsServiceHarness {
  service: AccountsService;
  accountRepo: MockedAccountRepository;
  txRepo: MockedTransactionRepository;
}
