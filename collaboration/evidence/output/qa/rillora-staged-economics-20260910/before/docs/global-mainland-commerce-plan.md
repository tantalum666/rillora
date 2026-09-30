# Rillora 全球版与中国大陆版收费发布总计划

Role: 全球／中国大陆运营、支付、云部署、税费、法律与收费发布的聚焦权威  
Authority scope: Apple IAP、Stripe/Paddle、香港个人经营路径、中国大陆云与支付、地区隔离、收费发布顺序、预算与上线门槛  
Superseded by: 适用法律、平台／支付／云服务商正式审核结果、签署合同、真实税务居民事实，或 `docs/decision-log.md` 中更新的 Owner 决定  
Do not use for: 个案法律／税务意见、服务商报价、许可证必然获批证明、真实付款授权或公开发布授权  
Status: 中文执行版完成；架构与顺序已定；Global角色邮箱组织／个人两步验证、内部闭环、三条Gmail外部往返及监控目标已完成有限证据门；长期SLA表现、价格、主体、合同、采购、备案和首次真实收费仍是 Owner 资金／法律门  
Last reviewed: 2026-09-10 (current-decision alignment only; dated legal, fee and financial research is not a fresh revalidation)

## 当前价格覆盖 — 2026-09-10

主路线改为US$49/年、US$6.99/月的自助Family验证价。下文99与¥698渠道算例均为历史研究，非当前报价。[新版经济合同](unit-economics.md)加入美元出款、Free／留存人群和劳动成本。旧逐项确认字样服从AGENTS最新默认授权；真实本人交互、实际商户与生产证据仍独立。

## 一句话决定

Rillora 的**每个地区首次公开发布都必须同时具备真实订阅能力**，但全球版和中国大陆版不要求同日上线：Global先建立真实个人运营／收款路径，再同时开放市场登记表中全部已通过的英语／StoreKit地区；`USA`与`HKG`是首波核心候选而不是自动通过项。中国大陆只有在运营主体、经营性互联网信息服务分类、App／ICP备案、本地数据平面和本地支付全部通过后才单独发布收费版。

首发仍保留永久 `Free`，只开放一个付费权益层级 `Rillora Family`；“发布即能收费”不等于“用户一进入就被要求付费”。价格只在用户主动查看方案或使用明确的 Family 能力时出现。

2026-08-27，Owner已私下提供个人运营者姓名、香港居住／税务国家输入和候选地址，并确认个人运营、香港法候选、责任cap、按渠道退款、长期保留、独立购买同意及`USA / HKG`首波意图。项目不得把这些私人值写入仓库；候选住址也不自动成为公开服务地址。Owner随后明确：当前Agent任务是让条款尽量符合适用法律并最小化个人信息，不是判断签证／NOL／自雇或商业登记资格。相关运营许可结论留给Owner、主管机关或合资格顾问，不作为本轮条款起草的下一步。

## 已定路线

| 决策面 | 全球版 | 中国大陆版 |
| --- | --- | --- |
| iOS 数字订阅 | 美国 storefront 使用系统浏览器中的 Rillora Web + Stripe Checkout；StoreKit 保留为审核后备与未来非美适配器 | Apple StoreKit / In-App Purchase，中国大陆 storefront 规则 |
| Web 订阅 | Stripe Hong Kong direct 为主；Paddle MoR 为合规进度后备 | 微信支付＋支付宝为首发候选；银联／云闪付后置 |
| 运营主体 | Owner 个人维持首发；满足条件后以真实香港个人独资业务经营，不成立有限公司 | 在主管部门书面分类结果前不假设个人备案足以支持有偿 SaaS；很可能需要大陆经营主体或合规合作主体 |
| 数据 | 独立 Global 数据平面；生产区尚待最终门 | 阿里云华南 1（深圳）独立数据平面；不从 Global 自动迁移或同步敏感计划 |
| 身份 | Auth0／Apple／Google／email 适配器 | 大陆兼容身份适配器，不把 Auth0 可用性当成前提 |
| 首个付费市场 | 使用版本化ready-market allowlist；`USA`与`HKG`是首波核心候选，其他通过全部门的地区可同批开放；EU/EEA、UK、中国大陆及特殊规则地区逐行过门 | 仅在大陆全部门通过后开放；不借全球版域名或香港身份绕过 |
| 发布节奏 | 目标 10–14 周达到受控收费发布 | 目标 16–24 周，且从大陆主体／许可分类门通过后计算 |

这些时间是项目排期，不是监管或平台审批承诺。

## Apple 应用内购买：佣金不是“税率”

Apple 的 12%／15%／25%／30%首先是**平台佣金率**，不是个人所得税、企业所得税或全部消费税。App Store 的实际开发者收入一般按以下顺序理解：

