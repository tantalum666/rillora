import type { PoolClient } from 'pg';
import type { ApplePurchaseSelection } from './apple-purchase-catalog.js';
type QuoteRow = {
    binding_code: string;
    price_id: string;
    price_code: string;
    amount_minor: string;
    minor_unit_exponent: number;
    currency_code: string;
    operator_code: string;
    route_code: string;
    route_version: number;
};
/** Review offers require their own explicitly enabled test route and Sandbox SKU.
 * They never activate an operating entity, market or production sales policy.
 * The versioned Apple binding owns the quote amount. A retained SKU's historical
 * price_id must not be rewritten when the same Apple product is repriced. */
export declare function loadAppleReviewQuoteRows(client: PoolClient, selection: ApplePurchaseSelection): Promise<QuoteRow[]>;
export {};
