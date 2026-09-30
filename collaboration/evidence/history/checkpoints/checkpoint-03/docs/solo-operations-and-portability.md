# Rillora 单人经营、自助、自动化与迁移合同

Role: current operating model, full feature roadmap and provider-exit contract  
Status: OWNER NO-HIRING DIRECTION LOCKED; DISABLED PRICE CATALOG DEPLOYED TO SYNTHETIC STAGING; PUBLIC MONITOR SCHEDULE ENABLED / DELIVERED FAILURE-RECOVERY-SILENCE PROOF; ACCOUNT DELETION WORKER DEPLOYED; OTHER AUTOMATIONS PLANNED  
Last updated: 2026-09-28 (identity portability assessment; earlier operations evidence retains its date)

## September28 identity concentration and migration cost

Owner requests SES reconsideration and asks about later moving Auth0 to AWS.
The support message is submitted; production mail is not approved. Current code
already separates Rillora planner IDs/sessions from identity-provider bindings,
but native claims/SDK, deletion, verification, legal proof and old-account linking
require a real migration. Keep Auth0 for this release; no Cognito pool is created.
Auth0 Free and Cognito Essentials both cover the initial100–1,000eligible MAUs
without identity fees. Beyond10,000, Cognito Essentials is metered; paid/security
features must be compared separately. Password-hash export is unavailable on
Auth0 Free, while current Cognito supports compatible-hash import. See the
[dated migration and cost assessment](auth0-cognito-migration-20260928.md).


## September26 current offer and drift correction

Web is nowUS$88.99/year, Apple remains differentiated, and new monthly sales remain
retired. This supersedes the older88.80/9.99wording in the active roadmap. No new
monitor, hiring, cost commitment or automation deployment follows from this price
change. [Current price](pricing-88-99-20260926.md).

## September19 release priority, pricing and active public monitor

Owner now selects88.80 annual/9.99 monthly; [current price](pricing-88-80-20260919.md) supersedes the earlier68 statement. No-hiring/self-service and staged upgrades stay. Business/registration is Owner-deferred without document collection; independent launch engineering proceeds through [release-readiness](release-readiness.md).

The selected daily Gmail subscription is confirmed. Actual CloudWatch action history exposed missing SNS Publish permission; the fix permits only this account's four exact alarms. Test failure/automatic recovery and real missing-heartbeat/automatic recovery emails arrived in Inbox. Initial confirmation landed in Spam and was moved. Schedule now deploys ENABLED every15minutes; current cloud-run/readback evidence is in [QA](../output/qa/rillora-release-readiness-20260919/README.md). The silence check observed75.4minutes because CloudWatch searches earlier data beyond its three15-minute evaluation periods;45minutes is the evaluation window, not a maximum alert latency guarantee. This monitors public/staging metadata, not private-account security or a production SLA. Other registry jobs remain planned.

## September17 current software and operations checkpoint

Commercial sharing is enforced in synthetic staging with Free1/Family5, saved permitted copies and explicit resumption. Actual68/7.99 Stripe sandbox payment, cancellation/resume, refund and cutoff acceptance now pass; the former permission/SMS blocker is resolved. [Current implementation](commercial-completion-20260916.md).

RilloraOperations is deployed. Its first real AWS invocation passed all7 public TLS/status/header/negative-access checks, without private bodies or user credentials. The first deployment failed because this account could not reserve concurrency above AWS's minimum unreserved pool. The corrected read-only Lambda uses the shared pool, one15-minute rule,15-second timeout and bounded retries; this is not a per-function concurrency1 guarantee. The operator policy is limited to this job's invocation/logs/alarms/topic operations, not application secrets or data.

The schedule remains configured off. An Owner-selected subscriber, delivered alarm/recovery and missing-heartbeat drill remain necessary; the user has been asked to choose the destination. No alert email has been sent. The failed initial stack was removed; its retained log group and dead-letter queue were independently verified empty, deleted and read back as absent. Their temporary exact-resource cleanup policy stack is also removed. No app/database resource was changed by the operations deployment. Other planned automation jobs remain planned.

