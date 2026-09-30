# Rillora iOS 外部支付与 Stripe 可行性研究

Role: iOS 数字订阅、外部 Web 结账、Storefront 路由与 App Review 风险的聚焦研究和执行合同  
Authority scope: Rillora Family 在 iOS 中使用 StoreKit、Stripe 外部结账或只读伴随模式的地区适用性、成本、审核和工程边界  
Superseded by: Apple 最新审核规则、法院／监管变化、Apple entitlement 条款、正式 App Review 结果，或 `docs/decision-log.md` 中更新的 Owner 决定  
Do not use for: 保证 App Store 审核通过、规避平台合同、个人法律／税务意见、创建真实 Stripe 商品或收费授权  
Status: RESEARCH-BACKED ROUTING DECISION；STRIPE PHASE 1C TEST LIFECYCLE COMPLETE；STOREKIT SK0 LOCAL LIFECYCLE INCLUDING EXPLICIT RESTORE COMPLETE；美国外部 Web 结账仍为 Global iOS 首发主路径；非美／大陆StoreKit与Apple外部门保持关闭  
Last reviewed: 2026-08-21

## Executive Summary（执行摘要）

**可以使用 Stripe，但不能把它作为全球统一的“绕过苹果税”方案。** Rillora Family 解锁的是在 iOS 内使用的数字 SaaS 权益：私有云端计划、家庭协作、版本与维护工作流。按 Apple 当前规则，它默认属于需要 In-App Purchase 的数字功能，不属于 Reader App、实体商品、现实世界服务或纯企业内部服务。

当前最可执行的例外是**美国 App Store storefront**。Apple 自 2025-05-01 起允许美国 storefront 的 App 在无需额外 entitlement 的情况下包含通往外部购买方式的按钮、链接或行动号召。因此 Global 首发若继续只开放美国市场，iOS 可以在用户明确查看 `Plan & access` 或触发 Family 能力时，打开系统默认浏览器中的 Rillora Web 页面，并由 Stripe Checkout 完成购买；服务端 webhook 再写入同一 provider-neutral entitlement ledger，App 刷新权益。

这不是全球规则，也不能只用一个“用户国家”字段处理：

- **美国**：采用 Stripe 外部 Web 结账作为 iOS 与 Web 的统一首发商业路径；仍保留 StoreKit adapter，但不作为美国首发依赖。
- **日本／巴西**：技术上可申请外部支付，但必须同时提供 Apple IAP、展示规定披露、报告交易并继续支付 Apple 佣金／store services commission；个人首发阶段使用 StoreKit 更简单。
- **欧盟／EEA**：外部购买需要适用 entitlement、额外条款、API、交易报告、税务能力和 Apple 费用；不能称为“免苹果税”，继续关闭。
- **韩国**：需要韩国专用 binary、只能选择一种 PSP、不能与 IAP 同一 App 并存，Apple 当前列出的预批准 PSP 也不包含 Stripe；首发不采用外部支付。
- **中国大陆及多数其他非美 storefront**：不得在 App 内直接引导相同数字订阅的外部 Stripe 购买。公开收费时使用 StoreKit，或在没有购买 CTA 的免费伴随模式下仅让既有 Web 订阅者登录；后者仍有 App Review 分类风险，不作为大陆收费首发主路径。

推荐把这条路线称为**“按 storefront 合规路由的外部 Web 结账”**，不要在产品、审核说明或内部计划中称为“绕税”。它降低平台佣金，但把间接税、退款、拒付、订阅取消、支持和 merchant 责任转回 Rillora。

## 为什么有些 App 不用 IAP 也能交易

| 观察到的产品类型 | 为什么可不用 IAP 或不在 App 内卖 | 与 Rillora 是否相同 |
| --- | --- | --- |
| Uber、Airbnb、外卖、电商 | 购买的是在 App 外消费的实体商品或现实服务；Apple 反而要求使用非 IAP 支付 | 否。Family 是 App 内数字权益 |
| Netflix、Spotify | 主要功能是访问此前购买的音视频内容，属于 Reader App；可让既有订阅者登录。它们常把注册／购买放在网站 | 否。Rillora 不是媒体 Reader App |
| Slack 等组织工具 | 组织或企业为员工购买的服务可落入企业服务路径，面向个人／家庭的销售仍受不同规则约束 | 否。首发 Family 是消费者／家庭产品 |
| 1:1 咨询、远程辅导 | 两个人之间实时服务可使用外部支付；一对多或数字内容仍需 IAP | 仅适用于未来独立的人类服务 SKU，不适用于 Family 软件订阅 |
| 银行、券商、钱包 | 资金转移和金融账户交易不是为 App 数字功能付款 | 否。不能把 SaaS 订阅包装成金融交易 |
| 1Password、Dropbox 等消费级数字 SaaS | 与 Rillora 更接近；其 iOS 产品仍提供 IAP，说明“有网站订阅”不等于“App 可任意外链购买” | 是最近的参照类别 |

