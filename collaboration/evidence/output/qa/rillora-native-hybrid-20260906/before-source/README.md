# Rillora — Digital Legacy & Estate Continuity / 数字遗产与事务连续性

状态：常用provider官方身后处理指导已在Web／iOS本地实现；合成数据AWS Frankfurt staging和Stripe测试生命周期保持可用且普通权益始终Free；StoreKit已完成Xcode本地SK0，App Store Connect又建立了同组月／年产品、八个代表店面和目的限定Sandbox testers。官方Apple JWS验证、Notifications V2／设备交易入口、App Store Server API签名状态规范化及数据库对账已在本地实现，只有权威快照持久化后才允许finish，且`entitlement_mutation_applied=false`。此前Pro Max的`Products unavailable`已定位为残留Xcode-local StoreKit服务；干净iOS 26.4／26.5 Simulator均可从真实USA Sandbox目录加载年付`US$99.00`与月付`US$9.99`。新增Debug-only purchase scheme把signed transaction提交本地4182 API，pending snapshot不finish。当前API`103 / 103`、iOS`102 passed / 0 failed / 1 skipped`、AWS IaC`9 / 9`；Chrome最终`Rillora StoreKit Server 3`私钥已从Downloads移入ignored `0700/0600`目录，PKCS#8、OpenSSL、指纹、官方Sandbox客户端构造和Apple `4040010`认证探针通过。前两把无私钥key已撤销，Apple只剩一把有效key。Owner确认后，三套独立Sandbox tester凭据先后提交到干净iOS 26.4／26.5 Simulator；Apple均在账号持久化层返回`AMSErrorDomain 100 / Password reuse not available for account`并在交易前取消。一次被UI自动化回显的test credential已连同tester／Keychain项删除并轮换；当前未暴露的第三套仅存Keychain。数据库StoreKit inbox／event／subscription／reconciliation／entitlement mutation均为0，普通`commerce-v1`仍Free。三份Secrets Manager路径只完成本地合成、未部署或产生新云费用。实体iPhone目前离线；真实Sandbox购买／通知／restore、Apple-enabled staging、App Review、权益mutation、销售和真实付款继续关闭；Logo、真实邀请／身份绑定接受与投递、生产数据门、完整P0对等和外部测试仍开放  
最后更新：2026-09-06（Asia/Hong_Kong）

法律与注册状态：七份Owner批准的正式英文法律页现已公开运行在`https://legal.rillora.xyz`，版本仍为`2026-08-27-1`并显示`Effective`。2026-09-03确认旧Sites ID不属于当前账户后进行一次受控重建；当前账户列表／Owner权限、源码推送、三轮保存／部署、最终version 3、公开访问和自定义域均通过。最终Worker内嵌HTML外壳，客户端没有可被Sites clean-URL层改写的HTML对象；七页匿名200、根308→Terms、Account／API／unknown／内部模板／写请求404、安全头和脱敏渲染回读通过，Web／发布测试`48 / 48`。应用没有分析SDK、广告、表单、API、auth、localStorage或自建Cookie；Sites提供聚合访问统计，Cloudflare在每个公开响应设置host-only必要安全Cookie`__cf_bm`，现有Privacy／Cookie Notice的基础设施元数据与request-protection类别覆盖该事实。Google OAuth Branding仍为`External / Testing`，旧Google Web secret已清理。2026-09-05 Auth0 CLI／API完成只读回查：内建Google native-social配置当前要求Android package，付费Custom Token Exchange不符合零收入阶段，因此iOS Google继续隐藏；Free Passkey的policy、connection、Device Settings、AASA、grant和200 challenge全部通过，Debug启用Apple＋Passkey，Release保持Google／Passkey关闭。Debug测试目标和Release均无设备编译通过；下一步是Owner手动启动Simulator后的Account／checkbox／provider／取消交互与测试验证。没有实机、付费升级、新AWS资源、市场开放或收费。

2026-09-06新聊天保存检查点：源码、生成Xcode工程、Debug／Release产物和所有权威Markdown均已落盘；50份项目Markdown／141个本地链接零断链，叙述文档不含Google client ID，聚焦扫描未发现私钥／API key材料。Auth0 CLI短期用户token在收尾时已过期，但上一工作流的Passkey grant／200 challenge证据仍保留；未来Auth0操作先重新登录。父仓库仍无正常Git基线且整体显示untracked，因此本轮未擅自创建初始commit。唯一下一步仍是Owner手动启动Simulator后的原生Account／Passkey运行验证，实机继续延期。

基础设施方向：没有真实收入前采用“零新增固定成本、真实敏感数据不上廉价捷径”的分阶段合同。GoDaddy继续负责注册与DNS；法律站已在`legal.rillora.xyz`使用独立静态artifact，无API、登录、数据库、应用内分析、广告、表单或可选存储；Sites／Cloudflare仅提供托管层聚合流量统计和必要bot-protection Cookie。现有AWS Frankfurt仅保留合成staging。未来生产仍使用容器化API、PostgreSQL、私有对象存储和IaC，并通过显式DNS、标准协议、版本化迁移和provider-neutral对象键降低迁移难度。完整阶段、成本门、性能／安全预算和迁移runbook见[`docs/infrastructure-roadmap.md`](docs/infrastructure-roadmap.md)。

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
