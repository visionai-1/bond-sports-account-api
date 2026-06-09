import { Account } from '../../../src/accounts/entities/account.entity';
import { AccountType } from '../../../src/accounts/enums/account-type.enum';

export function buildAccount(overrides: Partial<Account> = {}): Account {
  return {
    accountId: 'acc-1',
    personId: 'person-1',
    balance: '100.0000',
    dailyWithdrawalLimit: '1000.0000',
    activeFlag: true,
    accountType: AccountType.CHECKING,
    createDate: new Date('2026-01-01T00:00:00.000Z'),
    transactions: [],
    ...overrides,
  };
}
