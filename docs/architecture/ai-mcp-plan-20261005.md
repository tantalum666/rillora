# Rillora AI 接口、MCP 与 OpenAI Plugin 目录实施交接

Role: future integration architecture proposal and implementation handoff  
Authority scope: AI-facing API boundaries, phased work packages and acceptance criteria  
Status: HISTORICAL PROPOSAL — SEE CURRENT SCOPED IMPLEMENTATION
Last updated: 2026-10-16 (Asia/Hong_Kong; current-direction pointer only; original technical proposal remains dated October5)
Official-source check: original sources 2026-10-04 UTC; MCP Events addendum 2026-10-05 UTC / Asia/Hong_Kong  
Source baseline: `2cc95f77c1279bdad43547b7e58a8faca9da7a93` on `codex/strict-review-20261002`  
Delivery branch: `codex/ai-mcp-plan-20261005`

## 0. 接手结论与本次授权

**2026-10-16 当前方向：** Owner 已明确要求按方案实施并推Git。先读[跨平台方案](ai-discovery-vnext-20261015.md)和[实际实施记录](ai-discovery-implementation-20261015.md)：两个只读工具、选择授权和平台配置已完成本地候选，尚未部署／真实连接。下文原授权、源码映射和更宽工具集合仍是October5历史提案，不能把整份方案当作全部已实现；私密数据、授权和确认边界继续适用。

**能做，也值得预留。建议先建立可复用、带权限的领域接口，再接 MCP，私测成熟后再申请公开目录。AI 集成不新增当前首发阻塞项。**

Owner 提出以后用户应能通过 AI 使用 Rillora，并要求“整理好也推到git去”。本轮交付是计划与 Git 保存，不是开始运行时开发的证明，也不扩展为创建凭据、配置 Auth0、开放用户数据、上线服务、上架提交或合并其他分支。