`开发者实收 = 用户价 - 适用消费税／VAT／GST等 - Apple佣金 - 退款／调整 - 可能的预提税或汇兑差异`

Apple 官方报告把 proceeds 定义为用户价格扣除适用税款和 Apple 佣金后的金额。税务类别选择也会改变估算 proceeds，因此不能简单认为“标价 × 85%”就是最终银行入账。

### 当前佣金情形

| Storefront / 情形 | 自动续费订阅佣金 | Rillora 的建模方式 |
| --- | ---: | --- |
| 中国大陆以外，标准订阅首个付费年 | 30% | 必须作为最差渠道情形保留 |
| 中国大陆以外，同一订阅组累计满一年后 | 15% | 不把它当首年现金流 |
| 中国大陆以外，获批 Small Business Program | 15% 起 | 应申请，但获批前仍按 30% 压力测试 |
| 中国大陆，自 2026-03-15 起标准 IAP／付费 App | 25% | 大陆首年最差渠道情形 |
| 中国大陆，Small Business Program／符合条件的首年后续订阅 | 12% | 获批或满足条件后使用 |

Small Business Program 适用于符合条件的新开发者或前一日历年总 proceeds 不超过 US$1 million 的开发者，但需要 Account Holder 接受 Paid Apps agreement、申报关联开发者账户并完成申请。不能因为 Rillora 规模小就自动按 15%／12%记账。

### 历史US$99佣金算例 — 非当前报价

以下只展示佣金，不包含用户所在市场消费税、退款、汇兑、预提税和 Rillora 自身所得税：

| 情形 | 佣金 | 佣金后余额 |
| --- | ---: | ---: |
| Apple 15% | US$14.85 | US$84.15 |
| Apple 30% | US$29.70 | US$69.30 |
| 中国大陆 Apple 12% | US$11.88 | US$87.12 |
| 中国大陆 Apple 25% | US$24.75 | US$74.25 |

若大陆参考年价为 ¥698，同样的纯佣金演示分别是：12% = ¥83.76、25% = ¥174.50；税款和其他调整仍需另算。

### iOS 必须按 storefront 路由，而不是全球只选一个渠道

Rillora Family 解锁的是 App 内数字权益，所以 Apple `3.1.1` 仍是默认规则。2025-05-01 后，美国 storefront 的 App 可以在无需额外 entitlement 的情况下包含外部购买按钮、链接和行动号召；这使“美国地区路由到外部Web结账”成为美国市场的可执行主路径，但不能外推到其他国家，也不要求其他已通过地区等待美国单独发布。

Global 首发因此改为：

1. App Store availability 只开放当前市场登记表中已通过法律和运营门的 storefront；不再仅限美国，`USA / HKG`也不得自动视为已通过；
2. 公开首页、Account 和普通 Free 路径仍不显示价格；只有用户主动进入 `Plan & access` 或触发一个命名 Family 能力时才出现购买选择；
3. 美国 storefront 使用系统默认浏览器打开 Rillora 自有订阅页，再由 Stripe Checkout 结账；不在 WebView 或原生 Stripe PaymentSheet 中售卖数字订阅；
4. Stripe webhook 只写入共享的服务端 subscription／entitlement／finance ledger；客户端回跳不能直接赋权；
5. 非美国 storefront 隐藏外部购买 CTA。已在 Web 合法购买的用户可登录访问；需要 App 内转化的市场使用 StoreKit；
6. StoreKit adapter、收据／Server Notifications、退款、宽限期和撤销模型继续预留，作为美国 App Review fallback、未来非美市场和中国大陆的正式路径；
7. 中国大陆 App Store 提交前确保 App 备案信息与开发者／运营信息匹配，并使用当地可用价格点。

EU 外部购买不是“零 Apple 费用”路径：它需要适用 entitlement、额外条款、指定 API、交易报告和 Apple 费用，并把支付问题、税务、退款和消费者支持更多地交给开发者。EU/EEA 继续关闭。完整分类、费用和审核包见 [`ios-external-payment-research.md`](ios-external-payment-research.md)。

## 是否把 Apple、Stripe、法务等成本算进价格

答案是**必须**，但要分三层计算，不能把所有成本混成一个百分比：

1. **交易变量成本**：Apple／Stripe／Paddle 费率、固定每笔费用、Billing、FX、退款、拒付、支付失败；直接进入单笔贡献毛利。
2. **用户交易税**：VAT／GST／sales tax 等。Apple 或 MoR 在覆盖范围内通常处理收取／申报；Stripe direct 下 Rillora 仍是 merchant，需自己判断注册、收取、申报和留档。
3. **经营固定成本**：律师、会计、保险、渗透测试、备案、等保、云最低保有量和支持系统；进入年度盈亏平衡，不伪装成每笔支付手续费。

