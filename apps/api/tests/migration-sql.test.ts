import { describe, expect, it } from 'vitest';
import { migrationOwnershipRole, migrationTransactionBody, migrationTransactionStatements } from '../src/migration-sql.js';

describe('migration transaction boundaries', () => {
  it('recognizes actual service ownership transfers without treating quoted text as executable DDL', () => {
    expect(migrationOwnershipRole('-- comment\n ALTER FUNCTION app.example(text) OWNER TO continuity_content_service;')).toBe('continuity_content_service');
    for (const sql of ["select 'alter table app.x owner to continuity_app';", 'alter table other.x owner to continuity_app;',
      'alter table app.x owner to unrelated_role;', 'alter table app.x owner to continuity_app; select 1;']) {
      expect(migrationOwnershipRole(sql)).toBeNull();
    }
  });
  it('splits prepared statements without splitting stored procedures, strings or comments', () => {
    const first = `\n-- semicolon;\ncreate function app.probe() returns text language sql as $fn$ select 'x;y'; $fn$;`;
    const second = `\n/* nested /* ; */ comment */ select E'it\\\'s; still one', "semi;colon";`;
    expect(migrationTransactionStatements(`BEGIN;${first}${second}COMMIT;`)).toEqual([first, second]);
    expect(migrationTransactionStatements('-- comment only;')).toEqual([]);
    expect(() => migrationTransactionStatements('select 1; COMMIT; select 2;')).toThrow('transaction control');
  });
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
