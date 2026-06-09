import { IsEnum, IsNumberString, IsUUID } from 'class-validator';
import { AccountType } from '../enums/account-type.enum';

export class CreateAccountDto {
  @IsUUID()
  personId: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  // Decimal string to preserve precision (never float).
  @IsNumberString()
  dailyWithdrawalLimit: string;
}