核心公式：

`单户净收入 = 排除消费税的服务收入 - 退款/收入冲回`

`贡献 = 单户净收入 - 渠道费 - 变动服务成本 - Free/留存人群分摊`

`贡献率 = 贡献 ÷ 单户净收入`

`盈亏平衡付费户数 = 年度固定合规/安全/法务/基础设施成本 ÷ 单户年度贡献毛利`

### 历史US$99渠道算例 — 未计美元出款，非当前完整成本

| 渠道 | 使用的公开费率组件 | 估算渠道费 | 渠道费后余额 | 未包含 |
| --- | --- | ---: | ---: | --- |
| Stripe HK，USD结算，国际卡＋Billing | 3.4% + 0.5% + 0.7% + US$0.30 | US$4.85 | US$94.15 | Stripe Tax、税务申报、拒付、退款、支持 |
| Stripe 同上且发生 2% FX | 上述 + 2% | US$6.83 | US$92.17 | 同上 |
| Paddle MoR | 5% + US$0.50 | US$5.45 | US$93.55 | 合同特定 FX、准备金、Rillora 自身所得税／隐私／产品责任 |

Stripe HK 公布的本地卡基础费率为 3.4% + HK$2.35；USD settlement 的公开固定费示例为 US$0.30，国际卡另加 0.5%，需要换汇时另加 2%，Billing pay-as-you-go 另为 0.7%。真实卡种、结算币种和 Stripe Tax 产品费必须以账户报价和交易事实为准。

月付会承担 12 次固定每笔费，因此年付的支付成本和现金流更好。以 US$9.99 月付计算，12 笔 Stripe 上述 4.6% + US$0.30 的全年渠道费约 US$9.11；Paddle 约 US$11.99。年付不能以隐藏自动续费或误导默认选择换取这一优势。

### 建议价格

当前收费发布的**推荐建模基准**改为：

- Global：当前前瞻验证价`US$6.99/月`或`US$49/年`；年付比12个月月付低41.6%。
- 中国大陆：旧`¥68/月`／`¥698/年`只保留为历史假设；当地成本、需求和价格点单独重算，不自动沿用USD。
- 永久 Free 保留；首发没有自动转付费试用。
- 现行直接Web退款候选遵循强制法律或书面例外；早期首购30天保证已被2026-08-27决定取代，只保留为关闭的未来实验。App Store退款按Apple流程。

最新选择是先以较小自助产品验证49／6.99，依据实际可交付范围、较近竞品与成本预算。更高毛利不能证明用户愿付99；较低价格也不自动证明可规模经营。现有支付商品和地区开关未改。

历史扩张目标（非当前结果）：

新版49基准贡献率56.2%，1,000年付户毛利率48.2%；低服务成本情形较好，高成本情形亏损。下列旧目标不能作为已满足事实或用来倒推必须收99。

- 1,000 个付费家庭时的 blended contribution margin 目标至少 75%；
- Apple 30% 等最差渠道下的贡献毛利底线至少 60%；
- 先预留 gross billings 的 5% 作为退款／拒付／坏账保守准备，真实数据形成后再修正；
- 任何法务、云或支持成本增长都必须进入 cohort 毛利和现金跑道，不只看 App Store Connect 的 proceeds。

## Global Web：Stripe 与 Paddle 的最终分工

### 主路径：Stripe Hong Kong direct

Stripe 产品能力更强，适合长期的订阅生命周期、发票、税务工具、Radar、客户门户、对账和未来企业化迁移。Owner 有香港身份证使 HK KYC 路径可研究，但仍需六个事实同时成立：

1. 香港 condition of stay 允许实际经营；
2. 业务真实开始后按要求登记香港个人独资业务；
3. 使用真实香港地址、电话、实体银行和实际运营事实；
4. 香港与大陆税务顾问确认利润来源、PRC税务居民全球所得和境外税抵免；
5. 首发市场的间接税、订阅取消／退款和消费者义务可以运营；
6. Stripe 对真实域名和 Rillora 数字遗产产品完成 KYC／underwriting。

香港个人独资不是有限公司，不违背“产品有起色前不成立公司”的方向；但它仍是需要真实经营和商业登记的非公司业务。香港税务局要求个人独资业务一般在开始经营后一个月内办理商业登记。当前未授权实际登记。

### 后备路径：Paddle Merchant of Record

若到全球发布第 8 周，Stripe direct 所需的税务注册、账单支持或服务商审核仍无法按期完成，Web 收费切换到 Paddle 作为发布后备。Paddle 的公开价为 5% + US$0.50，并在其覆盖交易中承担 MoR、间接税、付款合规和部分 buyer support。Rillora 仍承担产品、隐私、安全、所得税、退款政策边界和用户支持。

