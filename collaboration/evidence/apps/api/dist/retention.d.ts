import { type DatabasePool } from './db.js';
export declare function runRetentionBatch(pool: DatabasePool, limit?: number): Promise<Record<string, number>>;
export declare function startRetentionWorker(pool: DatabasePool): () => void;
