# MVP And Market Validation Contract

Role: product-led validation contract  
Authority scope: first usable product, experiment events and continue/stop criteria  
Superseded by: later locked MVP decision  
Do not use for: production security certification or global legal claims  
Status: PROVISIONAL MVP SCOPE  
Last updated: 2026-09-26 (current annual offer and existing sharing evidence aligned; dated evidence unchanged)

## Core Hypothesis

数字事务复杂且有人依赖自己的用户，愿意花15至20分钟建立不包含高风险密码的应急地图，并愿意邀请一名真实可信联系人参与；其中一部分人愿意为持续复核、家庭协作和执行支持付费。

## Primary Outcome

MVP不是证明我们能开发一个保险箱，而是观察用户是否完成以下真实行为：

1. 添加重要事务；
2. 为每项事务设置处理意愿；
3. 邀请真实联系人；
4. 联系人接受；
5. 复核所选接收人实际可见的资料范围；
6. 下载或查看应急包；
7. 真实付款或进入明确的付费承诺。

## MVP Core Journey

0. **Understand first**：无需账户先理解产品、工作方式和不保存密码的边界；选择开始或Account后再登录／注册。
1. **Choose how to begin**：认证后直接进入可用总览；用户可选择`添加第一项事务`或`使用约2分钟引导`，不被问卷或弹窗阻塞。
2. **Why now — optional accelerator**：只在用户选择引导时采集当前触发事件和主要担忧；允许跳过、退出和稍后恢复，不因回答而增加准备度。
3. **Build the map**：添加至少五项资产、负债、账号、设备或资料；第一项采用任务内的即时小问题，不先收集完整家庭资料。
4. **Choose outcomes**：逐项选择通知、转移申请、关闭、删除申请、纪念化、延迟公开或永不披露。
5. **Assign people**：区分可信联系人、执行人和资料接收人。
6. **Complete official setup**：先为Apple、Google、Facebook、GitHub和密码管理器检查可预设的官方机制，再为Microsoft、LinkedIn、X、PayPal、Coinbase和准确地区的Binance保留官方身后申请入口与材料指导；不把两类流程混为“已继承”。
7. **Invite**：发送真实邀请并记录接收状态。
8. **Review sharing**：在现有共享设置中复核接收人的实际字段投影；不以非操作性演练冒充真实事件验证。
9. **Start Here**：生成给处理人的任务清单和资料定位包。

## P0 Capabilities — Required On Web And iOS

- 注册、登录和基础账户恢复；任何真实Rillora planner／session创建前必须用未预勾选clickwrap同意当前Terms、确认Privacy并接受电子记录，精确版本／bundle digest由服务端提交且注册同意不授权订阅扣费；
- 可跳过、可退出、可恢复且不阻塞产品访问的“为什么现在开始”动机采集；
- 事务分类、添加、编辑、归档和过期状态；
- 遮罩账号、机构、价值区间、资料位置和重要程度；
- 逐项处理意愿和指定角色；
- 可信联系人邀请、接受、撤销和替换；
- 平台官方设置检查清单、provider官方HTTPS入口、可执行步骤、通常材料和结果边界；
- 准备度状态和缺口说明；
- 接收人字段投影预览；死亡／失能的非操作性演练仅保留内部安全QA，不是消费者必经步骤；
- 经明确披露边界的Start Here包：最小披露可打印指南，以及客户端加密、逐设备公钥封装和离线Owner恢复；真实收件人登记、投递与释放保持独立门；
- 统一实验事件与匿名化来源标签。

## Staged operations — current solo-operation boundary

Owner于2026-09-11明确不招人。当前按[自助与有界自动化合同](solo-operations-and-portability.md)推进；不得把未来人工配额或未启用服务当作现有能力。以下是较早的人工／模拟运营提案，标为HISTORICAL，不能成为当前消费者入口或上线完成证明：