### 不采用的首发路径

- Stripe Managed Payments 仍为 public preview，并限制中国买家；不作为首发依赖。
- 不用个人微信／支付宝收款码代替订阅支付、退款、对账、税务和消费者合同。
- 不让 Web 与 iOS 各自生成无法合并的权益；所有渠道只写入一个 provider-neutral entitlement／finance ledger。

## 全球版法律问题怎样在发布前解决

“全球版”是架构愿景，不是第一天开放所有国家。当前首发方向是英语产品与版本化ready-market allowlist；`USA / HKG`为核心候选，其他通过全部门的地区可同批开放。香港经营路径、EU/EEA、UK、中国大陆及其他特别规则仍各自过门，不能把旧美国单区研究当成当前发布锁定。

### 全球收费发布的 10–14 周路径

| 周期 | 操作 | 交付物 | 硬门 |
| --- | --- | --- | --- |
| 第 0–1 周 | 冻结首发地区、运营者、Free／Family权益与当前49／6.99验证价 | 市场登记行、数据流、功能／不功能清单 | Owner 仅确认涉及钱和法律的最终选择 |
| 第 1–3 周 | 香港入境／经营资格、商业登记时点、PRC税务居民和境外收入审阅 | 一份 HK/PRC operator-tax memo | 不得用身份证替代税务结论 |
| 第 1–4 周 | 完成生产数据图、subprocessor清单、保留／删除／备份／legal hold | Data map、ROPA/PIPIA 类记录、DPA清单 | 与真实代码／云配置一致 |
| 第 2–5 周 | 美国市场的 Privacy、Terms、自动续费、取消、退款、免责声明和未成年人规则审阅 | 可发布法律页＋版本号＋同意记录 | 不宣称全球遗嘱效力或自动判定死亡 |
| 第 3–6 周 | Stripe/Paddle KYC、Apple美国外链规则复核、税务类别和银行信息 | provider acceptance/readback＋App Review说明包草案 | 任何真实合同／银行／税务提交由 Owner 完成；Apple尚未批准Rillora |
| 第 4–8 周 | 生产安全评审、渗透测试、事件响应、备份恢复和删除演练 | 可复现证据包 | 高危问题清零；恢复演练通过 |
| 第 5–9 周 | 美国外部Web结账、Stripe/Paddle、webhook、幂等账本、退款／撤销／downgrade；StoreKit fallback合同 | 沙盒端到端证据＋非美CTA隐藏证据 | 支付状态不能触发披露或死亡流程 |
| 第 8 周 | Stripe direct readiness checkpoint | 继续 Stripe 或切换 Paddle 的记录 | 不在第 12 周才发现税务／审核阻塞 |
| 第 9–11 周 | 有限付费 beta、人工观察账单与支持 | 10–25 笔可退款真实交易、对账、取消、退款证据 | 需单独批准首笔真实收费 |
| 第 12–14 周 | 首波ready-market公开收费allowlist | App Store／Web生产、支持、状态页、日对账 | 每个地区的Go/No-go全部通过；不是仅美国或自动开放全部地区 |

### 全球版发布前必须有的文件与能力

- Privacy Policy、Terms of Service、Subscription Terms、Refund/Cancellation Policy；
- 明确运营者法定名称、可接收通知的地址、`support@`／`privacy@`／`security@`；
- subprocessor register 和处理目的、地区、保留期；
- 用户数据访问、导出、更正、删除和账户关闭流程；
- 未成年人门槛和非监护人敏感数据规则；
- 自动续费前披露、明确同意、即时电子确认、自助取消、续费提醒；
- 安全事件响应、用户／监管通知决策树、保险决定；
- Stripe Web主路径与StoreKit fallback共享账本、退款／撤销和重复订阅防护；
- 不把 Rillora 描述为律师、公证、遗嘱有效性保证、死亡登记机关或密码库。

### 全球预算预留

为“融资／收购可尽调”标准预留，而不是最低模板成本：

- 一次性 global paid-launch readiness：US$15,000–40,000；
- 每年会计、报税、保险、法律更新和安全复核：US$5,000–15,000；
- 其中应单独取三份报价：HK/PRC税务、美国消费者／隐私法律审阅、安全测试。

这只是内部预算带，不是服务商报价。若实际报价低于区间，节省部分留作事故／合规准备金；若高于，必须回到市场范围、数据范围或 MoR 路径降复杂度，不能删掉核心安全门。

## 中国大陆版：先解决主体和许可，不先买服务器

中国大陆的关键约束不是技术。现行规则区分：

