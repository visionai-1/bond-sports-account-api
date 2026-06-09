import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { StatementQueryDto } from './dto/statement-query.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(dto);
  }

  @Get(':accountId')
  getOne(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return this.accountsService.getAccount(accountId);
  }

  @Post(':accountId/deposit')
  @HttpCode(HttpStatus.OK)
  deposit(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: DepositDto,
  ) {
    return this.accountsService.deposit(accountId, dto);
  }

  @Post(':accountId/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: WithdrawDto,
  ) {
    return this.accountsService.withdraw(accountId, dto);
  }

  @Get(':accountId/statement')
  statement(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.accountsService.getStatement(accountId, query);
  }
}
