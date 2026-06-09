import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountType } from '../enums/account-type.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  accountId: string;

  @Column('uuid', { name: 'person_id' })
  personId: string;

  // numeric is returned as string by the pg driver to preserve precision (never float).
  @Column('numeric', { name: 'balance', precision: 19, scale: 4, default: 0 })
  balance: string;

  @Column('numeric', {
    name: 'daily_withdrawal_limit',
    precision: 19,
    scale: 4,
  })
  dailyWithdrawalLimit: string;

  @Column('boolean', { name: 'active_flag', default: true })
  activeFlag: boolean;

  @Column({
    type: 'enum',
    name: 'account_type',
    enum: AccountType,
  })
  accountType: AccountType;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];
}
