import type { DatabasePool } from './db.js';
import { type RecoveryControl } from './recovery-journal.js';
import type { RecoveryProviderReader } from './recovery-commerce-readers.js';
/** Only a quarantined administrator may refresh current provider facts. The
 * current journal inventory is mandatory; old empty markers never auto-clear. */
export declare function reconcileRecoveryCommerce(pool: DatabasePool, controls: RecoveryControl[], generation: string, reader: RecoveryProviderReader): Promise<{
    reconciledOwners: number;
    providerReads: number;
    customerTrafficEnabled: boolean;
}>;
