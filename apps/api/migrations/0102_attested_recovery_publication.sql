-- The HTTP runtime cannot sign arbitrary journal bodies or acknowledge its own write.
create table rillora_guard.journal_authority (
 singleton boolean primary key default true check(singleton),
 signing_key text not null check(signing_key ~ '^[A-Za-z0-9_-]{48,128}$')
);
alter table rillora_guard.journal_authority owner to continuity_authority_service;
revoke all on rillora_guard.journal_authority from public;
alter table rillora_guard.journal_authority enable row level security;
alter table rillora_guard.journal_authority force row level security;
create policy journal_authority_admin on rillora_guard.journal_authority to continuity_authority_service using(true) with check(true);
create policy journal_authority_signer on rillora_guard.journal_authority for select to continuity_recovery_service using(true);
grant usage on schema rillora_guard,public to continuity_recovery_service;
grant select on rillora_guard.journal_authority to continuity_recovery_service;
grant create on schema app to continuity_recovery_service;

create function app.recovery_envelopes() returns jsonb
language plpgsql security definer set search_path='' as $$
declare event jsonb; body text; key text; generation text; result jsonb:='[]'::jsonb;
begin
 select signing_key into key from rillora_guard.journal_authority where singleton;
 if key is null then raise exception 'recovery_attestation_unavailable' using errcode='55000'; end if;
 select p.generation::text into generation from app.recovery_policy p where singleton;
 if generation is null then raise exception 'recovery_attestation_unavailable' using errcode='55000'; end if;
 for event in select value from jsonb_array_elements(app.recovery_pending()) loop
  body:=event::text;
  if octet_length(body)>300000 then raise exception 'recovery_attestation_too_large'; end if;
  result:=result||jsonb_build_array(jsonb_build_object('version',1,'generation',generation,
   'transaction',txid_current()::text,'event',body,
   'signature',encode(public.hmac(convert_to('rillora-journal-event-v1|'||generation||'|'||txid_current()::text||'|'||body,'UTF8'),
    convert_to(key,'UTF8'),'sha256'),'hex')));
 end loop;
 return result;
end $$;
alter function app.recovery_envelopes() owner to continuity_recovery_service;
revoke all on function app.recovery_envelopes() from public;
grant execute on function app.recovery_envelopes() to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce;

create function app.recovery_mark_attested(p_revision bigint,p_event text,p_receipt text) returns void
language plpgsql security definer set search_path='' as $$
declare actual text; key text; generation text; expected text;
begin
 if p_receipt is null or p_event is null or p_receipt !~ '^[a-f0-9]{64}$' or octet_length(p_event)>300000 then raise exception 'invalid_recovery_receipt'; end if;
 select signing_key into key from rillora_guard.journal_authority where singleton;
 select p.generation::text into generation from app.recovery_policy p where singleton;
 select value::text into actual from jsonb_array_elements(app.recovery_pending()) where (value->>'revision')::bigint=p_revision;
 if key is null or generation is null or actual is null or actual<>p_event then raise exception 'invalid_recovery_receipt'; end if;
 expected:=encode(public.hmac(convert_to('rillora-journal-ack-v1|'||generation||'|'||txid_current()::text||'|'||
  encode(public.digest(convert_to(actual,'UTF8'),'sha256'),'hex')||'|'||p_revision::text,'UTF8'),convert_to(key,'UTF8'),'sha256'),'hex');
 if expected<>p_receipt then raise exception 'invalid_recovery_receipt'; end if;
 update app.recovery_controls set published=true where revision=p_revision and transaction_id=txid_current();
end $$;
alter function app.recovery_mark_attested(bigint,text,text) owner to continuity_recovery_service;
revoke all on function app.recovery_mark_attested(bigint,text,text) from public;
grant execute on function app.recovery_mark_attested(bigint,text,text) to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce;

-- Administrative restore/bootstrap preserves its existing explicit path.
-- Neither a valid runtime ticket nor SET ROLE permits unsigned self-acknowledgment.
create or replace function app.recovery_mark_published(p_revision bigint) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not app.runtime_maintenance_login() then raise exception 'recovery_receipt_required' using errcode='42501'; end if;
 update app.recovery_controls set published=true where revision=p_revision and transaction_id=txid_current();
end $$;
grant execute on function app.runtime_maintenance_login() to continuity_recovery_service;
revoke create on schema app from continuity_recovery_service;