Apple 的 `3.1.3(f)` 还允许某些免费独立伴随 App 访问在网站购买的工具，例如云存储、邮件或 Web hosting，但要求 App 内没有购买，也没有外部购买行动号召。Rillora 有云端工具属性，理论上可尝试这种“免费伴随 App”解释；不过它不是 Apple 明示类别中的典型产品，且 Owner 要求地区公开发布时即具备清晰收费能力。因此它只保留为非美临时后备，不作为全球首发策略。

## 规则分类：Rillora 属于什么

### 默认分类

`Rillora Family = 消费级、单用户／家庭、跨平台数字 SaaS 订阅`

它会解锁或持续提供：

- 更多或持续维护的私有 Matter 能力；
- 家庭／可信联系人协作；
- 版本、复核和长期维护能力；
- Web 与 iOS 共同使用的云端权益。

这些价值在 App 内被使用，因此 Apple `3.1.1` 的一般规则仍是 StoreKit/IAP。网站购买后的跨平台访问可以存在，但非例外 storefront 的 App 内不能因此任意加入外部购买入口。

### 不得用来包装 Family 的例外

- 不把 Family 声称为“现实世界服务”；
- 不把 Stripe 交易伪装成捐赠、打赏、金融转账或实体商品；
- 不把个人／家庭销售伪装成 enterprise-only；
- 不把未来律师、设置协助或证据审阅与 Family 捆绑成一个 Stripe SKU，以此解锁软件功能；
- 不在嵌入式 WebView 或原生 Stripe PaymentSheet 内售卖 iOS 数字订阅来制造“看起来没离开 App”的路径。

### 可以独立使用 Stripe 的未来服务

如果未来开放一项真正实时、1:1、由真人交付的设置协助或咨询服务，它可以作为独立服务商品研究外部支付。但必须同时满足：

- 服务 SKU、发票、收入和退款与 Family 软件分开；
- 购买人主要支付真人服务，而非借服务费解锁数字权益；
- 不承诺律师、公证、死亡证明审核或法律效力，除非相应专业和法域门另行通过；
- 一对多课程、录播内容或预制材料不自动继承该例外。

## 地区决策矩阵

| Storefront | App 内可见购买路径 | 结账渠道 | Rillora 决定 | 主要风险／限制 |
| --- | --- | --- | --- | --- |
| 美国 | 用户明确进入套餐或 Family 能力后，可出现通往外部网站的按钮／链接 | Safari／默认浏览器中的 Rillora 页面 + Stripe Checkout | Global 首发主路径 | 政策变化、审核员分类、Web 转化损耗、Rillora 自负 merchant 义务 |
| 日本 | iOS 26.2+，申请 entitlement 后可提供 alternative payment／out-of-app offer，但每个购买页面必须同时提供 IAP | Stripe 可作为候选 PSP；仍有 10%／21% App Store commission 或 10%／15% store-services commission、报告和自负税务 | 首发用 StoreKit；有规模后再重评 Stripe | 双选项、系统披露、月报、Apple 发票和客服税务复杂度 |
| 巴西 | iOS 26.5+，申请 entitlement 后可提供 alternative payment／out-of-app offer，且必须同时提供 IAP | Stripe 原理上可承接；仍有与日本相近的 Apple 佣金／报告结构 | 首发用 StoreKit；有规模后再重评 Stripe | 新规则、双选项、交易报告、税务和本地消费者义务 |
| EU／EEA | 仅在适用 entitlement 和条款下按 Apple 指定流程通信外部优惠 | 外部支付，但另有 Apple 费用、报告及消费者告知 | 首发关闭；未来优先 StoreKit | 不是零 Apple 费；EU VAT ID、条款、技术、税务和支持复杂度高 |
| 韩国 | 韩国专用 binary 与 entitlement；外部支付 App 不能同时使用 IAP | 预批准 PSP 为 KCP、Inicis、Toss、NICE；其他 PSP 要另行审查 | 首发用 StoreKit，不为 Stripe 拆韩国专版 | Apple 26%佣金、专用 binary、单 PSP、Stripe 非预批准 |
| 荷兰 | 一般 App 不适用当地约会 App 外部支付 entitlement | StoreKit | 按普通 EU 路线 | Rillora 不是 dating app |
| 俄罗斯 | Apple 文档存在 external-link entitlement，但 Apple 自 2026-04-01 起停止当地媒体服务支付处理，且 Stripe 不支持俄罗斯商户路径 | 当前不作为 Stripe／收费首发市场 | 关闭 | 制裁、支付可达性、运营和支持风险 |
| UK、加拿大、澳洲、新西兰、新加坡等 | 当前一般规则下不在 App 内外链销售相同数字权益 | StoreKit；或 App 内无 CTA 的既有订阅访问 | 逐市场过门 | 不能把美国规则外推；伴随模式仍需审核接受 |
| 中国大陆 | 不使用美国外链例外 | StoreKit 中国大陆 | 大陆收费 App 主路径 | App 备案、主体／许可、IAP费率、数据与本地运营门 |

