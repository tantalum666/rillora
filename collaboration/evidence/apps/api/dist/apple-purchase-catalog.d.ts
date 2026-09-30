import type { PoolClient } from 'pg';
import { type ApplePurchaseQuote } from './apple-purchase-consent.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
export type ApplePurchaseSelection = Readonly<{
    serviceMarketCode: string;
    storefrontCountryCode: string;
}>;
export declare function loadApplePurchaseQuote(client: PoolClient, selection: ApplePurchaseSelection, context?: AppleExecutionContext): Promise<{
    quote: ApplePurchaseQuote;
    priceId: string;
    operatorCode: string;
    routeCode: string;
    routeVersion: number;
}>;
