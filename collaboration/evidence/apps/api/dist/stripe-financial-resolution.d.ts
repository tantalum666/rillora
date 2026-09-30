import type { NormalizedProviderSignal } from './commerce-provider-contract.js';
import type { StripeSdkPort, StripeFinancialSignalResolution } from './stripe-sdk.js';
export declare function resolveStripeFinancialSignal(sdk: StripeSdkPort, signal: Pick<NormalizedProviderSignal, 'signalType' | 'providerTransactionReference' | 'providerRefundReference'>, environment: 'test' | 'production'): Promise<StripeFinancialSignalResolution>;
