# Rillora Owner-Controlled Google OAuth Evidence

Date: 2026-08-18  
Environment: Google Cloud project `rillora-identity`, Auth0 EU development tenant, live `login.rillora.xyz`, Frankfurt synthetic staging Web  
Evidence type: sanitized configuration readback and pre-consent route inspection  
Not evidence of: account ownership, submitted consent, callback, Rillora session, private-plan access, logout, production consent publication or Release readiness

## Configured Google surface

- OAuth client name: `Rillora Auth0 Production`
- Application type: Web application
- Authorized JavaScript origin: `https://login.rillora.xyz`
- Authorized redirect URI: `https://login.rillora.xyz/login/callback`
- Google consent audience/status: External / Testing
- Google scopes: `openid`, email, profile
- Test users: one Owner-controlled account; the address is intentionally not recorded
- Homepage: `https://rillora.xyz`
- Privacy policy: not configured; intended public route returned 404 at setup time
- Terms of Service: not configured; intended public route returned 404 at setup time

No Google client id, client secret, account address or Auth0 token is stored in this evidence file.

## Auth0 sanitized readback

- Connection: `con_p2UWW5YMzXUaTZhM / google-oauth2`
- Client id present: yes
- Client secret present: yes
- Connection scope: `email / profile`
- Enabled applications: exactly `Rillora Web` and `Rillora iOS`
- Auth0 `Default App`: disabled for this connection
- Management API and CLI errors after final write/readback: none

Auth0's 2026 dedicated connection-client endpoint was used for application bindings. The deprecated `enabled_clients` property was not used in the successful request.

## Live route checks

### Web staging

1. Opened `https://app.staging.rillora.xyz/account`.
2. Used the real `Sign in` route to reach `login.rillora.xyz`.
3. Confirmed `Welcome back`, passkey and Google were reachable.
4. Confirmed Auth0's former development-key warning was absent.
5. Opened Google and reached `accounts.google.com` account chooser.
6. Confirmed the chooser identified Rillora and showed neither `redirect_uri_mismatch` nor an access-blocked state.

### iOS Auth0 client

1. Opened an Authorization Code + PKCE request with the existing iOS Auth0 client and registered custom-scheme callback.
2. Confirmed the hosted prompt showed passkey, Google and Apple.
3. Confirmed there was no development-key warning or visible request error.
4. Opened Google and reached the official account chooser.
5. Confirmed Rillora naming and no redirect mismatch or access block.

## Credential handling

The current Google secret was transferred from temporary runtime memory to the official Auth0 CLI through standard input. It was not printed, placed in command arguments, written to a request file or copied into the repository. Secret-bearing temporary variables and raw connection readbacks were cleared after sanitized verification.

Google generated two enabled secrets during setup because the first secret became unrecoverable after the original browser-control session reset. Auth0 holds the second secret. The first remains an open cleanup item; revoke it only after a successful real callback and explicit action-time confirmation.

## Remaining gate

The Owner must personally select the Google test account and submit consent. Only then can the project verify Auth0 callback, Rillora session issuance, private-plan loading, cancellation/error behavior and logout. Google consent publication must also remain closed until real Privacy Policy and Terms routes exist and Google production-status requirements are reviewed.