Storefront 判断必须使用 Apple 提供的 App Store storefront／StoreKit 信息，而不是 IP、GPS、系统语言或用户自报。App Store 可用地区还应先限制为已通过的市场，避免同一 binary 在未设计的 storefront 暴露购买入口。

## “美区用户”到底如何判断

### iOS 购买界面：看 App Store storefront

App 不应也不能直接读取用户完整 Apple ID 资料。购买界面需要的是 StoreKit 的 `Storefront.current`：它表示设备当前用于 App Store 产品购买的 storefront，受用户 **Media & Purchases／App Store Apple Account 的国家或地区**影响。`countryCode` 是 ISO 3166-1 alpha-3；美国是 `USA`，不是 `US`。

实现规则：

1. 每次准备显示套餐、价格或购买按钮前，重新读取 `await Storefront.current`；
2. `countryCode == "USA"` 才可能进入美国外部购买候选；
3. 监听 `Storefront.updates`，变更时清空当前产品和路线并重新求值；
4. `Storefront.current == nil`、网络失败、未知代码或服务端策略缺失时失败关闭，不显示 Stripe CTA；
5. 不用 IP、GPS、Locale、系统语言、SIM、时区或普通 iCloud 账户地区替代；
6. 不把 storefront 长期保存为用户画像或营销属性。Apple 明确指出 storefront 可随时改变，也不应与客户资料一起保存。必要的交易审计只记录当时采用的 `purchase_route_policy_version` 和实际 provider；Apple 交易本身的 storefront 由签名交易／服务器通知提供。

### 法律、税务和服务资格：不能只看 storefront

“美区 App Store”不等于“美国居民／美国税务客户”。一个居住在法国的人可以使用美国 storefront，一个居住在美国的人也可能仍使用其他 storefront。因此必须分开四个信号：

| 信号 | 用途 | 不能证明什么 |
| --- | --- | --- |
| `apple_storefront`（瞬时） | 决定 iOS 能否显示外部购买 CTA、加载哪些 IAP Product | 实际居住、税务居民、法律适用地 |
| `service_market`（用户声明＋服务端 allowlist） | 决定 Rillora 是否在该法域提供付费服务和哪版条款适用 | App Store 支付规则 |
| `billing_country`（支付时由 Stripe／Apple取得） | 间接税、支付风控和账单记录 | 永久居住或国籍 |
| `active_subscription.provider` | 决定在哪里续费、取消、退款和管理 | 用户现在所在地区 |

购买资格是四者的交集，不是任何一个字段单独决定：

`route = storefront_policy ∩ service_market_policy ∩ provider_availability ∩ existing_subscription_state`

首发时，美国 Stripe 路线应同时满足：当前 storefront 为 `USA`、Global 服务市场允许该用户购买、没有其他活动 Family 订阅、Stripe checkout 对该服务市场开放。billing country 在 Checkout 中收集并用于税务／风控，不能在 App 内靠 IP 猜测。

## Stripe 与 StoreKit 如何同时存在

### 推荐：同一后端并存，单个用户只看到一条新购路径

Stripe 与 StoreKit 应共同接入一套服务端 catalog、subscription、entitlement 和 finance ledger，但不在同一普通购买页面让用户随意二选一。客户端先询问服务端 `purchase-route`，服务端返回一条有效路径：

```text
已有活动订阅？
  ├─ Stripe -> 显示当前权益；管理入口指向 Rillora billing portal
  └─ Apple  -> 显示当前权益；管理入口指向 App Store subscriptions
没有活动订阅？
  ├─ storefront=USA 且服务市场通过 -> stripe_web_external
  ├─ StoreKit Product 在当前 storefront 可售 -> apple_storekit
  └─ 其他 -> none（购买暂不可用）
```

必须满足：