The same provider acceptance found a real Spot interruption of the only API task. The baseline is now one regular Fargate task, without increasing CPU/memory/count; the current task is verified healthy. The public-price compute-only estimate is8.29USD/month at730hours, excluding database/network/tax/other services. Monitoring is still configured off until the pending alert destination and delivery drill are complete. [Current provider/availability evidence](../output/qa/rillora-stripe-acceptance-20260917/README.md).

## September16 deployed deletion worker and recovery

P1 is now deployed to the existing synthetic staging environment: API23, migration17, checksums0043–0047, completed1/1 rollout; Web and the current native Debug build use the matching contract. Sites legal version4 and the Auth0 form/action are published and read back.36 HTTPS and25 legal checks pass. Authenticated cloud fixtures verify invitation scope, scoped plaintext/encrypted export, full backup/import, private archive restoration and provider-backed account deletion. These are deliberately synthetic sessions, not real signup/email/consent ceremonies. Sales remain closed. [September16 deployment acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md). The cloud test exposed missing provider-check INSERT rights in the import upsert.0047 adds only imported columns/sequence usage with tenant RLS intact; timestamps are normalized and existing non-default preparation settings preserved. Final API148 tests pass. All eight temporary identity mappings are removed and no deletion job remains pending. The earlier expired-authentication blocker is resolved.

When a CLI process no longer exists after a turn boundary, a confirmation code cannot be moved into an unrelated new PKCE flow. Reuse the fresh browser session and verify STS after the current CLI completes. The raw OAuth code in the confirmation URL is not the full remote verification-code format. A local callback successfully connected this workflow without another Owner password/MFA or permanent credential.

## HISTORICAL — September16 local deletion/portable-file checkpoint

Complete private map backup, local JSON/TXT/encrypted readers, empty-map import and private archive restoration are implemented on Web/native/API. Deletion uses durable leased jobs and a dedicated Auth0 delete:users service. A fresh disposable provider identity and its local map were deleted and independently checked; routine active-system versus backup/legal retention stays explicit. This is local acceptance, not a continuously running cloud job or actual customer result.

AWS STS confirmed expiry. A cached active-session choice returned400 in both remote and local callback attempts; Sign into new session reached the intended IAM form. Owner password/MFA was still pending when the final CLI authorization timed out. Do not reuse that expired authorization URL; create one fresh attempt when the Owner resumes. Do not repeat Auth0 login while its authorized CLI session is still valid. [Current repair/QA](p1-reliability-repair-20260915.md).

## AWS human session troubleshooting — 2026-09-11

The local operator profile uses `aws login` with the exact IAM identity `rillora-operator`. AWS documents automatic short-credential refresh with an overall session up to12hours. A browser error page alone is not evidence the CLI exchange failed: in this workflow the Owner reported Chrome `ERR_BLOCKED_BY_CLIENT` at127.0.0.1, but the existing CLI completed successfully and STS confirmed the intended identity/account. The unused remote fallback was cancelled; no extra login, permanent key, MFA removal or permission widening was needed.

Before requesting another personal login, inspect the existing command completion and run a bounded STS identity check. If the credential exchange genuinely cannot finish because local callbacks are blocked, use AWS's supported `aws login --remote` and return its authorization code only to that waiting CLI. Never put codes/tokens in chat or project records. Future restricted workload/CI roles reduce routine human-login dependence; they are separate from an indefinitely authenticated human account. [Official behavior and troubleshooting](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html).

## 已定方向

Owner明确不招人，希望由Codex协助开发、运维、安全和营销，并尽量由用户自助或系统自动执行。Owner现锁定 **Web US$88.99/年**；新月付已停售，Apple按渠道差异另定。只有永久Free和一个Family；历史月付权利保留。[价格与成本](pricing-88-99-20260926.md)。这些是经营决定，不是需求、利润或收费上线证据。

