alter table app.legal_acceptances
  add column identity_reference_sha256 bytea;

update app.legal_acceptances acceptance
set identity_reference_sha256 = digest(
  identity.issuer || chr(31) || identity.subject,
  'sha256'
)
from app.identity_accounts identity
where identity.id = acceptance.identity_account_id;

alter table app.legal_acceptances
  alter column identity_reference_sha256 set not null,
  alter column planner_id drop not null,
  alter column identity_account_id drop not null,
  drop constraint legal_acceptances_planner_id_fkey,
  drop constraint legal_acceptances_identity_account_id_fkey,
  add constraint legal_acceptances_planner_id_fkey
    foreign key (planner_id) references app.planners(id) on delete set null,
  add constraint legal_acceptances_identity_account_id_fkey
    foreign key (identity_account_id) references app.identity_accounts(id) on delete set null,
  add constraint legal_acceptances_identity_digest check (
    octet_length(identity_reference_sha256) = 32
  );

grant insert (identity_reference_sha256) on app.legal_acceptances to continuity_auth;