- 非经营性互联网信息服务实行备案，且不得从事有偿服务；
- 经营性互联网信息服务实行许可；
- 原生 App、小程序、快应用都纳入 App 备案体系，未备案的 App 不应获得网络接入／分发／预置；
- 个人信息保护、敏感个人信息、数据跨境、网络安全等级保护和支付商户审核是另外的并行义务。

因此，个人能办理某些备案，不代表个人身份必然可以经营收费版 Rillora。对于“订阅型个人信息管理 SaaS 是否落入经营性互联网信息服务许可、当地许可主体要求和增值电信业务分类”，必须先取得接入商备案顾问＋所在地通信管理局窗口＋大陆律师三方书面结论。

### 大陆版本的首个硬门

在以下二选一成立前，不承诺大陆收费发布日期：

1. 主管机关和律师书面确认，Owner 以真实个人主体能完成 Rillora 当前收费范围所需的全部备案／许可；或
2. 使用真实合规的大陆经营主体／合作主体，且数据控制、IP、收入、退款、客服、责任和未来迁移合同均清楚。

香港身份、香港个人独资、海外 App Store 账号或境外 Stripe 都不能替代这一门。若门 1 不成立，而 Owner 坚持产品有起色前不设大陆主体，则正确选择是**先发布全球收费版，大陆版继续开发但不公开收费**。

## 中国大陆云：推荐阿里云华南 1（深圳）

### 云厂商比较

| 维度 | 阿里云 | 腾讯云 | 华为云 | 火山引擎 |
| --- | --- | --- | --- | --- |
| 备案路径 | ECS／轻量等规则清楚；华南深圳可用 | CVM／轻量规则清楚 | 可行 | 可行 |
| PostgreSQL | RDS PostgreSQL 高可用、一主一备、跨可用区、自动切换 | 托管 PostgreSQL 可用，但 PostgreSQL Serverless 新建能力已下线 | 成熟，生产建议规格通常更重 | 有高可用 PostgreSQL |
| 安全产品 | KMS、WAF、SLS、OSS、云安全中心完整 | KMS、WAF、CLS、COS完整 | 企业合规能力强 | 性价比有吸引力 |
| 支付生态关系 | 支付宝接入仍需独立商户审核 | 微信支付接入仍需独立商户审核 | 无额外支付优势 | 无额外支付优势 |
| 单人团队运维匹配 | 最佳综合平衡 | 强备选 | 偏重、通常成本更高 | 可作后续成本竞价备选 |

推荐阿里云的原因：Owner 位于大陆／香港附近，深圳区域延迟和支持路径合适；备案、RDS PostgreSQL、KMS、WAF、日志和对象存储可在一个治理平面完成；现有 Global PostgreSQL 领域模型更容易迁移部署。选腾讯云不会自动获得微信支付资格，支付商户仍要独立申请。

### “数据不迁移”的具体含义

- 中国大陆新用户默认落在中国大陆数据平面；
- Global 用户继续留在 Global 数据平面；
- 不做后台批量复制、跨区分析或客服随意跨区查询；
- 用户不能只改地区设置就搬迁敏感计划；
- 未来如做迁移，必须是显式、用户发起、最小范围、带独立同意／影响评估／删除旧副本和迁移回执的项目；
- 产品分析默认采用去标识、区域内聚合；不得把 Mainland 原始 Matter／contact／claim 数据输往 Global。

### 大陆收费发布的推荐生产架构

1. 一台满足备案条件的包年包月 ECS（中国内地、至少 3 个月、公网带宽）；
2. 两个无状态应用实例跨可用区，放在 SLB／API Gateway 后；
3. RDS PostgreSQL 高可用版，主备跨可用区；有限 beta 可 2c4g，公开收费建议 4c8g 起并按指标扩容；
4. OSS 私有桶、服务端加密、KMS 客户主密钥；
5. WAF、TLS、最小安全组、Secrets Manager／KMS、SLS 审计日志；
6. 数据库自动备份＋跨账号备份策略＋季度恢复演练；
7. CDN 只缓存公开静态资产，不缓存私有 API／用户内容；
8. 初期不引入 Redis；只有锁竞争、队列吞吐或缓存指标证明必要时再加；
9. 身份、支付、消息、地图／推送 SDK 采用 Mainland allowlist，不把海外 SDK 原样打包；
10. Terraform/CDK 等基础设施定义保留 Global／Mainland 两套 state 与账户，不能共享生产密钥。

阿里云官方要求在其平台备案时关联中国内地资源；常见 ECS／轻量服务器需要包年包月至少 3 个月并购买公网带宽。ACK／ACS／SLB 不能直接作为备案服务码来源，因此即使应用最终跑容器，也应保留合规的 ECS 备案资源。