- 身份与证明文件审核；
- 申请升级、申诉和撤销；
- 平台规则核验；
- 专业人士转介；
- 受控的测试性披露演练。

MVP不执行真实死亡后的敏感资料自动披露。真实申请在安全、法律和人工运营门通过前保持关闭。

## Implementation Coverage — Historical checkpoints from 2026-08-11

These dated paragraphs retain their original test evidence. Current public UI is
the September 9 interactive map, not a three-choice/example flow; iOS private
intent uses direct hosted login. Account-bound direct sharing was deployed
September 10. Current runtime boundaries live in [handoff.md](handoff.md) and
[trusted-sharing.md](trusted-sharing.md); this history is not a new test run.

后端已经持久化计划、事务、角色、联系人记录、官方设置自报、计数模拟、非操作性角色策略演练、Start Here预览／打印元数据、客户端密文与HPKE密钥信封、合成收件人演练、审计和隐私过滤第一方事件，并通过PostgreSQL跨租户／跨角色测试。Web根路径新增无需账户的公开产品页，开始计划和Account进入独立`/account`选择后才转到Auth0；私有状态仍由同源API和Cookie会话保护。认证后Web与iOS现在共享持久化的`available / guide_in_progress / guide_paused / completed`首次使用合同，但分别使用总览面板与原生Sheet；三条路径、跳过、退出、从Web聚合入口／原生iOS Profile恢复、合成示例不持久化和明确保存第一项Matter已通过本地浏览器／模拟器验证；引导答案不增加准备度。移动Web一级信息架构为`Overview / Matters / More`，原生iOS为`Overview / Matters / Profile`，而桌面Web保留完整工作区侧栏；低频计划、联系人、指南、活动与设置仍在各平台第三个聚合入口下继续可达。真实Auth0 EU Universal Login、Cookie会话／CSRF和退出已用合成身份验证；隔离虚拟WebAuthn认证器已完成Web Passkey渐进注册与后续登录。原生SwiftUI客户端已通过Auth0.swift系统浏览器Code + PKCE，把短期provider token一次性换成Keychain保存的Rillora本地Bearer会话，并在重启后继续读取共享API；Cookie与Bearer不能交叉使用。动机、Matter、可信联系人记录、全计划／逐事项角色记录、官方设置可逆自报、三类无副作用计数演练、死亡／失能／失联三套角色级策略状态机、最小披露明文指南、AES-256-GCM＋RFC 9180 HPKE的Owner恢复包，以及一次性合成接受／内存设备私钥／公钥登记／撤销／收件人侧解密合同已在Web与iOS保持同一证据边界；服务端不能解密，角色记录不建立授权，策略演练不能验证证明、发送通知或释放资料。政策变化会使旧演练快照过期。当前75项iOS单元测试、40项共享API测试、13项Web API-client、3项Web首次使用状态、2项Web移动导航合同和4项Web加密测试通过；Web还手工验证了公开首页、Account路由、首次使用全路径、移动More层级、角色创建／编辑／撤销、过期警告和新快照。原生Profile当前另有签出17 Pro Max `2 / 2`与SE `1 / 1`聚焦证据；已登录完整新矩阵仍待合成QA API可用后重跑。

2026-08-20官方指导不再只有五个provider名称和checkbox。Web／iOS本地目录现覆盖十一类常用provider；Apple／Google／Facebook／GitHub／密码管理器的生前设置与Microsoft／LinkedIn／X／PayPal／Coinbase／Binance的身后申请分别呈现。每项只在详情页显示步骤、通常材料、官方链接和限制，根页继续保持低文字负担。当前iOS `91 passed / 0 failed / 1 skipped`、Web `40 / 40`；这些测试证明目录、官方host allowlist和Binance产品真相，不证明provider设置或申请结果。

