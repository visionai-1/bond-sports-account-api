import { IsNumberString } from 'class-validator';

export class DepositDto {
  // Positive decimal string; amount-sign validation is enforced in the service.
  @IsNumberString()
  amount: string;
}
