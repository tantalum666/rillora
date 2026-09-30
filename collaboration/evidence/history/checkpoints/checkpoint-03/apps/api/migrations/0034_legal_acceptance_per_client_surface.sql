alter table app.legal_acceptances
  drop constraint legal_acceptances_identity_version_unique,
  add constraint legal_acceptances_identity_version_surface_unique unique (
    identity_account_id,
    terms_version,
    privacy_version,
    legal_bundle_sha256,
    client_surface
  );
