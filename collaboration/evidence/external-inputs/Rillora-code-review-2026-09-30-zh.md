# Rillora 全仓代码静态 Review

日期：2026-09-30 UTC  
仓库：tantalum666/rillora（私有）  
分支快照：main / [73dd50d36988e6def406908beae1c984e70c4fa8](https://github.com/tantalum666/rillora/commit/73dd50d36988e6def406908beae1c984e70c4fa8)

收尾增量复核：main已更新至 [296c7b53ad22ee7239aa037d7544b708c5b73703](https://github.com/tantalum666/rillora/commit/296c7b53ad22ee7239aa037d7544b708c5b73703)。已逐项核对相对基线的7个变更文件：仅App Store展示文档与发布登记更新，新增1份说明，没有程序、Swift、迁移或基础设施执行代码变化；以下代码发现仍适用于该最新版本。该提交并非本次review产生。附录是原基线的1095文件，新文档已另行完整阅读。

## 结论

本轮发现 **13项可操作问题：1项P1、10项P2、2项P3**。建议先修复近期认证绕过、跨标签账户混用、支付状态竞争，以及正式分发下的退出/邀请路由，再完成真实发布验收。没有看到足够证据证明匿名访问任意账户或破解加密；这不等于排除了全部漏洞。

只做了固定提交的只读静态审阅，没有修改GitHub代码、创建提交/PR/Issue、运行仓库代码、测试、数据库迁移、部署或真实支付，也没有创建Codex任务。报告里的触发步骤是源码推演，未冒充线上实测事故。仓库的普通生产客户/正式支付仍有关闭门；本报告不代替真实上线验收。

### 问题总览

|编号|等级|问题|
|---|---|---|
|F01|P1|等价URL绕过敏感操作的10分钟近期认证|
|F02|P2|同一浏览器另一标签切换账户，旧草稿可能保存进新账户|
|F03|P2|Stripe并发对账把已取消订阅回写成active|
|F04|P2|正式iOS退出URL丢失/api前缀，服务端会话未撤销|
|F05|P2|生产CloudFront路由遗漏真实邀请入口|
|F06|P2|Web与iOS忽略事项分页，超过50条后余下事项不可正常访问|
|F07|P2|Web恢复草稿调用不存在的getMatter方法|
|F08|P2|合法多角色/撤销重建导致联系人重复返回|
|F09|P2|原生联系人编辑器系统返回可绕过未保存确认|
|F10|P2|测试在验证目标数据库之前先执行迁移|
|F11|P3|官网Pricing的订阅条款链接指向错误路由|
|F12|P3|浏览器移动原型关闭输入面板后模拟键盘残留|
|F13|P2|原生UI矩阵仍断言已移除的控件与旧文案|

P1表示应优先修复的安全边界问题；P2表示明确的正确性、隔离或发布路径缺陷；P3为较低影响问题。每项详细说明包含前提、影响、固定提交定位、修复方向与置信度。

## 审阅覆盖与方法

- 完整获取未截断Git目录树：1095个文件
- API源码：87/87全文阅读；SQL迁移：91/91全文阅读
- 程序、样式、SQL及测试源码（按列明扩展名）：581/581全文静态阅读
- API测试/辅助：44/44全文阅读
- 原生Swift代码（含测试/预览）：120/120全文阅读
- 整体文件阅读层次：全文643，部分2，其余450；逐文件名单在附录，不把下载或文件名盘点算成全文审查
- 覆盖认证/账号、CSRF/RLS、分享投影/撤销、导出/导入/加密、家庭维护、Stripe/Apple账本与并发、Web/Swift调用者、运行入口、IaC、运维脚本、构建及CI；对具体发现检查相邻路由、最新迁移和反例测试
- 图片/字体/资源包、SVG图形、历史文档、第三方依赖源码与锁文件的完整供应链审计不属于本轮逐字检查；没有做许可证法律审计、外部平台政策时效审计或像素级视觉验收
- 样式的静态阅读不等于浏览器布局/可访问性实测；真实SSO、设备Keychain/Passkey、StoreKit、Stripe和AWS有效权限仍需要各自运行验证

## CI证据

现有 [Verify source #38](https://github.com/tantalum666/rillora/actions/runs/36630649822) 对本提交状态为success，完成于2026-09-29 21:04:59 UTC。本轮没有触发或重跑。工作流包含源码扫描、API构建/测试、Web构建/测试及基础设施/工具检查，**没有iOS/Xcode job**；不能把这个绿灯解释为双端全部验证。最新文档提交的[Verify source运行](https://github.com/tantalum666/rillora/actions/runs/36664168395)也于2026-09-30 03:25:22 UTC成功。API CI使用Node24，而Docker声明Node22.22.3；未据此推定已有兼容性故障。

## 详细发现

## F01 / P1：等价URL绕过敏感操作近期认证

置信度：高，静态验证，未动态利用。

主位置：[recent-authentication.ts 22–26](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/recent-authentication.ts#L22-L26)

中间件通过includes(request.path)和区分大小写、结尾锚定正则识别敏感路径。业务Router却采用默认匹配：不区分大小写，且/foo与/foo/等价。[Express 5官方Router默认值](https://expressjs.com/en/5x/api/express/#express.router)

调用链：
- [app.ts 207–209](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/app.ts#L207-L209)：默认Router，先正常认证，再调用路径检查；全src未启用strict/case-sensitive routing
- [app.ts 238–242](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/app.ts#L238-L242)：账号处理器及/v1、/api/v1双入口
- [account-deletion.ts 60–72](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/account-deletion.ts#L60-L72)：删号处理器只补验CSRF、请求体、计费确认和身份清理配置，没有再验近期认证
- [account-data-routes.ts 60–91](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/account-data-routes.ts#L60-L91)：导出/导入同样依赖外层名单

触发：requireRecentAuthentication开启，仍有效的本地会话authenticated_at超过10分钟或缺失。使用Bearer，或Cookie加正确CSRF，把POST /v1/account/delete改成/v1/account/delete/，即可跳过近期认证并命中原处理器；/v1/account/MAP/export等大小写变体同理。其余业务条件和合法请求体仍须满足。

后果：遗留/被盗会话无需重新证明身份即可删号、导出、创建共享、重发邀请或恢复实时共享。不是未登录绕过，也不是跨租户读取。事务内另有直接认证检查的PATCH范围扩大与家庭协作者变更，不受此具体漏洞影响。

[现有测试49–58](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/tests/recent-authentication.integration.test.ts#L49-L58)仅覆盖标准URL，遗漏两个前缀及大小写/尾斜线组合。

建议：把近期认证直接绑定每个敏感业务路由/操作，避免另建字符串匹配授权表；补所有可命中处理器的等价URL、陈旧/缺失/新鲜认证时间的回归测试。

## F02 · P2 · 同源另一标签页切换账户后，旧页面草稿会提交到新账户

- 主定位：[App.jsx 484–490](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L484-L490)
- 触发：在标签页一以 A 登录并填写一个新事项；在同源标签页二退出 A 并登录 B；不刷新标签页一，直接保存仍显示的 A 草稿。
- 原因：App 只在初始 effect 加载主 session/map，[356–361](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L356-L361) 没有 focus/visibility/账户切换同步。新事项 POST 不绑定编辑时的 planner。API client 每次实时读取当前 CSRF cookie，[38–52](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/api.js#L38-L52)；[415–422](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/api.js#L415-L422) 读取同源共享的 document.cookie，因此送出的 session 和 CSRF 都属于 B。服务端按当前 session 的 planner 插入，[routes.ts 358–364](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/routes.ts#L358-L364)。也已交叉确认没有已加载账户身份绑定屏障。
- 后果：A 输入的私人事项、Notes 等落入 B 的账户；A 页还把 B 返回的记录合并进旧 map。账户隔离的 sessionStorage 草稿键只保护恢复读取，不能保护这一条已挂载编辑器的提交链。旧事项更新由于 owner/RLS 检查会被拒绝，本问题以新增为准，不声称 SQL 跨租户越权。
- 修复：为编辑器捕获明确的账户/会话身份；敏感读写和新增请求由服务器核验这个预期身份，账号变更时拒绝提交并清空旧可见数据。跨标签通知与前台校验用于尽早锁定旧页面，但仅靠提交前一次 GET 仍有竞争窗口。
- 建议验证：真实两标签 A→B 切换，对比 POST 所属账户和两方事项计数；覆盖 contact/import 等无既有资源ID的写入。
- 置信度：高。

## F03 / P2：并发 Stripe 对账会把已经取消的订阅重新写成 active
置信度：高（控制流与 SQL 的确定性交错分析，尚未执行并发测试）。

主要位置：
- [stripe-production-adapter.ts L153–165](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/stripe-production-adapter.ts#L153-L165)
- [stripe-commerce-executor.ts L306–335](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/stripe-commerce-executor.ts#L306-L335)
- [stripe-commerce-executor.ts L947–960](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/stripe-commerce-executor.ts#L947-L960)
- [commerce-subscription-ledger.ts L25–38](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/commerce-subscription-ledger.ts#L25-L38)

触发顺序：
1. 针对同一已支付订阅的旧事件 A 先进入。retrieveSubscription 返回 active 与未来的 current_period_end；随后 A 等待 retrieveInvoice。
2. 用户/供应商立即取消该订阅，新的 customer.subscription.deleted 事件 B 进入。B 的 retrieveSubscription 返回 canceled；stripeSubscriptionState 把它映射成 expired_read_only，因此 B 跳过 active 分支中的 invoice 请求，先返回较早 observedAt=t2。
3. B 提交 expired_read_only，撤销权益。provider_observed_at 记录 t2。
4. A 的 invoice 请求稍后返回原已支付发票。发票仍是 paid 并不会因取消而自动变为未支付。A 的 subscription 对象仍是步骤1读取的旧 active，但它在函数返回处被标记 observedAt=t3，且 t3>t2。
5. A 此时才取得 sharing advisory lock。已有防旧快照检查只比较本地 observedAt，故通过；A 覆盖状态、续费可能性及账期为旧 active，再次调用权益函数授予剩余旧账期的 Family 权益。

为何现有防护不阻止：
- 锁在 provider snapshot 取完后才取得，不能序列化供应商读取。
- 事件去重只按 event ID；A/B 不同，均可提交。
- reconcileCommerceProviderState 每次只收到本次 signal/snapshot；只要求本次 snapshot.observedAt >= 本次 signal.occurredAt，不查询已提交的较新 provider event。
- provider_occurred_at 保存作审计，没有参与新旧状态冲突判定。
- invoice-bound financial override 仅保护 refund/dispute；一般取消没有该 override。
- 权益 SQL 的当前时间检查限制过期，却不会拒绝尚未到期的旧 paid-through，故无法阻止上述重新授予。
- 已有 production-commerce 集成测试按顺序使用完整合成快照，没有模拟 adapter 内两个 await 的反向完成。

后果：服务器重新显示可续费/active，Family 权益和共同维护能力可能延续到原账期结束；也可能使后续合法购买被 existing_subscription 拒绝。原已应用取消事件重送会被当 duplicate，不保证自行修复。

建议：采用与 Apple intake 类似的、按 provider/environment/subscription 的租约，从 provider 读取前持续到最终提交；重读 provider 状态或建立可靠的状态版本/观察栅栏。不要仅把 observedAt 放在最后一次网络调用结束处。补充可控制两个 SDK Promise 完成顺序的集成测试，验证 canceled/paid-renewal/dispute 状态不会被旧响应覆盖。

## F04 / P2：正式 iOS 的退出端点丢失 /api 前缀，服务端会话撤销失效
置信度：高；Release 配置、实际请求构造、CloudFront 行为和 API 路由的静态链完整。

主要位置：
- [NativeAuthenticationService.swift L262–283](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Core/Authentication/NativeAuthenticationService.swift#L262-L283)
- [NativeAuthenticationService.swift L294–315](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Core/Authentication/NativeAuthenticationService.swift#L294-L315)
- [APIConfiguration.swift L81–92](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Core/API/APIConfiguration.swift#L81-L92)
- [rillora-production-web-stack.ts L82–99](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/infra/aws/lib/rillora-production-web-stack.ts#L82-L99)
- [production-router.js L3–9](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/worker/production-router.js#L3-L9)

触发：正式 iOS 使用强制配置的 sessionExchangeURL=https://app.rillora.xyz/api/auth/native/session；登录成功后调用普通退出或退出所有设备。

NativeAuthenticationService 以该 URL 为基础，却分别硬写 path=/v1/auth/logout 和 /v1/auth/logout-all，生成 https://app.rillora.xyz/v1/auth/logout[-all]。生产分发只有 /api/* 转 API，其余默认 S3 静态行为仅允许 GET/HEAD；production-router 也明确拒绝非 /api 的 POST。因此这两个请求不会到达撤销 auth_sessions 的 API。API 本身同时挂载 /v1 与 /api/v1，不代表公开 app 主机也代理 /v1。

后果：
- signOut 忽略网络/HTTP结果并删除本机 Keychain token，看起来已退出，但该 opaque Rillora 会话没有在服务端撤销；若 token 已被另处复制，仍可在有效期内继续使用
- signOutAll 检查2xx，因路由拒绝始终抛 sessionRevocationRejected，正式版本的“退出所有设备”不可用
- Auth0 .logout 只处理身份提供方会话，不会替代 app.auth_sessions 的撤销

建议：从明确的 API base URL 派生 auth/logout[-all]，或统一 URL 构造并保留公开代理前缀；生产路径应为 /api/v1/auth/logout[-all]。增加 URLProtocol/HTTPTransport fixture，使用真实 production URL 配置断言路径和服务端撤销成功。当前 ProductionConnectionTests 仅验证端点配置/命名空间，APIClientTests 的认证相关测试没有执行这两个退出 URL，不能覆盖该错误。

## F05 · P2 · 生产 CloudFront 路由拒绝所有邀请入口

- 主定位：[production-router.js 10–14](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/worker/production-router.js#L10-L14)
- 触发：打开生产 /invite#invitation=[REDACTED_CAPABILITY] 或解析后的 /invite/<UUID>。
- 原因：白名单包括旧 /accept，却没有 /invite 及 UUID 子路径；它们均落入 404。前端实际入口和 resolve 后地址在 [InvitationPage.jsx 11–35](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/InvitationPage.jsx#L11-L35)。基础设施配置已确认 production-web-stack 的默认行为确实配置此函数，无另一邀请放行路径。
- 后果：正式分享核心闭环在到达 React/账户验证前即失败。当前 production customerAccess=closed，故这不是已观察到的现售用户事故，而是解除发布门前必须修复的确定路径缺陷。
- 修复：仅允许 /invite 和有效 UUID 的 /invite/:id，保留未知路径404；增加 fragment 初始入口、认证返回、reload、HEAD 测试。当前 router 测试只断言旧 /accept 成功，掩盖了真实路径。
- 置信度：高。

## F06 · P2 · Web 和原生 iOS 均忽略 overview 分页，超过 50 条后无法访问余下事项

- 主定位：[App.jsx 315–321](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L315-L321)
- 触发：账户有 51 条或更多未归档事项，重新加载 Web。
- 原因：服务器明确只返回前 50 条并提供 nextCursor，[overview.ts 46–48](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/overview.ts#L46-L48)；客户端丢弃 cursor，未提供更多页请求/加载控件，搜索只过滤本地 matters。[App.jsx 724–755](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L724-L755)。冲突恢复再次调用固定 limit=50 的 getMatters，[659–663](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L659-L663)。
- 后果：第 51 条及以后记录看起来消失，无法正常搜索、编辑、归档或从分享选择器选择；概览计数也误报 50。创建后暂时可见、刷新后消失尤其容易被理解为数据丢失。
- 修复：保存 nextCursor 并完整分页或提供明确加载更多；搜索/计数说明实际范围。单项恢复用按ID读取，不能依赖第一页。
- 现有测试只测请求/纯函数，不覆盖 51 条 workspace hydration。
- 原生交叉证据：[APIClient.swift 306–308](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Core/API/APIClient.swift#L306-L308) 只GET overview；[OverviewStore.swift 50–56](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Overview/OverviewStore.swift#L50-L56) 直接接受snapshot；MattersView也仅在snapshot.matters上过滤，没有继续加载cursor。此为同一双端分页缺陷，不额外重复计数。
- 置信度：高，已与 API 分页实现交叉核实。

## F07 · P2 · 恢复缺席原事项的草稿调用不存在的 API 方法

- 主定位：[App.jsx 424–432](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/App.jsx#L424-L432)
- 触发：保留已存在事项的未保存草稿，在另一端归档该事项后刷新，再点 Resume draft。也可由 F06 的第一页缺席触发。
- 原因：此处调用 api.getMatter，但 createApiClient 返回对象没有该方法，立即抛 TypeError。catch 判断 undefined !== 404 后返回，所以后面的“另存为新事项”确认永远不能执行。服务端实际上提供可返回 archivedAt 的 [GET /matters/:publicId](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/routes.ts#L431-L448)。
- 后果：草稿只能停在“原事项无法检查”，用户不能通过已有恢复流程取回编辑内容；目前恢复 UI 只显示标题，并无草稿下载功能。
- 修复：补齐按ID读取的客户端方法及契约测试；覆盖 active/archived/404/network error 四分支以及实际组件点击流程。
- 置信度：高。此项独立于分页问题，即使所有事项不足 50 条仍可复现。

## F08 / P2：多角色记录导致同一联系人重复返回

置信度：高；API、索引、Web列表及原生正常入口已交叉核对。

主位置：[overview.ts 12–25](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/overview.ts#L12-L25)
重复位置：[routes.ts 593–610](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/routes.ts#L593-L610)

people直接JOIN全部trusted_contact角色，未限制范围/状态或聚合。[0019唯一索引](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/migrations/0019_active_role_assignment_uniqueness.sql)明确只约束未撤销的同角色同范围，因此合法多范围、撤销重建会生成多行。

复现：创建联系人后，自动生成plan_wide trusted_contact；通过角色API为同一人再创建matter_specific trusted_contact，或撤销重建原角色。/overview和/trusted-contacts随即返回相同publicId的多个联系人，角色状态可能不同。Web用publicId作key且不去重，造成重复显示/重复key；个人Start Here也会在多个有效trusted_contact范围时重复打印同一人。

原生普通入口已确认：MatterEditorView的Directions → More options → Recorded roles进入RoleAssignmentPolicyView，用户可选Trusted contact并保持Matter-specific，合法产生额外角色。Web角色面板还可经/?task=role-policy到达。不是仅修改数据库才能构造的问题，也不意味着所有普通联系人都会重复。

建议：以people作唯一集合，明确聚合角色/邀请状态；若仅需plan-wide主记录，则限定有效主记录。加多范围、撤销重建及导出每人只出现一次的测试。

## F09 · P2 · 联系人编辑页的系统导航返回可绕过未保存确认

- 主定位：[TrustedContactEditorView.swift 130–135](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Contacts/TrustedContactEditorView.swift#L130-L135)
- 正常触发路径：Profile→联系人分享页→[Edit contact record 的 NavigationLink](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Contacts/ContactSharingView.swift#L110-L113)，修改名字或关系后，使用系统导航返回，而非自定义 Cancel。
- 原因：只有 Cancel 在[154–164行](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Contacts/TrustedContactEditorView.swift#L154-L164)检查 hasUnsavedChanges。页面没有 navigationBarBackButtonHidden、导航路径拦截或可恢复草稿；interactiveDismissDisabled 针对模态 presentation，不等于拦截 NavigationStack 的 pop。此API用途已对照[Apple官方说明](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled%28_%3A%29)，同仓 MatterEditorView 和 PlanMotivationView 已显式隐藏脏状态下的系统Back。
- 后果：正常编辑路径可直接丢弃未保存联系人变更，且没有事后恢复入口。尚未运行设备动态复现，报告的是确定的导航防护遗漏。
- 修复：和Matter编辑器统一，脏/忙状态隐藏系统返回并使用受控 Back；为push与sheet两种呈现分别验证Cancel、系统Back、边缘返回、保存中的返回与Keep editing。
- 置信度：高（代码与官方API语义交叉核实）。

## F10 / P2：测试数据库保护在迁移提交之后执行
置信度：高，静态控制流；未执行测试或连接数据库。

- 主证据：[bootstrap-runtime.test.ts L14–22](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/tests/bootstrap-runtime.test.ts#L14-L22)
- 迁移确实提交：[migrate.ts L24–54](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/api/src/migrate.ts#L24-L54)

该测试采纳 TEST_DATABASE_URL。beforeAll 先对其运行整个 runMigrations，等91项迁移有机会提交后才检查 current_database() 是否 continuity_test。若开发者的环境变量误指一个允许该测试连接且凭据可执行迁移的非测试库，测试虽最终报“拒绝修改非测试库”，此前的架构、角色、权限和数据迁移已经可能提交。afterAll 还会在已建立但未通过数据库身份校验的连接上尝试 DROP ROLE continuity_runtime_staging_test。当前生产TLS要求可阻挡这里的非TLS误连，因此不能声称任意当前生产库都会被改；本问题适用于能接受该连接的其他开发/共享/非生产数据库或配置不同的远端库。

建议：在任何DDL/迁移之前用独立连接验证数据库名称、主机、专用测试标记和允许的测试凭据；只有验证通过后设置“已初始化”标记，teardown据此执行。最好统一到现有 assertDedicatedTestDatabase 风格帮助函数。增加“错误TEST_DATABASE_URL”测试，断言 runMigrations 和 cleanup SQL 都未调用。CI所用一次性Postgres本身是隔离的，这不是已发生CI事故。

## F11 · P3 · 官网 Pricing 的订阅条款链接固定指向 404

- 主定位：[PlanSection.jsx 79–83](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/web/src/landing/PlanSection.jsx#L79-L83)
- 触发：点击 Pricing 页底部 Subscription terms。
- 原因：href 是 /subscriptions，而 legal worker 唯一合法路由为 /subscription-terms；不存在别名或重定向。
- 后果：价格页读者无法从该入口查看订阅条款。其他法律入口正确，故不夸大成完全不可访问。
- 修复：使用 publicRoutes.subscriptions 统一常量，并对所有公共链接目标做路由断言。
- 置信度：高。

## F12 · P3 · 移动浏览器原型关闭输入面板后模拟键盘不退出

- 主定位：[Keyboard.tsx 185–193](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios-prototype/src/mobile/Keyboard.tsx#L185-L193)
- 触发：打开原型事项 BottomSheet，聚焦 KeyboardInput 后保存或关闭 sheet；也可只让输入框失焦。
- 原因：KeyboardInput/KeyboardTextarea 只有 onFocus→show，没有失焦处理；BottomSheet 只在打开时 hide，关闭/拖拽关闭不会 hide；Prototype 保存直接卸载 sheet。因此 Provider 的 visible 仍为 true，KeyboardDock 继续显示且 MobileScroll 仍预留键盘高度。
- 后果：返回主页仍被模拟键盘遮挡，原型交互证据失真。此目录明确仅是交互/视觉原型，不能据此说真实 SwiftUI iOS 有同样问题。
- 修复：统一关闭/卸载路径 hide，并在 focus 离开所有 keyboard-aware 输入时关闭；输入框之间切换保留一次会话。增加带输入的 sheet 关闭测试，当前 runtime 测试仅覆盖 FlowStack 主动 hide 和无输入 sheet。
- 置信度：高（静态调用链），未运行浏览器。

## F13 · P2 · UI回归矩阵仍断言已删除的页面和控件，完整套件无法验收当前版本

- 主定位：[RilloraLayoutMatrixTests.swift 755–770](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/RilloraLayoutMatrixTests/RilloraLayoutMatrixTests.swift#L755-L770)
- 触发：运行工程定义的 RilloraLayoutMatrix test scheme，使用已准备好的测试地图。
- 原因：非skip测试 testPrimaryEditorsAndPreparationRoutes 直接点击 matter.section.people，但当前MatterEditorView已是一页连续表单，完全没有这个identifier；testEditorSectionsKeepTheSameUnsavedDraft 同样依赖已删除的 directions/people/details tabs。另有非skip用例打开不再出现于正式Profile的 plan-motivation.open、simulation.open、disclosure-rehearsal.open。无需依赖网络推断：当前源中这些目标不存在。
- 无账号数据依赖的另一静态例子：[testSignedOutExperienceUsesHostedAuthentication 第269行](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/RilloraLayoutMatrixTests/RilloraLayoutMatrixTests.swift#L265-L270)要求精确旧文案“A report starts evidence checks. It does not release a matter by itself.”，当前[ProfileSupportViews.swift 第173行](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Account/ProfileSupportViews.swift#L169-L174)实际显示“A report alone must never release information. A live claims service is not available yet.”。当前替代交互为[MatterEditorView.swift 44–56](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Matters/MatterEditorView.swift#L44-L56)的连续表单类别/名称，以及[115–137行](https://github.com/tantalum666/rillora/blob/73dd50d36988e6def406908beae1c984e70c4fa8/apps/ios/Rillora/Features/Matters/MatterEditorView.swift#L115-L137)的Preferred outcome / More options / People，并无旧tabs。
- 后果：即使服务、身份和设备正确，完整套件也会在旧目标失败；核心编辑/导出/退出安全路径被陈旧前置步骤阻挡，不能将部分新用例通过扩大为完整UI矩阵有效。
- 修复：按当前连续表单和正式可达路由更新测试；需要保留的内部演练应进专属fixture/preview测试而非恢复已撤销用户界面；加入口清单静态检查，并补F09的push联系人草稿退出用例。
- 置信度：高，当前源码中断言与控件不匹配可直接核实；没有声称本轮运行失败。

## 建议的回归验证顺序

1. 对两个API前缀、大小写、尾斜线和陈旧/新鲜认证时间做敏感路由矩阵
2. 两标签A/B账户切换后尝试新增事项、联系人和导入，断言旧页面不能向新账户提交
3. 至少51条事项的双端加载/搜索/编辑/分享，以及归档后草稿恢复
4. 用正式API基础URL与CloudFront规则验证iOS退出/全设备退出、邀请初始入口/回调/刷新
5. 可控制Stripe两个网络请求完成顺序的并发测试，断言取消/退款/账期不会回退
6. 错误TEST_DATABASE_URL的初始化/清理测试，确保第一条DDL之前已拒绝
7. 原生联系人编辑后系统Back/边缘手势/Cancel、以及原型输入sheet关闭

## 未升级为确定缺陷的事项

- 登录returnTo中的控制字符可做更严格归一校验，但没有建立可绕过现有Origin/CORS与前端限定入口的完整第三方攻击链
- Dynamo恢复日志先写、PostgreSQL后提交的故障窗口，尤其hold释放，值得故障注入；本轮没有把未执行的失败场景当作已发生数据破坏
- Apple12次失败后的运营终态、pending取消、目录缓存已对照调用者/合同核查，不直接报成验签或权益绕过
- runtime角色可增加更全面的错误授权自检，但未发现IaC实际授予所怀疑的高权限，未当作现有提权漏洞

## 附录：完整文件覆盖

“全文”仅表示完整源码/正文静态阅读，不代表测试已执行或文件无问题；“未逐字”主要包含静态资源、历史文档、锁文件及资源元数据。发现的精确定位以以上固定提交链接为准。

|文件|类别|状态|
|---|---|---|
|.github/workflows/verify.yml|配置/项目资源|全文|
|.gitignore|配置/项目资源|全文|
|AGENTS.md|文档/图示|全文|
|DESIGN.md|文档/图示|未逐字|
|README.md|文档/图示|未逐字|
|SECURITY.md|文档/图示|全文|
|THIRD_PARTY_NOTICES.md|文档/图示|未逐字|
|apps/api/.dockerignore|配置/项目资源|全文|
|apps/api/.env.example|配置/项目资源|全文|
|apps/api/.gitignore|配置/项目资源|全文|
|apps/api/Dockerfile|配置/项目资源|全文|
|apps/api/certificates/apple/AppleIncRootCertificate.cer|二进制/字体/证书/资源包|未逐字|
|apps/api/certificates/apple/AppleRootCA-G2.cer|二进制/字体/证书/资源包|未逐字|
|apps/api/certificates/apple/AppleRootCA-G3.cer|二进制/字体/证书/资源包|未逐字|
|apps/api/migrations/0001_initial.sql|程序/样式源码|全文|
|apps/api/migrations/0002_auth_planner_policy.sql|程序/样式源码|全文|
|apps/api/migrations/0003_runtime_least_privilege.sql|程序/样式源码|全文|
|apps/api/migrations/0004_auth_column_privileges.sql|程序/样式源码|全文|
|apps/api/migrations/0005_oidc_identity_sessions.sql|程序/样式源码|全文|
|apps/api/migrations/0006_tighten_auth_privileges.sql|程序/样式源码|全文|
|apps/api/migrations/0007_limit_auth_transaction_reads.sql|程序/样式源码|全文|
|apps/api/migrations/0008_trusted_contact_revocation.sql|程序/样式源码|全文|
|apps/api/migrations/0009_native_bearer_sessions.sql|程序/样式源码|全文|
|apps/api/migrations/0010_printable_start_here.sql|程序/样式源码|全文|
|apps/api/migrations/0011_start_here_preview_commitment.sql|程序/样式源码|全文|
|apps/api/migrations/0012_encrypted_start_here.sql|程序/样式源码|全文|
|apps/api/migrations/0013_recipient_rehearsals.sql|程序/样式源码|全文|
|apps/api/migrations/0014_recipient_rehearsal_acceptance_read.sql|程序/样式源码|全文|
|apps/api/migrations/0015_recipient_rehearsal_planner_context.sql|程序/样式源码|全文|
|apps/api/migrations/0016_recipient_rehearsal_integrity.sql|程序/样式源码|全文|
|apps/api/migrations/0017_disclosure_rehearsals.sql|程序/样式源码|全文|
|apps/api/migrations/0018_role_assignment_policy_editor.sql|程序/样式源码|全文|
|apps/api/migrations/0019_active_role_assignment_uniqueness.sql|程序/样式源码|全文|
|apps/api/migrations/0020_privacy_filtered_product_events.sql|程序/样式源码|全文|
|apps/api/migrations/0021_nonblocking_first_use.sql|程序/样式源码|全文|
|apps/api/migrations/0022_provider_neutral_commerce.sql|程序/样式源码|全文|
|apps/api/migrations/0023_commerce_currency_precision.sql|程序/样式源码|全文|
|apps/api/migrations/0024_commerce_cross_record_integrity.sql|程序/样式源码|全文|
|apps/api/migrations/0025_stripe_test_catalog_binding.sql|程序/样式源码|全文|
|apps/api/migrations/0026_stripe_test_executor.sql|程序/样式源码|全文|
|apps/api/migrations/0027_storekit_local_test_catalog.sql|程序/样式源码|全文|
|apps/api/migrations/0028_storekit_sandbox_intake.sql|程序/样式源码|全文|
|apps/api/migrations/0029_storekit_notification_binding.sql|程序/样式源码|全文|
|apps/api/migrations/0030_storekit_sandbox_catalog_binding.sql|程序/样式源码|全文|
|apps/api/migrations/0031_versioned_legal_acceptance.sql|程序/样式源码|全文|
|apps/api/migrations/0032_auth_sessions_require_legal_acceptance.sql|程序/样式源码|全文|
|apps/api/migrations/0033_minimize_retained_legal_identity.sql|程序/样式源码|全文|
|apps/api/migrations/0034_legal_acceptance_per_client_surface.sql|程序/样式源码|全文|
|apps/api/migrations/0035_account_bound_sharing.sql|程序/样式源码|全文|
|apps/api/migrations/0036_private_matter_clears_sharing.sql|程序/样式源码|全文|
|apps/api/migrations/0037_family_maintenance.sql|程序/样式源码|全文|
|apps/api/migrations/0038_family_review_serialization.sql|程序/样式源码|全文|
|apps/api/migrations/0039_family_owner_history_retention.sql|程序/样式源码|全文|
|apps/api/migrations/0040_owner_selected_family_prices.sql|程序/样式源码|全文|
|apps/api/migrations/0041_matter_category_details.sql|程序/样式源码|全文|
|apps/api/migrations/0042_shared_detail_allowlist.sql|程序/样式源码|全文|
|apps/api/migrations/0043_export_audience.sql|程序/样式源码|全文|
|apps/api/migrations/0044_map_import_receipts.sql|程序/样式源码|全文|
|apps/api/migrations/0045_self_service_account_deletion.sql|程序/样式源码|全文|
|apps/api/migrations/0046_matter_create_receipts.sql|程序/样式源码|全文|
|apps/api/migrations/0047_map_import_setup_permissions.sql|程序/样式源码|全文|
|apps/api/migrations/0048_sharing_commercial_lifecycle.sql|程序/样式源码|全文|
|apps/api/migrations/0049_verified_entitlement_application.sql|程序/样式源码|全文|
|apps/api/migrations/0050_review_scope_revocation.sql|程序/样式源码|全文|
|apps/api/migrations/0051_sharing_replacement_and_access_clock.sql|程序/样式源码|全文|
|apps/api/migrations/0052_paid_snapshot_capture_boundaries.sql|程序/样式源码|全文|
|apps/api/migrations/0053_retroactive_cutoff_safety.sql|程序/样式源码|全文|
|apps/api/migrations/0054_saved_copy_owner_preview.sql|程序/样式源码|全文|
|apps/api/migrations/0055_validation_receipt_contract.sql|程序/样式源码|全文|
|apps/api/migrations/0056_commerce_account_access_guard.sql|程序/样式源码|全文|
|apps/api/migrations/0057_sharing_activation_rate_limit.sql|程序/样式源码|全文|
|apps/api/migrations/0058_invoice_bound_financial_state.sql|程序/样式源码|全文|
|apps/api/migrations/0059_current_stripe_test_prices.sql|程序/样式源码|全文|
|apps/api/migrations/0060_session_email_verification.sql|程序/样式源码|全文|
|apps/api/migrations/0061_owner_selected_88_80_prices.sql|程序/样式源码|全文|
|apps/api/migrations/0062_current_stripe_v3_test_prices.sql|程序/样式源码|全文|
|apps/api/migrations/0063_retire_new_monthly_offers.sql|程序/样式源码|全文|
|apps/api/migrations/0064_private_content_envelopes.sql|程序/样式源码|全文|
|apps/api/migrations/0065_content_maintenance.sql|程序/样式源码|全文|
|apps/api/migrations/0066_content_migration_representation.sql|程序/样式源码|全文|
|apps/api/migrations/0067_content_migration_grant_lookup.sql|程序/样式源码|全文|
|apps/api/migrations/0068_recovery_control_journal.sql|程序/样式源码|全文|
|apps/api/migrations/0069_recovery_status_reader.sql|程序/样式源码|全文|
|apps/api/migrations/0070_recovery_replay_privileges.sql|程序/样式源码|全文|
|apps/api/migrations/0071_purchase_consent_receipts.sql|程序/样式源码|全文|
|apps/api/migrations/0072_production_commerce_policy_read.sql|程序/样式源码|全文|
|apps/api/migrations/0073_stripe_inbox_retry_context.sql|程序/样式源码|全文|
|apps/api/migrations/0074_owner_selected_web_88_99.sql|程序/样式源码|全文|
|apps/api/migrations/0075_web_v4_stripe_test_binding.sql|程序/样式源码|全文|
|apps/api/migrations/0076_provider_grace_access_clock.sql|程序/样式源码|全文|
|apps/api/migrations/0077_apple_versioned_prices_and_receipts.sql|程序/样式源码|全文|
|apps/api/migrations/0078_verified_subscription_price_refresh.sql|程序/样式源码|全文|
|apps/api/migrations/0079_absolute_provider_grace_windows.sql|程序/样式源码|全文|
|apps/api/migrations/0080_apple_production_delivery.sql|程序/样式源码|全文|
|apps/api/migrations/0081_provider_observation_reconciliation.sql|程序/样式源码|全文|
|apps/api/migrations/0082_reconciliation_restore_index_name.sql|程序/样式源码|全文|
|apps/api/migrations/0083_apple_purchase_preflight.sql|程序/样式源码|全文|
|apps/api/migrations/0084_purchase_consent_financial_retention.sql|程序/样式源码|全文|
|apps/api/migrations/0085_active_purchase_owner.sql|程序/样式源码|全文|
|apps/api/migrations/0086_apple_review_environment.sql|程序/样式源码|全文|
|apps/api/migrations/0087_bounded_retention.sql|程序/样式源码|全文|
|apps/api/migrations/0088_independent_retention_hold_reasons.sql|程序/样式源码|全文|
|apps/api/migrations/0089_recovery_commerce_inventory.sql|程序/样式源码|全文|
|apps/api/migrations/0090_recent_authentication.sql|程序/样式源码|全文|
|apps/api/migrations/0091_reauthentication_failure_status.sql|程序/样式源码|全文|
|apps/api/package-lock.json|依赖/生成锁文件|未逐字|
|apps/api/package.json|配置/项目资源|全文|
|apps/api/src/account-data-routes.ts|程序/样式源码|全文|
|apps/api/src/account-deletion.ts|程序/样式源码|全文|
|apps/api/src/app.ts|程序/样式源码|全文|
|apps/api/src/apple-execution-context.ts|程序/样式源码|全文|
|apps/api/src/apple-price-bindings.ts|程序/样式源码|全文|
|apps/api/src/apple-price-catalog.ts|程序/样式源码|全文|
|apps/api/src/apple-production-evidence.ts|程序/样式源码|全文|
|apps/api/src/apple-production-inbox.ts|程序/样式源码|全文|
|apps/api/src/apple-production-intake.ts|程序/样式源码|全文|
|apps/api/src/apple-production-ledger.ts|程序/样式源码|全文|
|apps/api/src/apple-production-metrics.ts|程序/样式源码|全文|
|apps/api/src/apple-production-receipts.ts|程序/样式源码|全文|
|apps/api/src/apple-production-routes.ts|程序/样式源码|全文|
|apps/api/src/apple-production-runtime.ts|程序/样式源码|全文|
|apps/api/src/apple-production-secret.ts|程序/样式源码|全文|
|apps/api/src/apple-production-server-api.ts|程序/样式源码|全文|
|apps/api/src/apple-production-verification.ts|程序/样式源码|全文|
|apps/api/src/apple-purchase-catalog.ts|程序/样式源码|全文|
|apps/api/src/apple-purchase-consent.ts|程序/样式源码|全文|
|apps/api/src/apple-purchase-preflight.ts|程序/样式源码|全文|
|apps/api/src/apple-review-catalog.ts|程序/样式源码|全文|
|apps/api/src/apple-storekit-adapter.ts|程序/样式源码|全文|
|apps/api/src/apple-storekit-server-api.ts|程序/样式源码|全文|
|apps/api/src/auth-routes.ts|程序/样式源码|全文|
|apps/api/src/auth.ts|程序/样式源码|全文|
|apps/api/src/bootstrap-runtime.ts|程序/样式源码|全文|
|apps/api/src/commerce-provider-contract.ts|程序/样式源码|全文|
|apps/api/src/commerce-purchase-conflicts.ts|程序/样式源码|全文|
|apps/api/src/commerce-reconciliation.ts|程序/样式源码|全文|
|apps/api/src/commerce-routes.ts|程序/样式源码|全文|
|apps/api/src/commerce-subscription-ledger.ts|程序/样式源码|全文|
|apps/api/src/commerce-synthetic-adapters.ts|程序/样式源码|全文|
|apps/api/src/config.ts|程序/样式源码|全文|
|apps/api/src/db.ts|程序/样式源码|全文|
|apps/api/src/disclosure-policy.ts|程序/样式源码|全文|
|apps/api/src/disclosure-rehearsal-routes.ts|程序/样式源码|全文|
|apps/api/src/domain.ts|程序/样式源码|全文|
|apps/api/src/email-verification.ts|程序/样式源码|全文|
|apps/api/src/errors.ts|程序/样式源码|全文|
|apps/api/src/express.d.ts|程序/样式源码|全文|
|apps/api/src/family-maintenance-routes.ts|程序/样式源码|全文|
|apps/api/src/healthcheck.ts|程序/样式源码|全文|
|apps/api/src/identity.ts|程序/样式源码|全文|
|apps/api/src/legal-contract.ts|程序/样式源码|全文|
|apps/api/src/managed-tls.ts|程序/样式源码|全文|
|apps/api/src/matter-details.ts|程序/样式源码|全文|
|apps/api/src/migrate-private-content.ts|程序/样式源码|全文|
|apps/api/src/migrate.ts|程序/样式源码|全文|
|apps/api/src/overview.ts|程序/样式源码|全文|
|apps/api/src/planner-records.ts|程序/样式源码|全文|
|apps/api/src/private-content.ts|程序/样式源码|全文|
|apps/api/src/product-events.ts|程序/样式源码|全文|
|apps/api/src/production-review-access.ts|程序/样式源码|全文|
|apps/api/src/purchase-consent.ts|程序/样式源码|全文|
|apps/api/src/rate-limit-key.ts|程序/样式源码|全文|
|apps/api/src/reauthentication.ts|程序/样式源码|全文|
|apps/api/src/recent-authentication.ts|程序/样式源码|全文|
|apps/api/src/recipient-rehearsal-routes.ts|程序/样式源码|全文|
|apps/api/src/recovery-admin.ts|程序/样式源码|全文|
|apps/api/src/recovery-commerce-admin.ts|程序/样式源码|全文|
|apps/api/src/recovery-commerce-readers.ts|程序/样式源码|全文|
|apps/api/src/recovery-commerce.ts|程序/样式源码|全文|
|apps/api/src/recovery-journal.ts|程序/样式源码|全文|
|apps/api/src/recovery-replay.ts|程序/样式源码|全文|
|apps/api/src/retention-admin.ts|程序/样式源码|全文|
|apps/api/src/retention-holds.ts|程序/样式源码|全文|
|apps/api/src/retention.ts|程序/样式源码|全文|
|apps/api/src/role-assignment-routes.ts|程序/样式源码|全文|
|apps/api/src/routes.ts|程序/样式源码|全文|
|apps/api/src/security.ts|程序/样式源码|全文|
|apps/api/src/seed-dev.ts|程序/样式源码|全文|
|apps/api/src/server.ts|程序/样式源码|全文|
|apps/api/src/sharing-identity.ts|程序/样式源码|全文|
|apps/api/src/sharing-routes.ts|程序/样式源码|全文|
|apps/api/src/storekit-sandbox-intake.ts|程序/样式源码|全文|
|apps/api/src/storekit-sandbox-routes.ts|程序/样式源码|全文|
|apps/api/src/stripe-commerce-executor.ts|程序/样式源码|全文|
|apps/api/src/stripe-commerce-routes.ts|程序/样式源码|全文|
|apps/api/src/stripe-execution-config.ts|程序/样式源码|全文|
|apps/api/src/stripe-financial-resolution.ts|程序/样式源码|全文|
|apps/api/src/stripe-production-adapter.ts|程序/样式源码|全文|
|apps/api/src/stripe-production-routes.ts|程序/样式源码|全文|
|apps/api/src/stripe-production-secret.ts|程序/样式源码|全文|
|apps/api/src/stripe-provider-shared.ts|程序/样式源码|全文|
|apps/api/src/stripe-recovery-financial-state.ts|程序/样式源码|全文|
|apps/api/src/stripe-sdk.ts|程序/样式源码|全文|
|apps/api/src/stripe-test-adapter.ts|程序/样式源码|全文|
|apps/api/tests/api.integration.test.ts|测试代码|全文|
|apps/api/tests/apple-commerce.integration.test.ts|测试代码|全文|
|apps/api/tests/apple-price-bindings.test.ts|测试代码|全文|
|apps/api/tests/apple-production-intake.integration.test.ts|测试代码|全文|
|apps/api/tests/apple-production-runtime.test.ts|测试代码|全文|
|apps/api/tests/apple-production-server-api.test.ts|测试代码|全文|
|apps/api/tests/apple-production-verification.test.ts|测试代码|全文|
|apps/api/tests/apple-purchase-preflight.integration.test.ts|测试代码|全文|
|apps/api/tests/apple-review.integration.test.ts|测试代码|全文|
|apps/api/tests/apple-storekit-adapter.test.ts|测试代码|全文|
|apps/api/tests/apple-storekit-server-api.test.ts|测试代码|全文|
|apps/api/tests/bootstrap-runtime.test.ts|测试代码|全文|
|apps/api/tests/commerce-provider-adapters.test.ts|测试代码|全文|
|apps/api/tests/config.test.ts|测试代码|全文|
|apps/api/tests/content-test-keys.ts|测试代码|全文|
|apps/api/tests/email-verification.integration.test.ts|测试代码|全文|
|apps/api/tests/email-verification.test.ts|测试代码|全文|
|apps/api/tests/family-maintenance.integration.test.ts|测试代码|全文|
|apps/api/tests/http-fixture.ts|测试代码|全文|
|apps/api/tests/http-test-isolation.ts|测试代码|全文|
|apps/api/tests/identity-proof.test.ts|测试代码|全文|
|apps/api/tests/legal-contract.test.ts|测试代码|全文|
|apps/api/tests/managed-tls.test.ts|测试代码|全文|
|apps/api/tests/matter-details.integration.test.ts|测试代码|全文|
|apps/api/tests/p1-repair.integration.test.ts|测试代码|全文|
|apps/api/tests/private-content-kms.test.ts|测试代码|全文|
|apps/api/tests/private-content-migration.integration.test.ts|测试代码|全文|
|apps/api/tests/private-content.integration.test.ts|测试代码|全文|
|apps/api/tests/production-closed.test.ts|测试代码|全文|
|apps/api/tests/production-commerce.integration.test.ts|测试代码|全文|
|apps/api/tests/production-purchase-contract.test.ts|测试代码|全文|
|apps/api/tests/production-review-access.integration.test.ts|测试代码|全文|
|apps/api/tests/rate-limit-key.test.ts|测试代码|全文|
|apps/api/tests/recent-authentication.integration.test.ts|测试代码|全文|
|apps/api/tests/recovery-commerce.integration.test.ts|测试代码|全文|
|apps/api/tests/recovery-journal.integration.test.ts|测试代码|全文|
|apps/api/tests/request-logging.test.ts|测试代码|全文|
|apps/api/tests/retention.integration.test.ts|测试代码|全文|
|apps/api/tests/security-cors.test.ts|测试代码|全文|
|apps/api/tests/sharing-lifecycle.integration.test.ts|测试代码|全文|
|apps/api/tests/sharing.integration.test.ts|测试代码|全文|
|apps/api/tests/stripe-production-adapter.test.ts|测试代码|全文|
|apps/api/tests/stripe-recovery-financial-state.test.ts|测试代码|全文|
|apps/api/tests/stripe-test-adapter.test.ts|测试代码|全文|
|apps/api/tsconfig.build.json|配置/项目资源|全文|
|apps/api/tsconfig.json|配置/项目资源|全文|
|apps/api/vitest.config.ts|程序/样式源码|全文|
|apps/ios-prototype/.gitignore|配置/项目资源|全文|
|apps/ios-prototype/.openai/hosting.json|配置/项目资源|全文|
|apps/ios-prototype/AGENTS.md|文档/图示|全文|
|apps/ios-prototype/index.html|程序/样式源码|全文|
|apps/ios-prototype/mobile-runtime.lock.json|依赖/生成锁文件|未逐字|
|apps/ios-prototype/package-lock.json|依赖/生成锁文件|未逐字|
|apps/ios-prototype/package.json|配置/项目资源|全文|
|apps/ios-prototype/playwright.config.ts|程序/样式源码|全文|
|apps/ios-prototype/public/assets/android/Keyboard.png|二进制/字体/证书/资源包|未逐字|
|apps/ios-prototype/public/assets/android/Pixel10.png|二进制/字体/证书/资源包|未逐字|
|apps/ios-prototype/public/assets/android/navigation-bar.svg|静态素材/许可正文|未逐字|
|apps/ios-prototype/public/assets/iphone/Bezel.png|二进制/字体/证书/资源包|未逐字|
|apps/ios-prototype/public/assets/iphone/Keyboard.png|二进制/字体/证书/资源包|未逐字|
|apps/ios-prototype/public/assets/status/ios-status-icons.svg|静态素材/许可正文|未逐字|
|apps/ios-prototype/public/assets/status/status-icons.svg|静态素材/许可正文|未逐字|
|apps/ios-prototype/scripts/check-mobile-runtime.mjs|程序/样式源码|全文|
|apps/ios-prototype/scripts/prepare-sites-build.mjs|程序/样式源码|全文|
|apps/ios-prototype/scripts/update-mobile-runtime-lock.mjs|程序/样式源码|全文|
|apps/ios-prototype/src/App.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/Prototype.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/main.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/BottomSheet.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/COMPONENTS.md|文档/图示|全文|
|apps/ios-prototype/src/mobile/Carousel.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/Device.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/FlowStack.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/Keyboard.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/MobileCursor.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/MobileRuntime.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/MobileScroll.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/PhoneFrame.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/assets.ts|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/components.tsx|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/geometry.ts|程序/样式源码|全文|
|apps/ios-prototype/src/mobile/index.ts|程序/样式源码|全文|
|apps/ios-prototype/src/prototype.css|程序/样式源码|全文|
|apps/ios-prototype/src/styles.css|程序/样式源码|全文|
|apps/ios-prototype/src/vite-env.d.ts|程序/样式源码|全文|
|apps/ios-prototype/tests/mobile-runtime.spec.ts|测试代码|全文|
|apps/ios-prototype/tests/navigation.spec.ts|测试代码|全文|
|apps/ios-prototype/tests/runtime-fixture.css|测试代码|全文|
|apps/ios-prototype/tests/runtime-fixture.html|测试代码|全文|
|apps/ios-prototype/tests/runtime-fixture.tsx|测试代码|全文|
|apps/ios-prototype/tests/sites-worker.test.mjs|测试代码|全文|
|apps/ios-prototype/tsconfig.json|配置/项目资源|全文|
|apps/ios-prototype/vite.config.ts|程序/样式源码|全文|
|apps/ios-prototype/worker/index.js|程序/样式源码|全文|
|apps/ios/.gitignore|配置/项目资源|全文|
|apps/ios/Rillora/App/AppDependencies.swift|程序/样式源码|全文|
|apps/ios/Rillora/App/AppShellView.swift|程序/样式源码|全文|
|apps/ios/Rillora/App/AppTab.swift|程序/样式源码|全文|
|apps/ios/Rillora/App/RilloraApp.swift|程序/样式源码|全文|
|apps/ios/Rillora/App/UITestPresentationFixtures.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/API/APIClient.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/API/APIConfiguration.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/API/HTTPTransport.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/API/RilloraAPIError.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/AuthenticationStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/HostedLegalAcceptanceProof.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/LegalConsentContract.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/NativeAuthenticationCallback.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/NativeAuthenticationService.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/NativeReauthenticationPrompt.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/SessionStorageNamespace.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Authentication/SessionTokenStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/ApplePurchaseCoordinator.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/ApplePurchaseServing.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/CommerceStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/CommerceStorefrontProvider.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/RilloraStoreKitCatalog.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Commerce/StoreKitClient.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/AppAppearance.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraBrand.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraInteractionComponents.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraLibraryEffects.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraSharingMotion.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraSurfaceMotion.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Design/RilloraTheme.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/AccountDataModels.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/ApplePurchaseModels.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/CommerceModels.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/FamilyMaintenanceModels.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/MatterDetailFields.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/Models.swift|程序/样式源码|全文|
|apps/ios/Rillora/Core/Domain/SharingModels.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/AccountDataView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/AccountDeletionView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/AccountView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/ApplePurchaseEntryView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/ApplePurchaseSection.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/AuthenticatedProfileContent.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/PlanAccessView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/ProfileDashboardComponents.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/ProfileSupportViews.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Account/StoreKitSandboxCatalogView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/ContactSharingStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/ContactSharingView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/InvitationAcceptView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/MatterPeopleSection.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/SharedAccessStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/SharedWithMeView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/SharingPreviewContent.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/TrustedContactEditorStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Contacts/TrustedContactEditorView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/FirstUse/FirstUseGuideStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/FirstUse/FirstUseViews.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Maintenance/FamilyMaintenanceStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Maintenance/FamilyMaintenanceView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Maintenance/FamilyReviewSheetView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Matters/MatterEditorStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Matters/MatterEditorView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Matters/MattersView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/OfficialSetup/MatterAccountGuides.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/OfficialSetup/OfficialProviderGuideCatalog.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/OfficialSetup/OfficialSetupStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/OfficialSetup/OfficialSetupView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/ContinuityExplorer.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/OverviewDashboardComponents.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/OverviewStateViews.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/OverviewStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/OverviewView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/PreviewFixtures.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/PublicHomeAppearance.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/PublicHomeSharingDemo.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/PublicHomeView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Overview/SignedOutExperienceViews.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Plan/PlanMotivationStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Plan/PlanMotivationView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Roles/RoleAssignmentPolicyStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Roles/RoleAssignmentPolicyView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Simulation/DisclosureRehearsalStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Simulation/DisclosureRehearsalView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Simulation/SimulationStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/Simulation/SimulationView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/StartHere/RecipientRehearsalStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/StartHere/StartHereEncryptionService.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/StartHere/StartHerePreviewStore.swift|程序/样式源码|全文|
|apps/ios/Rillora/Features/StartHere/StartHerePreviewView.swift|程序/样式源码|全文|
|apps/ios/Rillora/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/AppIcon.appiconset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/CoinbaseLogo.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/CoinbaseLogo.imageset/coinbase-logo-white.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/ContinuityGuide.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/ContinuityGuide.imageset/guide.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/ContinuityMap.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/ContinuityMap.imageset/continuity-map.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/DropboxGlyph.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/DropboxGlyph.imageset/dropbox-glyph.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/FacebookLogo.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/FacebookLogo.imageset/facebook-primary.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GitHubInvertocat.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GitHubInvertocat.imageset/github-invertocat-white.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GoogleGLogo.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GoogleGLogo.imageset/google-g-logo.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GoogleGLogo.imageset/[REDACTED_EMAIL]|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/GoogleGLogo.imageset/[REDACTED_EMAIL]|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/InstagramGlyph.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/InstagramGlyph.imageset/instagram-glyph-white.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/LaunchBackground.colorset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/PublicHomeHero.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/PublicHomeHero.imageset/dark.jpg|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/PublicHomeHero.imageset/light.jpg|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraBrandCompact.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraBrandCompact.imageset/lockup-small-reversed.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraBrandLockup.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraBrandLockup.imageset/lockup-reversed.svg|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraFolio.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraFolio.imageset/rillora-folio.jpg|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraFolioCutout.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/RilloraFolioCutout.imageset/folio-cutout.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/XLogo.imageset/Contents.json|配置/项目资源|未逐字|
|apps/ios/Rillora/Resources/Assets.xcassets/XLogo.imageset/x-logo-white.png|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/DesignCredits.txt|静态素材/许可正文|未逐字|
|apps/ios/Rillora/Resources/Fonts/GoogleSans-SemiBold.ttf|二进制/字体/证书/资源包|未逐字|
|apps/ios/Rillora/Resources/Info.plist|配置/项目资源|全文|
|apps/ios/Rillora/Resources/PrivacyInfo.xcprivacy|配置/项目资源|全文|
|apps/ios/Rillora/Rillora.entitlements|配置/项目资源|全文|
|apps/ios/RilloraComponentPreview/ApplePurchaseLayoutPreview.swift|程序/样式源码|全文|
|apps/ios/RilloraComponentPreview/Info.plist|配置/项目资源|全文|
|apps/ios/RilloraComponentPreview/RilloraComponentPreviewApp.swift|程序/样式源码|全文|
|apps/ios/RilloraLayoutMatrixTests/RilloraJourneyAuditTests.swift|测试代码|全文|
|apps/ios/RilloraLayoutMatrixTests/RilloraLayoutMatrixTests.swift|测试代码|全文|
|apps/ios/RilloraTests/APIClientTests.swift|测试代码|全文|
|apps/ios/RilloraTests/AccountDataTests.swift|测试代码|全文|
|apps/ios/RilloraTests/AppAppearanceTests.swift|测试代码|全文|
|apps/ios/RilloraTests/ApplePurchaseCoordinatorTests.swift|测试代码|全文|
|apps/ios/RilloraTests/AppleStoreKitClientTests.swift|测试代码|全文|
|apps/ios/RilloraTests/CommerceStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/ContactSharingStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/DisclosureRehearsalStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/FamilyMaintenanceTests.swift|测试代码|全文|
|apps/ios/RilloraTests/FirstUseGuideStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/Fixtures/provider-guide-match-cases.json|配置/项目资源|全文|
|apps/ios/RilloraTests/HostedLegalAcceptanceProofTests.swift|测试代码|全文|
|apps/ios/RilloraTests/MatterEditorStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/NativeAuthenticationCallbackTests.swift|测试代码|全文|
|apps/ios/RilloraTests/OfficialProviderGuideCatalogTests.swift|测试代码|全文|
|apps/ios/RilloraTests/OfficialSetupStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/OverviewStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/PlanMotivationStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/ProductionConnectionTests.swift|测试代码|全文|
|apps/ios/RilloraTests/RoleAssignmentPolicyStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/SharedAccessStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/SharingPreviewTests.swift|测试代码|全文|
|apps/ios/RilloraTests/SharingTests.swift|测试代码|全文|
|apps/ios/RilloraTests/SimulationStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/StartHereEncryptionServiceTests.swift|测试代码|全文|
|apps/ios/RilloraTests/StartHerePreviewStoreTests.swift|测试代码|全文|
|apps/ios/RilloraTests/TrustedContactEditorStoreTests.swift|测试代码|全文|
|apps/ios/StoreKit/Rillora.storekit|配置/项目资源|全文|
|apps/ios/project.yml|配置/项目资源|全文|
|apps/web/.env.example|配置/项目资源|全文|
|apps/web/.gitignore|配置/项目资源|全文|
|apps/web/.openai/hosting.json|配置/项目资源|全文|
|apps/web/AGENTS.md|文档/图示|全文|
|apps/web/index.html|程序/样式源码|全文|
|apps/web/legal.html|程序/样式源码|全文|
|apps/web/package-lock.json|依赖/生成锁文件|未逐字|
|apps/web/package.json|配置/项目资源|全文|
|apps/web/public.html|程序/样式源码|全文|
|apps/web/scripts/appearance-bootstrap.mjs|程序/样式源码|全文|
|apps/web/scripts/prepare-legal-sites-build.mjs|程序/样式源码|全文|
|apps/web/scripts/prepare-production-build.mjs|程序/样式源码|全文|
|apps/web/scripts/prepare-public-build.mjs|程序/样式源码|全文|
|apps/web/scripts/prepare-sites-build.mjs|程序/样式源码|全文|
|apps/web/scripts/preview-public.mjs|程序/样式源码|全文|
|apps/web/scripts/validate-legal-release.mjs|程序/样式源码|全文|
|apps/web/src/AccountDataPanel.jsx|程序/样式源码|全文|
|apps/web/src/AccountDeletionStatus.jsx|程序/样式源码|全文|
|apps/web/src/App.jsx|程序/样式源码|全文|
|apps/web/src/AppearanceControl.jsx|程序/样式源码|全文|
|apps/web/src/ConfirmationDialog.jsx|程序/样式源码|全文|
|apps/web/src/ContactEditorPanel.jsx|程序/样式源码|全文|
|apps/web/src/ContinuityExplorer.jsx|程序/样式源码|全文|
|apps/web/src/DisclosureRehearsalPanel.jsx|程序/样式源码|全文|
|apps/web/src/FamilyMaintenancePanel.jsx|程序/样式源码|全文|
|apps/web/src/FirstUsePanel.jsx|程序/样式源码|全文|
|apps/web/src/InvitationPage.jsx|程序/样式源码|全文|
|apps/web/src/LegalDocumentPage.jsx|程序/样式源码|全文|
|apps/web/src/LegalPublicationApp.jsx|程序/样式源码|全文|
|apps/web/src/MatterAccountGuides.jsx|程序/样式源码|全文|
|apps/web/src/MatterForm.jsx|程序/样式源码|全文|
|apps/web/src/PlatformGuides.jsx|程序/样式源码|全文|
|apps/web/src/ProductionBillingControls.jsx|程序/样式源码|全文|
|apps/web/src/ProviderMark.jsx|程序/样式源码|全文|
|apps/web/src/PublicExperience.jsx|程序/样式源码|全文|
|apps/web/src/PublicHome.jsx|程序/样式源码|全文|
|apps/web/src/PublicWebsite.jsx|程序/样式源码|全文|
|apps/web/src/ReauthenticationPrompt.jsx|程序/样式源码|全文|
|apps/web/src/RilloraBrand.jsx|程序/样式源码|全文|
|apps/web/src/RoleAssignmentPolicyPanel.jsx|程序/样式源码|全文|
|apps/web/src/SavedCopyReader.jsx|程序/样式源码|全文|
|apps/web/src/SharingMotion.jsx|程序/样式源码|全文|
|apps/web/src/SharingPanels.jsx|程序/样式源码|全文|
|apps/web/src/StartHerePanel.jsx|程序/样式源码|全文|
|apps/web/src/SurfaceMotion.jsx|程序/样式源码|全文|
|apps/web/src/TaskPanels.jsx|程序/样式源码|全文|
|apps/web/src/TestBillingControls.jsx|程序/样式源码|全文|
|apps/web/src/WebsiteAppearanceDisclosure.jsx|程序/样式源码|全文|
|apps/web/src/accountDeletionClient.js|程序/样式源码|全文|
|apps/web/src/api.js|程序/样式源码|全文|
|apps/web/src/appearance-control.css|程序/样式源码|全文|
|apps/web/src/appearance.css|程序/样式源码|全文|
|apps/web/src/appearanceLink.js|程序/样式源码|全文|
|apps/web/src/assets/brand/apple-touch-icon.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/brand/favicon-32.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/brand/favicon.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/brand/lockup-primary.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/brand/lockup-reversed.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/brand/lockup-small-reversed.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/brand/symbol-paper.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/continuity-guide.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/continuity-map.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/design-credits.txt|静态素材/许可正文|未逐字|
|apps/web/src/assets/font-licenses.txt|静态素材/许可正文|未逐字|
|apps/web/src/assets/illustrations/rillora-folio-cutout.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/illustrations/rillora-folio.jpg|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/folio-paper.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/folio-transparent.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/guidance-map.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/hero-dark.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/hero-still-life.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/landing/rillora-sharing-example.txt|静态素材/许可正文|未逐字|
|apps/web/src/assets/landing/sharing-folio.webp|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/official-brands/coinbase-logo-white.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/official-brands/dropbox-glyph.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/official-brands/facebook-primary.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/assets/official-brands/github-invertocat-white.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/official-brands/instagram-glyph-white.svg|静态素材/许可正文|未逐字|
|apps/web/src/assets/official-brands/x-logo-white.png|二进制/字体/证书/资源包|未逐字|
|apps/web/src/authenticated-motion.css|程序/样式源码|全文|
|apps/web/src/brand.css|程序/样式源码|全文|
|apps/web/src/commercialAccess.js|程序/样式源码|全文|
|apps/web/src/contactEvidence.js|程序/样式源码|全文|
|apps/web/src/continuity-explorer.css|程序/样式源码|全文|
|apps/web/src/family-maintenance.css|程序/样式源码|全文|
|apps/web/src/familyMaintenance.js|程序/样式源码|全文|
|apps/web/src/firstUse.js|程序/样式源码|全文|
|apps/web/src/guideAccess.js|程序/样式源码|全文|
|apps/web/src/guideIdentifiers.js|程序/样式源码|全文|
|apps/web/src/interaction-refinement.css|程序/样式源码|全文|
|apps/web/src/landing/AppearanceControl.jsx|程序/样式源码|全文|
|apps/web/src/landing/ControlSection.jsx|程序/样式源码|全文|
|apps/web/src/landing/ExampleMatter.jsx|程序/样式源码|全文|
|apps/web/src/landing/LandingChrome.jsx|程序/样式源码|全文|
|apps/web/src/landing/LandingFAQ.jsx|程序/样式源码|全文|
|apps/web/src/landing/LandingMotion.jsx|程序/样式源码|全文|
|apps/web/src/landing/LandingPage.jsx|程序/样式源码|全文|
|apps/web/src/landing/LegalInformation.jsx|程序/样式源码|全文|
|apps/web/src/landing/LifeSituations.jsx|程序/样式源码|全文|
|apps/web/src/landing/MatterDemo.jsx|程序/样式源码|全文|
|apps/web/src/landing/PlanSection.jsx|程序/样式源码|全文|
|apps/web/src/landing/ProductPages.jsx|程序/样式源码|全文|
|apps/web/src/landing/PublicFragmentNavigation.jsx|程序/样式源码|全文|
|apps/web/src/landing/SharingDemo.jsx|程序/样式源码|全文|
|apps/web/src/landing/landing-base.css|程序/样式源码|全文|
|apps/web/src/landing/landing-details.css|程序/样式源码|全文|
|apps/web/src/landing/landing-pages.css|程序/样式源码|全文|
|apps/web/src/landing/landing-responsive.css|程序/样式源码|全文|
|apps/web/src/landing/landing-sharing.css|程序/样式源码|全文|
|apps/web/src/landing/landing-story.css|程序/样式源码|全文|
|apps/web/src/landing/landing-theme.css|程序/样式源码|全文|
|apps/web/src/landing/landing.css|程序/样式源码|全文|
|apps/web/src/landing/landingModel.js|程序/样式源码|全文|
|apps/web/src/landing/matterExamples.js|程序/样式源码|全文|
|apps/web/src/legal-main.jsx|程序/样式源码|全文|
|apps/web/src/legalContract.js|程序/样式源码|全文|
|apps/web/src/main.jsx|程序/样式源码|全文|
|apps/web/src/matterDraftStorage.js|程序/样式源码|全文|
|apps/web/src/matterForm.js|程序/样式源码|全文|
|apps/web/src/mobileNavigation.js|程序/样式源码|全文|
|apps/web/src/officialProviderGuides.js|程序/样式源码|全文|
|apps/web/src/platform-guides.css|程序/样式源码|全文|
|apps/web/src/productionBilling.js|程序/样式源码|全文|
|apps/web/src/public-experience.css|程序/样式源码|全文|
|apps/web/src/public-main.jsx|程序/样式源码|全文|
|apps/web/src/public-website.css|程序/样式源码|全文|
|apps/web/src/publicEntry.js|程序/样式源码|全文|
|apps/web/src/publicIntent.js|程序/样式源码|全文|
|apps/web/src/publicRoutes.js|程序/样式源码|全文|
|apps/web/src/savedCopy.js|程序/样式源码|全文|
|apps/web/src/sharing.css|程序/样式源码|全文|
|apps/web/src/sharing.js|程序/样式源码|全文|
|apps/web/src/startHereCrypto.js|程序/样式源码|全文|
|apps/web/src/styles.css|程序/样式源码|全文|
|apps/web/src/surface-motion.css|程序/样式源码|全文|
|apps/web/src/websiteAppearance.js|程序/样式源码|全文|
|apps/web/src/workspaceNavigation.js|程序/样式源码|全文|
|apps/web/tests/api-client.test.mjs|测试代码|全文|
|apps/web/tests/appearance-contrast.test.mjs|测试代码|全文|
|apps/web/tests/commercial-access.test.mjs|测试代码|全文|
|apps/web/tests/contact-evidence.test.mjs|测试代码|全文|
|apps/web/tests/family-maintenance.test.mjs|测试代码|全文|
|apps/web/tests/first-use.test.mjs|测试代码|全文|
|apps/web/tests/landing-model.test.mjs|测试代码|全文|
|apps/web/tests/legal-sites-worker.test.mjs|测试代码|全文|
|apps/web/tests/matter-draft-storage.test.mjs|测试代码|全文|
|apps/web/tests/matter-form.test.mjs|测试代码|全文|
|apps/web/tests/mobile-navigation.test.mjs|测试代码|全文|
|apps/web/tests/official-provider-guides.test.mjs|测试代码|全文|
|apps/web/tests/production-billing.test.mjs|测试代码|全文|
|apps/web/tests/production-router.test.mjs|测试代码|全文|
|apps/web/tests/public-experience.test.mjs|测试代码|全文|
|apps/web/tests/public-intent.test.mjs|测试代码|全文|
|apps/web/tests/public-website.test.mjs|测试代码|全文|
|apps/web/tests/saved-copy.test.mjs|测试代码|全文|
|apps/web/tests/sharing-preview.test.mjs|测试代码|全文|
|apps/web/tests/sharing.test.mjs|测试代码|全文|
|apps/web/tests/sites-worker.test.mjs|测试代码|全文|
|apps/web/tests/start-here-crypto.test.mjs|测试代码|全文|
|apps/web/tests/website-appearance.test.mjs|测试代码|全文|
|apps/web/tests/workspace-navigation.test.mjs|测试代码|全文|
|apps/web/vite.config.mjs|程序/样式源码|全文|
|apps/web/worker/index.js|程序/样式源码|全文|
|apps/web/worker/legal-index.js|程序/样式源码|全文|
|apps/web/worker/production-router.js|程序/样式源码|全文|
|apps/web/worker/public-router.js|程序/样式源码|全文|
|assets/brand/rillora-approved-brand-20260919.zip|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-approved-brand-20260920.zip|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-approved-brand-20260928.zip|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/Inter-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/README.md|文档/图示|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/Source-Serif-4-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-clay.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-clay.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-dark.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-dark.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-light.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/app-icon-light.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/comparison.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/comparison.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/favicon-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/favicon.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/hero.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/hero.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/identity-board.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/identity-board.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/lockup-primary.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/lockup-primary.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/lockup-white.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/lockup-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/manifest.json|配置/项目资源|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/optical-proof.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/optical-proof.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-128.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-16.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-24.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-256.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-512.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-64.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-black.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-clay.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-ink.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-micro.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/symbol-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/wordmark-ink.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/wordmark-ink.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-02-open-folio-20260919/wordmark-source.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/README.md|文档/图示|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/Source-Serif-4-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-bronze.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-bronze.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-dark.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-dark.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-light.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/app-icon-light.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/comparison.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/comparison.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/favicon-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/favicon.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/hero.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/hero.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/identity-board.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/identity-board.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/lockup-primary.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/lockup-primary.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/lockup-white.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/lockup-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/manifest.json|配置/项目资源|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/optical-proof.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/optical-proof.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-128.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-16.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-24.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-256.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-512.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-64.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-black.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-forest.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-micro.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/symbol-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/wordmark-forest.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/wordmark-forest.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-03-legacy-imprint-20260919/wordmark-source.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-05-line-tree-20260919/README.md|文档/图示|未逐字|
|assets/brand/rillora-identity-05-line-tree-20260919/line-tree-study.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-05-line-tree-20260919/manifest.json|配置/项目资源|未逐字|
|assets/brand/rillora-identity-05-line-tree-20260919/prompt.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/README.md|文档/图示|未逐字|
|assets/brand/rillora-identity-20260919/Source-Serif-4-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-dark.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-dark.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-light.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-light.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-tinted.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/app-icon-tinted.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/favicon-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/favicon.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/hero.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/hero.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/identity-board.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/identity-board.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/lockup-pine.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/lockup-pine.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/lockup-white.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/lockup-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/manifest.json|配置/项目资源|未逐字|
|assets/brand/rillora-identity-20260919/optical-proof.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/optical-proof.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/symbol-128.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-16.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-24.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-256.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-512.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-64.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/symbol-black.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/symbol-micro.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/symbol-pine.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/symbol-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/wordmark-pine.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora-identity-20260919/wordmark-pine.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora-identity-20260919/wordmark-source.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/Inter-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora/README.md|文档/图示|未逐字|
|assets/brand/rillora/Source-Serif-4-Adobe-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora/Source-Serif-4-Google-Fonts-OFL.txt|静态素材/许可正文|未逐字|
|assets/brand/rillora/app-icon-bronze.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/app-icon-bronze.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/app-icon-dark.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/app-icon-dark.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/app-icon-light.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/app-icon-light.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/favicon-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/favicon.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/font-license-sources.json|配置/项目资源|未逐字|
|assets/brand/rillora/identity-board.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/identity-board.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/lockup-primary.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/lockup-primary.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/lockup-reversed.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/lockup-small-reversed.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/lockup-white.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/lockup-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/manifest.json|配置/项目资源|未逐字|
|assets/brand/rillora/optical-proof.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/optical-proof.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/symbol-128.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-16.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-24.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-256.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-32.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-512.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-64.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/symbol-black.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/symbol-forest.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/symbol-micro.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/symbol-white.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/wordmark-forest.png|二进制/字体/证书/资源包|未逐字|
|assets/brand/rillora/wordmark-forest.svg|静态素材/许可正文|未逐字|
|assets/brand/rillora/wordmark-source.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-authenticated-motion-20260911/README.md|文档/图示|未逐字|
|assets/concepts/rillora-authenticated-motion-20260911/connected-circle.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-authenticated-motion-20260911/folio-asset.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-authenticated-motion-20260911/living-map.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-authenticated-motion-20260911/prepared-folio.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-dark-ui-20260815/DG-01-public-continuity.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-dark-ui-20260815/DG-02-private-map.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-dark-ui-20260815/DG-03-guided-preparation.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-dark-ui-20260815/DG-04-rehearsal-export.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v2/folio-paper.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v2/implementation-target.md|文档/图示|未逐字|
|assets/concepts/rillora-landing-20260928-v2/organise.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v2/people-control.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v2/plans-faq.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v2/prompts.json|配置/项目资源|未逐字|
|assets/concepts/rillora-landing-20260928-v3/dark-concept.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v3/folio-transparent.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v3/hero-dark.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928-v3/implementation-target.md|文档/图示|未逐字|
|assets/concepts/rillora-landing-20260928-v3/prompts.json|配置/项目资源|未逐字|
|assets/concepts/rillora-landing-20260928/guidance-concept.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928/hero-art.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928/hero-concept.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928/prompts.json|配置/项目资源|未逐字|
|assets/concepts/rillora-landing-20260928/sharing-concept.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-landing-20260928/sharing-folio.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/README.md|文档/图示|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/a1-quiet.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/a2-measured.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/a3-embrace.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/a4-deep.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/b1-early.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/b2-lifted.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/b3-settled.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/b4-late.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/c1-pronounced.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/c2-weighted.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/c3-unequal.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/c4-maximum.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/gate2-review-board.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/gate2-review-board.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/gate2-shortlist-board.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/gate2-shortlist-board.svg|静态素材/许可正文|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/manifest.json|配置/项目资源|未逐字|
|assets/concepts/rillora-logo-gate2-dual-embrace-20260808/qa-report.json|配置/项目资源|未逐字|
|assets/concepts/rillora-public-motion-20260909/README.md|文档/图示|未逐字|
|assets/concepts/rillora-public-motion-20260909/continuity-guide.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-public-motion-20260909/continuity-map.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-public-motion-20260909/deep-pages-prompt.txt|静态素材/许可正文|未逐字|
|assets/concepts/rillora-public-motion-20260909/deep-pages-rejected.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-public-motion-20260909/deep-pages-v2-prompt.txt|静态素材/许可正文|未逐字|
|assets/concepts/rillora-public-motion-20260909/deep-pages-v2.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-public-motion-20260909/guide-asset-prompt.txt|静态素材/许可正文|未逐字|
|assets/concepts/rillora-public-motion-20260909/map-asset-prompt.txt|静态素材/许可正文|未逐字|
|assets/concepts/rillora-public-motion-20260909/reference-storyboard.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-trusted-sharing-20260909/README.md|文档/图示|未逐字|
|assets/concepts/rillora-trusted-sharing-20260909/interaction-reference.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-ui-directions-20260814/AI-01-architectural-index.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-ui-directions-20260814/AI-02-architectural-index-long-page-blueprint.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-ui-directions-20260814/NM-01-night-map.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-ui-directions-20260814/PF-01-private-folio.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/rillora-ui-directions-20260814/README.md|文档/图示|未逐字|
|assets/concepts/visual-directions-20260804/01-calm-continuity.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/visual-directions-20260804/02-private-ledger.png|二进制/字体/证书/资源包|未逐字|
|assets/concepts/visual-directions-20260804/03-trusted-circle.png|二进制/字体/证书/资源包|未逐字|
|assets/illustrations/rillora-folio-cutout-20260929/README.md|文档/图示|未逐字|
|assets/illustrations/rillora-folio-cutout-20260929/folio-cutout.png|二进制/字体/证书/资源包|未逐字|
|config/app-store-listing.en-US.json|配置/项目资源|全文|
|config/automation-registry.json|配置/项目资源|全文|
|config/brand.json|配置/项目资源|全文|
|config/content-program.json|配置/项目资源|全文|
|config/manual-snapshot-retention.json|配置/项目资源|全文|
|config/operations-targets.json|配置/项目资源|全文|
|config/product-catalog.json|配置/项目资源|全文|
|config/production-connections.json|配置/项目资源|全文|
|config/provider-guides.json|配置/项目资源|全文|
|config/public-entry.json|配置/项目资源|全文|
|config/purchase-consent.json|配置/项目资源|全文|
|config/release-gates.json|配置/项目资源|全文|
|config/repository-scan-exceptions.json|配置/项目资源|全文|
|config/service-registry.json|配置/项目资源|全文|
|design-qa.md|文档/图示|未逐字|
|docs/account-matter-ux.md|文档/图示|全文|
|docs/annual-brand-capacity-20260921.md|文档/图示|未逐字|
|docs/apple-review-validation-20260929.md|文档/图示|未逐字|
|docs/apple-watch-death-signal-research.md|文档/图示|未逐字|
|docs/asset-licenses.md|文档/图示|未逐字|
|docs/auth0-cognito-migration-20260928.md|文档/图示|未逐字|
|docs/authentication-experience.md|文档/图示|未逐字|
|docs/backend.md|文档/图示|未逐字|
|docs/blockchain.md|文档/图示|未逐字|
|docs/brand-font-license-20260919.md|文档/图示|未逐字|
|docs/channel-pricing-20260921.md|文档/图示|未逐字|
|docs/chat-resume-20260930.md|文档/图示|未逐字|
|docs/cloud-cost-options-20260924.md|文档/图示|未逐字|
|docs/commercial-completion-20260916.md|文档/图示|未逐字|
|docs/competitor-ux-audit.md|文档/图示|未逐字|
|docs/component-preview-20260918.md|文档/图示|未逐字|
|docs/dark-ui-redesign-brief.md|文档/图示|未逐字|
|docs/death-verification-evidence-research.md|文档/图示|未逐字|
|docs/decision-log.md|文档/图示|未逐字|
|docs/disclosure-rehearsal.md|文档/图示|未逐字|
|docs/e2ee-effort-20260922.md|文档/图示|未逐字|
|docs/family-maintenance.md|文档/图示|未逐字|
|docs/free-paid-ui-audit.md|文档/图示|未逐字|
|docs/global-mainland-commerce-plan.md|文档/图示|未逐字|
|docs/handoff-history-20260910.md|文档/图示|未逐字|
|docs/handoff-history-20260911.md|文档/图示|未逐字|
|docs/handoff-history-20260915-p1-start.md|文档/图示|未逐字|
|docs/handoff-history-20260915.md|文档/图示|未逐字|
|docs/handoff-history-20260916-before-behavior-release.md|文档/图示|未逐字|
|docs/handoff-history-20260916-before-commercial-completion.md|文档/图示|未逐字|
|docs/handoff-history-20260916-before-ui-scope-correction.md|文档/图示|未逐字|
|docs/handoff-history-20260916-p1-deployment.md|文档/图示|未逐字|
|docs/handoff-history-20260917-invitation-complete.md|文档/图示|未逐字|
|docs/handoff-history-20260917-provider-acceptance-in-progress.md|文档/图示|未逐字|
|docs/handoff-history-20260917-stripe-complete.md|文档/图示|未逐字|
|docs/handoff-history-20260918-component-preview.md|文档/图示|未逐字|
|docs/handoff-history-20260918-filter-components.md|文档/图示|未逐字|
|docs/handoff-history-20260918-platform-library.md|文档/图示|未逐字|
|docs/handoff-history-20260918-surface-motion.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-approved-brand.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-logo-alternative.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-logo-reset.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-logo03.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-release-preparation.md|文档/图示|未逐字|
|docs/handoff-history-20260919-before-tree-variants.md|文档/图示|未逐字|
|docs/handoff-history-20260919-contextual-guidance.md|文档/图示|未逐字|
|docs/handoff-history-20260919-icon-practice.md|文档/图示|未逐字|
|docs/handoff-history-20260919-provider-marks.md|文档/图示|未逐字|
|docs/handoff-history-20260920-before-logo-consistency.md|文档/图示|未逐字|
|docs/handoff-history-20260921-before-annual-only.md|文档/图示|未逐字|
|docs/handoff-history-20260921-before-channel-pricing.md|文档/图示|未逐字|
|docs/handoff-history-20260921-before-security-positioning.md|文档/图示|未逐字|
|docs/handoff-history-20260921-before-subscription-review.md|文档/图示|未逐字|
|docs/handoff-history-20260922-before-content-implementation.md|文档/图示|未逐字|
|docs/handoff-history-20260922-before-e2ee-effort.md|文档/图示|未逐字|
|docs/handoff-history-20260923-before-production-start.md|文档/图示|未逐字|
|docs/handoff-history-20260923-before-release-gap-review.md|文档/图示|未逐字|
|docs/handoff-history-20260923-production-attempts.md|文档/图示|未逐字|
|docs/handoff-history-20260924-access-recovery.md|文档/图示|未逐字|
|docs/handoff-history-20260924-before-identity.md|文档/图示|未逐字|
|docs/handoff-history-20260924-before-runtime.md|文档/图示|未逐字|
|docs/handoff-history-20260925-before-clients.md|文档/图示|未逐字|
|docs/handoff-history-20260926-before-apple.md|文档/图示|未逐字|
|docs/handoff-history-20260926-before-channel-correction.md|文档/图示|未逐字|
|docs/handoff-history-20260926-before-commerce.md|文档/图示|未逐字|
|docs/handoff-history-20260926-before-launch-goal.md|文档/图示|未逐字|
|docs/handoff-history-20260926-before-web-88-99.md|文档/图示|未逐字|
|docs/handoff-history-20260928-before-landing-v2.md|文档/图示|未逐字|
|docs/handoff-history-20260928-before-theme-closeout.md|文档/图示|未逐字|
|docs/handoff-history-20260929-before-appearance-closeout.md|文档/图示|未逐字|
|docs/handoff-history-20260929-before-native-home.md|文档/图示|未逐字|
|docs/handoff-history-20260929-before-ui-ux-closeout.md|文档/图示|未逐字|
|docs/handoff-history-20260930-before-apple-closeout.md|文档/图示|未逐字|
|docs/handoff-history-20260930-before-review-runtime.md|文档/图示|未逐字|
|docs/handoff.md|文档/图示|未逐字|
|docs/identity-data-region.md|文档/图示|未逐字|
|docs/individual-operator-launch-plan.md|文档/图示|未逐字|
|docs/infrastructure-roadmap.md|文档/图示|未逐字|
|docs/interaction-experience.md|文档/图示|未逐字|
|docs/invitation-motion-ux.md|文档/图示|未逐字|
|docs/ios-external-payment-research.md|文档/图示|未逐字|
|docs/ios-layout-matrix.md|文档/图示|未逐字|
|docs/journey/PROJECT_JOURNEY.md|文档/图示|未逐字|
|docs/landing-page-20260928-v2-history.md|文档/图示|未逐字|
|docs/landing-page-20260928.md|文档/图示|未逐字|
|docs/legal-candidate-zh.md|文档/图示|未逐字|
|docs/logo-ai-workflow.md|文档/图示|未逐字|
|docs/logo-design-20260919.md|文档/图示|未逐字|
|docs/logo-discovery.md|文档/图示|未逐字|
|docs/logo-form-brief.md|文档/图示|未逐字|
|docs/monetization.md|文档/图示|未逐字|
|docs/mvp.md|文档/图示|未逐字|
|docs/native-home-20260929.md|文档/图示|未逐字|
|docs/p1-reliability-repair-20260915.md|文档/图示|未逐字|
|docs/platform-contract.md|文档/图示|未逐字|
|docs/pricing-68-20260911.md|文档/图示|未逐字|
|docs/pricing-88-80-20260919.md|文档/图示|未逐字|
|docs/pricing-88-99-20260926.md|文档/图示|未逐字|
|docs/pricing-band-20260910.md|文档/图示|未逐字|
|docs/product-events.md|文档/图示|未逐字|
|docs/product.md|文档/图示|全文|
|docs/production-apple-20260926.md|文档/图示|未逐字|
|docs/production-clients-20260925.md|文档/图示|全文|
|docs/production-commerce-20260926.md|文档/图示|未逐字|
|docs/production-identity-mail-20260924.md|文档/图示|未逐字|
|docs/production-recovery-20260923.md|文档/图示|未逐字|
|docs/production-runtime-20260924.md|文档/图示|未逐字|
|docs/provider-death-account-guides-history-20260820.md|文档/图示|未逐字|
|docs/provider-death-account-guides.md|文档/图示|未逐字|
|docs/provider-icon-practice-research.md|文档/图示|未逐字|
|docs/provider-mark-usage.md|文档/图示|未逐字|
|docs/public-legal-pages.md|文档/图示|未逐字|
|docs/public-product-website-20260924.md|文档/图示|未逐字|
|docs/quality-gates.md|文档/图示|未逐字|
|docs/recovery-control-journal.md|文档/图示|未逐字|
|docs/release-engineering-20260930.md|文档/图示|部分|
|docs/release-readiness.md|文档/图示|未逐字|
|docs/research.md|文档/图示|未逐字|
|docs/role-assignment-policy.md|文档/图示|未逐字|
|docs/security-hardening-20260921/context.md|文档/图示|未逐字|
|docs/security-hardening-20260921/diagrams/private-content-boundary-baseline-after.mmd|文档/图示|未逐字|
|docs/security-hardening-20260921/diagrams/private-content-boundary-before.mmd|文档/图示|未逐字|
|docs/security-hardening-20260921/diagrams/private-content-boundary-e2ee-after.mmd|文档/图示|未逐字|
|docs/security-hardening-20260921/diagrams/private-content-boundary-envelope-after.mmd|文档/图示|未逐字|
|docs/security-hardening-20260921/hardening.json|配置/项目资源|未逐字|
|docs/security-hardening-20260921/hardening.md|文档/图示|未逐字|
|docs/security-hardening-20260921/implementation/envelope.md|文档/图示|未逐字|
|docs/security-hardening-20260921/implementation/operations.md|文档/图示|未逐字|
|docs/security-hardening-20260921/proposals/private-content-boundary.md|文档/图示|未逐字|
|docs/security-positioning-20260921.md|文档/图示|未逐字|
|docs/solo-operations-and-portability.md|文档/图示|未逐字|
|docs/source-control.md|文档/图示|未逐字|
|docs/start-here-export.md|文档/图示|未逐字|
|docs/storekit.md|文档/图示|未逐字|
|docs/subscription-value-20260921.md|文档/图示|未逐字|
|docs/surface-motion-20260917.md|文档/图示|未逐字|
|docs/trust-safety-legal.md|文档/图示|未逐字|
|docs/trusted-sharing.md|文档/图示|部分|
|docs/ui-ux-audit-20260915.md|文档/图示|未逐字|
|docs/ui-ux-audit-20260929.md|文档/图示|未逐字|
|docs/unit-economics-history-20260910.md|文档/图示|未逐字|
|docs/unit-economics-pricing-reset-history-20260910.md|文档/图示|未逐字|
|docs/unit-economics.md|文档/图示|未逐字|
|docs/ux-behavior-repair-20260916.md|文档/图示|未逐字|
|docs/website-appearance-controls-20260929.md|文档/图示|未逐字|
|infra/auth0/README.md|文档/图示|未逐字|
|infra/auth0/hosted-consent/README.md|文档/图示|未逐字|
|infra/auth0/hosted-consent/form.json|配置/项目资源|全文|
|infra/auth0/hosted-consent/post-login-action.cjs|程序/样式源码|全文|
|infra/auth0/hosted-consent/post-login-action.test.cjs|测试代码|全文|
|infra/auth0/hosted-consent/production-review-action.cjs|程序/样式源码|全文|
|infra/auth0/hosted-consent/production-review-action.test.cjs|测试代码|全文|
|infra/auth0/universal-login/branding.json|配置/项目资源|全文|
|infra/auth0/universal-login/custom-text/login-id.en.json|配置/项目资源|全文|
|infra/auth0/universal-login/custom-text/login-password.en.json|配置/项目资源|全文|
|infra/auth0/universal-login/custom-text/reset-password.en.json|配置/项目资源|全文|
|infra/auth0/universal-login/custom-text/signup-id.en.json|配置/项目资源|全文|
|infra/auth0/universal-login/custom-text/signup-password.en.json|配置/项目资源|全文|
|infra/auth0/universal-login/page-template.liquid|程序/样式源码|全文|
|infra/auth0/universal-login/preview.html|程序/样式源码|全文|
|infra/auth0/universal-login/theme.json|配置/项目资源|全文|
|infra/aws/.gitignore|配置/项目资源|全文|
|infra/aws/README.md|文档/图示|未逐字|
|infra/aws/bin/rillora.ts|程序/样式源码|全文|
|infra/aws/bootstrap/standalone-account-identity.yml|配置/项目资源|全文|
|infra/aws/cdk.context.json|配置/项目资源|全文|
|infra/aws/cdk.json|配置/项目资源|全文|
|infra/aws/lib/rillora-mail-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-operations-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-production-preflight-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-production-runtime.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-production-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-production-web-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-public-web-stack.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-snapshot-retirement.ts|程序/样式源码|全文|
|infra/aws/lib/rillora-staging-stack.ts|程序/样式源码|全文|
|infra/aws/package-lock.json|依赖/生成锁文件|未逐字|
|infra/aws/package.json|配置/项目资源|全文|
|infra/aws/scripts/content-rollout.py|程序/样式源码|全文|
|infra/aws/test/rillora-mail-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-operations-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-production-preflight-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-production-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-production-web-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-public-web-stack.test.ts|测试代码|全文|
|infra/aws/test/rillora-staging-stack.test.ts|测试代码|全文|
|infra/aws/tsconfig.json|配置/项目资源|全文|
|tools/auth0/apply-apple-hosted.py|程序/样式源码|全文|
|tools/auth0/apply-custom-text.sh|程序/样式源码|全文|
|tools/auth0/apply-hosted-consent.py|程序/样式源码|全文|
|tools/auth0/apply-selected-brand.py|程序/样式源码|全文|
|tools/auth0/apply-universal-login.sh|程序/样式源码|全文|
|tools/auth0/install-deletion-secret.py|程序/样式源码|全文|
|tools/auth0/install-email-verification-secret.py|程序/样式源码|全文|
|tools/auth0/install-production-identity-services.py|程序/样式源码|全文|
|tools/auth0/prepare-production-clients.py|程序/样式源码|全文|
|tools/auth0/prepare-production-identity-services.py|程序/样式源码|全文|
|tools/auth0/prepare-review-identity.py|程序/样式源码|全文|
|tools/auth0/provision-email-verification.py|程序/样式源码|全文|
|tools/commerce/activate-sharing.sql|程序/样式源码|全文|
|tools/godaddy/README.md|文档/图示|未逐字|
|tools/godaddy/rillora_dns.py|程序/样式源码|全文|
|tools/godaddy/test_rillora_dns.py|测试代码|全文|
|tools/legal/configure-release.sh|程序/样式源码|全文|
|tools/legal/package-legal-sites.sh|程序/样式源码|全文|
|tools/legal/run-legal-sites-build.sh|程序/样式源码|全文|
|tools/legal/run-release-build.sh|程序/样式源码|全文|
|tools/logo/audit-dual-embrace-gate2.cjs|程序/样式源码|全文|
|tools/logo/build-rillora-identity-20260919.cjs|程序/样式源码|全文|
|tools/logo/build-rillora-legacy-imprint-20260919.cjs|程序/样式源码|全文|
|tools/logo/build-rillora-open-folio-20260919.cjs|程序/样式源码|全文|
|tools/logo/export-approved-favicons.cjs|程序/样式源码|全文|
|tools/logo/generate-dual-embrace-gate2.cjs|程序/样式源码|全文|
|tools/ops/handler.mjs|程序/样式源码|全文|
|tools/ops/health-check.mjs|程序/样式源码|全文|
|tools/ops/health-check.test.mjs|测试代码|全文|
|tools/ops/run-checks.mjs|程序/样式源码|全文|
|tools/release/build-web-production.sh|程序/样式源码|全文|
|tools/release/check_mail_readiness.py|程序/样式源码|全文|
|tools/release/create_source_baseline.py|程序/样式源码|全文|
|tools/release/install-review-secrets.py|程序/样式源码|全文|
|tools/release/preflight.py|程序/样式源码|全文|
|tools/release/prepare_repository.py|程序/样式源码|全文|
|tools/release/probe_recovery_isolation.mjs|程序/样式源码|全文|
|tools/release/recovery_drill.py|程序/样式源码|全文|
|tools/release/run_recovery_task.py|程序/样式源码|全文|
|tools/release/scan_repository.py|程序/样式源码|全文|
|tools/release/test_mail_readiness.py|测试代码|全文|
|tools/release/test_preflight.py|测试代码|全文|
|tools/release/test_recovery_drill.py|测试代码|全文|
|tools/release/test_repository_scan.py|测试代码|全文|
|tools/run-ios-layout-matrix.sh|程序/样式源码|全文|
|tools/snapshot-retention/handler.mjs|程序/样式源码|全文|
|tools/snapshot-retention/package-lock.json|依赖/生成锁文件|未逐字|
|tools/snapshot-retention/package.json|配置/项目资源|全文|
|tools/snapshot-retention/retention.mjs|程序/样式源码|全文|
|tools/snapshot-retention/retention.test.mjs|测试代码|全文|
|tools/storekit/run-local-sandbox-api.sh|程序/样式源码|全文|
