import { AccountType } from '../../src/accounts/enums/account-type.enum';
import { TransactionType } from '../../src/transactions/enums/transaction-type.enum';
import {
  AccountInactiveError,
  AccountNotFoundError,
  DailyWithdrawalLimitExceededError,
  InsufficientFundsError,
  InvalidAmountError,
  InvalidStatementPeriodError,
} from '../../src/common/errors';
import {
  AccountsServiceHarness,
  buildAccount,
  buildTransaction,
  createAccountsServiceHarness,
} from '../shared';

describe('AccountsService', () => {
  let service: AccountsServiceHarness['service'];
  let accountRepo: AccountsServiceHarness['accountRepo'];
  let txRepo: AccountsServiceHarness['txRepo'];

  beforeEach(() => {
    ({ service, accountRepo, txRepo } = createAccountsServiceHarness());
  });

  // 1
  it('creates an account successfully', async () => {
    accountRepo.createAccount.mockResolvedValue(
      buildAccount({ balance: '0.0000' }),
    );

    const result = await service.createAccount({
      personId: 'person-1',
      accountType: AccountType.CHECKING,
      dailyWithdrawalLimit: '1000.00',
    });

    expect(accountRepo.createAccount).toHaveBeenCalledWith({
      personId: 'person-1',
      accountType: AccountType.CHECKING,
      dailyWithdrawalLimit: '1000.00',
    });
    expect(result.accountId).toBe('acc-1');
    expect(result.balance).toBe('0.0000');
  });

  // 2
  it('deposit increases the balance', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(
      buildAccount({ balance: '100.0000' }),
    );

    const result = await service.deposit('acc-1', { amount: '50.00' });

    expect(accountRepo.save).toHaveBeenCalledTimes(1);
    const savedAccount = accountRepo.save.mock.calls[0][1];
    expect(savedAccount.balance).toBe('150.0000');
    expect(result.balance).toBe('150.0000');
  });

  // 3
  it('deposit creates a DEPOSIT transaction record', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(buildAccount());

    const result = await service.deposit('acc-1', { amount: '50.00' });

    expect(txRepo.createInTransaction).toHaveBeenCalledWith(expect.anything(), {
      accountId: 'acc-1',
      value: '50.00',
      type: TransactionType.DEPOSIT,
    });
    expect(result.transaction.type).toBe(TransactionType.DEPOSIT);
  });

  // 4
  it('withdrawal decreases the balance', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(
      buildAccount({ balance: '100.0000', dailyWithdrawalLimit: '1000.0000' }),
    );
    txRepo.getTotalWithdrawals.mockResolvedValue('0.0000');

    const result = await service.withdraw('acc-1', { amount: '30.00' });

    expect(accountRepo.save).toHaveBeenCalledTimes(1);
    const savedAccount = accountRepo.save.mock.calls[0][1];
    expect(savedAccount.balance).toBe('70.0000');
    expect(result.balance).toBe('70.0000');
  });

  // 5
  it('withdrawal creates a WITHDRAWAL transaction record', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(buildAccount());
    txRepo.getTotalWithdrawals.mockResolvedValue('0.0000');

    const result = await service.withdraw('acc-1', { amount: '30.00' });

    expect(txRepo.createInTransaction).toHaveBeenCalledWith(expect.anything(), {
      accountId: 'acc-1',
      value: '30.00',
      type: TransactionType.WITHDRAWAL,
    });
    expect(result.transaction.type).toBe(TransactionType.WITHDRAWAL);
  });

  // 6
  it('withdrawal fails when the account is inactive', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(
      buildAccount({ activeFlag: false }),
    );

    await expect(
      service.withdraw('acc-1', { amount: '10.00' }),
    ).rejects.toBeInstanceOf(AccountInactiveError);

    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(txRepo.createInTransaction).not.toHaveBeenCalled();
  });

  // 7
  it('withdrawal fails when the amount is not positive', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(buildAccount());

    await expect(
      service.withdraw('acc-1', { amount: '0' }),
    ).rejects.toBeInstanceOf(InvalidAmountError);

    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(txRepo.createInTransaction).not.toHaveBeenCalled();
  });

  // 8
  it('withdrawal fails when the balance is insufficient', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(
      buildAccount({ balance: '10.0000' }),
    );

    await expect(
      service.withdraw('acc-1', { amount: '50.00' }),
    ).rejects.toBeInstanceOf(InsufficientFundsError);

    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(txRepo.createInTransaction).not.toHaveBeenCalled();
  });

  // 9
  it('withdrawal fails when the daily withdrawal limit is exceeded', async () => {
    accountRepo.findByIdForUpdate.mockResolvedValue(
      buildAccount({ balance: '1000.0000', dailyWithdrawalLimit: '100.0000' }),
    );
    txRepo.getTotalWithdrawals.mockResolvedValue('80.0000');

    await expect(
      service.withdraw('acc-1', { amount: '50.00' }),
    ).rejects.toBeInstanceOf(DailyWithdrawalLimitExceededError);

    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(txRepo.createInTransaction).not.toHaveBeenCalled();
  });

  // 10
  it('statement filters transactions by period', async () => {
    accountRepo.findById.mockResolvedValue(buildAccount());
    txRepo.findByAccountAndPeriod.mockResolvedValue([
      buildTransaction({ transactionId: 't1', type: TransactionType.DEPOSIT }),
      buildTransaction({
        transactionId: 't2',
        type: TransactionType.WITHDRAWAL,
      }),
    ]);

    const result = await service.getStatement('acc-1', {
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(txRepo.findByAccountAndPeriod).toHaveBeenCalledWith(
      'acc-1',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions.map((t) => t.transactionId)).toEqual([
      't1',
      't2',
    ]);
  });

  // 10b: a date-only `to` includes transactions from later that same day.
  it('statement includes transactions later on the "to" day (exclusive upper bound)', async () => {
    accountRepo.findById.mockResolvedValue(buildAccount());
    txRepo.findByAccountAndPeriod.mockResolvedValue([
      buildTransaction({
        transactionId: 't-late',
        transactionDate: new Date('2026-01-31T23:30:00.000Z'),
      }),
    ]);

    const result = await service.getStatement('acc-1', {
      from: '2026-01-01',
      to: '2026-01-31',
    });

    // Upper bound is the start of the day AFTER `to`, so 2026-01-31T23:30Z is in range.
    expect(txRepo.findByAccountAndPeriod).toHaveBeenCalledWith(
      'acc-1',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(result.transactions.map((t) => t.transactionId)).toEqual(['t-late']);
  });

  // Rollback behavior: a failed balance-changing operation writes nothing.
  describe('rollback behavior', () => {
    it('does not persist balance or transaction when withdrawal fails', async () => {
      accountRepo.findByIdForUpdate.mockResolvedValue(
        buildAccount({ balance: '10.0000' }),
      );

      await expect(
        service.withdraw('acc-1', { amount: '50.00' }),
      ).rejects.toBeInstanceOf(InsufficientFundsError);

      expect(accountRepo.save).not.toHaveBeenCalled();
      expect(txRepo.createInTransaction).not.toHaveBeenCalled();
    });

    it('throws AccountNotFoundError and writes nothing for a missing account', async () => {
      accountRepo.findByIdForUpdate.mockResolvedValue(null);

      await expect(
        service.deposit('missing', { amount: '50.00' }),
      ).rejects.toBeInstanceOf(AccountNotFoundError);

      expect(accountRepo.save).not.toHaveBeenCalled();
      expect(txRepo.createInTransaction).not.toHaveBeenCalled();
    });
  });

  it('statement rejects an invalid period (from after to)', async () => {
    await expect(
      service.getStatement('acc-1', { from: '2026-02-01', to: '2026-01-01' }),
    ).rejects.toBeInstanceOf(InvalidStatementPeriodError);

    expect(txRepo.findByAccountAndPeriod).not.toHaveBeenCalled();
  });
});
