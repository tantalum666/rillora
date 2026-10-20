# Connect Rillora to your AI application

Server: `https://app.rillora.xyz/api/mcp`
Account and access management: https://app.rillora.xyz/account?next=ai-connect

Start in your AI application, sign into your existing Rillora account in the browser, then select the matters you want it to read and approve that specific connection. No password or token belongs in a chat. Do not overwrite other servers or unrelated settings.

Access lasts 7 days. Rillora shares selected titles, categories and statuses; the optional gap check reports missing common information without the underlying field contents. Notes, contacts, values and account hints are excluded. You can revoke access in Rillora's account settings. Revocation stops new requests but cannot erase copies already received by the AI provider. OpenAI can also request your verified sign-in email, with separate disclosed consent, for account/workspace checks.

## Choose one installation path

- **Codex:** run `sh codex/setup.sh` from this download. It adds only a server named `rillora` and starts browser authorization. If that name already exists, review its URL first; do not overwrite another configuration. The `codex-plugin` folder is a separate compatibility plugin for hosts that support local plugin installation. Do not put the portable `openai` files into that folder.
- **ChatGPT:** use the custom connector or plugin installation flow provided by your account. Server URL is above, OAuth client ID is `rillora-openai-v1`, and no client secret is required. The `openai` folder contains the portable package. Public directory listing is a separate approval process; possessing this file does not guarantee an account has an installation option.
- **Claude:** Settings → Connectors → Add custom connector. Enter the server URL; in advanced OAuth settings use `rillora-claude-v1` with no client secret. Connect, sign in and select matters.
- **Claude Code:** merge only the Rillora entry from `claude-code/mcp.json` into your MCP configuration. Use `/mcp` to authenticate it.
- **Cursor:** merge the Rillora entry from `cursor/mcp.json` in MCP settings. Connect and complete the browser selection.
- **Gemini CLI:** merge `gemini-cli/settings.json` into your user or project settings. Run `/mcp auth rillora`. Keep your existing model account and other configuration.
- **Qwen Code:** merge `qwen-code/settings.json`. Start Qwen Code with `QWEN_CODE_FORCE_ENCRYPTED_FILE_STORAGE=true`, then run `/mcp auth rillora`. This protects the client's local credential file. Your model account remains separate.

After connection, try: “Review the matters I selected in Rillora” or “Check missing common information in my selected Rillora matters.” Reconnect when the authorization expires. Selecting or authorizing in Rillora does not subscribe you to a model provider or purchase a paid service.

If authorization expired, start the connection again. If no matters are selectable, add a matter in Rillora first and keep it neither private nor archived. Do not change the audience, disable issuer checks, paste a bearer token, or replace the registered client ID to work around an error. Support: support@rillora.xyz.
