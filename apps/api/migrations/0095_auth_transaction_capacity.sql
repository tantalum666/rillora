-- Authentication transaction hygiene is independent of long-term retention.
-- Serialize admission without making waiters consume the shared connection pool.
create function app.admit_auth_transaction() returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('auth-transaction-admission',0)) then return false; end if;
 with expired as (
  select id from app.auth_transactions where expires_at<=statement_timestamp()
  order by expires_at,id limit 2000 for update skip locked
 ) delete from app.auth_transactions t using expired where t.id=expired.id;
 select count(*) into n from (select 1 from app.auth_transactions limit 1000) bounded;
 return n<1000;
end $$;
revoke all on function app.admit_auth_transaction() from public;
grant execute on function app.admit_auth_transaction() to continuity_auth;
alter function app.admit_auth_transaction() owner to continuity_retention_service;
