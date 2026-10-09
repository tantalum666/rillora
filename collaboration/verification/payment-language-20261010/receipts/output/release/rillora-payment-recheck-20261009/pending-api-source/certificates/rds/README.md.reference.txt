# Pinned Amazon RDS root certificate bundle

Updated: 2026-10-09 (Asia/Hong_Kong)

`global-bundle.pem` contains the 108 public Amazon RDS root CA certificates already
approved and used by the retained Rillora runtime image. Its SHA-256 remains
`e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3`, matching the
Dockerfile check. It contains no private key, account credential or server leaf.

The previously downloaded global URL now includes three additional me-west-1 roots.
Comparing the approved bytes against AWS's current global and Frankfurt downloads
confirmed that all 108 approved roots remain present, all are valid self-signed CAs,
and the three Frankfurt root fingerprints are unchanged. Keeping the reviewed bundle
in source makes builds repeatable without accepting an unreviewed remote change.
The container still checks the pinned digest and uses `verify-full` database TLS.

Sources: [AWS RDS TLS documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html),
[official global bundle](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem),
[official Frankfurt bundle](https://truststore.pki.rds.amazonaws.com/eu-central-1/eu-central-1-bundle.pem).

Before updating this file, inspect the official certificate subjects, validity,
self-signatures and regional root fingerprints, review the trust-set difference,
update the Dockerfile digest deliberately, then build and verify an actual database
TLS connection. Never disable certificate or digest verification to repair a build.
Current comparison evidence is in the October9 Web rollout QA record.
