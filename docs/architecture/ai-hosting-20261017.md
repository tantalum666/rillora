# 下一版本：长期隔离托管与其他 AI 平台

Status: ISOLATED FREE HOSTING LIVE / CLAUDE CODE AND CURSOR OAUTH + SCOPED REVOCATION PASSED
Last updated: 2026-10-17 (Asia/Hong_Kong)

Owner要求继续长期托管与其他平台接入，尽量免费，不重复已验项目，不影响App14审核，并推GitHub。沿用[上轮HTTPS闭环](ai-https-acceptance-20261016.md)及CI169／170，未重做已完成的官网发布、站长平台提交、旧Codex／Gemini协议矩阵或Apple操作。Owner本轮说明没有Claude账号，因此不要求注册，不把Claude官网算作接入成功。

## 实际托管

候选入口为[独立MCP服务](https://rillora-ai-candidate.rillora-candidate.workers.dev/mcp)。Cloudflare Workers Free承担HTTPS、OAuth与两个只读工具，EU-jurisdiction KV保存各客户端登记，Hyperdrive连接全新Neon Free PostgreSQL16法兰克福项目。固定0.25CU，项目配额10计算小时、512MiB传出、256MiB逻辑存储；实际观察到空闲314秒后休眠。Free配额不等于SLA或容量承诺。

数据库从空库开始，105条原迁移校验和保持。Neon预处理接口不接受多个SQL命令，因此复用项目SQL词法解析器拆分；所有命令仍在一个外层事务执行。首次失败完整回滚。Neon的所有权转移需要新owner暂时具有schema CREATE，候选适配器只对明确的app对象／continuity服务角色在同一事务内临时授予，再恢复原权限，不修改历史迁移。实际运行角色NOINHERIT、非superuser、无绕过RLS／建库／建角色权限，基础角色不能直接使用app schema或假扮authority服务。Hyperdrive禁用查询缓存并对Neon来源执行verify-full证书验证。

Neon Functions最初显示Completed，但公网入口在应用执行前返回403，原生地址及转发都没有应用执行证据，因此没有继续把它当作已托管服务。当前改为直接Worker→Hyperdrive→Neon，并已用真实受限请求验证。原Cloudflare探针公共路由已关闭；Neon探针更新为不导入数据库的410关闭处理器，deployment2 Completed。旧探针未冒充正式运行，失败记录保留。

## 身份、选择与撤销

[Auth0 Free上限](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/entity-limit-policy)为10应用。现有9个应用保留，新增一个专用第一方候选登录应用，以及禁止注册、非domain级、仅绑定该应用的合成连接。实际读回旧应用、旧连接绑定及租户设置未变，未升级、未删除旧应用、未复用Default App或生产client。原CLI会话确实过期后由Owner恢复，之后没有重复索要登录。

候选采用[Cloudflare官方OAuth Provider](https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/)1.2.3。Claude、Claude Code、Cursor和Qwen Code各有独立预登记clientId；Auth0只负责上游本人认证，不把多个平台冒充同一个下游客户端。关闭全局DCR、CIMD、外部令牌接收及token exchange。回调取自官方说明和真实请求；浏览器表单使用绑定浏览器的单次事务、严格Origin与CSRF校验、PKCE S256、精确resource和当前事项版本。

用户登录后明确选择最多20事项及字段范围，授权至多7天；每次增加或替换需要最近10分钟的实际认证。访问令牌15分钟，刷新令牌固定8小时且轮换。令牌固定原connection UUID；刷新同时检查当前账号、法律记录、原授权是否存在／撤销／过期，不能通过重新签发日期复活已替换的旧授权。浏览器会话30分钟，Secure／HttpOnly／__Host Cookie，独立加密密钥。浏览器不接触operator秘密。

实际Chrome验收发现no-referrer使原生POST发出Origin:null；服务器正确403拒绝，Chrome显示ERR_BLOCKED_BY_CLIENT。改为HTML／跳转采用same-origin，其他响应保持no-referrer，保留严格CSRF而不是放行null。表单跳转仅允许固定Auth0及经过OAuth验证的回调origin。另修复Worker全局随机数初始化限制：仅测试邮件键改为首次需要时生成，生产显式密钥要求不变。

## 新增客户端证据

| 客户端 | 当次实证 | 明确保留的边界 |
| --- | --- | --- |
| Claude Code 2.1.302 | 原版CLI、独立profile、实际Auth0→选择→回调、Connected；实际签发凭据的SDK读两工具与刷新通过；浏览器撤销后旧令牌、新令牌及再次刷新均拒绝，原令牌仍剩608秒 | 没有Claude模型对话／自动工具选择、消费端账号或目录上架 |
| Cursor CLI 2026.10.16-e3cb207 | 官方发行包仅解压到QA目录；隔离配置／工作区，原版OAuth及实际list-tools列出两工具；同一真实凭据读取、刷新及浏览器撤销通过，刷新令牌的访问期仍剩814秒时拒绝 | 未安装IDE、未改用户全局MCP、没有模型调用或消费端／目录结论 |
| Claude官网 | 已准备独立client、固定回调及手动连接资料 | Owner没有账号；没有注册、连接或升级 |
| Qwen Code | 按官方HTTP OAuth配置、独立回调与client登记准备材料，明确要求加密凭据存储 | 原版0.25.2重连报告缺少令牌；交互端明确要求先连接模型provider，未借用其他项目密钥或调用模型。OAuth／工具发现尚未通过 |

首次Claude Code流程在排查表单问题期间超时，保留失败记录；修正后用新请求完成，未将过期码或浏览器成功页单独算作完成。Cursor前两次没有找到配置，随后确认其MCP加载器按Git工作区读取；只为隔离fixture建立本地仓库并批准该Rillora条目，未放开全部MCP。两端验证后撤销连接；Claude CLI退出该MCP，Cursor隔离fixture中的失效令牌已清理。

两工具只返回选定事项的ID、标题、类别、状态或适用缺项字段名。另一条未选事项、备注、账号提示、联系人、金额和分类详情不返回。不存在写入、支付、退款、转账、导出或身后释放工具。当前注册与配置见[接入包](../../integrations/ai/README.md)，可直接读的实现及运行说明见[候选包](../../infra/ai-candidate/README.md)。

## 安全与产品边界

这是长期保留的**合成候选环境**。两条事项均为明确标记的测试资料，不复制Gmail／QQ或任何生产记录。内容沿用项目封装格式，由独立Worker秘密包装密钥；它不是生产AWS KMS、独立强制恢复日志或客户开放的等价证明。新的OAuth账户法律记录是Owner已授权的合成验收fixture，不伪称新的真实用户法律同意。

生产API／数据库、真实数据、官网既有GEO页面、定价、收费开关、FanPass、App14审核和TestFlight状态保持。新注册不接入普通客户。托管、客户端连接、真实模型工具选择、目录审核、搜索收录及推荐效果分别记账。

当次证据位于output/qa/rillora-ai-hosting-20261017；新增可读／加密保存见[本轮交付](../../collaboration/verification/ai-hosting-20261017/README.md)。私密凭据、登录URL、完整提供方对象、CLI令牌及系统账号屏幕均排除Git。正常源码与有用失败记录保留；旧archives1—44不重新封存或下载。