以下P0仍未被证明完成：真实Apple设备／原生Passkey、备用因子、恢复与完整接管防护、Release身份、真实联系人投递与身份绑定接受、真实设备私钥的安全持久化／更换／恢复、KMS加密附件、真实证明与申请处理、真实加密包投递／释放，以及生产事件清理／同意／分析管线。`login.rillora.xyz`的DNS、托管TLS、Auth0默认域以及Web与iOS Debug在该issuer下的合成登录／本地会话／退出已验证；iOS还完成Keychain进程重启恢复。当前是“Auth0 EU开发身份连接的Web和原生iOS + 已验证的Web／iOS Debug自定义域 + 虚拟Web Passkey + 可运行后端 + 本地规划／角色记录／Owner恢复／合成收件人解密／角色策略演练协议”，不是可招募真实敏感数据用户的完整MVP。

原生Profile候选的聚焦证据另外包括：签出17 Pro Max `2 / 2`、签出SE `1 / 1`以及隔离合成QA API下的已登录纵向／横向／深层路由`3 / 3`。第一次未启动API的`0 / 3`前置失败继续保留；测试专用4181监听在复跑后已关闭。完整五设备／全部Dynamic Type的新矩阵仍开放。

## Explicit Exclusions

- 银行密码、完整恢复码、完整助记词和可直接转账秘密；
- 自动资金清偿或转移；
- 全球遗嘱生成器；
- 自动死亡判定；
- AI分身、纪念社区和内容推荐；
- 大规模邮箱、银行或云盘读取集成；
- 以区块链替代法律授权或死亡核验。

## Segments To Observe

首轮招募30至50名测试者，尽量覆盖：

- 跨国生活或有海外账户；
- 有伴侣、孩子或其他依赖者；
- 创业者、开发者或创作者；
- 投资或加密资产持有人；
- 最近两年处理过亲友遗产。

产品内记录触发事件和事务复杂度，再按真实行为比较，而不是先按年龄确定市场。

## Event Model

关键漏斗事件：

- `signup_completed`
- `motivation_selected`
- `first_item_added`
- `five_items_completed`
- `item_outcome_assigned`
- `item_role_assigned`
- `trusted_contact_invited`
- `trusted_contact_accepted`
- `official_setup_checked`
- `simulation_completed`
- `start_here_exported`
- `pricing_viewed`
- `subscription_started`
- `subscription_refunded`
- `subscription_cancelled`
- `plan_reviewed_30d`
- `plan_maintained_90d`

事件只能包含必要的行为元数据，不得把真实机构账号、资料内容、联系人身份或敏感意愿发送到分析系统。

当前本地实际实现的是`motivation_selected / first_item_added / five_items_completed / item_outcome_assigned / item_role_assigned / official_setup_checked / simulation_completed / start_here_exported`八项，由服务端事务生成并受数据库精确属性白名单约束。邀请、接受、定价、订阅、退款、取消和30／90天复核仍是未来真实MVP事件，不能伪造。本地90天`expires_at`没有清理任务，不构成生产删除或市场证据。

## North-Star Activation

**Connected useful map / 已建立可用共享地图**（操作指标，不是法律／继承核验）：

- 至少五项事务；
- 关键事项已有处理意愿；
- 至少一名可信联系人已接受；
- 接收人通过自己的账户找到一项被允许查看的方向；这只证明任务完成，不证明法律权限或未来处理成功。

## Initial Decision Thresholds

前30至50名受邀测试者中，继续投入的方向性信号是：

- 不少于一半完成五项事务；
- 至少三分之一发出真实邀请；
- 被邀请联系人中多数完成接受；
- 至少五组规划者／接收人完成上述“找到获准方向”的实际任务；
- 至少三人产生真实付款或等价的不可轻易撤回付费承诺；这只证明交易路径与初始意愿，后续仍需形成50–100个全价或清晰标注Founder价格的付费家庭队列，才讨论显著付费获客或融资叙事。

