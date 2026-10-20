# October13 — Why configured Stripe Live remains closed in Rillora

Status: READ-ONLY FACTS VERIFIED / NO BILLING ACTIVATION

[Current runtime](runtime-readback.json) is API23 in review mode, with production Stripe notifications enabled and production Checkout disabled. [Current Stripe readback](provider-readback.json) confirms the expected Rillora account can charge/pay out, and the live Family product and USD88.99 annual price are active. The application tax mode is still not_configured, the provider Price tax_behavior is unspecified, and Tax Settings pending/0 active registrations is separately observed.

[Scope and tool boundaries](verification.json) distinguish fresh facts, source guards and unqueried database policy rows. The existing runtime restricted key was used in memory only for read operations; no key, authorization state or private provider body is saved. The reference runner is evidence, not a command to activate billing. No financial transaction, deployment, price/customer/market/tax setting or FanPass change occurred.

Stripe documents automatic_tax as optional in [Checkout creation](https://docs.stripe.com/api/checkout/sessions/create). Deferring that optional service remains the Owner direction. Rillora still needs an explicit truthful billing/tax treatment, a reusable live deployment path, and coordinated catalog/route/sales/production-entitlement activation. Do not manufacture a global no-collection assessment or a live self-payment. Existing TEST lifecycle proof is reused.
