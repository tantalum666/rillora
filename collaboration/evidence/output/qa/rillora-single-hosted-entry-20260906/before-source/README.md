# Rillora — Digital Legacy & Estate Continuity / 数字遗产与事务连续性

最后更新：2026-09-06（Asia/Hong_Kong）

当前工作：已完成整个原生 iOS App 的一轮 UI/UX 审阅与改进，覆盖公开入口、Account、三主页面、编辑、引导、角色、演练、导出选择和恢复。111 项单元测试通过、1 项既有 StoreKit 环境跳过；常规字号 14 项 UI 路径与额外 AX5 路径通过，真实横屏布局单独验证，Debug 运行及 Release 编译通过。正常云端 Debug 与默认字号已恢复。查看[整 App 对照报告](output/qa/rillora-full-app-ux-20260906/README.md)与[当前交接](docs/handoff.md)。

公开法律站的七份正式英文文本已在2026-09-03部署到[legal.rillora.xyz](https://legal.rillora.xyz/terms)，版本为2026-08-27-1。Google Branding链接已保存，Audience仍为External／Testing。应用没有可选跟踪；Sites／Cloudflare的聚合流量与必要安全Cookie按既有合同单独记录。这不开放产品账号、私人数据、市场或收费。

其他保留进度：AWS Frankfurt只用于合成staging；Stripe Phase 1C测试生命周期完成且普通权益始终Free。StoreKit本地SK0完成，真实Sandbox商品可加载，购买仍被此前记录的Apple Simulator账号持久化故障阻断；实机工作由Owner明确延期。完整商业证据见[StoreKit合同](docs/storekit.md)与[商业化合同](docs/monetization.md)，不得把IAP server key和Apple登录key混为一项。

本轮已完整阅读50份／14,408行项目Markdown，修正冲突的活动入口与验收规则，保留历史记录。源码、截图、结果包和覆盖清单已保存。父仓库仍没有正常tracked baseline；未创建初始commit或改写既有改动。

基础设施继续遵守[分阶段成本与迁移合同](docs/infrastructure-roadmap.md)：当前公共法律host零新增固定费用，真实敏感数据等待独立生产基线；现有域名、邮箱与AWS成本不因此归零。

`Rillora`是这个面向全球用户的数字遗产与事务连续性产品的锁定品牌名。它帮助用户提前整理重要的线上资产、负债、账号、设备和资料，说明每项事务应由谁在什么条件下处理，并为可信联系人或遗嘱执行人提供合法、清晰的下一步。

产品不承诺生成一份在全球自动有效的电子遗嘱，也不以保存所有密码为核心价值。

## 当前产品承诺

> 用15至20分钟建立一份不包含高风险密码的数字事务应急地图，让被授权的人知道有什么、去哪里找、应该怎么处理。

## 首轮产品面

- Web：完整编辑、资料整理、执行人入口、导出和复杂设置。
- iOS：快速录入、复核、通知、可信联系人管理和移动端模拟演练。
- Shared Core：统一账户、领域模型、权限、审计、实验事件和安全策略。

Web与iOS在同一MVP验证周期内交付，但不复制同一套页面布局。

## 文档入口

任何产品或实现工作先读 [Product Constitution](docs/product.md)。

| 文件 | 作用 |
| --- | --- |
| [产品宪章](docs/product.md) | 产品定义、权威顺序、已锁定与待验证决定 |
| [MVP与市场验证](docs/mvp.md) | 首版范围、核心旅程、事件和继续投入门槛 |
| [商业化与定价合同](docs/monetization.md) | 两轮商业研究合并、免费／付费边界、首发单一付费层级、月年付、试用与安全降级 |
| [单位经济与融资／收购准备](docs/unit-economics.md) | 价格主假设、毛利、LTV/CAC、渠道费、合规成本、现金跑道和尽调数据合同；含可编辑工作簿与自包含审阅报告 |
| [Web/iOS平台合同](docs/platform-contract.md) | 两端共享能力、平台差异和同步门槛 |
| [StoreKit实现合同](docs/storekit.md) | StoreKit 2、本地Xcode测试、App Store sandbox、Apple交易／通知验证与分阶段证据边界 |
| [常用平台官方身后处理指南](docs/provider-death-account-guides.md) | Apple、Google、Meta、GitHub、Microsoft、社交、支付、Coinbase／Binance和密码管理器的官方入口、步骤、材料与限制 |
| [信任、安全与法律边界](docs/trust-safety-legal.md) | 数据、触发、披露、合规与禁止事项 |
| [公开法律页与发布门](docs/public-legal-pages.md) | 七份正式英文文本、事实输入、Cookie边界与发布条件 |
| [法律文件中文版参考译文](docs/legal-candidate-zh.md) | 已批准七份英文文本的中文参考；不是对外合同 |
| [质量门](docs/quality-gates.md) | 产品、设计、跨平台、安全和证据验收标准 |
| [研究与来源](docs/research.md) | 法律、平台、竞品和用户信号；仅作证据 |
| [竞品UX深度审计](docs/competitor-ux-audit.md) | 当前公开站、注册墙、产品帮助、移动端、可借鉴模式与账户门 |
| [决策记录](docs/decision-log.md) | 追加式批准、否决和取代记录 |
| [当前交接](docs/handoff.md) | 当前阶段、已完成、未完成和唯一下一步 |
| [项目旅程](docs/journey/PROJECT_JOURNEY.md) | 持续记录项目为什么变成现在这样 |
| [设计合同](DESIGN.md) | 已选视觉方向、跨平台层级、令牌与交互约束 |
| [Logo AI辅助生产合同](docs/logo-ai-workflow.md) | 只约束Rillora Logo概念、矢量与校正流程的锁定方法 |
| [Logo发现记录](docs/logo-discovery.md) | 两轮否决证据、公司身份案例研究和完整组合标志选择门 |
| [资产与许可证](docs/asset-licenses.md) | 原型字体、图标和视觉证据来源 |
| [设计QA](design-qa.md) | 源图与Web/iOS实现的同状态比较和修复记录 |
| [后端与数据架构](docs/backend.md) | API、PostgreSQL、租户隔离和生产开放门 |
| [Start Here导出合同](docs/start-here-export.md) | 无文件预览、明文指南、客户端加密与离线恢复边界 |
| [角色级披露策略演练](docs/disclosure-rehearsal.md) | 三类独立状态机、角色最小字段和零通知／零释放边界 |
| [规划者角色策略](docs/role-assignment-policy.md) | 逐事项／全计划角色、证据标签、撤销与快照失效合同 |
| [隐私过滤产品事件](docs/product-events.md) | 本地第一方事件、严格属性白名单和保留边界 |
| [身份、恢复与首区](docs/identity-data-region.md) | Auth0/AWS候选、OIDC协议、恢复与数据区域边界 |
| [区块链决定](docs/blockchain.md) | MVP不上链及未来完整性证明的允许边界 |
| [仓库威胁模型](SECURITY.md) | 资产、信任边界、攻击故事和严重度口径 |

## 当前证据边界

目前已有全球可行性研究、MVP范围、已选视觉方向、通过视觉QA的Web/iOS交互原型，以及运行在AWS Frankfurt的TypeScript/PostgreSQL合成staging。正式Web域为`https://app.staging.rillora.xyz`：静态资源通过私有S3和CloudFront提供，`/api/*`同源代理到API Gateway、VPC Link、Fargate Spot和私有Single-AZ RDS；公开首页、Account回退、会话探测、未登录401、Auth0跳转、CSP/HSTS、TLS/CORS和数据库readiness都已在真实HTTPS端点验证。Auth0 EU开发租户上的Web Universal Login和iOS Code + PKCE此前已用合成身份完成闭环；Owner也已在iPhone模拟器本人完成一次云端Auth0登录。iOS无会话启动现与Web保持“先公开理解、产生私有意图后再进Account”的顺序，不把登录墙作为第一屏。

Web使用Cookie/CSRF，iOS只把Rillora本地Bearer会话存入Keychain，两类会话不能交叉使用；Auth0 provider token不持久化。Matter、联系人、角色、官方设置自报、非操作性演练和Start Here均不授予账号访问、所有权或法律权限。明文文件服务端不留副本；密文包采用客户端AES-256-GCM与RFC 9180 HPKE。当前云面只允许合成/个人早期试用，不是生产环境；真实恢复、原生Apple Passkey、Release身份、KMS/附件、真实邀请与申请处理、真机／TestFlight、真实披露、DPIA、独立安全审查、外部测试和市场付款仍未完成。`apps/ios-prototype`继续只是移动交互与视觉证据。