- `one household + one paid tier + one active renewal provider` 的服务端唯一约束；
- 打开 Stripe Checkout 或 StoreKit purchase 前都先重新查询 active subscription，并使用 purchase lock／idempotency key；
- Stripe webhook 与 App Store Server Notifications V2都规范化为同一生命周期状态，但保留 provider、原始外部ID和不可改写流水；
- 回跳 URL、客户端本地成功状态或单条 webhook 都不能直接赋权；
- 用户换 storefront 时不自动取消、迁移或重新购买。原 provider 继续续费；要换渠道，先取消旧渠道，等 paid-through date 到期后再开放新渠道；
- 已在 Web／Stripe 购买的用户可以登录 iOS 使用既有权益。在普通非美 storefront 内，App 不引导其去网站购买；若按 multiplatform services 路线提供访问，等价 Family 订阅也应在该 storefront 通过 IAP 可得；
- App Store Connect 可以按国家／地区设置 IAP 和订阅可售范围，不能假设一个 StoreKit Product 自动适用于全部市场。

## 还有哪些地方可以采用 Stripe

| 表面／商品 | Stripe 可用性 | Rillora 当前决定 |
| --- | --- | --- |
| Global Web／PWA／移动浏览器 | 可在已通过 Rillora 法律、税务、支持和 provider 风控的服务市场使用；Stripe HK 商户可以面向全球客户收款，但不是所有国家都自动合规 | Global Web 主支付候选；服务器 market allowlist 决定可售地区 |
| 美国 App Store iOS | 可在明确购买意图后打开系统浏览器中的 Rillora Web + Stripe | 首发主路径 |
| 日本／巴西 App Store iOS | 原理上可作为 entitlement 下的 alternative PSP／out-of-app offer；仍需同时 IAP、披露、报告和 Apple 费用 | 首发不用；待有规模、当地转化和运营能力后重评 |
| EU／EEA App Store iOS | 原理上可在适用 Apple 条款／entitlement 下使用 | 首发不用；优先 StoreKit，独立做 EU 商业模型 |
| 韩国 App Store iOS | 第三方支付原理上可用，但 Stripe 非 Apple 预批准 PSP，且需韩国专版和26% Apple佣金 | 不采用 |
| 普通非美 iOS storefront | 网站本身可以卖，但 App 内不能放 Stripe 购买 CTA；既有 Web 订阅可按规则登录使用 | App 内 StoreKit，Web 独立获客时可用 Stripe |
| macOS 独立下载版／Web App | 不经 Mac App Store 销售的 Web／直接分发软件可研究 Stripe；Mac App Store 内数字解锁仍受 IAP规则 | 后期表面，不是首发依赖 |
| 真正实时 1:1 真人服务 | 可作为独立服务 SKU 使用外部支付 | 只有专业资质、交付、保险和法域门通过后才开放；不得捆绑 Family 解锁 |
| App 外消费的实体／现实服务 | 应使用外部支付 | 当前无此商品 |
| 中国大陆 Global Web | Stripe HK 技术上可能显示部分跨境方式，但不能替代大陆主体、备案／许可、本地支付、数据与税务要求 | 不作为大陆绕行方案；大陆 Web 仍走本地合规支付 |
| 未来 Android／其他商店 | 各商店有独立计费和引导规则 | 到平台立项时重新审核，不能继承美国 iOS 结论 |

Stripe Checkout支持订阅和多种本地支付方式，但“可显示”不等于“可自动续费”；例如部分钱包在 Checkout subscription mode 不支持。Family 首发应优先卡、Apple Pay／Google Pay等已确认支持 recurring 的方式，再按商户国家、币种、退款和续费能力逐一启用，不能把“100+ payment methods”直接当作“100+订阅方式”。

## 美国首发的推荐体验

### 用户路径

1. App 仍以产品和永久 Free 能力开始，不在首页展示价格或“省苹果税”。
2. 用户主动打开 `Plan & access`，或尝试一个命名明确的 Family 能力。
3. 服务端／App Store storefront 同时表明用户处于美国可售市场后，展示价格、月／年付和 `Continue on rillora.xyz`。
4. 点击后通过系统默认浏览器打开 `https://rillora.xyz/subscribe`（最终生产路径待域名与安全审查），不在 WebView 或 Stripe 原生 PaymentSheet 内完成数字订阅。
5. Stripe Checkout 显示运营者、金额、周期、自动续费、取消、退款和法律链接；支付由 Stripe 托管页面完成。
6. Stripe webhook 经签名、幂等和乱序处理后写入 `subscription_state`、财务流水和 `entitlement_grant`。
7. 通用链接／返回 App 只用于提示刷新；是否获得 Family 权益始终由服务端查询决定，不能相信回跳 URL。
8. App 提供 `Restore access / Refresh purchase`，在同一账号登录后跨设备恢复；不要求再次购买。

