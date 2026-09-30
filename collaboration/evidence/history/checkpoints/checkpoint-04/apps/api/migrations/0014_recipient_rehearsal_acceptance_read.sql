begin;

-- PostgreSQL applies SELECT visibility to rows targeted by UPDATE. This policy
-- exposes only the single row addressed by the presented hashed capability;
-- the UPDATE policy still requires pending status and the new session hash.
create policy recipient_rehearsals_acceptance_read on app.recipient_rehearsals
  for select to continuity_rehearsal
  using (
    acceptance_token_hash = decode(
      nullif(current_setting('app.rehearsal_acceptance_hash', true), ''),
      'hex'
    )
  );

commit;