### 大陆云成本规划带

| 阶段 | 建议形态 | 月度预算带 |
| --- | --- | ---: |
| 内部／合成 staging | 单实例、基础 RDS、低日志量；不放真实敏感数据 | ¥500–1,500 |
| 受限付费 beta | 双应用实例＋RDS 高可用＋基础 WAF/KMS/日志/备份 | ¥2,500–6,000 |
| 公开收费发布 | 跨可用区应用＋4c8g级 RDS HA＋WAF/KMS/日志/备份/告警 | ¥5,000–12,000 |

以上不是报价。购买前在阿里云配置报价器生成同日 BOM，另加 25% 带宽、日志、备份和突发余量。不得为了省几百元把生产数据库降为单点。

## 中国大陆支付怎样接

### iOS

数字订阅只走 StoreKit，不在 App 内放微信／支付宝购买按钮绕过 IAP。中国大陆 App Store 自 2026-03-15 起按 25%标准佣金，Small Business／符合条件的长期续订按 12%。

### Web

首发支付顺序：

1. **微信支付**：App／H5／Native 场景按实际产品申请；提交营业执照、身份证、结算银行等材料，审核后绑定 AppID／场景。官方指引显示申请本身免费，常见类目交易服务费约 0.6%–1%，以实际类目和合同为准。
2. **支付宝**：使用开放平台的网页／移动应用产品，完成应用、商户、签约、密钥和回调；订阅自动扣款是独立签约能力，不能把一次性支付成功当成已获自动续费资格。
3. **银联／云闪付**：首发后再加，优先采用银联线上收银台或合规收单机构聚合方案；它能补充银行卡覆盖，但不值得在零用户时增加第三套退款、对账和签名协议。

### 自动续费的门

微信／支付宝的一次性收款、委托扣款／商家扣款、周期扣费不是同一产品。只有服务商正式开通相应能力并通过场景审核后，Rillora Web 才能写“自动续费”。未获批时的发布后备是：

- iOS 继续使用 StoreKit 自动续费；
- Web 提供年付预付和到期前主动续费，不伪装成自动扣款；
- 仍然属于真实收费订阅，但 renewal mode 标记为 `manual_renewal`；
- 获得委托扣款资格后创建新的 payment-method capability，不重写历史订阅。

### 支付技术与财务合同

- 后端统一 `order -> payment_attempt -> provider_event -> settlement -> refund -> entitlement_event`；
- webhook 验签、重放保护、幂等键和金额／币种服务端权威；
- provider success 不直接放行敏感数据，只更新订阅权益；
- 每日对账 gross billings、税、渠道费、退款、拒付、净结算；
- 每月把 Apple／Stripe／微信／支付宝／银联结算和银行流水闭合；
- 收据、发票、抬头、退款和客服流程必须与大陆主体及税务方案一致；
- 不存完整卡号、支付密码、Apple/Google 密码或微信／支付宝凭据。

## 中国大陆法律与合规 16–24 周操作表

| 周期 | 操作 | 交付物／通过条件 |
| --- | --- | --- |
| 第 0–2 周 | 产品与信息服务分类预咨询 | 通信管理局／接入商／律师书面分类，明确个人或单位主体、ICP备案还是许可 |
| 第 1–4 周 | 主体与合同路线 | 大陆主体／合作主体、IP、数据控制者、收款、退款、客服和未来迁移协议 |
| 第 2–5 周 | 阿里云账户、深圳区域 BOM、域名实名与备案资源准备 | 只生成报价和清单；购买是 Owner 资金门 |
| 第 3–8 周 | ICP／App备案材料；如需经营许可证则单独申请 | 域名、App名／图标、bundle id、签名、SDK、主办者信息一致 |
| 第 3–8 周 | PIPL数据图、敏感信息规则、单独同意、影响评估、保留删除 | Mainland Privacy、儿童／家庭成员数据规则、PIPIA记录 |
| 第 4–10 周 | MLPS定级评估与备案决定 | 不预先冒充二级；由测评机构／公安窗口确认；如为二级则完成定级备案和整改 |
| 第 5–11 周 | 阿里云独立平面、身份和消息适配器 | 数据不出境、密钥隔离、备份恢复、日志和运维访问证据 |
| 第 6–12 周 | 微信／支付宝商户申请；银联后置 | 商户和场景正式获批；自动扣款能力单独验证 |
| 第 8–14 周 | 大陆 Privacy／Terms／订阅／退款／发票／安全事件流程审阅 | 可发布中文条款和同意记录 |
| 第 10–18 周 | iOS大陆 storefront、App备案号、StoreKit、Web支付沙盒和安全测试 | 完整购买／取消／退款／恢复／对账／降级证据 |
| 第 16–22 周 | 10–25户受控付费 beta | 真实账单、退款、客服、备份恢复和月结证据 |
| 第 20–24 周 | 大陆公开收费 Go/No-go | 许可、备案、支付、数据、安全、支持、税务全部通过 |

