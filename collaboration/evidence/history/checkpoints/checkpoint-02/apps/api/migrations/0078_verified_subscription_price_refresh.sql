-- A newly verified provider period may have a different reviewed price/version.
-- Existing orders and immutable Apple receipts retain their original price facts.
-- Existing composite foreign keys continue to bind the price and plan version.
grant update(price_id,plan_version_id) on app.commerce_subscriptions to continuity_commerce;
