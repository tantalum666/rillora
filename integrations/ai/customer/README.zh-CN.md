# 把 Rillora 连接到 AI 应用

服务器地址：`https://app.rillora.xyz/api/mcp`
账号与授权管理：https://app.rillora.xyz/account?next=ai-connect

先在 AI 应用中发起连接，在浏览器登录已有的 Rillora 账号，再选择允许读取的事项并确认本次授权。不要把密码或令牌放进对话，也不要覆盖其他服务器或无关配置。

授权有效期为 7 天。Rillora 仅提供所选事项的名称、类别和状态；可选的缺项检查只报告通用资料是否缺失，不发送字段的具体内容。备注、联系人、价值信息和账号提示不在范围内。可在 Rillora 账号设置撤销授权，停止新请求；撤销不能删除 AI 提供方已经收到的副本。OpenAI 还可请求已验证的登录邮箱，用于账号及工作区核对，Rillora 会明确说明并另存对应同意记录。

## 选择一种接入方式

- **Codex：**在下载目录运行 `sh codex/setup.sh`。它只添加名为 `rillora` 的服务器，并开始浏览器授权。如果已有同名配置，请先核对地址，不要直接覆盖。`codex-plugin` 是供支持本地插件安装的客户端使用的独立兼容插件，不要把 `openai` 中的文件混入该目录。
- **ChatGPT：**使用账号提供的自定义连接器或插件安装入口。服务器地址如上，客户端编号为 `rillora-openai-v1`，客户端密钥留空。`openai` 目录提供插件文件。公开目录上架属于独立审核，持有文件不代表账号一定有安装入口。
- **Claude：**在设置中打开连接器，添加自定义连接器，填写服务器地址；高级授权设置的客户端编号填 `rillora-claude-v1`，客户端密钥留空。连接后登录并选择事项。
- **Claude Code：**把 `claude-code/mcp.json` 中的 Rillora 条目合入现有配置，再输入 `/mcp`，为 Rillora 完成授权。
- **Cursor：**在 MCP 设置中合入 `cursor/mcp.json` 的 Rillora 条目，连接后在浏览器选择事项。
- **Gemini CLI：**把 `gemini-cli/settings.json` 的条目合入用户或项目设置，再输入 `/mcp auth rillora`，保留现有模型账号和其他配置。
- **Qwen Code：**合入 `qwen-code/settings.json` 的条目。启动时设置 `QWEN_CODE_FORCE_ENCRYPTED_FILE_STORAGE=true`，保护客户端本地凭据文件，再输入 `/mcp auth rillora`。模型账号仍单独管理。

连接后，可以说“整理我在 Rillora 选定的事项”或“检查这些 Rillora 事项还缺哪些通用资料”。授权到期后重新连接即可。选择事项和授权不会替你订阅模型服务，也不会购买付费套餐。

连接请求过期时，请重新发起；没有可选事项时，先在 Rillora 添加事项，并确保它未设为不披露、未归档。不要通过改写授权对象、关闭身份校验、粘贴令牌或替换客户端编号来绕过错误。支持邮箱：support@rillora.xyz。
