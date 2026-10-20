# 下一版本 AI 接入续验

Status: HISTORICAL PREPARATION CHECKPOINT / SUPERSEDED BY REAL OAUTH VALIDATION
Last updated: 2026-10-16 (Asia/Hong_Kong)
Source baseline: 48ee3ad719e03d5905e4e10f7490b8b2b40cfdae

本文件保留早期准备与失败过程。随后[真实OAuth及撤销验收](ai-oauth-validation-20261016.md)已通过，并完成全部临时资源清理；下方待权限／待OAuth描述不再是当前下一步。

Owner要求继续尝试补齐与验收，并明确重新打开AWS／Auth0登录页面。沿用[上一批实施](ai-discovery-implementation-20261015.md)及完整阅读／本地／归档证据，不重复已完成检查，不改App14、价格、数据或收费状态。

## 已补齐

- GitHub连接器恢复后，源码CI158与收尾CI159均读回completed/success；各自三个任务全部通过。旧CLI令牌的Actions权限不扩大，没有重新申请GitHub授权。
- AWS只读STS原先明确过期；随后旧密码及本人MFA恢复，原部署角色／账户读回通过。只读栈清单确认当前没有另建AI候选栈，生产与既有Preview未修改。
- Auth0此前设备流的网络／过期／安全挑战失败保留为历史。Owner最终确认完成后，租户设置、应用及API列表三个管理GET成功；登录恢复已验证。以下新OAuth准备与管理续登录分开记录。
- 已重新取得Agent Plugins公开schema，并对照OpenAI官方OAuth扩展正文。基础mcp.schema不允许server.extensions，而OpenAI官方示例要求该位置声明OAuth。须分别验证基础结构和OpenAI扩展／实际客户端，不能删掉认证字段只为让通用schema通过。

## 实际发现与修正

本机Codex0.162.0-alpha.17.2的 `plugin/read` 接受了插件介绍，却返回空MCP服务列表；其日志明确拒绝server.extensions。这是实际客户端兼容缺口，不只是一条通用schema告警。新增独立 `codex-plugin/` 兼容包，使用 `.codex-plugin/plugin.json`＋`.mcp.json` 的固定OAuth客户端配置，不能混入优先级更高的portable根文件。最终生成包被同一解析器识别为恰好一个Rillora服务，仍保持未安装／未启用。

OpenAI portable包继续遵循[官方OAuth扩展位置](https://developers.openai.com/plugins/build/plugins)，保留新版目录准备用途；不宣称当前所有宿主都能解析。原始通用schema对整份MCP文件仍不通过，剥离扩展的独立基础结构检查通过；这不是整份文件通过的替代声明。新旧格式共享元数据和服务，不复制业务实现。

随后使用Codex真实app-server与Gemini CLI0.64.0连接本机Rillora服务：Codex返回 `get_preparation_gaps`／`list_selected_matters` 两工具及bearerToken状态；Gemini显示Connected并退出0。测试使用生成的RS256签名合成身份和独立本地数据库，未调用模型、未创建聊天任务、未把个人资料送给提供方。该证据只关闭本地传输／发现，不能替代外部OAuth／实际对话中的工具选择与调用。

Gemini最初按预期拒绝未信任目录；随后使用独立临时profile，仅登记本次受控合成fixture为可信目录，不关闭全局信任检查。成功输出在stderr，第一版验收脚本只查stdout产生误判；依据已保存的明确Connected行纠正解析，没有重做成功连接。合成账号、临时数据库角色和隔离profile已清理，用户全局Gemini配置未创建。

## 当前边界

本机原先只有Codex CLI；本轮把Gemini CLI0.64.0和Ajv8.20.0安装在Git忽略的独立工具目录，未安装到全局。没有Claude／Cursor桌面端。新的云端服务器、真实Auth0回调、目录申请及公开发布均未完成；原先560等本地结果只引用既有检查点，未重复本地全量测试。

当次证据：output/qa/rillora-ai-acceptance-20261016。本人登录过程与任何credential／activation URL均保存在忽略的受保护目录，不进入可读Git。当前无新产品或定价决定；执行步骤以[handoff](../handoff.md)为准。

交付：源码436af7a07／CI160通过；archive41为87路径／66对象，独立GitHub下载完整认证通过。最后回执普通Git保存，不重封旧档案。

## 真实 OAuth 准备与发现

Owner完成管理验证后，读回resource_parameter_profile本来就是compatibility，未修改该租户开关。Free额度下原有9个普通应用，另有global应用；只新建一个临时公共native客户端与一个loopback API。客户端保留第三方属性、authorization_code、无secret认证；资源为RS256／900秒／两scope，不允许offline或跳过同意。旧应用、API、连接绑定及租户配置逐项比较保持。

真实Codex app-server使用进程内配置生成授权请求，resource精确匹配、scope恰好两项、S256、无secret。Auth0未声明authorization_response_iss_parameter_supported，Codex按实际资源生成带专属尾段的回调；已登记返回的完整loopback地址，不猜测或使用通配符。此时还没有Auth0 token或成功工具读取。

实际启用时，Auth0返回400：第三方应用不能通过connection clients接口绑定；[官方说明](https://support.auth0.com/center/s/article/error-enabling-domain-connection-for-a-third-party-application)要求使用域级连接。现有Apple／Google／邮箱三条连接均非域级，保持原状。独立合成数据库连接是本轮替代路径；不把AI客户端改为第一方来绕过限制。[第三方安全合同](https://auth0.com/docs/get-started/applications/third-party-applications/security-controls)还要求目的API的显式用户client grant，不能误建M2M grant或默认向全部第三方开放API。

新建合成连接请求未执行成功：当前CLI权限缺少create:connections。追加授权只申请create:connections与delete:connections，后者用于验收清理。浏览器首轮缺失会话，第二轮重新到设备确认但工具点按未推进；已请Owner完成当场授权。原管理登录仍有效，追加权限尚未取得，没有创建合成连接／账号／密码／用户grant。

独立本机数据库只准备两条合成事项、选择其中一条，复用真实加密及签名数据库路径；持久监听仅暴露MCP，bootstrap开发REST已关。停止等待时已清理到0规划者／0临时角色，监听关闭，并对唯一新MCP名称执行logout。没有访问云端数据库、调用模型或花模型额度。该检查是环境及真实授权请求证据，不替代签名token、范围读取和撤销验收。

本次QA：output/qa/rillora-ai-oauth-20261016。CLI登录URL、旧Google subject映射、原始管理结果和认证页面截图均排除发布；安全脚本／无凭据回执另保存。新临时客户端／API保留且不可实际授权，等待恢复上述唯一下一步。CI161确认11b62244e成功，不重跑原本地560检查。
