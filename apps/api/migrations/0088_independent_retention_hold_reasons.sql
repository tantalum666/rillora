-- Independent legal/dispute/security holds must not overwrite or release one another.
alter table app.retention_holds drop constraint retention_holds_pkey;
alter table app.retention_holds add primary key(category,record_id,reason_code);
