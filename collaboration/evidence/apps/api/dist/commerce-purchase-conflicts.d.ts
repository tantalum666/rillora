import type { PoolClient } from 'pg';
export declare function assertFamilyPriceReady(client: PoolClient, priceId: string): Promise<void>;
/** Caller holds the shared checkout advisory lock. An expired prepared quote has
 * never opened a sheet; a started/pending payment has no such safe time limit. */
export declare function expirePreparedApplePurchases(client: PoolClient): Promise<void>;
export declare function assertNoForeignPurchase(client: PoolClient, provider: 'stripe' | 'storekit', environment?: 'production' | 'sandbox'): Promise<void>;