### 非美国表现

- 隐藏外部购买 CTA，不只是让按钮点击后报错；
- 已经在 Web 合法购买的用户可以登录和使用已获得权益，但 App 内不出现引导其去网站购买的文案；
- 若该市场要在 iOS 内转化，启用 StoreKit adapter，并通过同一 entitlement ledger 防止重复订阅；
- EU entitlement 或其他地区例外只能作为独立、版本化 storefront policy，不能用一个全局 feature flag 打开。

### App Review 说明包

提交美国 storefront 前，审核说明应包含：

- Rillora 是消费级数字规划 SaaS，不声称 Reader App 或实体服务例外；
- 外部链接只在美国 storefront、明确购买意图后显示；
- 非美 storefront 的截图／测试说明证明入口被隐藏；
- 审核测试账号、套餐入口路径、网站结账路径、退款／取消入口和隐私／条款 URL；
- Web 购买与 App 权益同步的测试步骤；
- 没有隐藏支付页面、浏览器欺骗、误导低价比较或在 App 外收集 Apple 凭据。

当前公开文档没有给出对 Rillora 的预先批准机制。即使规则文字支持，美国外部支付仍必须以真实 App Review 结果为发布证据；在审核通过前只能写“计划采用”，不能写“Apple 已允许 Rillora”。

## US$99 年付单位经济比较

以下只比较可公开建模的渠道组件，不包含消费税、退款、拒付、支持、会计、汇率差异和 Rillora 自身所得税。

| 路径 | 选定公开组件 | 估算费用 | 费用后余额 |
| --- | --- | ---: | ---: |
| Apple SBP／15% | 15% | US$14.85 | US$84.15 |
| Apple 标准首年／30% | 30% | US$29.70 | US$69.30 |
| Stripe HK 国际卡＋Billing | 3.4% + 0.5% + 0.7% + US$0.30 | US$4.85 | US$94.15 |
| Stripe 同上＋Tax Basic | 上述 + 0.5% | US$5.35 | US$93.65 |

与 Apple 15% 情形相比，Stripe＋Tax Basic 每个 US$99 年付表面多保留约 **US$9.50**。因此，如果外部 Web 路径的购买转化率至少维持 IAP 路径的约 **89.9%**，在只比较以上渠道组件时，它的总净收入不低于 Apple 15%：

`84.15 ÷ 93.65 ≈ 89.9%`

这意味着它可承受约 10.1% 的相对转化损失；相对 Apple 30% 情形则可承受约 26.0%。但这不是选择 Stripe 的充分条件，因为 Stripe direct 会额外带来：

- 销售税／VAT／GST 注册、判定、申报与记录；
- 退款、拒付、欺诈、支付失败和账单支持；
- 订阅取消、续费提醒和消费者法要求；
- 香港经营、银行、会计、PRC 全球所得和跨境税务处理；
- 浏览器跳转造成的转化损失；
- App Review 与政策变化风险。

真正要比较的是：

`渠道贡献 = 有效购买意图人数 × 结账转化率 × 单笔净贡献`

而不是只比较 `15%` 和 `4.6%`。

## 工程架构决定

### Stripe 是商业系统，不是权益真相源

共享模型继续保持：

`catalog_product -> plan_version -> capability -> price -> storefront_product -> subscription -> entitlement_grant -> financial_transaction`

新增／保留的地区和路由字段至少包括：

- `service_market_code`、`storefront_policy_code`、`purchase_route_policy_version`；
- `purchase_route = stripe_web_external | apple_storekit | web_direct | none`；
- `external_offer_allowed`、`external_offer_reason`、`effective_from/to`；
- `provider_customer_id`、`provider_subscription_id`、`provider_event_id`；
- `renewal_provider` 与“同一 household／plan 同时最多一条活动自动续费”的数据库约束；
- Apple签名交易／服务器通知原生携带的 `transaction_storefront` 可随不可变支付流水保存；Stripe 路由前读取的瞬时 storefront 不进入用户画像；
- `gross`、`tax`、`provider_fee`、`refund`、`dispute`、`settlement_net`；
- `entitlement_source`、`entitlement_effective_at/expires_at/revoked_at`。

Stripe、StoreKit、Paddle 和大陆支付都只能作为 provider adapter。客户端不能根据 Stripe success URL、StoreKit 本地状态或一条 webhook 单独赋权；服务端账本必须处理签名、重放、乱序、重复事件、退款、争议、宽限期、撤销、账号合并和重复订阅。

### 需要的产品事件

