# 下一版本 AI 接入续验

Status: CI AND LOCAL CLIENT INTEROPERABILITY VERIFIED / EXTERNAL OAUTH PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)
Source baseline: 48ee3ad719e03d5905e4e10f7490b8b2b40cfdae

Owner要求继续尝试补齐与验收，并明确重新打开AWS／Auth0登录页面。沿用[上一批实施](ai-discovery-implementation-20261015.md)及完整阅读／本地／归档证据，不重复已完成检查，不改App14、价格、数据或收费状态。

## 已补齐

- GitHub连接器恢复后，源码CI158与收尾CI159均读回completed/success；各自三个任务全部通过。旧CLI令牌的Actions权限不扩大，没有重新申请GitHub授权。
- AWS只读STS原先明确过期；随后旧密码及本人MFA恢复，原部署角色／账户读回通过。只读栈清单确认当前没有另建AI候选栈，生产与既有Preview未修改。
- Auth0旧CLI明确过期。首次设备登录报Invalid network change；新设备流正常进入原邮箱登录页，但未完成时设备码已到期。收尾时重新打开有效设备流，等待本人完成。未改租户、API或客户端。
- 已重新取得Agent Plugins公开schema，并对照OpenAI官方OAuth扩展正文。基础mcp.schema不允许server.extensions，而OpenAI官方示例要求该位置声明OAuth。须分别验证基础结构和OpenAI扩展／实际客户端，不能删掉认证字段只为让通用schema通过。

## 实际发现与修正

本机Codex0.162.0-alpha.17.2的 `plugin/read` 接受了插件介绍，却返回空MCP服务列表；其日志明确拒绝server.extensions。这是实际客户端兼容缺口，不只是一条通用schema告警。新增独立 `codex-plugin/` 兼容包，使用 `.codex-plugin/plugin.json`＋`.mcp.json` 的固定OAuth客户端配置，不能混入优先级更高的portable根文件。最终生成包被同一解析器识别为恰好一个Rillora服务，仍保持未安装／未启用。

OpenAI portable包继续遵循[官方OAuth扩展位置](https://developers.openai.com/plugins/build/plugins)，保留新版目录准备用途；不宣称当前所有宿主都能解析。原始通用schema对整份MCP文件仍不通过，剥离扩展的独立基础结构检查通过；这不是整份文件通过的替代声明。新旧格式共享元数据和服务，不复制业务实现。

随后使用Codex真实app-server与Gemini CLI0.64.0连接本机Rillora服务：Codex返回 `get_preparation_gaps`／`list_selected_matters` 两工具及bearerToken状态；Gemini显示Connected并退出0。测试使用生成的RS256签名合成身份和独立本地数据库，未调用模型、未创建聊天任务、未把个人资料送给提供方。该证据只关闭本地传输／发现，不能替代外部OAuth／实际对话中的工具选择与调用。

Gemini最初按预期拒绝未信任目录；随后使用独立临时profile，仅登记本次受控合成fixture为可信目录，不关闭全局信任检查。成功输出在stderr，第一版验收脚本只查stdout产生误判；依据已保存的明确Connected行纠正解析，没有重做成功连接。合成账号、临时数据库角色和隔离profile已清理，用户全局Gemini配置未创建。

## 当前边界

本机原先只有Codex CLI；本轮把Gemini CLI0.64.0和Ajv8.20.0安装在Git忽略的独立工具目录，未安装到全局。没有Claude／Cursor桌面端。新的云端服务器、真实Auth0回调、目录申请及公开发布均未完成；原先560等本地结果只引用既有检查点，未重复本地全量测试。

当次证据：output/qa/rillora-ai-acceptance-20261016。本人登录过程与任何credential／activation URL均保存在忽略的受保护目录，不进入可读Git。当前无新产品或定价决定；执行步骤以[handoff](../handoff.md)为准。
