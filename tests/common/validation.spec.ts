import {
  ArgumentMetadata,
  BadRequestException,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { DepositDto } from '../../src/accounts/dto/deposit.dto';
import { StatementQueryDto } from '../../src/accounts/dto/statement-query.dto';

// Boundary validation: the controller relies on ParseUUIDPipe (for :accountId) and the global
// ValidationPipe (for DTOs). These assert that bad input is rejected with HTTP 400 before any
// service/business logic runs. No HTTP server is spun up — the pipes are driven directly.
// A BadRequestException always carries status 400 (asserted explicitly once below).

const VALID_UUID = '6fa459ea-ee8a-3ca4-894e-db77e160355e';

describe('Request boundary validation', () => {
  describe('ParseUUIDPipe (:accountId)', () => {
    const pipe = new ParseUUIDPipe();
    const meta: ArgumentMetadata = { type: 'param', data: 'accountId' };

    it('rejects an invalid UUID with 400', async () => {
      expect.assertions(2);
      try {
        await pipe.transform('not-a-uuid', meta);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getStatus()).toBe(400);
      }
    });

    it('passes a valid UUID through unchanged', async () => {
      await expect(pipe.transform(VALID_UUID, meta)).resolves.toBe(VALID_UUID);
    });
  });

  describe('ValidationPipe — DepositDto body', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const meta: ArgumentMetadata = { type: 'body', metatype: DepositDto };

    it('rejects a missing amount with 400', async () => {
      await expect(pipe.transform({}, meta)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a non-numeric amount with 400', async () => {
      await expect(
        pipe.transform({ amount: 'abc' }, meta),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an unknown extra property with 400 (forbidNonWhitelisted)', async () => {
      await expect(
        pipe.transform({ amount: '50.00', evil: true }, meta),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a valid decimal-string amount', async () => {
      const result = await pipe.transform({ amount: '50.00' }, meta);
      expect(result).toBeInstanceOf(DepositDto);
      expect(result.amount).toBe('50.00');
    });
  });

  describe('ValidationPipe — StatementQueryDto', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const meta: ArgumentMetadata = {
      type: 'query',
      metatype: StatementQueryDto,
    };

    it('rejects a missing date with 400', async () => {
      await expect(
        pipe.transform({ from: '2026-01-01' }, meta),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an invalid date string with 400', async () => {
      await expect(
        pipe.transform({ from: 'not-a-date', to: '2026-01-31' }, meta),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts valid from/to dates', async () => {
      const result = await pipe.transform(
        { from: '2026-01-01', to: '2026-01-31' },
        meta,
      );
      expect(result).toBeInstanceOf(StatementQueryDto);
      expect(result.from).toBe('2026-01-01');
      expect(result.to).toBe('2026-01-31');
    });
  });
});
