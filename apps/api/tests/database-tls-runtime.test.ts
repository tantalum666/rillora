import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { connect, createServer, type ConnectionOptions, type Server } from 'node:tls';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { databaseConnectionOptions } from '../src/db.js';
import { loadDatabaseConfig } from '../src/config.js';

let directory: string, certificate: string, server: Server, port: number;
beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'rillora-tls-'));
  certificate = join(directory, 'server.crt');
  const key = join(directory, 'server.key');
  execFileSync('openssl', ['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,
    '-out',certificate,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'], { stdio:'ignore' });
  server = createServer({ key:readFileSync(key), cert:readFileSync(certificate) }, socket => socket.end('ok'));
  server.on('tlsClientError', () => {});
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  port = (server.address() as {port:number}).port;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (directory) rmSync(directory,{recursive:true,force:true});
});
function options(ca = certificate): ConnectionOptions {
  return databaseConnectionOptions(loadDatabaseConfig({NODE_ENV:'test',DATABASE_URL:'postgresql://127.0.0.1/local_tls_fixture',DATABASE_SSL_MODE:'verify-full',
    DATABASE_SSL_CA_PATH:ca})).ssl as ConnectionOptions;
}
function handshake(ssl: ConnectionOptions, servername = 'localhost'): Promise<void> {
  return new Promise((resolve,reject) => {
    const socket = connect({...ssl,host:'127.0.0.1',port,servername},() => socket.resume());
    let verified = false;
    socket.once('secureConnect',() => {verified=socket.authorized;});
    socket.setTimeout(2000,() => socket.destroy(new Error('Local TLS timeout')));
    socket.once('error',reject);
    socket.once('close',() => verified ? resolve() : reject(new Error('Unverified local TLS')));
  });
}
describe('reused database TLS context', () => {
  it('keeps one verified context through pg and repeated TLS connections', async () => {
    const ssl=options();
    expect(ssl.rejectUnauthorized).toBe(true);
    expect(ssl.secureContext).toBeDefined();
    for(let i=0;i<8;i++) {
      const client=new pg.Client({ssl});
      expect((client as unknown as {connectionParameters:{ssl:ConnectionOptions}}).connectionParameters.ssl.secureContext).toBe(ssl.secureContext);
      await handshake(ssl);
    }
  });
  it('still rejects a valid chain for the wrong hostname', async () => {
    await expect(handshake(options(),'another.invalid')).rejects.toMatchObject({code:'ERR_TLS_CERT_ALTNAME_INVALID'});
  });
  it('does not share trust between separate pool configurations', async () => {
    const trusted=options(),untrusted=options(resolve('certificates/rds/global-bundle.pem'));
    expect(untrusted.secureContext).not.toBe(trusted.secureContext);
    await expect(handshake(untrusted)).rejects.toMatchObject({code:'DEPTH_ZERO_SELF_SIGNED_CERT'});
    await expect(handshake(trusted)).resolves.toBeUndefined();
  });
});
