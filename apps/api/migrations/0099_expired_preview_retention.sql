-- No production execution is performed by adding this migration. The existing
-- NOLOGIN retention service can see only expired, non-encrypted preview metadata.
-- Forced RLS denies current previews and ready/saved artifacts even to a caller
-- who could assume that service role. No ciphertext or owner identity is granted.
grant select(id,format,status,expires_at),delete on app.export_packages to continuity_retention_service;
create policy expired_preview_retention_read on app.export_packages
 for select to continuity_retention_service
 using(format='start_here_json' and status='previewed' and expires_at<=statement_timestamp());
create policy expired_preview_retention_delete on app.export_packages
 for delete to continuity_retention_service
 using(format='start_here_json' and status='previewed' and expires_at<=statement_timestamp());
create index export_preview_expiry on app.export_packages(expires_at,id)
 where format='start_here_json' and status='previewed';

alter function app.run_retention_batch(integer) rename to run_retention_batch_before_previews;
revoke all on function app.run_retention_batch_before_previews(integer) from public,continuity_auth;
create function app.run_retention_batch(p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; n integer;
begin
 result:=app.run_retention_batch_before_previews(p_limit);
 with due as (
  select id from app.export_packages
  where format='start_here_json' and status='previewed' and expires_at<=statement_timestamp()
  order by expires_at,id limit p_limit
 ) delete from app.export_packages p using due where p.id=due.id;
 get diagnostics n=row_count;
 return result||jsonb_build_object('expiredPreviews',n);
end $$;
revoke all on function app.run_retention_batch(integer) from public;
grant execute on function app.run_retention_batch(integer) to continuity_auth;
alter function app.run_retention_batch(integer) owner to continuity_retention_service;