采用小而完整的自助软件，不以人工管家、代办遗产、人工法律审查或无限AI服务作为Family的承诺。完整自建客服平台、CRM、微服务集群和企业后台都不成为首发前置项。未来功能先确定数据、权限、版本、依赖和扩展门；实际建设按证据分期。Owner不招人的新决定取代把雇员／外包视作默认扩容手段；历史Logo“设计师主导”描述也不再构成招聘前置项，但不恢复任何已否决Logo。

Codex可以在任务被唤起且凭据可用时检查、修复和推进；它本身不是始终在线的服务器或具备法定责任的运营主体。持续任务必须部署到真实调度器，具备身份、预算、日志、失败处理及实际到达的告警。Owner保留账户所有权、付款／税务／平台本人认证以及无法自动确定的争议处理。遇到这些必要边界时减少服务承诺或暂缓高风险流程，不用AI虚构完成。

## September11基础检查点 — 历史状态表

| 项目 | 现在的证据 | 尚缺什么 |
| --- | --- | --- |
| 68年／7.99月独立价格 | `config/product-catalog.json`、迁移0040、真实PostgreSQL API测试 | September11随事项更新部署0040，云端checksum已核对；Stripe/Apple商品未改价；普通收费仍关闭 |
| 同一能力版本的目录选择 | 排除过期／未来价格；同币种同周期只取一个报价；市场关闭时active price也不可买 | Web/iOS新报价运行展示与商户发布仍需独立验收 |
| 公开运维探针 | Node脚本、超时／地址边界／证书／负向权限测试；7个URL独立curl的HTTP状态与指定安全头检查符合预期 | Mac代理DNS使受保护直连探针拒绝伪IP，不能把它报成远端停机；云端实测未做 |
| 持续调度与告警 | 独立CDK `RilloraOperations`：每15分钟但默认关闭、重试、加密死信、故障／无心跳／执行错误／死信告警；15项infra测试通过 | AWS本人会话在本轮恢复且STS通过；该独立调度栈仍未部署，没有已验证的告警订阅者或持续运行证据 |
| 服务、任务与营销登记 | [服务登记](../config/service-registry.json)、[任务登记](../config/automation-registry.json)、[内容计划](../config/content-program.json) | 登记为planned的任务均未运行；发布账号尚未接入 |

原有地图、托管认证、邀请／二维码／按人按事项权限、撤销、导出及Shared reviews继续按各自有日期的证据使用。本轮不把旧测试重新计算为新验证，也不宣称整个运营系统已完成。

## 每条用户路径如何自助

| 路径 | 产品行为和必要自动化 | 实现边界 |
| --- | --- | --- |
| 访客与首次使用 | 未登录先理解产品；明确保存才认证；取消保留位置／草稿；首项录入可跳过引导 | 既有路径，继续防止登录墙和说明文章占满页面 |
| 登录与恢复 | Auth0托管邮箱／Google／Apple／passkey；失败提示可选原登录方式，使用安全恢复入口 | 登录配置已有；不能靠邮箱相同自动合并；高风险恢复不能由客服AI跳过证明 |
| 联系人邀请 | 选择人→逐项权限→链接或QR→对方Web/iOS认证接受；邀请撤销／过期可以自行重建 | 既有共享；未接受不泄露内容，接收人不必下载App或付费 |
| 权限和分层 | A分别决定B/C可见事项；预览“对方能看见什么”；缩小范围及撤销立即生效 | 既有ACL；新的套餐限制不能扩大可见范围 |
| 持续共同维护 | 接收人检查、报问题、建议更正；Owner看差异并批准；过期检查自动失效 | 已有有界Shared reviews；外部提醒发送仍待outbox与投递验证 |
| 购买／账单／换卡 | 相同年/月能力；Stripe托管Checkout和Customer Portal，Apple原生购买／管理／恢复；回调由服务端验签和对账 | 目前test-only；不自建卡片表单或根据客户端成功直接授予权益 |
| 取消与到期 | 自助关闭续费、保留已付期；到期降为一个Free实时接收人，其余只读获准的截止版本；恢复后再重新授权实时更新 | 准确快照、名额事务和到期状态现已部署并进行合成验收；真实支付与商户验收仍独立开放 |
| 导出／退出／删除 | 本人随时编辑与取回核心数据；异步大导出有状态和重试；删除有范围、保留原因与完成证据 | 基本出口已有；全量可恢复归档／跨系统删除自动化须单独验收 |
| 帮助与故障 | 先给与当前错误匹配的一步恢复动作；显示真实操作状态、重试和短帮助；仍不行才进入问题单 | 小规模先结构化帮助与AI辅助；不把“回复过”算自动解决 |
| 死亡／失能／失联 | 明确区分；只提供已验证范围内的指引和非操作性演练 | 真实事件验证／敏感披露继续关闭，不能用“无人团队”改成定时自动释放 |

