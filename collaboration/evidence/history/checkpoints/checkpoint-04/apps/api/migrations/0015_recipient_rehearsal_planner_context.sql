begin;

-- Recipient RLS compares the already-authenticated rehearsal's planner id;
-- the role receives only function execution, never planner-table privileges.
grant execute on function app.current_planner_id() to continuity_rehearsal;

commit;
