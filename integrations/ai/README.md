# Rillora 跨平台 AI 接入包

Status: CUSTOMER PRODUCTION LIVE / CODEX MODEL VERIFIED / OFFICIAL MCP REGISTRY ACTIVE
Last updated: 2026-10-18 (Asia/Hong_Kong)

本目录提供独立于当前App1.0(14)审核的AI接入材料。正式API与Web已经开放选定事项的只读MCP；原数据、价格、收费及Auth0登录保持。示例与旧合成候选继续单独标记，不能替代正式客户配置。OpenAI／Claude商店批准不由官方MCP Registry登记推导。

## October18 ordinary-user production continuation

The [current contract](../../docs/architecture/customer-mcp-20261018.md) supersedes the historical direct-Auth0 recipe below. Production reuses Rillora sign-in, with issuer `https://app.rillora.xyz/api/ai/oauth` and resource `https://app.rillora.xyz/api/mcp`. Seven distinct [public client registrations](../../apps/api/src/mcp/customer-clients.json), [English instructions](customer/README.en.md), [Chinese instructions](customer/README.zh-CN.md) and a [public download](https://app.rillora.xyz/integrations/rillora-ai-v1.zip) are deployed. No private repository access or administrator-issued token is required.

Actual Codex0.163.0-alpha.10.2 completed production OAuth and a model task invoking both tools for one explicitly selected synthetic matter. Immediate browser revocation then blocked the same stored credentials; the test-only alias was logged out. The production plugin also passes the current parser; no public marketplace installation is claimed. [Official MCP Registry metadata](registry/server.json) is published as [xyz.rillora/rillora@0.1.0](https://registry.modelcontextprotocol.io/v0/servers/xyz.rillora%2Frillora/versions/latest), independently read back as active. Other provider directories and consumer-account acceptance remain separate.

## HISTORICAL — October18 部署前营销与可运行性复核

[本轮全平台矩阵](../../docs/marketing/readiness-audit-20261018.md)区分当前长期登记与已清理的临时证据。原生Node即时读取资源／授权发现200，匿名MCP401；Python路径403／1010不冒充整体停机。OpenAI简介36字符超限已修为23字符并通过5项生成器检查。当前候选不具备下游OIDC UserInfo／email能力及正式客户部署，未提交目录；[5正／3负审核测试和字段草稿](submission-draft-20261018.json)尚未执行于消费端。生成包的pending字段是通用待验条件，不是已验证客户端的最新状态；实际完成只看有日期的证据。

## October17 长期合成候选

October18补充：[Qwen Code0.25.2原版OAuth及CLI验收](../../docs/architecture/ai-seo-20261018.md)已完成，实际reconnect／list、选定读取、原版刷新与浏览器撤销通过。没有配置模型provider或发起模型调用；不能据此声称模型交互UI、千问消费端或模型自动选择工具通过。测试alias凭据已移除，合成浏览器会话已退出。

[当前托管和验收](../../docs/architecture/ai-hosting-20261017.md)新增Cloudflare／Neon Free独立候选。真实Claude Code与Cursor授权、读取和撤销通过，未调用付费模型。下方原Auth0直连步骤保留为生产路线合同，不能套作候选的已部署配置。候选使用Cloudflare官方OAuth授权层、一个独立Auth0上游应用、各平台独立clientId；只含合成资料，不能作为普通客户入口或生产恢复能力证明。

[真实公开登记](candidate-client-ids.json)和[生成的接入材料](hosted-candidate/readiness.json)包含Claude、Claude Code、Cursor、Qwen Code，不含秘密。只合并对应条目，不覆盖用户配置；Qwen必须按随附说明打开加密凭据存储。Owner没有Claude官网账号，官网连接没有执行，也不要求注册。代码客户端接通并不代表同品牌消费端或模型会主动推荐产品。

## 共享实现与边界

- 服务端使用官方 MCP TypeScript SDK server/client 2.3.1、Node adapter 2.1.1；同时接受已验证的 2025 legacy 与 2026-07-28 请求。
- 仅暴露 list_selected_matters 与 get_preparation_gaps 两个只读工具。无模型 API 调用、任意 URL／SQL、支付／退款、分享扩权、删除、完整导出或身后释放工具。
- 用户先在下一版 Web 的账号页选择 AI 应用及最多20个事项，明确同意后建立7天授权。授权固定事项和字段，普通修改可继续读取；不披露／归档永久移除相关授权，不因改回公开状态而恢复。
- 摘要仅含名称、类别、记录状态和事项ID；缺项仅检查适用的通用字段与处理意愿。原始备注、联系人、账号提示、价值和分类详情不发送给 AI。
- 正式访问令牌使用加密协议状态中的短期opaque凭据，每次验证resource、issuer、client、scope、有效期及撤销，再叠加当前账号、法律接受与数据库授权；签名ID Token用于独立OIDC需求。不能把Web Cookie或原生Bearer复制到AI。旧合成候选的签名token机制不等同于正式opaque实现。
- 授权与撤销进入现有签名恢复日志；恢复数据库后所有外部 AI 授权失效，必须重新授权。账号删除通过外键清除授权，不保留可用连接。

## 生成配置与历史验收对照

以下命令只生成文件，不修改本机已安装客户端，不创建凭据，不提交目录：

```sh
node tools/mcp/client-packages.mjs --input integrations/ai/example-client-ids.json --out output/qa/rillora-ai-implementation-20261015/example-client-packages
node --test tools/mcp/client-packages.test.mjs
```

示例使用保留的 example.test 域名，readiness.json 明确标记 EXAMPLE_ONLY_NOT_INSTALLABLE。实际配置应另建只含 serverUrl 与各平台公开 client ID 的 JSON，移除 example 标记；每个平台独立注册，不复用现有 Web／iOS 客户端。生成器拒绝密码、clientSecret 字段、令牌式 client ID、非 Rillora 地址或含查询参数／用户信息的 URL，也拒绝覆盖现有输出目录。

| 交付 | 用途 | 实际接入仍需完成 |
| --- | --- | --- |
| OpenAI portable plugin.json／mcp.json | ChatGPT／Codex 共用插件包，明确 OAuth provided client 与只读能力 | 真实 HTTPS 地址、平台注册连接、回调核对、用户 OAuth 和目录审核；不伪造 plugin_asdk_app ID |
| codex-plugin 兼容包 | 当前Codex的 `.codex-plugin/plugin.json` 与 `.mcp.json`，保留固定OAuth客户端 | 当前0.163.0-alpha.10.2从正式下载包识别服务；正式CLI模型调用与撤销另已通过。不要把portable根manifest／mcp.json混进这个目录，否则其优先级会覆盖兼容配置；公开商店安装仍独立 |
| Codex setup.sh | 使用本机已核对的 mcp add／oauth-client-id参数；resource由受保护资源元数据发现 | 核对 CLI 选用的完整回调后注册，再用 mcp login；生成文件不自动执行 |
| Claude Code mcp.json | HTTP、固定 clientId 和最小 scopes | 使用本机版本实际回调；需要时指定已登记 callbackPort，不能使用通配回调 |
| Cursor mcp.json | HTTP 与固定 CLIENT_ID／scopes | 按使用的 Desktop／Web 入口分别登记其官方回调 |
| Gemini CLI settings.json | Streamable HTTP 与已登记 OAuth clientId | 使用实际 redirectUri；通过发现校验 issuer，不关闭不匹配检查 |
| Claude、Gemini Apps、Perplexity、Grok | 复用同一远程 URL 和授权资源，通过各产品自己的连接 UI | 检查地区／套餐／工作区资格，以及各自实际 client ID；自定义接入与精选目录分开 |
| Microsoft 365 Copilot | 同一受保护资源的企业连接器／agent 路线 | 单独认证与租户管理员部署；不冒称消费版 Copilot 已接入 |
| Qwen Code、Kimi Code、其他客户端 | 标准远程 MCP 兼容候选 | 按当前官方方式提供／核对 OAuth 客户端；未经验证不生成猜测的认证字段 |
| DeepSeek、豆包、元宝、Meta AI、Mistral 等消费端 | 纳入公开搜索与推荐评估 | 其具体扩展资格仍须逐端核对，不能从模型 API 或同品牌 CLI 推断支持 |

不要将生成片段直接覆盖现有全局配置；只合入 Rillora 条目，保留其他项目和 FanPass 的配置。未登记客户端默认拒绝，不能为让连接成功而关闭 client／audience 校验或接受整权会话。

## HISTORICAL — earlier direct-Auth0 enablement recipe (superseded)

1. 保留当前在审环境。先在独立候选环境验证新 broker、迁移0104—0105、API与Web，沿用现有加密／签名事务／TLS／恢复要求。0105保留独立删除worker原有日志权限；两份迁移必须作为同一批完成后再验收服务。
2. 先交付兼容新 ai_connection 事件的恢复日志 broker，再迁移数据库，再部署 API；首次保持 ALLOW_MCP_INTEGRATION=false 与 Web 开关关闭。旧版本不能替代新增授权后的恢复处理器。
3. 为 MCP 单独注册 Auth0 API，identifier 精确等于 HTTPS MCP URL，RS256；access token 最大寿命3600秒。每个平台独立 OAuth client，授权码＋PKCE，首批使用无 secret 的 public client；回调使用实际完整地址，不开 M2M，不复用退役或第一方客户端。
4. 第三方应用须使用域级登录连接，并取得仅针对目的API、subject_type=user与精确scope的client grant；不能绑定普通连接、改成第一方、开放全部第三方默认授权或误用M2M grant。隔离验收优先独立合成连接，保持正式连接不动；连接管理权限不足时单独补齐，不将其误报成会话过期。
5. 只读核对 Auth0 Resource Parameter Compatibility Profile。官方明确 MCP 的 resource 参数需要该兼容设置才能映射到正确 audience；不能修改原 native audience 或 tenant default audience 来绕过。此轮未修改租户标志。[Auth0 官方说明](https://support.auth0.com/center/s/article/mcp-audience-error-with-auth0)。
6. 配置 MCP_RESOURCE_URL 和 MCP_CLIENTS_JSON。每项含 key、name、clientId、privacyUrl，最多16项；scope 只选已实现的两项。只有在独立环境核对成功后才打开 ALLOW_MCP_INTEGRATION=true，并以 VITE_RILLORA_AI_CONNECTIONS=true 构建同一候选 Web。
7. 先在 Rillora 选择范围并保存授权，再在 AI 端 OAuth 连接。新授权要求新签发的 token；撤销即时阻止新请求，不能撤回已送到 AI 的副本。真实用户接受与本地合成测试分别记录。
8. 在每个实际客户端验证连接、工具选择、拒绝越权、普通更新可读、不披露／归档后不复活、撤销、到期与网络失败。生产部署、目录提交、批准、发现与真实增长分别记账。

既有本地协议测试没有替代真实Auth0回调或所有AI产品验收。October16已用独立合成账号完成两家真实OAuth与撤销验收并清理所有临时资源；未发邀请、购买服务、开启生产MCP或分发TestFlight。

## October16 客户端验收补充

源码CI158和收尾CI159已由GitHub连接器读回，三任务均成功，旧的CI读取阻塞已关闭。[本轮续验](../../docs/architecture/ai-integration-acceptance-20261016.md)发现官方通用MCP JSON Schema与OpenAI文档的OAuth扩展存在差异；本机Codex确实忽略portable server.extensions，故新增单独兼容包，保留原目录格式而不删认证字段。最终兼容包已被真实解析器识别为一个Rillora服务，未安装或启用。

Codex和Gemini CLI0.64.0都已连接本机Rillora接口；Codex读取两工具目录，Gemini报告Connected。使用本地生成的签名合成身份，属于传输／工具发现验证，不是Auth0或消费聊天产品端到端通过。Gemini配置在独立临时profile中，仅信任该合成fixture，完成后清理；未改变用户全局配置、调用模型或泄露真实事项。真实OAuth、工具选择和每个平台目录继续单独验收。

## 官方资料

- [OpenAI 插件包与 OAuth 配置](https://developers.openai.com/plugins/build/plugins)
- [Codex MCP 配置及回调规则](https://learn.chatgpt.com/docs/extend/mcp)
- [Claude Code 固定 OAuth 客户端](https://code.claude.com/docs/en/mcp)
- [Cursor MCP](https://prod.cursor.com/docs/mcp)
- [Gemini CLI MCP](https://geminicli.com/docs/tools/mcp-server/)
- [MCP SDK 2026-07-28 与 legacy 兼容](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)
- [当前跨平台方案](../../docs/architecture/ai-discovery-vnext-20261015.md)

October16[真实OAuth与撤销](../../docs/architecture/ai-oauth-validation-20261016.md)已补齐：Codex实际app-server、Gemini原版OAuth函数＋实际CLI，都用独立合成身份连接；真实签名与范围读取通过，撤销后同一令牌拒绝。Codex设置不再额外提供oauth-resource，避免与发现重复。临时资源已清理，原正式配置不变；公网候选、模型选工具和消费端／目录仍独立待验。
