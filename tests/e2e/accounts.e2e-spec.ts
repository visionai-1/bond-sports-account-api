import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

// Lightweight end-to-end test: a real Nest application + real PostgreSQL, exercised over HTTP via
// supertest. It proves routing → validation pipes → controller → service → repository → DB wiring.
// It runs against a DEDICATED database (bond_sports_account_e2e), never the dev database, and is
// kept minimal on purpose — business-rule depth lives in the unit suite.

const E2E_DB_NAME = process.env.E2E_DB_NAME ?? 'bond_sports_account_e2e';
const VALID_MISSING_UUID = '6fa459ea-ee8a-3ca4-894e-db77e160355e';

describe('Accounts API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    // Point the app at the dedicated E2E database BEFORE the module (and TypeORM) is built.
    // @nestjs/config loads .env via dotenv, which does not override already-set process.env.
    process.env.DB_NAME = E2E_DB_NAME;
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5432';
    process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same global validation behavior as src/main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);

    // Safety: never truncate anything but the dedicated E2E database.
    if (dataSource.options.database !== E2E_DB_NAME) {
      throw new Error(
        `Refusing to run E2E against "${String(
          dataSource.options.database,
        )}"; expected "${E2E_DB_NAME}".`,
      );
    }

    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE transactions, accounts CASCADE');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('runs the full account lifecycle over HTTP', async () => {
    // 1. Create
    const created = await http
      .post('/accounts')
      .send({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        accountType: 'CHECKING',
        dailyWithdrawalLimit: '1000.00',
      })
      .expect(201);

    const accountId = created.body.accountId as string;
    expect(accountId).toBeDefined();
    expect(created.body.balance).toBe('0.0000');

    // 2. Get
    const fetched = await http.get(`/accounts/${accountId}`).expect(200);
    expect(fetched.body.accountId).toBe(accountId);

    // 3. Deposit
    const deposited = await http
      .post(`/accounts/${accountId}/deposit`)
      .send({ amount: '250.00' })
      .expect(200);
    expect(deposited.body.balance).toBe('250.0000');
    expect(deposited.body.transaction.type).toBe('DEPOSIT');

    // 4. Withdraw
    const withdrawn = await http
      .post(`/accounts/${accountId}/withdraw`)
      .send({ amount: '50.00' })
      .expect(200);
    expect(withdrawn.body.balance).toBe('200.0000');
    expect(withdrawn.body.transaction.type).toBe('WITHDRAWAL');

    // 5. Statement includes both transactions
    const statement = await http
      .get(`/accounts/${accountId}/statement?from=2020-01-01&to=2030-01-01`)
      .expect(200);
    const types = (statement.body.transactions as Array<{ type: string }>).map(
      (t) => t.type,
    );
    expect(types).toContain('DEPOSIT');
    expect(types).toContain('WITHDRAWAL');
  });

  it('returns 400 for a malformed accountId (ParseUUIDPipe)', async () => {
    await http.get('/accounts/not-a-uuid').expect(400);
  });

  it('returns 404 for a valid but non-existent account', async () => {
    await http.get(`/accounts/${VALID_MISSING_UUID}`).expect(404);
  });

  it('returns 422 when withdrawing more than the balance', async () => {
    const created = await http
      .post('/accounts')
      .send({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        accountType: 'CHECKING',
        dailyWithdrawalLimit: '1000.00',
      })
      .expect(201);

    await http
      .post(`/accounts/${created.body.accountId}/withdraw`)
      .send({ amount: '50.00' })
      .expect(422);
  });

  it('returns 400 for an invalid statement period (from after to)', async () => {
    const created = await http
      .post('/accounts')
      .send({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        accountType: 'CHECKING',
        dailyWithdrawalLimit: '1000.00',
      })
      .expect(201);

    await http
      .get(
        `/accounts/${created.body.accountId}/statement?from=2030-01-01&to=2020-01-01`,
      )
      .expect(400);
  });
});
