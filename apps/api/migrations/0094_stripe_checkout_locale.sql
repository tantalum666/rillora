-- Preserve the first provider request's display locale across ambiguous retries.
-- NULL keeps historical requests unchanged: their Stripe locale was unspecified.
alter table app.commerce_payment_attempts
  add column stripe_checkout_locale text
  check (stripe_checkout_locale is null or
    (provider_code = 'stripe' and stripe_checkout_locale in ('en', 'zh-CN')));