- `plan_access_viewed`，带 route 与 policy version，不带可用于用户画像的原始 storefront；
- `checkout_route_presented`；
- `external_checkout_opened`；
- `checkout_completed`；
- `entitlement_activated`；
- `checkout_abandoned`（只用第一方最小化信号）；
- `renewal_succeeded/failed`；
- `refund_or_dispute_created`；
- `duplicate_subscription_prevented`。

不得把完整支付资料、卡号、Stripe 页面字段或 Apple receipt 原文写入产品分析事件。

## 发布顺序

### Phase 0 — 已完成的本地可逆工程门

1. 已完成 provider-neutral catalog、price、storefront policy、subscription、entitlement 和 finance ledger；
2. 已把美国 Stripe 外部结账、非美隐藏、StoreKit fallback 写成 disabled versioned policy；
3. iOS已用`Storefront.current`读取当前三位storefront、监听`Storefront.updates`并在变更时重新向服务端求值；Web与iOS均验证服务端安全边界并失败关闭；
4. 数据库已阻止同一家庭／套餐存在两条活动续费provider，并用跨记录外键约束price、plan、order、attempt、settlement与refund交易谱系；
5. 本阶段没有创建Stripe商品、接受Apple付费协议、连接支付SDK、部署商业迁移或收款。

### Phase 1A — 已完成的本地合成provider门

1. 已定义Stripe／Apple共享的最小provider signal、权威subscription snapshot与对账结果合同；通知本身明确不能赋权；
2. Stripe测试夹具验证未修改body上的HMAC、轮换secret、时间窗、大小上限与`livemode=false`，只保留归一化外部引用和digest；
3. Apple测试夹具验证外层notification以及内层transaction／renewal的固定测试公钥ES256 JWS、bundle、environment和subject，并拒绝Production与`x5c`；
4. 纯对账器已覆盖重复、乱序、过时snapshot、grace、cancel-at-period-end、past-due、expired、refund、revoke以及同provider／跨provider重复活动订阅冲突；
5. 上述Apple夹具不是生产Apple PKI验证：真实V2通知包含`x5c`证书链，生产必须使用Apple App Store Server Library或经安全审阅的同级实现。上述Stripe夹具也不是Stripe官方SDK、真实account或生产webhook endpoint；
6. 本阶段没有写账本、创建权益、连接真实provider、部署staging或收款；API本地回归为`67 / 67`。

### Phase 1B — 已完成的官方Stripe禁售测试适配门

1. Stripe MCP已回读并硬绑定独立Rillora测试Account `acct_1U6B2RCxTlowhyiG`，不得接触FanPass；
2. 测试模式已创建一个Family Product和月／年两条Price，本地目录只以`test_only`保存Account／Product／Price引用，所有market／route仍关闭；
3. 官方Stripe Node SDK适配器已实现raw-body签名验证、权威Subscription查询、Account／Customer／metadata／Product／Price绑定、服务端Price选择、Checkout幂等和Portal Customer边界；
4. live key／object、partial configuration、跨域return URL、trialing、未知状态、异常host和任何映射不符均失败关闭；callback和success URL仍不能赋权；
5. 2026-08-20非秘密门前加固又将API key边界从“测试key”收紧为仅`rk_test_`，固定SDK API contract `2026-07-29.dahlia`，为Checkout增加绑定服务端幂等键的稳定`integration_identifier`，继续不传`payment_method_types`，且在无税务登记时保持`automatic_tax=false`；
6. 本阶段没有生成API／webhook secret、挂载HTTP支付入口、创建Customer／Checkout／Portal／webhook、写账本、部署staging或收费；当前API完整回归为`78 / 78`。

### Phase 1C — Stripe测试秘密、durable executor与美国支付沙盒（完成测试生命周期）

1. 已经Owner安全门确认生成最小权限`rk_test_`与独立测试Webhook `whsec_`，并分别直接写入两个AWS Secrets Manager secret；Restricted Key实际只给`Checkout Sessions: Write`、`Customer Portal: Write`和`Subscriptions: Read`。Stripe当前`Core: Read`会继承Balance／Customers等广泛读取，因此没有为了`GET /v1/account`扩权；账户隔离由控制面精确回读和账户专属Product／Price／Customer／Subscription引用共同失败关闭；
2. 已新增独立最小权限`continuity_commerce`角色、全局最小事件inbox、Customer／provider-object link和reconciliation记录；普通`continuity_app`不能写inbox，该角色也不能写权益grant，且未持久化前Webhook不得返回成功；
3. 已部署raw-body webhook、认证后的Checkout／Portal入口，并完成测试卡订阅、Customer Portal取消、全额退款、重复投递、fraudulent dispute的revoke／won恢复，以及subscription-linked账单失败past_due／恢复active。Refund／Dispute都经Charge→Invoice Payments→Invoice parent Subscription做权威关联；所有reconciliation仍`entitlementMutationApplied=false`，普通access保持Free，sales／route／entitlement-mutation开关继续关闭；
4. 完成真实香港经营／税务／银行／Stripe KYC门与美国Privacy、Terms、Subscription、Cancellation、Refund法律审阅，之后才可规划live activation；
5. StoreKit sandbox启动前完成Apple Paid Apps Agreement／税务／银行门；生产App Store Server Notifications使用Apple真实`x5c`信任链与官方Server Library或经审阅的同级实现；
6. 验证webhook／notification重放、退款、争议模拟、取消、宽限期、跨端恢复和单续费provider约束；
7. 为美国外部结账做小屏、VoiceOver、网络中断和回跳测试，并产出App Review说明包与非美入口隐藏证据。

