// Domain errors mapped to the HTTP status codes defined in docs/API.md.
// They extend Nest's HttpException subclasses so the default error response
// shape ({ statusCode, error, message }) is produced without an extra filter.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class AccountNotFoundError extends NotFoundException {
  constructor(accountId: string) {
    super(`Account ${accountId} not found`);
  }
}

export class AccountInactiveError extends ConflictException {
  constructor() {
    super('Account is inactive');
  }
}

export class InvalidAmountError extends BadRequestException {
  constructor() {
    super('Amount must be positive');
  }
}

export class InsufficientFundsError extends UnprocessableEntityException {
  constructor() {
    super('Insufficient balance');
  }
}

export class DailyWithdrawalLimitExceededError extends UnprocessableEntityException {
  constructor() {
    super('Daily withdrawal limit exceeded');
  }
}

export class InvalidStatementPeriodError extends BadRequestException {
  constructor() {
    super('Invalid statement period: "from" must not be after "to"');
  }
}