若经营许可证或主体准备时间更长，时间线自动延长；不能用先上线后补证代替。

### 大陆预算预留

- 若仅为窄范围预审／受限 beta：¥50,000–150,000；
- 若公开收费且涉及经营许可、PIPL专项、可能的 MLPS 2、渗透测试、支付和正式法律审阅：一次性 ¥150,000–400,000；
- 每年会计报税、合规更新、安全测评／复核、云基础保有和保险：¥50,000–150,000，云使用费另计。

这些仍是风险预算带，不是报价。正式执行前对律师、测评、备案／许可顾问各取至少三份书面报价，报价必须写清服务边界和“不获批”处理。

## 公开收费的统一 Go/No-go 清单

任一地区只有以下全部为 `PASS` 才能公开收费：

1. 运营主体、收款主体、App Store seller、Terms／Privacy 名称一致；
2. 市场 allowlist 明确，未审地区默认关闭；
3. 生产数据流、subprocessor、保留／删除和跨境事实准确；
4. 身份恢复、MFA／passkey、会话撤销和支持流程可用；
5. 备份恢复演练、渗透测试、事件响应通过；
6. StoreKit 和 Web支付沙盒的购买、续费、取消、退款、撤销、grace、downgrade通过；
7. 真实价格、税务类别、发票／收据、服务商结算和每日对账配置完成；
8. Free、Family、月／年和未来层级全部由服务端版本化 entitlement 决定；
9. 付款失败、取消或长时间未登录永远不能触发死亡、失能、失联或信息披露；
10. support／privacy／security 邮箱有人监控并有 SLA；
11. 公开法律页已经由目标法域律师审阅，且版本／同意可追溯；
12. 已批准首次真实收费与退款演练，且现金准备金足以支撑至少 12 个月固定合规和基础设施。

## 商业发布依赖顺序 — 非当前任务交接

这是商业发布的路线图，不是当前工作流的另一套“唯一下一步”。实际任务、已完成节点和最新授权以[handoff.md](handoff.md)与[AGENTS.md](../AGENTS.md)为准。Provider-neutral目录和Stripe测试已完成其记录范围，不重复初始化；实际收费仍需完整产品、运营与渠道证据。

### 轨道 A：未来 14 周完成 Global 收费发布

1. 完成 provider-neutral catalog／price／subscription／finance ledger；
2. 为US$49年付／6.99月付准备新的disabled price version；保留旧测试映射与历史账单，再完成两端实际报价验证；
3. Owner已确认个人运营意图；当前Agent只完成条款、隐私、订阅、退款、责任和最小披露合同，签证／经营许可／商业登记资格由Owner、主管机关或合资格顾问在外部单独处理；
4. 已建立`support@rillora.xyz`单一Zoho邮箱及`privacy@`／`security@`别名；组织／个人两步验证、内部闭环、三条Gmail独立往返和内部监控目标均已完成其有限证据门；长期SLA表现仍未证明；
5. 完成 Global 生产数据平面、安全审计和法律页；
6. 申请 Stripe HK，并准备美国App Review说明包；第 8 周检查，必要时把外部Web provider切Paddle；
7. 完成美国外部Web结账沙盒、非美CTA隐藏、StoreKit fallback合同和跨渠道重复订阅防护；
8. 单独确认首笔真实收费，做 10–25 户付费 beta；
9. 只开放当期市场登记表中全部为`PASS`的首波地区；`USA`与`HKG`是核心候选，但任一未过门都继续关闭；
10. 首波地区各自完成30天稳定结算、退款和支持后，再把新的ready row加入allowlist。

### 轨道 B：未来 24 周准备 Mainland，但不拖住 Global

1. 先做经营性服务和主体书面分类；
2. 如果个人路径不成立，决定成立大陆主体还是寻找合规合作主体；
3. 确定后再购买阿里云深圳备案资源；
4. 建立隔离的数据、身份、支付、日志和密钥平面；
5. 完成 ICP／App备案及可能的经营许可、PIPL、MLPS；
6. 申请微信／支付宝普通支付与独立自动扣款能力；
7. 完成 StoreKit 中国大陆 storefront 和本地 Web 支付沙盒；
8. 单独批准首笔人民币收费，完成 10–25 户受控 beta；
9. 只在全部门通过后公开大陆收费版；
10. 小程序只作为后续有限入口，不替代独立 App。