这些不是统计显著性结论，而是早期是否值得继续的操作门槛。若用户只浏览、不添加真实事务、不邀请联系人也不付费，应停止扩展功能并重新审视价值主张。

## Pricing Test — PROVISIONAL

2026-09-10落实检查点：[Family共同复核](family-maintenance.md)已在API／Web／iOS实现并部署测试预览：按权限请求检查、接收人确认／报问题、指定一人建议更正、本人批准、更新真实事项、保留修正历史与下次复核日期。它提供可操作的付费价值候选，不再只有联系人数量；完整共同所有者、全计划历史、外部通知、人数收费限制和到期固定版本仍未完成，真实US$99付费意愿没有由代码测试证明。

- 免费：可形成有意义的轻量事务地图、一名可信人的基础路径、官方设置检查、实际共享范围预览、基础导出，以及认证、安全、导出、删除和接收人基础访问。不得把Apple／Google等本来免费的官方设置指导、最低安全或离开产品的能力锁进付费墙。
- 首发目录：永久`Free`之外只开放一个付费权益层级`Rillora Family`，新购只售年付；历史月付仍按原收据管理和对账，不变成第二个套餐。
- 最新价格和经营目标：Owner锁定Web US$88.99/年、Apple按渠道另定，并已取消新月付，继续明确不招人；同一Family能力集，需求仍未验证。先完成自助购买／名额／准确截止版本／取消恢复、最小监控和生产门；未来功能、营销、安全和服务扩容／迁移完整规划但按证据分期，不把完整自建AI平台当首发条件。见[当前价格](pricing-88-99-20260926.md)和[单人经营合同](solo-operations-and-portability.md)。
- 首发不启用自动转付费试用；永久Free承担体验作用。2026-08-27现行法律候选取代早期30天首购退款保证：直接Web按强制法律或书面例外处理，Apple按其渠道处理。30天保证及14天Family预览都保持关闭，不是当前承诺。
- 取消后使用到已付周期末，再安全降级到Free；账户、核心文本、基础导出和接收人基础访问不因取消或付款失败删除／锁死，订阅状态也永不触发死亡、失能、失联或披露。
- 每个地区首次公开发布都必须同时具备永久Free和可用的Family订阅；Global与Mainland独立过门、无需同日发布。支付未就绪的地区停留在受控beta，不先做公开Free-only发布。

完整长期套餐、权益、退款、全球Storefront和订阅生命周期设计见[`docs/monetization.md`](monetization.md)；单位经济、成本分配、毛利、LTV/CAC、跑道和尽调指标见[`docs/unit-economics.md`](unit-economics.md)。价格尚未验证且支付未激活；首轮目标仍是区分赞同、完成、邀请和付款四种强度不同的信号，并把付款后的30／90天维护、退款、取消和直接支持时间作为独立队列证据。

2026-09-10区分补全：Free的“一人”指向外共享关系，不限制保存联系人记录或接收别人分享；Family暂定五位接收人及一位共同维护者。逐项权限、安全、范围预览和退出能力两版相同。多人邀请和有界复核已在合成staging实现；provider/location建议审批、修正历史和产品内日期已完成。该September10时点尚未完成人数限制／截止版本；September17已完成其部署与有界测试。完整共同编辑、外部通知与全计划历史仍不属于已交付能力。先验证免费的一人完整结果，再以第二位接收人／共同维护等真实意图验证付费，具体计数、降级和验证分母以商业合同为准。

同日Owner追问后的修订：“基本接收访问保留”指保留已获准的资料取回，不是免费保留所有人的持续更新。计划到期后，一位指定接收人继续获得当前内容，其余已接受者只读到期前获准的固定版本；用户自己的文本仍可编辑／导出。关闭续费先保留当前已付周期。该决定时这些机制尚未实现；September17已完成固定副本、准确截止、持续权益检查和两端合成验收，正式购买／生产验收仍须完成。按月购买后正常取消或隔月再订本身不视为滥用。
