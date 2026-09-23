-- If provider reconciliation shortens a period retroactively, a later captured
-- copy cannot be presented as evidence from before that cutoff. Fail closed.
grant create on schema app to continuity_share_service;
create function app.sharing_validate_saved_cutoff() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.cutoff_at<new.saved_at then
   delete from app.sharing_saved_items where grant_id=new.grant_id;
   return null;
 end if;
 return new;
end $$;
revoke all on function app.sharing_validate_saved_cutoff() from public;
alter function app.sharing_validate_saved_cutoff() owner to continuity_share_service;
create trigger sharing_validate_saved_cutoff before update of cutoff_at on app.sharing_saved_items
 for each row execute function app.sharing_validate_saved_cutoff();
revoke create on schema app from continuity_share_service;
