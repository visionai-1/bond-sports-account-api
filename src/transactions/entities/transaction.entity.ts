import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionType } from '../enums/transaction-type.enum';
import { Account } from '../../accounts/entities/account.entity';

@Entity('transactions')
@Index('idx_transactions_account', ['accountId'])
@Index('idx_transactions_account_date', ['accountId', 'transactionDate'])
@Index('idx_transactions_account_type_date', [
  'accountId',
  'type',
  'transactionDate',
])
export class Transaction {
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('uuid', { name: 'account_id' })
  accountId: string;

  // numeric is returned as string by the pg driver to preserve precision (never float).
  @Column('numeric', { name: 'value', precision: 19, scale: 4 })
  value: string;

  @Column({
    type: 'enum',
    name: 'type',
    enum: TransactionType,
  })
  type: TransactionType;

  @CreateDateColumn({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate: Date;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
