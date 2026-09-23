-- Bind every preview and generated encrypted package to the selected audience.
-- A connection identifier is kept even after revocation so old previews fail closed.
alter table app.export_packages add column recipient_connection_public_id uuid;
