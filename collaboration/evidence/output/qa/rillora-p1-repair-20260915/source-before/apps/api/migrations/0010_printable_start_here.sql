begin;

alter table app.export_packages
  drop constraint export_packages_format;

alter table app.export_packages
  add constraint export_packages_format
  check (format in ('start_here_json', 'start_here_text', 'printable_pdf'));

commit;