每条新路径必须在Web和iOS都有完成／取消／失败／恢复状态。界面以动作、对象和结果为主；FAQ按需展开，不把本运营规划复制进产品界面。

## 分期建设：完整规划，按需要实现

人数是复盘节点，不是自动买更贵服务的开关。任何阶段都保留隐私、备份、删除、退出、有效认证和真实账单底线。

| 阶段 | 功能和自动化 | 升级前的实测条件 |
| --- | --- | --- |
| 现在→首发 | 完成名额／准确截止版本／取消恢复；落实Web88.99年价、Apple渠道差异和历史收据；独立生产与真实身份／商户；部署最小监控、备份检查、自助帮助、取消、导出；短营销草稿 | 核心A/B/C闭环、负向权限、支付生命周期、恢复备份、告警到达；未满足保持销售关闭 |
| 0–100付费家庭 | 事务通知outbox、发送去重／退信；到期复核提醒；每日支付对账／成本；短帮助与有限AI问答；每周两条有用内容上限 | 实际支持类型、解决／重开率、支出、邀请接受和首个付费任务；没有付费结果不盲目买广告 |
| 100–300 | 批量录入／CSV导入、草稿去重、可见范围预览改进、计划级修订历史；只对已证明反复出现的问题加自动处理 | 真实录入瓶颈或每周重复工作超过2小时持续4周；升级的节省须超过持续成本 |
| 300–1,000 | 可度量的共同编辑角色、冲突／审批、更多有用提醒策略；按请求量伸缩；更完整故障、对账和恢复看板 | 独立任务成果和愿付需求；队列积压、p95延迟、RTO或配额达到阈值 |
| 1,000以上／触发条件 | 多语言、附件/OCR、外部官方指南更新、专业角色或机构方案逐个试点；必要时跨可用区、高级身份功能或替换供应商 | 先单独评估毛利、权限、隐私、滥用和维护负担；不是自动增加多个公开付费档 |
| 单独未来项目 | 法律文件生成、真实事件核验／披露、专业服务市场、企业多租户、银行连接 | 新的责任／法域／操作与成本合同；不自动纳入当前Family，不作为当前销售卖点 |

附件/OCR必须先有大小、文件类型、恶意内容检测、费用上限和删除规则；AI整理只能建议，不能自动改变接收人、法律角色或披露策略。版本历史不得恢复已撤销内容的访问。完整共同编辑采用独立角色和审批能力，不把一个联系人直接升级为全局管理员。

## 自动化执行合同

业务继续采用**模块化单体API＋PostgreSQL＋独立后台任务**。现在不拆一组难维护的微服务。已存在的provider adapter和自有UUID是基础；下述业务outbox是待实施合同，不是假装现有表已具备此功能。

