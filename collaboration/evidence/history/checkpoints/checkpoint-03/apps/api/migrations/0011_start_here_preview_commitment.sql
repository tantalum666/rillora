begin;

alter table app.export_packages
  add column preview_snapshot_sha256 bytea;

alter table app.export_packages
  add constraint export_packages_preview_snapshot_sha256_length
  check (
    preview_snapshot_sha256 is null
    or octet_length(preview_snapshot_sha256) = 32
  );

commit;