## 平台本人事实与独立发布验收

本项目已获Owner默认授权，遵循最新[AGENTS.md](../AGENTS.md)，不把下列历史清单变成重复的逐项确认。平台强制本人登录、必须由本人提供的事实或更高优先级工具要求才交回相应步骤；产品授权与验收完成仍是不同证据。以下事项需各自完成真实事实／平台流程，未完成时不得声称已开放：

- 选择最终 US$／RMB 价格并创建真实商品；
- 接受 Apple／Stripe／Paddle／微信／支付宝／银联的付费、税务或法律合同；
- 提交身份证、住址、银行、税号、商业登记或 immigration facts；
- 支付云、律师、会计、保险、测评、备案／许可费用；
- 成立／登记任何经营主体或声明业务开始日期；
- 提交 ICP／App备案、经营许可、MLPS 或数据出境材料；
- 首笔真实收费、退款演练、公开市场和 App Store 发布；
- 发布个人法定姓名、地址、电话、税务或主体资料。

## 证据边界

本文使用 2026-08-19 复核的官方公开材料。费率、服务资格、App Store 条款、监管流程和云价格都可能变化。本文不是个人法律／税务意见，不证明 Stripe、Paddle、Apple、微信、支付宝、银联、备案或许可证会批准 Rillora。2026-08-19经Owner即时确认创建了与FanPass分离的香港Stripe `Rillora`控制台账户并进入测试模式；这不是商家验证／KYC、经营许可、税务结论、live activation或收款资格。当前没有购买中国大陆云资源、没有提交备案／许可、没有开通真实支付、没有创建Stripe／StoreKit商品、没有公开新市场，也没有产生任何真实收费。

## 官方来源

Apple：

- [App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [自动续费订阅收入比例](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [中国大陆 App Store 自 2026-03-15 起的 25%／12%佣金](https://developer.apple.com/cn/news/?id=dadukodv)
- [查看付款与 proceeds](https://developer.apple.com/help/app-store-connect/getting-paid/view-payments-and-proceeds)
- [设置 App 税务类别](https://developer.apple.com/help/app-store-connect/manage-app-information/set-a-tax-category)
- [App Review Guidelines](https://developer.apple.com/cn/app-store/review/guidelines/)
- [App Store Connect 中国大陆备案字段](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)

Global 经营与支付：

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple 2025-05-01 美国审核规则更新](https://developer.apple.com/news/?id=9txfddzf)
- [Apple EU外部优惠通信条款](https://developer.apple.com/support/communication-and-promotion-of-offers-on-the-app-store-in-the-eu/)
- [Stripe Hong Kong pricing](https://stripe.com/en-hk/pricing)
- [Stripe Hong Kong business requirements](https://support.stripe.com/questions/requirements-for-hong-kong-based-businesses?locale=en-GB)
- [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments/how-it-works?locale=en-GB)
- [Paddle pricing](https://www.paddle.com/pricing)
- [Paddle terms](https://www.paddle.com/legal/terms)
- [香港商业登记](https://www.ird.gov.hk/eng/tax/bre_abr.htm)
- [香港利得税](https://www.ird.gov.hk/eng/tax/bus_pft.htm)
- [中国个人所得税法](https://www.chinatax.gov.cn/n810219/n810744/n3752930/n3752974/c3970366/content.html)
- [境外所得税收抵免](https://www.chinatax.gov.cn/chinatax/n810219/n810744/n3752930/n3752974/c5143076/content.html)

中国大陆合规、云与支付：

- [互联网信息服务管理办法](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2023/art_483f0dd8eb1b4dc5961e4e008bd4a083.html)
- [工信部 App 备案说明](https://hunca.miit.gov.cn/zwgk/zcwj/zcjd/art/2023/art_888eed9c8e29444b8adf4787e2b26151.html)
- [个人信息保护法](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html)
- [促进和规范数据跨境流动规定](https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm)
- [阿里云备案服务器要求](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-server-access-information-check)
- [阿里云 RDS PostgreSQL 高可用版](https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/rds-high-availability-edition)
- [腾讯云备案云资源](https://cloud.tencent.com/document/product/243/18908)
- [腾讯 PostgreSQL Serverless 新建能力下线](https://cloud.tencent.com/document/product/1154/43004)
- [微信支付 App 接入](https://pay.wechatpay.cn/static/applyment_guide/applyment_detail_app.shtml)
- [微信支付委托扣款文档](https://pay.wechatpay.cn/doc/v2/merchant/4011987377)
- [支付宝网页／移动应用开放平台](https://open.alipay.com/module/webApp)
- [银联线上收银台](https://open.unionpay.com/tjweb/acproduct/list?apiSvcId=3021)