### StoreKit SK0 — 本地Xcode订阅基础（购买／取消／退款撤销／签名状态／续订更新已完成，剩余生命周期开放）

1. `apps/ios/StoreKit/Rillora.storekit`在一个订阅组中定义月付`com.rillora.family.monthly`和年付`com.rillora.family.annual`，不开Family Sharing；本地配置不会上传App Store Connect；
2. 独立`RilloraStoreKitLocal` Debug Scheme才启用该配置、4181合成API／planner和local-test flag；普通Debug／Release不启用本地测试界面，配置文件可供Debug同步且从Release产物明确排除；
3. iOS适配器已实现精确商品／订阅组加载、`appAccountToken`、购买结果、`Transaction.updates`、`Transaction.currentEntitlements`、验证后的transaction／renewal-info status、`Product.SubscriptionInfo.Status.all`更新和显式`AppStore.sync()`；
4. local transaction／subscription status必须同时匹配合成规划者UUID、Family product allowlist、订阅组`D7BCE9A1`、Xcode环境和当前storefront才会记录；unverified或不匹配结果不finish／不显示，状态本身永不赋权；
5. migration `0027`只增加`storekit / test / USA / test_only`目录绑定，不启用market、route、sale或entitlement mutation；
6. XcodeGen、Scheme回读、Debug build-for-testing与fresh Release build已通过，Release app不含`.storekit`；booted Simulator已完成年／月付、本地current entitlement、用户取消、退款／撤销、`Subscribed`／`Revoked`状态和重复加速续订更新，普通`commerce-v1`始终Free。Xcode已更新到26.6，最终iOS 26.5套件为`94 passed / 0 failed / 1 skipped`；唯一skip仍在干净iOS 26.4／26.5复现StoreKitTest Code 3，Apple所述iOS 26.6 Simulator修复因runtime当前不可下载而未验证；
7. 一次月付在两秒加速配置下产生49个verified local transaction updates并最终回到0个current entitlement；后续Xcode Run／transaction manager又用Ask to Buy系统页、过去日期和30秒／5分钟续费窗口产生App可见`pending / expired / billing retry / grace`，并在所有状态下保持普通Free；
8. 运行中的Default Storefront从USA切到Canada后，两项商品无需重启即更新为`CA$`，服务端对`CAN + GLOBAL_US`返回`none / storefront_not_eligible`且不持久化storefront。显式restore随后在Xcode本地环境完成：Apple系统弹层明确说明只是模拟Apple Account认证，确认后App报告历史已刷新，本地交易／权益均为0且普通权益继续Free。这不证明真实App Store／Sandbox Apple Account认证；
9. 详细合同与下一步见[`storekit.md`](storekit.md)。

真正Apple sandbox仍是后续门：Owner处理Paid Apps Agreement、银行／税务与App Store Connect商品后，服务器再用Apple官方App Store Server Library验证真实`x5c`、接入Server API／Notifications V2并继续保持普通entitlement mutation关闭。

### Phase 2 — 受控真实审核与收费

1. 任何 Paid Apps Agreement、Stripe 正式开户、真实商品和首笔收费仍由 Owner 在钱／法律门确认；
2. App Store 先只开放美国 storefront，并使用 manual release；
3. 审核通过后做 10–25 笔可退款受控交易，逐笔对账；
4. 记录 `IAP 假设净收入` 与 `Stripe 实际转化／净贡献`，到足够样本后再判断是否为其他市场同时开发 StoreKit；
5. 若 App Review 拒绝外部路径或转化显著低于 89.9% break-even，启用 StoreKit fallback，而不是隐藏或伪装结账。

### Phase 3 — 地区扩展

