import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { loadDatabaseConfig } from '../src/config.js';

const environment = {
  NODE_ENV: 'production', DATABASE_SSL_MODE: 'verify-full',
  DATABASE_SSL_CA_PATH: '/synthetic/ca.pem',
};

describe('database URL TLS precedence', () => {
  it.each(['ssl=no-verify', 'ssl=0', 'ssl=false', 'ssl=true', 'sslmode=require'])
    ('rejects URL options that can override managed TLS: %s', query => {
      expect(() => loadDatabaseConfig({ ...environment,
        DATABASE_URL: `postgresql://fixture@database.example/fixture?${query}`,
      })).toThrow('must be configured through DATABASE_SSL_MODE and DATABASE_SSL_CA_PATH');
    });

  it('keeps explicit certificate verification with an ordinary connection option', () => {
    const config = loadDatabaseConfig({ ...environment,
      DATABASE_URL: 'postgresql://fixture@database.example/fixture?application_name=fixture',
    });
    const ssl = { rejectUnauthorized: true, ca: 'synthetic-ca' };
    // Constructor inspection only: no network or real credentials are used.
    const client = new pg.Client({ connectionString: config.connectionString, ssl });
    expect((client as unknown as { connectionParameters: { ssl: unknown } }).connectionParameters.ssl).toEqual(ssl);
  });
});
