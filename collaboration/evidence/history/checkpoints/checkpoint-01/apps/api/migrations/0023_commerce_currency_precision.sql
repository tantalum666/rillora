alter table app.commerce_prices
  add column minor_unit_exponent smallint not null default 2;

alter table app.commerce_prices
  add constraint commerce_prices_minor_unit_exponent
  check (minor_unit_exponent between 0 and 3);

comment on column app.commerce_prices.minor_unit_exponent is
  'Number of decimal places represented by amount_minor. Clients must not infer this from locale or currency text.';
