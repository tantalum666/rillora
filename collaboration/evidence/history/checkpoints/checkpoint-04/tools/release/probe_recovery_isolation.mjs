// Executed only in the existing recovery task, with its existing restricted role.
import { createConnection } from 'node:net';
import { lookup } from 'node:dns/promises';
import { randomUUID } from 'node:crypto';
import { KMSClient, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const host = process.env.RECOVERY_SOURCE_HOST;
if (!/^rillora-production\.[a-z0-9]+\.eu-central-1\.rds\.amazonaws\.com$/.test(host ?? '')) throw Error('Unexpected original database host');
const resolved = await lookup(host);
if (!resolved.address.startsWith('10.43.')) throw Error('Original database did not resolve inside the production VPC');
const network = await new Promise(resolve => {
  const socket = createConnection({ host, port: 5432 });
  socket.setTimeout(4000);
  socket.once('connect', () => { socket.destroy(); resolve('connected'); });
  socket.once('timeout', () => { socket.destroy(); resolve('blocked_timeout'); });
  socket.once('error', () => { socket.destroy(); resolve('network_error'); });
});
const kms = new KMSClient({ region: 'eu-central-1', maxAttempts: 1 });
const dynamo = new DynamoDBClient({ region: 'eu-central-1', maxAttempts: 1 });
let keyDenied = false, writeDenied = false;
try {
  const generated = await kms.send(new GenerateDataKeyCommand({ KeyId: process.env.CONTENT_KMS_KEY_ARN, KeySpec: 'AES_256',
    EncryptionContext: { rillora_application: 'content-v1', rillora_environment: 'rillora-production', owner_id: randomUUID(), key_id: randomUUID() } }), { abortSignal: AbortSignal.timeout(5000) });
  generated.Plaintext?.fill(0); // Dispose immediately if the role is unexpectedly too broad.
} catch (error) { keyDenied = error?.name === 'AccessDeniedException'; }
try {
  await dynamo.send(new PutItemCommand({ TableName: process.env.RECOVERY_JOURNAL_TABLE,
    Item: { pk: { S: 'guard-probe' }, sk: { S: randomUUID() }, expiresAt: { N: String(Math.floor(Date.now() / 1000) + 60) } },
    ConditionExpression: 'attribute_not_exists(pk)' }), { abortSignal: AbortSignal.timeout(5000) });
} catch (error) { writeDenied = error?.name === 'AccessDeniedException'; }
kms.destroy(); dynamo.destroy();
const result = { originalDatabaseResolvedPrivately: true, originalDatabaseConnectionBlocked: network === 'blocked_timeout',
  kmsGenerateDataKeyDenied: keyDenied, journalPutDenied: writeDenied };
console.log(JSON.stringify(result));
if (!Object.values(result).every(Boolean)) process.exitCode = 1;
