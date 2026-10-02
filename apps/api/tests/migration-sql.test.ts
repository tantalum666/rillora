import { describe, expect, it } from 'vitest';
import { migrationTransactionBody } from '../src/migration-sql.js';

describe('migration transaction boundaries', () => {
  it('preserves procedure bodies, quoted semicolons, nested comments and original checksum input', () => {
    const body = `\n/* outer /* COMMIT; */ comment */\ncreate function app.probe() returns void language plpgsql as $probe$\nBEGIN\n  perform 'COMMIT;';\nEND;\n$probe$;\nselect E'escaped\\'; COMMIT;', 'it''s; COMMIT;', "semi;colon";\n`;
    expect(migrationTransactionBody(`-- legacy file\nBEGIN;${body}COMMIT; -- end`)).toBe(body.trimEnd());
    expect(migrationTransactionBody(body)).toBe(body);
  });

  it.each(['commit;', 'begin; select 1;', 'select 1; commit; select 2;',
    'begin; select 1; commit; commit;', 'start transaction;', 'rollback;', 'end;',
    'begin; select 1; rollback; commit;', 'prepare transaction \'x\';'])('rejects unmanaged transaction control: %s', sql => {
    expect(() => migrationTransactionBody(sql)).toThrow('transaction control');
  });

  it.each(["select 'unfinished", 'select "unfinished', 'do $fn$ begin', '/* nested /* */'])('rejects incomplete SQL lexical boundaries', sql => {
    expect(() => migrationTransactionBody(sql)).toThrow('Unterminated');
  });
});
