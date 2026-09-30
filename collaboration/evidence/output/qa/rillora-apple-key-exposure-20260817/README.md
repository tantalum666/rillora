# Rillora Apple Credential Output Incident — 2026-08-17

## What happened

During a read-only inventory for the Apple/Google Account grouping, the Auth0
CLI returned broader connection options than the requested safe field set. The
response included long-lived Apple connection credential material in the local
Agent tool output.

No secret value is repeated here. It was not added to source code, Git,
documentation, a QA screenshot, a request file or the user-facing response.
The local tool-session trace is nevertheless an output/log surface, so the
current Apple key no longer meets the project's credential-handling boundary.

## Immediate containment

- Stopped issuing connection reads that could return provider options.
- Did not copy or restate the credential value.
- Did not delete, revoke, create, upload or replace a key without fresh Owner
  confirmation.
- Kept Release Apple sign-in closed.
- Kept the Debug Apple control visible only for the non-authenticating layout
  review; do not initiate Apple authorization with the current key.

## Required remediation gate

After action-time Owner confirmation:

1. create a replacement Apple key for the same Rillora primary App ID;
2. update the existing Auth0 Apple connection using a no-echo input path;
3. read back only the new non-secret Key ID and secret-presence boolean;
4. confirm the connection is still bound only to the Rillora iOS client;
5. revoke the old Apple key;
6. replace the ignored owner-only local `.p8` copy and preserve `0700 / 0600`
   directory/file permissions;
7. only then resume native Apple callback, session, cancellation and logout
   testing.

This incident does not expose Rillora user data, a user Apple ID password,
Google credentials, an Auth0 access token or an App Store signing certificate.
It does invalidate the current Apple key for future release use.