任务最小字段：`job_id / job_type / schema_version / actor_scope / aggregate_id / due_at / idempotency_key / attempts / lease_until / status / last_error_code / correlation_id`。状态为`queued → leased → completed`，失败进入`retry_wait → dead_letter`；取消、被撤销和过期各自显式记录。工作者在提交事务时领取有时限租约；业务变更和outbox写入同一数据库事务。

- 采用至少一次投递和幂等效果，不宣称跨服务exactly-once。对账／订阅以provider事件ID和有效期去重，通知以事件、接收人、模板版本去重。
- 可重试的429／超时／5xx采用有上限的指数退避与抖动；无法确定外部副作用是否成功时先查询远端ID，不盲目重发。身份、撤销、权限或配置错误不通过重复执行“修好”。
- 每次发送／导出／修改前重新验证权限和当前事件状态，排队时的许可不能替代执行时检查。事件和日志不携带计划正文、密码、token或真实联系人地址。
- 每类任务有费用、次数、时间和并发上限。超限暂停可选内容生成／AI重试并报告；不能自动关闭核心安全、备份或抹掉用户数据以省钱。
- 保存最后成功、失败、积压年龄和版本；失败以及长期没有运行都可告警。告警合并去重，恢复再通知；正常无变化保持安静。
- 修复动作和观测权限分离。第一批自动修复仅允许已验证的无状态任务重试／回滚；数据库删除、权限扩张、身份合并、恢复覆盖和真实披露不开放给通用AI代理。

EventBridge会在重试耗尽后丢弃未交付事件，因此本轮调度源同时定义死信队列和无心跳告警；这仅证明配置存在。[AWS官方重试说明](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html)。

## 支持、安全和运维如何保持小成本

支持从高频20类问题的结构化帮助、真实错误码与自助深链开始；有实测需求才接按量AI。AI只读取经脱敏的状态和版本化知识，不默认发送私人计划给模型。测试集至少覆盖无法登录、不同provider、邀请过期、B/C隔离、换卡、取消、扣款争议、导出和删除；统计最终解决、7日重开、升级、错误动作、token与Owner耗时。90%独立解决率仍是财务假设。

| 任务 | 自动化目标 | 证据／失败处理 |
| --- | --- | --- |
| 可用性／身份公开配置／证书 | 每15分钟；TLS有效期小于21天提示；未认证私有入口必须401 | 本轮探针准备好；不保存响应正文；三个15分钟评估期加AWS缺数据回看；本次实测75.4分钟触发，非45分钟上限 |
| 数据备份 | 生产至少7日保留；每天检查最新备份；每月隔离恢复与迁移前额外演练 | 初始RPO≤24小时、RTO≤8小时为内部待测目标；实际更差时如实记录并修复；staging当前1日保留不冒充生产达标 |
| 发布／漏洞 | 每次依赖变化与每周检查；锁文件、组件清单、秘密扫描、相关测试；先staging再小批发布 | CI接入仍待做；扫描无报告不等于无漏洞；不能未经验证自动合并高影响补丁 |
| 访问与密钥 | 最小角色、短期执行身份；季度权限复核；服务商支持的轮换先双版本验证 | 观察角色不具备改账本、读私密数据或导出密钥的能力；Owner本人MFA不可代替 |
| 安全事故 | 异常403/401率、突发流量、错误成功访问、账本偏差和配置漂移进入事件 | 严重问题可触发已批准的隔离开关并保留证据；事件归因、通知义务及恢复验证仍需明确处理 |
| 账单／配额 | 每日预算预测、60/80%配额告警、每月发票与费用分摊 | 新预算先观察后调整；实际账单读取失败时写unknown，不能写0成本 |

当前公开探针采用批准origin白名单、拒绝私有/保留DNS地址、有效TLS、无跟随跳转、硬超时和无凭据请求；CDK运行角色只有日志／死信发送能力。它没有扫描账户、读取私密地图或自动修改防火墙的权限，也不是一次全仓安全审计。