- 非美市场逐个增加 StoreKit 或满足当地 entitlement 的路由；
- EU 单独建模 Apple 外部购买费用、报告、消费者支持和税务，不继承美国实现；
- 中国大陆继续按独立 App、StoreKit、本地数据和备案／许可轨道发布；
- 不让一个用户同时持有两条自动续费、重复收费的 Family 订阅；迁移或切换必须显示当前渠道和取消顺序。

## 推荐决定

1. **采用 Stripe-first 的美国 Global 商业路线。** Global Web 和美国 iOS 都通过 Rillora Web + Stripe Checkout 收费。
2. **StoreKit 从“Global iOS 首发默认”改为“非美／大陆默认和美国审核 fallback”。** 代码架构仍必须保留 adapter，避免未来重构权益。
3. **美国 App Store availability 首发只开美国。** 加拿大、澳洲、英国、EU 等不因为英语可用就自动开放。
4. **不在 App 首页或 Account 首屏放价格／Stripe。** 购买入口仍只在明确方案意图或命名 Family 能力之后出现。
5. **不把这一策略描述为避税。** Apple 佣金是渠道费，Stripe 路线仍有税、merchant、退款、拒付与合规责任。
6. **不把未来真人服务捆绑为软件支付漏洞。** 1:1 服务独立建模和核算。

## 仍待回答的问题

- Apple 实际审核是否接受 Rillora 当前美国外部结账呈现和文案；
- Stripe 对 Owner 的真实香港经营链、产品类别和美国消费者订阅是否完成 KYC／underwriting；
- 外部浏览器结账的真实移动转化是否能保持 IAP 假设的 89.9%以上；
- 美国州级自动续费、取消、退款和销售税义务的首发法律审阅结果；
- Apple 政策或美国法院命令变化时，现有客户迁回 StoreKit 的最终告知与操作流程；底层单续费provider约束已实现，真实迁移仍未验证；
- 非美 App 是否采用 StoreKit，还是以无购买 CTA 的伴随模式阶段性提供访问。

## 证据边界

本报告是 2026-08-19 的规则和商业建模快照。它不证明 Apple 已批准 Rillora、不保证美国规则长期不变、不构成香港／美国／中国大陆法律或税务意见。Owner已单独授权创建Stripe非直播测试目录；这不授权签署付费协议、完成KYC、开启live mode、提交App Review或收取真实款项。

## 官方来源

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple 2025-05-01 美国审核规则更新](https://developer.apple.com/news/?id=9txfddzf)
- [Apple StoreKit Storefront](https://developer.apple.com/documentation/storekit/storefront)
- [Apple Storefront.current](https://developer.apple.com/documentation/storekit/storefront/current)
- [Apple Storefront.updates](https://developer.apple.com/documentation/storekit/storefront/updates)
- [Apple 按国家／地区设置 IAP 可用性](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-availability-for-in-app-purchases/)
- [Apple 日本 App Store 支付选项](https://developer.apple.com/support/payment-options-on-the-app-store-in-japan)
- [Apple 巴西 App Store 支付选项](https://developer.apple.com/br/support/payment-options-on-the-app-store-in-brazil/)
- [Apple 韩国第三方支付](https://developer.apple.com/support/storekit-external-entitlement-kr)
- [Apple 荷兰约会 App 外部支付](https://developer.apple.com/support/storekit-external-entitlement/)
- [Apple 欧盟外部优惠通信条款与费用](https://developer.apple.com/support/communication-and-promotion-of-offers-on-the-app-store-in-the-eu/)
- [Apple Reader App entitlement](https://developer.apple.com/support/reader-apps/)
- [Apple 管理 App Store 地区可用性](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store)
- [Stripe iOS 订阅与 App Store 规则提示](https://docs.stripe.com/billing/subscriptions/build-subscriptions?payment-ui=mobile&platform=ios)
- [Stripe Checkout](https://docs.stripe.com/payments/checkout)
- [Stripe payment method support](https://docs.stripe.com/payments/payment-methods/payment-method-support)
- [Stripe global availability](https://stripe.com/global)
- [Stripe Tax customer location](https://docs.stripe.com/tax/customer-locations)
- [Stripe Hong Kong pricing](https://stripe.com/en-hk/pricing)
- [Stripe Tax pricing](https://stripe.com/tax/pricing)
- [Stripe Merchant of Record 说明](https://stripe.com/resources/more/merchant-of-record)
- [Spotify iOS 订阅说明](https://support.spotify.com/sg-en/article/cant-subscribe-to-premium-in-the-ios-app/)
- [Netflix iOS 注册说明](https://help.netflix.com/en/node/112419)
- [1Password Apple subscription](https://support.1password.com/apple-subscription/)
- [Dropbox iOS App Store listing](https://apps.apple.com/us/app/dropbox-cloud-photo-storage/id327630330)
