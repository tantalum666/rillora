import { ApplePriceBindings } from './apple-price-bindings.js';
import { type DatabasePool } from './db.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
/** Catalog reads use public price metadata, never a provider secret or client-selected amount. */
export declare function loadAppleProductionPriceBindings(pool: DatabasePool, context?: AppleExecutionContext): Promise<ApplePriceBindings>;
export declare function minorToAppleMilliunits(amountMinor: string, exponent: number): number;