## 营销与获客：先搭可持续流程

初期只验证一个目标人群和一至两个Owner拥有的渠道。每周一条具体情景＋一条15–25秒真实产品演示，少文字，突出“需要时找得到、不同人看不同事项、保持更新”。[内容登记](../config/content-program.json)已准备六类可复用选题／钩子／资产简报；只有合成数据可以进入演示，真实私有事项不得用于宣传。当前发布关闭，没有已连接社交账号。

流程是`产品证据 → 选题 → 短文/分镜/视觉资产 → 主张与隐私检查 → 版本化批次 → 指定账号定时发布 → 远端post ID → 归因与复盘`。文章、字幕、图像和视频源文件独立保存；改变发布工具不丢内容。正式授权具体渠道及发布范围后，已通过检查的低风险批次可以自动发出，无需Owner逐条批准；未连接前只产出草稿。

发布适配器保存idempotency key、remote ID、时间和失败原因，支持查询后重试、撤回和修订。不得自动私信陌生人、刷评论／粉丝、假证言，或制造死亡倒计时焦虑。没有明确渠道和内容范围时不代Owner发送消息。公共可选追踪在真实同意／拒绝／撤回能力完成前关闭。

衡量到激活规划者、接受逐项邀请、首个付费任务、付费／续费与获客的现金及本人时间；不以浏览量或AI产出数冒充获客。起步广告预算0是控制支出的决定，不是零CAC或有机增长保证。固定小批次测量后再决定平台、语言和投放，避免维护十个没有转化的账号。

## 服务边界与升级／退出方案

[机器可读服务登记](../config/service-registry.json)逐项保存现状、业务主键、替代边界、升级触发与迁移验收。不能为了“可迁移”现在同时购买两套云或保留完整双写数据面。

| 服务 | 现在保留什么 | 扩容／迁移怎么做 |
| --- | --- | --- |
| Auth0 | OIDC、PKCE、Rillora自有会话、业务UUID、精确issuer/subject绑定 | 按实际MAU和所需功能复核，不按付费户数买套餐；达到实际额度60/80%预警。迁移先建新issuer映射和双issuer有界过渡，明确重新认证／重新注册策略 |
| PostgreSQL | 标准SQL、显式迁移、UUID和约束、加密备份 | 先优化查询／连接池，再调规格；再按恢复/可用性需求加Multi-AZ。可迁往兼容托管Postgres，必须测试扩展、角色、恢复和权限 |
| API／Web | OCI容器、版本化HTTP合同、静态前端产物、CDK | 可以更换托管容器和CDN；保留移动端旧API窗口。迁入Workers这类不同执行环境需要适配运行时，不是只改域名 |
| Cloudflare／DNS | 现为GoDaddy DNS、CloudFront应用、Sites/Cloudflare法律页；没有认定已取得自有Cloudflare账户 | 实際带宽／攻击／费用证明需要再选；记录DNS、缓存、WAF规则，避免绑定独占业务存储。Cloudflare故障时预备替代CDN和受保护origin，不能直接暴露数据库 |
| S3／未来R2 | 业务只存对象ID、归属、digest、区域和保留类型 | 适配put/get/delete/sign；先核对签名URL、CORS、加密、版本／保留和删除能力，再校验复制。R2不能被当成完整S3等价物 |
| Stripe／Apple | 自有权益／价格／订阅／事件／财务账本；外部ID只作映射 | 新渠道／商户新增adapter和版本；旧订阅先留原渠道续费与取消，支持迁移才迁。Apple购买和用户支付方式不可自行“导出成Stripe订阅” |
| 邮件 | 可导出模板、通知ID、用户偏好、退信／抑制、发件DNS | 更换事务邮件provider时保留去重和抑制；Zoho角色邮箱不等于已经部署了事务通知系统 |
| AI／内容工具 | 任务接口、版本化提示、脱敏知识、评估集和成本记录 | 替换模型先评估准确率、敏感边界、耗时和成本，不把所有业务写死为某个模型输出格式 |
| 监控／任务 | JSON指标、任务版本、死信和运行状态 | 调度器可换，任务合同保留；切换只有一个活跃调度者，防止重复发信、重复扣款或静默漏任务 |

