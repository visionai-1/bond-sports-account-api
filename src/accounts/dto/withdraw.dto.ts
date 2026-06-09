import { IsNumberString } from 'class-validator';

export class WithdrawDto {
  // Positive decimal string; amount-sign validation is enforced in the service.
  @IsNumberString()
  amount: string;
}
