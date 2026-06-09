import { Transaction } from '../../../src/transactions/entities/transaction.entity';
import { TransactionType } from '../../../src/transactions/enums/transaction-type.enum';
import { Account } from '../../../src/accounts/entities/account.entity';

export function buildTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    transactionId: 'tx-1',
    accountId: 'acc-1',
    value: '50.0000',
    type: TransactionType.DEPOSIT,
    transactionDate: new Date('2026-01-02T00:00:00.000Z'),
    account: undefined as unknown as Account,
    ...overrides,
  };
}
