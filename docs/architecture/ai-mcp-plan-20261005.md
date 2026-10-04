# Rillora AI 接口、MCP 与 OpenAI Plugin 目录实施交接

Role: future integration architecture proposal and implementation handoff  
Authority scope: AI-facing API boundaries, phased work packages and acceptance criteria  
Status: PROPOSAL / DOCUMENTATION ONLY — NOT IMPLEMENTED  
Last updated: 2026-10-05 (Asia/Hong_Kong)  
Official-source check: 2026-10-04 UTC / 2026-10-05 Asia/Hong_Kong  
Source baseline: `2cc95f77c1279bdad43547b7e58a8faca9da7a93` on `codex/strict-review-20261002`  
Delivery branch: `codex/ai-mcp-plan-20261005`

## 0. 接手结论与本次授权

**能做，也值得预留。建议先建立可复用、带权限的领域接口，再接 MCP，私测成熟后再申请公开目录。AI 集成不新增当前首发阻塞项。**

Owner 提出以后用户应能通过 AI 使用 Rillora，并要求“整理好也推到git去”。本轮交付是计划与 Git 保存，不是开始运行时开发的证明，也不扩展为创建凭据、配置 Auth0、开放用户数据、上线服务、上架提交或合并其他分支。

- 本文的工具、scope、接口路径、阶段划分及预算控制均为待实施设计；除明确标记“现有”者外，不得写成已实现
- 已核对基线仍为上述 strict-review SHA；仓库代码、运行部署与真实用户验收是三类证据
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

### P2：草稿/建议与有限确认写入

- 先在对话中生成候选；需要跨会话保存时，建立独立 proposal，明确它是写操作
- 用户在可信 Rillora 界面核对精确差异后提交，只允许本人普通事项的狭窄字段更新
- 收件人第一版保持只读；以后建议能力须另外遵循现有共同复核/指定贡献者规则
- 完成标准：重认证、确认绑定、幂等、版本冲突、撤销竞争、审计和回滚测试通过；不因 UI 已确认而跳过服务端权限

### P3：公开目录

- 前三阶段及安全/隐私检查成熟后，按当前官方要求准备公开资料与专用合成审核账户
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
- 禁止通用 HTTP proxy、任意远程文件抓取与模型指定 webhook；未来如需引用外部资源，先加入受控解析、出站目的地与 SSRF 保护
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

## 14. 本轮完成与未完成

本轮完成：当前官方资料核对、既有源码/产品约束映射、分期接口方案、风险与验收矩阵、Codex 任务及文档 Git 保存。远端回读结果另见 [文档 QA](../qa/ai-mcp-plan-20261005/README.md)。

本轮未执行：产品代码、数据库迁移、Auth0 配置、凭据/令牌创建、连接授权、MCP 部署、真实数据传给模型、OpenAI 提交、收费、合并或部署。所有验收矩阵仍为 TODO。没有把既有 CI 或部署证据写成本方案功能已完成。

