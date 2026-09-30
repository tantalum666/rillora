alter table app.commerce_subscriptions add column provider_invoice_reference text,
  add column financial_state_override text check(financial_state_override in ('refunded','revoked'));
grant select(provider_invoice_reference,financial_state_override),
  update(provider_invoice_reference,financial_state_override)
  on app.commerce_subscriptions to continuity_commerce;