Auth0官方说明：密码哈希/MFA秘密导出需要支持工单、PGP和资格审核，部分请求可能不符合且无保证时间；用户档案导出不能代替凭据迁移。迁移必须预留重新验证／恢复路径，不能宣传“一键无感迁移”。Passkey受RP ID／域与provider能力约束，单独演练。[Auth0导出流程](https://auth0.com/docs/manage-users/user-migration/export-password-hashes-and-mfa-secrets)。

R2提供S3 API兼容面但有未实现功能，数据迁移前逐项检查实际使用能力；在数据驻留／加密政策没有通过前不能把Global私有资料搬到新区域。[R2兼容矩阵](https://developers.cloudflare.com/r2/api/s3/api/)。Auth0公开Free额度目前为25,000MAU，实际租户合同／功能仍需回读；按旧成本模型每户13个MAU估算，1,000付费户约13,000MAU，但免费用户增长可以更早触发升级。[Auth0定价](https://auth0.com/pricing)。

## 每次迁移的统一验收

1. 冻结范围、源／目标版本、数据区域、账户所有权、停机和回滚条件；记录当前配置及最近一次成功恢复。不把“能导出”当成“能恢复”。
2. 以加密副本在隔离目标恢复；校验实体总数、关系、版本、附件digest、撤销／删除记录和权益。备份可以包含旧保留数据，恢复时必须重放删除墓碑再开放访问。
3. 验证A/B/C隔离、邀请未接受不披露、同邮箱不同身份、撤销、截止版本、取消／退款、旧移动端、故障恢复。身份重绑必须证明账户控制，不凭邮箱相同合并。
4. 先合成小批、再有界切换；有实际写入时采用冻结或验证过的CDC，只保留一个权威写入者和一个收费／任务执行者。记录最终水位和未完成任务。
5. 通过允许的DNS／路由切换；检查Cookie、CORS、CSRF、AASA、回调、签名URL、缓存隔离及邮件DNS。达到事先写明的错误／延迟阈值即回滚，不能靠“页面能打开”验收。
6. 验证实际告警和完整业务后，按已公布保留政策关闭旧资源／轮换凭据；保存迁移审计和删除证据。不承诺可撤回用户已下载的副本。

全球与中国大陆仍是各自的身份／数据／支付平面；迁移便利不授权跨区同步。将来转公司或被收购也需核对域名、商户、Apple App转移、Auth0租户、许可证和用户数据处理义务；并非卖出Git目录即完成交接。

## 当前执行顺序与运行门

工程主线已转为[正式发布准备](release-readiness.md)；以下最小商业生命周期记录保留原检查点：**最小可售商业生命周期**：一位Free实时接收人、准确付费截止版本、原子名额／替换、取消／恢复与两端真实价格展示。把本计划中的监控／备份／用户自助纳入同一首发验收；未来阶段不抢占主线。

独立探针部署命令在[基础设施运行说明](../infra/aws/README.md)。较早基础检查点的AWS会话已于当天恢复，账户／事项与邀请UI部署都复用了准确operator身份；该历史检查点尚未部署独立运维栈；September17已部署并通过一次云探针，通知与持续调度仍待验证。Mac代理DNS为198.18/15保留地址，探针正确拒绝，独立curl证实7个HTTP状态及指定安全头检查符合预期；不可把它标成完整TLS／云端探针验收。当前没有真实发布、自动获客、全自动客服、备份恢复或全天候安全保障的完成声明。

验收细节与本次测试记录见[QA](../output/qa/rillora-automation-foundation-20260911/README.md)。