- 本文的工具、scope、接口路径、阶段划分及预算控制均为待实施设计；除明确标记“现有”者外，不得写成已实现
- 源码映射固定在上述 strict-review SHA，不宣称它仍是活动实现分支最新 head；仓库代码、运行部署与真实用户验收是三类证据
- 2026-10-05 Owner 要求补入 MCP Events；本次从文档分支已验证的 `554575405f8bb10bb8041fe02f473221184f8ed5` 继续，不合并后续 strict-review 或本地化分支
- 实施前重新读取 [产品宪章](../product.md)、[当前交接](../handoff.md)、[信任边界](../trust-safety-legal.md) 与当时最新官方规则
- 保持“地图而非密码”；AI 不获得遗嘱执行权、账号所有权、恢复权或转账权，不依据未登录/失联自动判定死亡或释放资料
- 保留 Web/iOS 核心闭环、现有定价与共享权益；不因增加 AI 入口降低已有平台能力
- 另一个 [Web 验收文档分支的固定检查点](https://github.com/tantalum666/rillora/blob/730071039b2deccaae1404e70cbe002e0af45575/docs/qa/web-ux-acceptance-20261005/README.md)可供复核共享档位、Notes、错误恢复与焦点问题；本分支没有合并它，其报告不能代替 AI 安全验收

## 1. 三层架构与产品边界

| 层 | 职责 | 不承担什么 |
| --- | --- | --- |
| 版本化领域 API / 应用服务 | 同一身份、对象与字段权限；状态机；校验；事务；审计；稳定契约 | 不依赖某个模型判断权限 |
| MCP 适配层 | 把少量明确业务动作暴露为工具；输入/输出 schema；OAuth 资源边界；错误映射 | 不复制整套业务逻辑，不直连无限权数据库，不暴露任意 SQL/HTTP executor |
| OpenAI Plugin 包与目录 | 安装、发现、工具说明、可选 skills/UI、审查与发布 | 不等于开源代码、提供数据库访问或保证被推荐 |

现有 Web/iOS 与新 MCP 应调用共同应用服务。先从 Express 路由内抽取领域用例，保留事务/RLS/权限行为，再由各 transport 调用。不要机械把所有 REST 路由转为工具；不要把 `/overview` 的事项与联系人大对象整体送给模型。

REST/JSON + OpenAPI 是建议的接口契约底座；MCP 是面向支持该协议客户端的适配层。不同 AI 客户端的认证、确认和 UI 支持仍需逐个验证，不承诺“一次开发兼容所有 AI”。

“外部 AI 使用 Rillora”与“在 Rillora 内置聊天助手”分开排期：前者可以只是受控工具服务，不需要 Rillora 每次再调用模型；后者涉及模型选型、API 用量与另一套产品体验。本计划优先前者。[O1][O2]

## 2. 现有架构映射：能复用与必须新增

以下是基线源码审阅结果，不是本轮重新运行测试：

| 现有能力与固定源码 | 可复用部分 | AI 接入缺口 |
| --- | --- | --- |
| [API package](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/package.json)、[app.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/app.ts#L215-L250)、[routes.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/routes.ts)：Node/TypeScript、Express、PostgreSQL、Zod，挂载 `/v1` 与 `/api/v1` | 工程栈、校验与业务路由；plan/matters/readiness 等用例 | 抽取应用服务、精简响应 DTO、独立 MCP 入口与能力版本 |
| [auth.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/auth.ts#L77-L170)、[identity.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/identity.ts#L43-L62) | 有效用户/法律接受检查、Web Cookie/CSRF 与原生 opaque Bearer 会话分离 | 当前是第一方登录；原生 OIDC 的准确 client ID 与 `session:create` 不是外部 AI 委托授权，不能直接借用 |
| [db.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/db.ts#L167-L189)、[基础 RLS](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/migrations/0001_initial.sql#L327-L386) | 由已认证用户设置事务上下文、强制 RLS、最小权限角色 | 额外的 client/connection/grant 约束，防止 confused deputy 与 IDOR |
| [sharing-routes.ts](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/sharing-routes.ts#L200-L271)、[sharing 合同](../trusted-sharing.md) | 逐人/逐事项 Name、Directions、Details；撤销、版本及扩权重认证 | 接收人可读不等于已同意给 AI；AI 连接需独立授权与更窄字段投影 |
| [Matter schema](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/domain.ts#L100-L135)、[Matter 写入](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/routes.ts#L339-L429) | 现有 draft 状态、create 的可选 requestId 去重、PATCH 的 expectedVersion | draft 仍是真实 Matter 写入；需要独立、不触发真实事项/共享更新的 AI proposal；AI 写入强制幂等 |
| [共同复核](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/family-maintenance-routes.ts#L161-L220) | 接收人建议与 owner apply/dismiss 分离，字段受限，检查旧版本 | 可借鉴但不是通用 AI 审批系统；不扩大协作者的既有可改字段 |
| [导出路由](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/routes.ts#L835-L983)、[导出合同](../start-here-export.md) | 到期预览、prepare/finalize、SHA-256 快照绑定、近期认证 | 不能直接当成 read-only MCP 工具；现有 preview 会持久化元数据和审计事件；完整导出不在首期 |
| [在线私密正文](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/private-content.ts#L58-L76)、[字段授权检查](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/migrations/0064_private_content_envelopes.sql#L154-L183) | KMS 支撑的应用层信封加密与授权解密 | 不是零知识；MCP 必须经过相同检查并增加 AI 披露限制 |
| [客户端加密包](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/web/src/startHereCrypto.js#L26-L143)、[完整备份](https://github.com/tantalum666/rillora/blob/2cc95f77c1279bdad43547b7e58a8faca9da7a93/apps/api/src/account-data-routes.ts#L65-L93) | 分离的客户端加密导出、私钥在客户端；完整备份另有私密 JSON 路由 | 不把恢复私钥传给模型/MCP，不把完整备份作为 AI 数据入口 |

观察到的是可复用基础，**没有据此证明 MCP、外部 OAuth scope、通用 proposal→review→commit 已经存在**。工具落地须重新检查当前代码，避免与后续修复重复。

## 3. 分期与停止条件

### P0：预留契约，不改变运行行为

- 定义统一 authenticated actor/request context，区分 user、client、connection 与 grant；用户身份只能来自校验后的凭据
- 确定字段分类、工具清单、版本化 schema/OpenAPI、稳定错误语义及应用服务抽取位置
- 建立合成用户 A/B/C、权限投影与行为对等测试；不部署 MCP，不申请外部持续访问
- 完成标准：契约经审查、现有 Web/iOS 不变、方案与实际实现差距清楚；这是后续可独立开始的工程包

### P1：私测只读 MCP

- 用受控合成账户完成 OAuth 与连接撤销；初期只支持规划者自己的明确选定事项
- 只开放小字段摘要、已授权范围内的待补信息及官方指南；具体指南依现有产品规则仍在登录后读取，不借 MCP 改为匿名公开
- 安装与调用在支持的开发者模式完成；不要把开发者模式等同于安全审查
- 完成标准：本计划认证、隔离、撤销、输出最小化、失败行为与只读测试通过；生产真实数据试点需要独立披露与适用审核

### P1E：可选 Events（在 P1 稳定后）

先预留领域事件/outbox、带权限订阅和投递适配器；首个候选是复核到期，具体方案与 EVT 验收见第 15 节。此阶段可独立排期，不成为 P2 或当前产品首发的强制前置。事件抵达不等于后续动作已获批准或执行成功。

### P2：草稿/建议与有限确认写入

- 先在对话中生成候选；需要跨会话保存时，建立独立 proposal，明确它是写操作
- 用户在可信 Rillora 界面核对精确差异后提交，只允许本人普通事项的狭窄字段更新
- 收件人第一版保持只读；以后建议能力须另外遵循现有共同复核/指定贡献者规则
- 完成标准：重认证、确认绑定、幂等、版本冲突、撤销竞争、审计和回滚测试通过；不因 UI 已确认而跳过服务端权限

### P3：公开目录

- P0、P1 及计划公开的 P2 能力完成适用验收与安全/隐私检查后，按当前官方要求准备公开资料与专用合成审核账户；P1E 保持可选，若公开 Events 则另满足第 15 节验收
- 公开工具面可继续小而完整，无需把所有 Rillora 功能开放给 AI
- 完成标准分别记录：材料完整、扫描结果、提交、批准、实际发布、真实用户可发现；不能合并为一个“上线”
- 不承诺审核时长、必然通过、首页推荐或所有地区开放

分享扩权、发邀请、发外部消息、批量更改、归档/删除、完整导出/导入、支付/订阅、账号删除、加密解锁与身后释放均不在 P1/P2 初始工具面。部分可以日后单独评估，但金融交易、凭据处理等仍受产品与平台禁限规则约束，并非“加个确认就可以”。

## 4. 工具与 scopes 草案

所有名称均为设计示例，不是已注册工具或 Auth0 配置。scopes 只限制操作类别，不能替代每事项/字段授权。

| 拟议工具 | 输入与最低权限 | 输出与状态变化 |
| --- | --- | --- |
| get_connection_profile | 当前认证连接，无 caller-selected user ID | 稳定 opaque profile ID、必要显示标签；不返回内部身份/邮箱，除非账户辨识确实需要且已披露；只读 |
| list_matter_summaries | `matters:read:summary`；有界 filter/cursor/pageSize | 仅连接 grant 内的 opaque matter ID、已允许 title/category 与下一步所需状态；分页不泄露全计划总数 |
| get_matter_directions | `matters:read:directions` + 指定 matter 的字段 grant | safe provider/location/intended outcome 白名单；title/位置同样可能敏感，不按“摘要”默认公开 |
| get_preparation_gaps | `readiness:read:scoped` | 仅对获准事项计算缺项，不推断隐藏事项/联系人；不是法律或应急准备认证 |
| find_provider_guidance | `guidance:read` + 当前产品访问条件 | 内置已审核目录的相关步骤、官方 URL、最后复核日期和限制；不抓取 arbitrary URL |
| preview_matter_change | `matters:propose` + 目标事项权限 | 验证建议并返回最小 before/after diff；若真正无持久化则只读；不复用会持久化的 export preview |
| save_matter_proposal | `matters:propose` | 有期限的独立 proposal ID；写操作，不改变真实 Matter、权限或现有分享 |
| commit_matter_proposal | `matters:write:reviewed` + 可信确认 + 当前对象权限 | 精确已确认更新、结果 version；写操作，重新校验所有安全条件；首期可仅由 Rillora UI 完成而不暴露给模型 |

工具约束：
- Name/Directions/Details 是现有 recipient 投影，不是“AI 可以看全部 Details”的同意开关
- 初版不暴露 raw Notes、任意 typed details、账户完整提示、金额/资产值、联系人邮箱、能力链接、备份正文或加密元数据
- 需要将来开放某个 Details 字段时，必须列出具体字段、必要性、接收 AI、保留说明与独立选择；自由文本红名单识别只能作为附加防线，不能替代默认不返回
- 未选事项不返回标题、数量、存在性提示、错误差异或可反推的聚合；Never disclose/归档规则继续 fail closed
- `readOnlyHint`、`destructiveHint`、`openWorldHint` 按真实行为逐工具设置，不按 GET/POST 或名字判断；保存草稿、排队、导出准备等有状态动作不得冒充只读
- `openWorldHint` 取决于是否面对开放外部目标，不因服务部署在互联网就自动为 true；安全标注只是客户端辅助，不是授权证据 [O2][O5]

## 5. OAuth、权限、同意与撤销

采用已在用的身份供应商能力优先于自造 OAuth。Auth0 是可行候选，但当前租户是否满足所需发现、resource/audience 与客户端注册方式，须在专用测试配置中验证，不能从“已接 Auth0”推定成功。[O3]

拟议流程：
1. 用户在 AI 客户端选择 Rillora，进入 Rillora/Auth0 托管登录与授权页，不在工具参数/聊天里交密码
2. OAuth 2.1 authorization-code + PKCE（S256），严格 redirect URI、state 与所用 OIDC nonce 检查
3. MCP 发布 protected-resource metadata，授权服务器发布 OAuth/OIDC discovery；resource 指向 MCP 的规范资源标识，授权/token 流程保持一致
4. 按支持情况选择 CIMD、预定义 OAuth 客户端或 DCR；没有验证就不声称现有设置兼容
5. 服务端校验签名/JWKS、issuer、audience/resource、有效期、scope、已绑定的 user/client/connection/grant；拒绝错误 audience、过期及跨资源 token。不接受 machine-to-machine 全库授权作为普通用户委托
6. 用户选择可操作类别和具体事项/字段；明确“这些选定数据会交给所连接 AI 服务处理”，另列写权限与撤销入口；注册法律接受、接收共享与 AI 同意保持独立
7. token 生命周期/刷新与过期策略按供应商能力审查；token 不出现在工具输出、URL、普通日志或版本库。需要持久化的刷新凭据受保护保存并可撤销
8. 每次读取、分页、proposal 读取与 commit 均重算权限交集；scope 或 item ID 永远不能指定 owner 上下文
9. 缩权/撤销不因缺少近期认证而被延迟；扩权必须重新同意，涉及现有敏感能力时保留近期认证规则。撤销同时使应用 grant 及 proposal/confirmation 失效，并处理 refresh token
10. 并发 commit 在同一授权串行化边界内复核 grant 版本：若撤销先提交，旧授权写入必须失败；不宣称撤销能够逆转已经提交的动作或外部复制

有效权限 = 当前用户/接收人权限 ∩ 当前 AI 连接 grant ∩ tool scope ∩ 字段白名单 ∩ 当前生产入口/审核身份限制 ∩ 当前产品/权益/法律接受条件。

基线 auth.ts 还执行 production-review 身份 allowlist。新 delegated 入口必须复用该关闭/受限入口判断，不能绕过第一方会话处理器后让普通客户进入；明确用户认证成功不等于产品已经开放。任何扩大生产用户范围是独立发布决定。

优先提供 Rillora 内“已连接的 AI”自助管理：客户端名称、授权范围、连接/到期状态、最近必要操作概览与撤销。解除连接终止新访问，不能承诺远程删除先前进入 AI 对话或下载副本的信息。缓存、已排队任务与断开重连必须具有同样撤销语义。

## 6. Prompt injection 与数据最小化

以下为工程安全建议，不冒称官方给 Rillora 指定的唯一实现：

- Matter 标题、位置、Notes、指南外链内容、导入文件、搜索结果和工具返回文本均视为不可信数据；其中的“忽略权限”“发送给某地址”等文字不能成为指令
- 不让模型提供任意 SQL、URL、owner ID、字段路径或服务器模板。所有 filter/sort/patch 字段白名单化；拒绝未知参数，限制长度、数组大小和分页
- 默认不返回 raw Notes，输出使用专用 DTO；不能把“模型会保密”当字段隔离
- 禁止通用 HTTP proxy、任意远程文件抓取与模型指定 webhook；第 15 节只为经认证协议提供且完成验证的 Events callback 定义受控例外，仍禁止任意模型目的地。未来如需引用其他外部资源，先加入受控解析、出站目的地与 SSRF 保护
- 模型决定“想做什么”，服务端决定“允许做什么”；每次工具处理器独立授权，不能因为前一个工具成功就放行后一个
- 不读取或拼接完整聊天历史，只接收完成该用例必需的结构化输入；默认不记录 raw prompt/response
- 工具错误不暴露 SQL、内部账号、tenant、堆栈、令牌或隐藏对象存在性；内部 debug correlation 与模型可见业务响应分开
- 选定数据进入 AI 服务不等于仍只在 Rillora 原部署区域处理。接真实数据前须核对接收者、区域、用途、保留与删除说明；本计划不宣称合规结论
- 以跨用户提示注入、恶意 Notes/标题、伪造官方指引与越权输出测试验证防线，不仅测试正常自然语言 [O4][O5]

## 7. 精确确认、幂等、并发与审计

建议写入状态机：candidate → saved proposal → reviewed → committed / expired / cancelled / rejected。

- 保存 proposal 与真实 Matter 分离；不能仅标记真实 Matter 为 draft 就宣称“还没写入/还没影响共享”
- 预览显示目标事项、明确字段差异、当前分享影响、接收 AI、是否产生副本/外发，以及必要的不可撤回提醒
- 确认凭据由可信 Rillora UI/服务端流程产生，绑定 user、client、connection、proposal、operation、object IDs、canonical input digest、expected object versions、grant/policy version 与 expiry；不把模型传入 `confirmed: true` 当同意
- 确认记录为短期、一次性，不能转给其他连接、对象或操作。确认后输入/权限/版本改变则必须重新预览
- 近期认证使用可信 auth_time 等已校验身份事实，沿用相关敏感操作要求；一般 AI 对话“我刚登录了”无效。取消认证保留草稿，不自动保存或自动重试
- commit 在事务内复核身份有效、法律接受、用户权限、连接未撤销、对象/权限版本、预览摘要、确认未过期/未用、权益与字段白名单，然后提交
- 每个 AI 写入要求幂等键；作用域绑定 user/client/connection/operation，并记录当时 grant/策略版本。返回保存的回执之前也要检查当前连接与授权，必要时重新投影最小结果；不同连接不得借同 user/client 的幂等键读取更宽权限回执。相同 key+相同 payload 且当前权限仍有效时返回原操作结果，不重复创建；同 key 不同 payload 拒绝。网络超时后先查操作结果，不能盲目重发
- 事务同时写入 metadata-only 审计和安全操作回执。异步外发若未来开放，采用同事务 outbox 与去重；不得通过写操作自动级联外发
- 审计保留 actor、client/connection、授权/策略版本、操作种类、允许记录的 opaque 对象引用、结果、必要时间与关联标识；不保存私钥、完整正文或未脱敏差异。保留期限与可见性单独定义
- 旧版本冲突显示“内容已变化，请重新查看”；不要自动覆盖别人新修改。错误恢复、Cancel/Back、重复点击和应用前后台切换都要覆盖

官方要求安全标注、权限检查与不可逆操作的人类确认；上述绑定字段、事务方式与 idempotency 设计是本项目建议，不是已实现事实。[O2][O4]

## 8. 加密、导出和复制边界

1. 在线业务正文当前是应用层信封加密，获授权后端能够解密；这不等于全产品 E2EE/零知识
2. MCP 只能走与当前业务相同的授权解密路径，再执行独立 AI 字段投影；不能给 adapter KMS 全权或绕过投影
3. Start Here 客户端加密包是另一条路径：恢复私钥、未包装数据密钥和客户端解锁不进入 MCP/模型/普通遥测
4. 将来需要 AI 整理密文内容时，必须另作用户在可信客户端显式选择、解密并披露最少字段的设计；本期不提供这一能力，不假装 AI 可直接读取密文
5. 最小指南、完整私有 JSON 备份、客户端密文包必须分别命名；完整备份不是安全摘要接口
6. 首期不开放 export/import。后续若开放，重用 audience、快照承诺、过期、最新 grant、近期认证和显式确认，不能把 export preview 的副作用藏起来
7. 撤销、删除、过期不等于抹除外部副本；既有打印/下载提醒与授权截止副本规则继续有效

依据为 [Start Here 合同](../start-here-export.md)、[共享合同](../trusted-sharing.md)与第 2 节固定源码，不把历史合成证据写成本期 AI 端到端验证。

## 9. API 契约、错误与运行控制

建议保留 `/v1` 现有客户端兼容；新 delegated/AI 入口使用明确命名空间与独立 DTO，最终路径在 P0 定稿。不要为了一个适配器复制整个 API v2。API/schema/tool 能力版本分开维护；破坏性变更需新版本、迁移期与契约测试。

拟议错误集合：
- unauthenticated / token_expired：重新连接；HTTP/OAuth 层按规范返回 challenge
- insufficient_scope / consent_required：明确需要的最小授权；不自动请求全权限
- not_found_or_not_accessible：统一隐藏对象不存在/越权表现
- reauthentication_required：前往可信认证，不把密码/OTP 请求转入工具
- version_conflict / preview_stale / proposal_expired：重新读取与复核
- confirmation_required / confirmation_mismatch：保持未提交
- idempotency_conflict：保留原结果，不执行不同 payload
- rate_limited / temporarily_unavailable：有界退避；避免不可确认写入自动重试

MCP 协议错误与业务错误分开；工具正常执行但业务拒绝时返回稳定可理解的失败，不通过堆栈泄密。最终 HTTP/MCP 映射、错误 DTO 和是否可重试必须由契约测试固定。

运行建议：
- 用户、client、连接、tool 多维配额；限制 pageSize、响应字节、执行时间、并发、proposal 数量/生命周期
- 只读重试有上限；写入以幂等回执判定结果； circuit breaker 与按客户端/工具关闭开关不影响 Web/iOS 正常服务
- token/grant 缓存必须有明确撤销失效，敏感 DTO 默认不缓存；流式输出也不能先泄露字段再返回拒绝
- 指标关注延迟、失败类别、授权拒绝、限流、重复提交、连接撤销后拒绝情况；记录最小化且纳入隐私披露
- 先用合成负载测容量与单次调用成本，再设预算告警；不承诺零成本或无限 AI
- 纯 MCP handler 不需要另发模型请求；托管、数据库、身份、日志和流量仍有成本。Rillora 若自行调用模型，则另计模型/API 用量。Responses API 的 MCP 调用按其模型 token 规则计费，官方说明无额外逐 MCP 调用费；这不是“目录/全部基础设施免费”的声明 [O7]

## 10. 验收矩阵与证据标准

下表全部为 **TODO**，未因写进文档而通过。必须记录输入、预期、实际、证据路径、commit、环境与版本；纯单测、合成 OAuth、真实用户同意、生产部署和目录发布分别记录。

| ID | 用例 | 完成标准 |
| --- | --- | --- |
| AUTH-01 | 无 token、过期/未生效、错 issuer/audience/resource、被撤销连接、错误 client、非生产审核 allowlist 身份 | 全部拒绝，无正文/存在性泄露；合法且当前准入身份的同资源 token 可用 |
| AUTH-02 | PKCE/state/redirect 篡改、授权拒绝、账户切换、重连 | 失败关闭；无会话串用或静默扩权；所选账号清楚 |
| ACL-01 | A 的工具参数填 B/C 的 matter/proposal/connection ID | 查/改/预览/确认均不能越权；RLS 与应用检查独立有效 |
| ACL-02 | Name/Directions/Details、未选事项、Never disclose、归档、暂停、授权截止副本 | 精确字段与版本；分页、计数、错误、日志及缓存不泄露隐藏资料 |
| ACL-03 | 接收人连接 AI，但规划者未允许扩展披露；角色/权益改变 | 不自动继承 owner/全计划权限；共享接收不等于 AI 同意 |
| REVOKE-01 | token 仍有效时撤销/缩权，含并发 read/commit、缓存和排队请求 | 撤销完成后的新请求拒绝；commit 与撤销顺序有确定性，无旧 grant 重放 |
| INJECT-01 | title/location/Notes/外部指南含伪造指令、外发地址与越权要求 | 仅作数据；无额外工具、SSRF、scope 扩展或输出泄露 |
| DATA-01 | 超长输入、未知字段、非法过滤、恶意游标、敏感数据进入自由文本 | 白名单/大小限制生效；初期 raw Notes 不出站；错误脱敏 |
| READ-01 | 所有标为 readOnly 的工具反复调用 | 不创建草稿/导出/job/外发或业务状态；必要安全日志按已披露规范处理 |
| WRITE-01 | 正常 proposal→可信 review→commit，取消/Back/关闭/到期 | 只提交用户确认的差异；取消保持未提交；保存 proposal 不改变 Matter |
| WRITE-02 | 伪造 confirmed、复用确认、换对象/client/payload、改 grant | 全部拒绝；确认不跨意图/连接/版本重用 |
| RACE-01 | 双击、两设备同时改、旧 expectedVersion、重认证后状态变化 | 一次效果或明确冲突；不静默覆盖，不自动用新状态重试 |
| RETRY-01 | 写成功但响应丢失、相同 key 重发、同 key 不同 payload、同用户第二条窄权限/撤销连接重放 | 当前连接先授权再返回最小回执或拒绝；无跨连接泄露、重复事项/通知/审计副作用 |
| CRYPTO-01 | 在线授权解密、跨 owner encrypted reference、密文包/恢复钥匙输入 | 授权边界正确；拒绝把钥匙交模型；不误称 E2EE 或密文可读 |
| EXPORT-01 | 初期调用完整导出/导入/删除/支付/释放工具；后续版本 stale audience/key set | 初期根本不暴露/不执行；后续单独验证快照与确认，不借已有测试过门 |
| ERROR-01 | 网络超时、Auth0/JWKS/DB 故障、工具断流、限流、token 刷新失败 | 无敏感堆栈、无错误成功提示；草稿安全；恢复行为与重试可预测 |
| OPS-01 | 合成并发/大响应/大量 proposals、配额告警、kill switch、回滚 | 有界资源与成本；关闭 MCP 不破坏 Web/iOS；回滚不复活授权 |
| CLIENT-01 | ChatGPT 实际连接、取消授权、断开重连、工具确认及可选移动 UI | 真实客户端行为有证据；其他 AI 客户端另列结果，不推定全兼容 |
| PRIVACY-01 | 同意页、日志/数据留存、撤销/删除说明、第三方处理范围 | 内容和实际行为一致；不承诺撤回外部副本或未经验证的地域边界 |
| DIRECTORY-01 | 专用样例账号、正/负例、域名、公开链接、扫描与演示 | 满足提交时最新规则；记录 reviewed/approved/published 的不同状态 |

现有 Web 验收的共享档位与 Notes 理解问题应作为 AI 同意页的回归输入，但没有实际修复证据前不能写“已经解决”。

## 11. 给 Codex 的工程任务与 Done 条件

按依赖逐包实施，不把整张表当成一次已授权生产变更：

| 包 | 交付 | Done |
| --- | --- | --- |
| C0 契约与威胁模型 | 数据字段分类、use cases、scope×tool×object/field 矩阵、OpenAPI/schema、错误/版本策略 | 每字段有必要性；确认现有会话与新 delegated actor 分离；明确非目标 |
| C1 应用服务抽取 | 从现有路由抽取选定只读领域用例，共享原权限/事务层 | Web/iOS 行为对等；现有相关测试与跨用户新增回归通过；无 UI/权益改变 |
| C2 委托授权 | OAuth metadata/校验、连接同意/撤销/expiry、最小 grant、client attribution | AUTH/ACL/REVOKE 通过；合成账户验证；生产凭据/持久访问变更另外获授权 |
| C3 只读 MCP | 版本化 MCP server、少量 schema、准确 annotations、DTO、限流/错误 | P1 工具全部契约/负例通过；实际客户端连接可复现；禁限动作不可达 |
| C3E 可选 Events | P1 后的 review.due、outbox、订阅/回调验证、签名投递、撤销/重试 | 第 15 节 EVT-01–12 验收；未实现；不新增当前首发门 |
| C4 Proposal 与确认写入 | 独立 proposal、可信 review、绑定确认、幂等/版本冲突/事务审计 | WRITE/RACE/RETRY 通过；初期不向接收人静默共享新正文；取消不丢草稿 |
| C5 安全与运维 | Prompt-injection/数据外泄测试、隐私说明、报警/配额/开关/回滚 | DATA/INJECT/CRYPTO/OPS/PRIVACY 通过；真实数据试点范围明确 |
| C6 目录候选 | 稳定 HTTPS、包/metadata、测试账号、演示、正/负例和公开法律/支持链接 | 所有当时必需项独立检查；扫描结果已处理；提交/发布按后续授权执行 |

每包 PR 要写清：基线 SHA、修改路径、合成/真实数据边界、跑过与没跑的测试、schema/授权兼容性、回滚方法与未完成项。代码可保持私有；不要为上架改变仓库可见性或把后端/秘密塞入 plugin ZIP。审查方需要可验证的工具和专用样例账户，不需要真实用户数据。[O2][O6]

## 12. OpenAI 当前规则与项目建议分开记录

以下为 2026-10-04 UTC 读取官方页面所得，**上线前必须复核**：

| 已核对的官方规则/机制 | Rillora 对应动作 |
| --- | --- |
| Plugin 可含 MCP、skills 和可选 UI；ChatGPT/Codex 共用目录 [O1] | 先工具，UI/skills 只在有明确价值时增加 |
| 私用/工作区用 developer mode；公开提交需生产可达 HTTPS MCP，Streamable HTTP；private tunnel 不单独满足公开要求 [O2][O8] | 区分“目录不公开”与“网络私有”；公开代理也必须认证；后端/代码仍可私有 |
| 私密用户数据/代用户动作应认证，OAuth 2.1 与每次 resource-server 校验 [O3] | 继续 Auth0 候选，不沿用整权第一方 session 给 AI |
| 公开目录禁止处理 PCI 数据、PHI、政府身份号与访问凭据/认证秘密；其他受管制敏感数据需满足必要性、合法同意及显著披露条件 [O5] | 仅最小地图字段；不把普通 OAuth 托管登录误写成工具采集密码；不开放 raw Notes/钥匙 |
| 可用既有付费权益；不得在插件内卖数字服务订阅、推广升级或链接直接结账 [O5] | Family 购买留在原独立渠道；插件可解释不可用权益，不发起购买 |
| 准确 safety annotations、数据最小化、不可逆动作人类确认 [O2][O4][O5] | 工具真实副作用与服务端确认双重约束 |
| 公开提交需身份/域名验证、网站/支持/隐私/条款 HTTPS URL、工具扫描；需专用合成 demo、五个正例、三个负例、演示视频与 release notes [O6] | 审核资料用样例内容；凭据仅走安全审核表单，不进 Git/ZIP |
| 获批后需主动发布；目录发现/推荐不是自动保证 [O6][O8] | 发布状态单独核验，不承诺流量、排名、审核时长或资格 |

官方规则不等于 Rillora 的最终法律意见，也不表示所有国家/用户/工作区都能使用。目录对成熟度、数据处理与功能范围的要求是独立产品门；不把本计划描述为 OpenAI 预先批准。

本项目建议（并非官方硬性同一实现）：先规划者只读；初期拒绝 raw Notes；独立 proposal；精确确认绑定；强制写入幂等；MCP 独立关闭开关；不作为当前发布阻塞。这些建议在实际 implementation PR 中复核与落实。

## 13. 官方来源与重新核验入口

- **O1** [Plugin quickstart](https://developers.openai.com/plugins/quickstart)；[Plugin architecture](https://developers.openai.com/plugins/concepts/plugins)：目录、MCP/skills/可选 UI 与开发者模式
- **O2** [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)：工具/schema、安全注释、授权与生产部署
- **O3** [Authentication](https://developers.openai.com/plugins/build/auth)：OAuth 2.1、resource metadata、PKCE、客户端注册选择、Auth0 与 token 校验
- **O4** [Security & Privacy](https://developers.openai.com/plugins/guides/security-privacy)：最小权限、明确同意、注入防护、确认、日志与留存
- **O5** [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)：受限数据、订阅/数字服务限制、工具与数据要求
- **O6** [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission)：身份/域名、包、扫描、审核资料与发布
- **O7** [Responses API MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)：模型侧调用、审批/认证边界与 token 计费说明
- **O8** [Remote MCP server review requirements](https://developers.openai.com/plugins/deploy/app-review)：私用/公开区分、公开端点与发布发现；遇到提交流程差异以 O6 最新页面为准

- **O9** [MCP Events](https://developers.openai.com/plugins/build/mcp-events)：2026-10-05 UTC 实际核对的 Events 集成/生命周期/客户端支持；页面链接的 MCP Events 协议参考仍标 draft，实施前复核

## 14. 本轮完成与未完成

本轮完成：当前官方资料核对、既有源码/产品约束映射、分期接口方案、风险与验收矩阵、Codex 任务及文档 Git 保存；后续补入第 15 节可选 Events 章节、12 组验收与 P1E/C3E 任务。远端回读结果另见 [文档 QA](../qa/ai-mcp-plan-20261005/README.md)。

本轮未执行：产品代码、数据库迁移、Auth0 配置、凭据/令牌创建、连接授权、MCP 部署、真实数据传给模型、OpenAI 提交、收费、合并或部署。所有验收矩阵仍为 TODO。没有把既有 CI 或部署证据写成本方案功能已完成。

## 15. 可选 MCP Events：事件订阅与投递（未实现）

Events addendum checked: 2026-10-05 UTC / Asia/Hong_Kong  
Status: OPTIONAL PROPOSAL — NO EVENT RUNTIME, SUBSCRIPTION OR DELIVERY CREATED

Owner 提供 [MCP Events 官方文档](https://developers.openai.com/plugins/build/mcp-events)并要求补入本计划。本章细化架构预留；不把事件支持新增为当前首发门，不改变前文只读优先或写入确认边界。

### 15.1 定位、兼容性与首个场景

Events 解决“选定对象发生变化时通知已订阅的 AI 客户端”，与 AI 主动调用 Rillora 工具互补。它不是定时器、短信/系统推送承诺、权限执行器或身后披露触发器。

当前官方支持范围为 Web Work、桌面 Work 且选择 Cloud，以及 dots，受工作区控制。该集成要求 MCP 2.0 / 协议版本 `2026-07-28`；支持 webhook 与 callback verification，不支持 polling、streaming 或草案的 `gap`/`terminated` 控制通知。官方链接的协议参考标为 draft/design sketch；不能把它说成整个产品处于 beta，也不能推定所有移动聊天或 MCP 客户端支持。实施时重新核对协议/SDK/客户端版本。[O9]

**项目建议：P1 只读 MCP 稳定后，增加独立可选 P1E；先试 `review.due` 一个场景。** 复核的日期、时区、到期计算、改期与撤销由 Rillora 自身持久化状态和调度执行；MCP 只传递已发生、仍相关的到期事实。尚未实现 Rillora 的可靠时钟/调度与去重之前，不能把“已订阅事件”说成“会准时提醒”。

### 15.2 领域事件、订阅与投递分层

以下均为拟议模块，不是现有表、worker 或接口：

1. **领域事件/outbox**：在业务事务内写入最少事件元数据，与真实状态变化同事务提交；提交成功后才由投递器处理，事务回滚不发事件。到期调度有单独业务去重键，改期/完成复核后旧到期事件不得继续触发提醒
2. **订阅登记**：保存认证 user/client/connection/grant、精确事件与筛选范围、已验证 callback、受保护签名材料、有效期及状态。事件目录与订阅操作均受当前用户/生产准入/对象权限约束
3. **投递适配器**：从 outbox 找到仍有效的订阅，重新授权并投影最小 payload，签名、投递、记录有界重试/结果。协议适配不直接获得数据库/KMS 管理权
4. **AI 后续读取/行动**：事件只提供线索；通过原有只读工具查询当前获准状态。后续写入继续经过 proposal、可信确认、版本/幂等和服务端授权；订阅不等于预先批准未来所有动作

| 拟议事件 | 触发与范围 | 初始最小业务 payload |
| --- | --- | --- |
| review.due | 用户已选择的复核对象到期，且当前仍未完成/改期；P1E 首个候选 | 受订阅范围限制的 opaque review ID、revision |
| matter.updated | 明确选定事项的可获准版本变化；后续候选，需防止隐藏字段变化泄露 | opaque matter ID、对该订阅可见的 revision |
| proposal.created | 独立 proposal 已保存并需要本人查看；待 P2 存在后再评估 | opaque proposal ID、revision |

事件名为设计示例。MCP 信封使用协议要求的 event ID、事件名、发生时间等；业务字段放在 `data`。不随事件发送 title、Notes、正文、金额、联系人、能力链接、恢复钥匙或完整差异；opaque ID 也须对象授权，不能当作匿名或公开信息。

`matter.updated` 的“可见 revision”需要定义：只改了订阅者无权知道的字段，不应通过更高版本号或新事件泄露该变化。跨用户隐藏对象、Never disclose、归档/暂停/撤销等按当前政策抑制，而不是发送一条“你无权访问的事项变了”。

### 15.3 订阅、续期与撤销

协议使用与工具相同的已认证 MCP endpoint，能力发现与 `events/list` 仅展示当前账号有权发现的事件；`events/subscribe` 创建/续期，`events/unsubscribe` 停止订阅。事件定义分别声明筛选输入与 payload schema。[O9]

项目授权设计：
- 订阅作为长期数据分享单独同意：谁接收、哪些事件/对象/字段、用途、期限与停用入口；不把“登录 Rillora”当订阅授权
- 拟议 `events:subscribe` 仅为能力 scope，还要逐对象与字段 grant；续期不能扩大筛选范围或复活已撤销权限。不同 AI 连接的订阅、回执、游标与签名材料隔离
- 按规范用认证 principal、callback、事件名与 canonical arguments 的身份实现幂等；Rillora 的 principal/内部绑定还要区分 client/connection，防止同用户的第二条窄授权连接接管宽授权订阅
- 订阅状态跨重启保留。事件身份相同的重复请求更新现有订阅；筛选参数键顺序变化不产生重复订阅。callback 改变要按新目的地验证，不能继承旧验证
- 有界默认有效期，按返回的 `refreshBefore` 执行到期停发；`ttlMs`/无期限请求按当前规范处理，不能暗中把用户要的短授权变成长授权。第一版建议不授予无期限订阅
- 每次初次投递、重试和可选重放前重新检查连接、对象、grant/策略版本、有效期及当前生产准入；权限不足即停止该目的地的待投递/重试任务
- unsubscribe 要鉴权且幂等，只能停止相应账号/连接的匹配订阅。断开账号、撤销 grant、过期或对象不再可见，均停止后续投递；已排队但未发出的也不能漏发
- 撤销与发送建立明确串行化/检查边界；已经发到对方或在途的副本不能承诺召回。事件中的“撤销通知”不是撤销生效机制，原 API 权限立即按当前状态拒绝
- 续期若替换签名 secret，按 Standard Webhooks 的短暂双签轮换处理；旧 secret 窗口有界，不能无限保留 [O9]

### 15.4 Callback 验证、安全例外与签名

前文禁止的是模型任意指定外发 webhook。本章只有一个狭窄例外：**经过认证的 Events 协议订阅请求提供、完成验证并绑定到该连接的 callback**。它不成为通用 HTTP 工具，也不允许事件/Notes/模型输出改写目的地。

- 激活前执行已签名、单次且短期 challenge；成功响应及 challenge 校验通过后才允许业务 payload。验证失败保持不活跃，返回协议对应错误；缓存验证仅在有界的相同认证 principal/callback 范围内
- callback 必须 HTTPS；每次建立连接时解析/验证目的地址，阻断 loopback、私有、link-local 与其他非公网地址，禁止重定向，实际连接到通过检查的地址并保留原 hostname 做 TLS 校验。验证请求、正常投递、重试均使用同一 SSRF 防线
- callback 地址与 signing secret 只从受校验的订阅协议对象取得；secret 按规范校验格式/长度后受保护保存，不进入模型工具输出、日志或 Git。本轮没有生成、接收或配置任何 secret
- 按 Standard Webhooks 签名准确请求字节；设置协议要求的 webhook ID、签名时刻、签名和 subscription ID 标头，保持信封 event ID 与 webhook ID 一致。正文序列化后不得再被 middleware 改写
- 密钥轮换、失败分类、日志脱敏与最小留存要有合成测试；不要用“有签名”替代用户授权、目的地验证和反重放检查 [O9]

### 15.5 投递语义与异常恢复

官方明确：每请求一个事件，完整请求体最大 256 KiB；`2xx` 仅确认 webhook 收到，后续处理异步。暂时失败有界指数退避；重试保留 event ID，重新生成签名时刻/签名；`410`、`413` 不重试。事件可能乱序；写工具必须幂等。Replay 是可选能力；未实现时 `cursor: null`，不能承诺补回断线期间事件。[O9]

Rillora 的建议实现：
- 区分 domain-committed、queued、receipt-accepted、failed/expired/cancelled 与实际用户任务结果；收到 2xx 后不能因看不到 AI 回复而盲目重发
- 一份领域事件可对应多条各自授权的投递记录；去重以订阅/连接与稳定 event ID 为界，不能把其他接收端的成功误当成本端成功
- 乱序或重复到达只触发当前状态读取；旧 revision 不覆盖新数据，不把事件旧内容当作最新事实。保留原先写工具的精确确认与幂等回执授权
- 410/413 分别记入可诊断的终止/体积失败处理；不由一次失败自动撤销所有用户连接。压缩或丢字段也不能绕过 schema/披露合同，正常 payload 应远小于上限
- 本期先不提供历史 replay；未来若开启，游标要有范围绑定、不跳过尚未投递项，并在历史不足时真实报告 `truncated`；重放仍检查当下权限，不能泄露撤销前旧范围。gap/terminated 不在本集成可用恢复机制中
- 事件导致 AI 写入、写入再产生事件时，要用内部 causation/operation 关联、幂等、去抖与次数/速率上限防反馈循环；内部关联记录默认不出站。首次试点不允许事件直接触发自动写入
- 每 user/client/subscription 设有界积压、并发、重试窗口、速率与预算；事件风暴可暂停适配器而不影响 Rillora 核心业务。不能把它设为关键到期/安全通知唯一通道；Rillora 内可核验的到期状态与用户原已授权提醒路线单独负责
- 通知与事件文本始终是不可信数据；不嵌入要求模型改权限、执行命令或给第三方发资料的行为指令

### 15.6 验收增补（全部 TODO）

| ID | 场景 | 完成标准 |
| --- | --- | --- |
| EVT-01 | 协议/客户端能力发现、目录重扫 | 在文档列明的真实客户端逐一验证；不支持时明确降级，不伪装已订阅 |
| EVT-02 | A/B/C、不同连接、隐藏对象与筛选条件 | list/subscribe/renew/unsubscribe 无越权；只投递被授权且匹配的事件，无隐藏数量/版本侧漏 |
| EVT-03 | 同身份重复订阅、参数键顺序、重启/续期/过期 | 订阅幂等、持久；到期停发；刷新不扩权，无期限请求正确处理 |
| EVT-04 | challenge 错误/重放/过期、错签名、旧/新 secret 轮换 | 未验证不发业务数据；轮换窗口有界，旧材料不会无限可用 |
| EVT-05 | DNS rebinding、IPv4/IPv6 非公网、重定向、TLS 主机名不符 | 验证和每次发送均阻断；没有仅检查字符串 URL 的漏洞 |
| EVT-06 | 订阅后缩权/撤销/断连；积压/正在重试/可选 replay | 当前权限再次检查；未发送队列停止，不复活旧 grant；不承诺在途副本召回 |
| EVT-07 | 事务回滚、重复定时作业、到期前改期/完成、时区边界 | 不产生虚假/重复到期；只有仍相关的 review.due，时钟在 Rillora |
| EVT-08 | 超时、5xx、410/413、256 KiB 边界、2xx 后 AI 未处理 | 正确退避/停重试/尺寸拒绝；保留 event ID 与新签名，不把送达当任务完成 |
| EVT-09 | 重复/乱序/批处理风暴，AI 写入产生新事件 | 不重复写入/覆盖新状态/无限循环；批处理开启与关闭各测 |
| EVT-10 | 未实现 replay 的断线，或将来游标历史不足/跨连接重放 | cursor/truncated 真实；不会跳过待投递或借历史泄密；漏事件不伪装已恢复 |
| EVT-11 | 恶意 title/Notes/正文/回调提示、秘密扫描 | payload 只有允许的 opaque 引用/版本，未带正文或行为指令 |
| EVT-12 | 关闭 Events/解除订阅/恢复服务 | 核心 Web/iOS/只读 API 与关键权限独立有效；原已授权提醒不依赖 MCP 单通道 |

### 15.7 Codex 可选任务与 Done

新增 **C3E（依赖 C0–C3 和 P1 验收）**：先交付事件 schema、review.due 领域时钟/outbox、connection-scoped subscriptions、验证/签名 delivery adapter、停用/撤销/重试与可观测性。matter.updated 与 proposal.created 留作后续候选，不要求同批上线。

Done = EVT-01–12 按范围有实际证据 + 与既有 AUTH/ACL/REVOKE/INJECT/RETRY 验收联测 + 官方当前协议/客户端重新核对 + 专用合成账号端到端。若要接真实数据或创建持久连接/凭据，按独立授权与隐私要求执行。公开工具/events 改变后还要重新扫描；扫描、生产部署和目录发布仍是分开的步骤。[O9]

本次只把上述内容纳入同一文档分支；没有新增事件表、定时作业、outbox worker、订阅、callback、签名密钥、webhook 投递、持续权限或通知任务。
