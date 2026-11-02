# Rillora — Digital Legacy & Estate Continuity / 数字遗产与事务连续性

最后更新：2026-10-05（Asia/Shanghai）

October5本机跟进：Dot四条分支已整合到`codex/dot-integration-20261005`，补原生Debug/Release、215单测与2项双语UI检查，以及真实本地浏览器回归；修复焦点、窄屏状态、活动时间和邀请邮箱反馈。未部署，更多矩阵仍开放。[准确结果](qa/dot-followup-20261005/README.md)。

October5中文Web：应用和官网已实现简体中文/English、集中可维护词典与语言偏好，保留原业务/法律边界。本地构建与169项Web/法律测试通过；浏览器视觉验收被环境阻止，未部署。[维护合同](web-localization-20261005.md) · [QA与Git/CI回读](qa/chinese-web-20261005/README.md)。本条仅描述中文分支，不把下方旧检查点当作新验证。

已完成Owner要求的全量Rillora Git保存，支持Dot协作。请先看[完整协作入口](../collaboration/README.md)、[保存范围与恢复方法](source-control.md)和[当前交接](handoff.md)。源码、设计与文档、发布候选、QA和历史都有目录；46,768工作文件和7个加密归档已从远端完整读回验证，[CI42通过](https://github.com/tantalum666/rillora/actions/runs/36737542600)。

最新工程任务是Owner要求的[严格全项目代码审查与直接修复](code-review-20261002.md)。完整活动源码正文已经读完；本轮修复、回归、Git记录与尚未部署的边界在该报告及[handoff](handoff.md)中分别记录，不能借用旧CI证明新改动。

保留的发布检查点：Dot的13项修复及后续受限身份／Apple证书检查修复已经部署；最后记录为API10／schema0091，普通客户访问与正式收费仍关闭。Resend已接通，QQ真实收件、密码重置、重新登录及有界共享已验证；六张商店设计图已保存，内部TestFlight1.0(2)已处理、仍为Missing Compliance。本人验证、真实Apple交易、SBP有效费率和最终上架继续单独验收；SES旧申请不再阻塞当前邮件路线。本轮没有重复部署或申请。

以下按日期保留项目沿革；涉及“当前”的旧检查点按原日期理解，最新状态只取[handoff](handoff.md)。

当前工程检查点：独立私有仓库 [tantalum666/rillora](https://github.com/tantalum666/rillora) 已推送审查后的源码基线，FanPass 和本地 Web Git 历史均保留。Owner授权后已直接升级 AWS Paid Plan；独立私有加密数据库、7天备份、独立密钥和恢复控制日志已建立并迁移。真实云端隔离恢复已通过本轮合成数据验收，临时资源已清理；客户流量仍关闭。见[生产与恢复](production-recovery-20260923.md)、[源码和回滚](source-control.md)、[当前交接](handoff.md)。

September24增量：关闭客户访问的生产API已部署，内部HTTPS／实际健康检查／权限配置与新监控目标已验收；原Auth0管理身份已恢复。官方GoDaddy CLI及[仅Rillora的项目命令](../tools/godaddy/README.md)已安装认证，临时DNS写入／清理恢复原20条记录。后续已完成独立关闭Web入口和原生Release连接配置；生产身份邮件、真实双端流程和销售仍有独立门。见[运行合同](production-runtime-20260924.md)。

当前新购为永久 Free 与 **Web US$88.99 年付 Family**；Apple 采用独立渠道价格，最终金额待核实。September21 已取消新月付，历史已付账期及收据继续支持。以下按日期保留的旧检查点不是当前价格或部署状态。

当前Logo：**Owner已选定传承印记03，主App图标和现有Web／原生品牌位置已采用。** [正式素材包](../assets/brand/rillora/README.md)与[ZIP](../assets/brand/rillora-approved-brand-20260920.zip)包含原始矢量、PNG、网站图标和完整字体许可。Source Serif4 SemiBold／Inter允许免费商用，详见[核验依据](brand-font-license-20260919.md)。普通模拟器、Web测试站和法律站Sites6已验证；这不等于生产App或App Store发布。[本轮QA](../output/qa/rillora-brand-adoption-20260919/README.md)与[handoff](handoff.md)。

前一版设计检查点：**Owner推翻所有此前Logo限制，Flowing R第一版已完成。** 已制作图形标、完整字标、配色、正反色／小尺寸版本、App图标设计与可编辑Figma；当前是设计交付，尚未替换产品或公开发布。[设计板](../assets/brand/rillora-identity-20260919/identity-board.png)、[当前Logo简报](logo-design-20260919.md)、[交接](handoff.md)。

September19历史发布检查点（新月付已取消）：**正式发布准备；当时报价US$88.80/年、US$9.99/月。** 当前产品核心已有测试站和真实A/B验收，但独立生产、普通正式购买、Apple交易、恢复／保留和最终上架仍有缺口。告警发布权限已修复，故障／恢复／缺心跳邮件实际送达并启用15分钟调度；新价格使用独立v3并保留旧收据。Apple没有精确88.80价格点，年价例外等待Owner选择。见[发布清单](release-readiness.md)、[当前价格](pricing-88-80-20260919.md)、[handoff](handoff.md)和[本轮QA](../output/qa/rillora-release-readiness-20260919/README.md)。

此前事项指导：**事项编辑与接收人读取已自动推荐相关账号身后指导，入口改为Account inheritance。** A读指导保留草稿，B只按已获准的字段匹配，隐藏平台不通过推荐泄露。新增官方Instagram图标、完整原始链接与实际表单／登录边界检查；修正Instagram地址、Facebook菜单及Google申请要求。原生154通过／1旧跳过、Web80通过，Web-only测试站发布及20项资源检查通过。[本轮QA](../output/qa/rillora-contextual-guidance-20260918/README.md)、[原始来源与检查表](../output/qa/rillora-contextual-guidance-20260918/official-source-links.md)、[当前交接](handoff.md)。

此前目录交付：**18份常用平台指导已接入Web／iOS，Web测试站已发布，普通模拟器已打开币安的身后申请步骤。** Profile → Platform guides和公开Web Guides都可免登录阅读；按Prepare／After a death／Documents逐步显示操作、材料、限制与官方入口。16份本次完整复核，Facebook／Instagram保留旧日期及访问限制。两端使用同一内容目录，新增本地测试和20项发布检查通过。[指导合同](provider-death-account-guides.md)、[本轮QA](../output/qa/rillora-platform-guidance-20260918/README.md)、[当前交接](handoff.md)。

此前同日组件检查点：**Pow／Shimmer动效库已安装，主App已更新，独立Rillora Preview已在模拟器运行。** Feedback／Loading／Flow可以直接点击比较，减少动态开关和许可声明可查看；预览无需登录，也不改真实资料。[组件预览合同](component-preview-20260918.md)、[实录与QA](../output/qa/rillora-components-preview-20260918/README.md)。

同日已完成：**Matters筛选文字截断已修复，可商用Figma SDS组件已实际采用，普通iOS模拟器已更新。** 内容宽度与换行代替等宽分段压缩；正常字号、最大辅助字号、SE3窄屏及筛选结果已检查。组件来源、CC BY4.0／MIT声明随App提供。[本轮QA](../output/qa/rillora-filter-fit-20260918/README.md)、[许可声明](../THIRD_PARTY_NOTICES.md)。本轮仅原生控件／署名变化，无Web／API重新发布。

September17已完成检查点：**登录后卡片与动效精修已实现并发布到现有staging，普通iOS模拟器已更新。** 沿用现有Graphite／Prepared Folio和导航分组，统一卡片底色，补充按钮、展开和子页面图标反馈；修复Family功能列表窄列、Free名额旧文案和新事项切换类别后的退出历史。当前152项原生测试通过／1旧跳过、78项Web测试通过，320／390及AX5／Reduce Motion检查已记录。[精修合同](surface-motion-20260917.md)、[QA与录像](../output/qa/rillora-surface-motion-20260917/README.md)、[当前交接](handoff.md)。

September18历史运行基线：既有API30／0060、常规Fargate和法律Sites第5版。真实A/B的注册验证／明确接受／A撤销／B失去读取权限已在此前检查点观察，验证邮件后的同会话衔接与Web返回／同意顺序已部署；不把本轮视觉检查当成新真人验收。Free1／Family5、付费截止副本与68年付／7.99月付Stripe测试生命周期已有独立证据，普通收费和生产市场门仍关闭。[前一交接 — HISTORICAL](handoff-history-20260917-invitation-complete.md)。

September16历史P1检查点：UX01–06的导出范围、草稿／错误恢复、加载状态、保存术语、自助数据退出和权益展示已修复；当时API23、法律站第4版和148项API／36项HTTPS是该次证据，现不作为最新部署或本轮重跑结果。[原修复合同](p1-reliability-repair-20260915.md)、[原部署QA](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md)。

September11历史检查点：**账户／邀请／事项录入修订已完成并更新到现有合成staging及普通Simulator Debug。** 统一Sign in / Sign up；访客只可打开收到的邀请；注册保留邀请返回；native会话携带首屏；Profile精简；单页分类表单、必填定位信息、Crypto交易所／链上字段和末尾Notes。API136项加1项注册返回测试、native133通过／1项旧StoreKit跳过、Web58项及云端30项HTTPS／资源检查通过。migration15退出0，API20为1/1，云端0040–0042校验和与源码一致。[当前合同](account-matter-ux.md)与[QA](../output/qa/rillora-account-matter-ux-20260911/README.md)。未完成新的本人Rillora登录计时、真机或付费生产验证。

此前Family检查点（当时状态，人数／付费截止后续已由上述合同取代）：**Family共同复核已在API／Web／iOS落地，并部署到现有测试环境。** 规划者发起检查，接收人按权限确认／报问题，指定一人可提出位置／机构更正；本人批准后更新真实事项并保存前后历史，还能设置复核日期和分享收件箱入口。入口为已登录后的Web `More → Shared reviews`／原生`Profile → Shared reviews`。[功能合同](family-maintenance.md)与[录像、截图及验证](../output/qa/rillora-family-maintenance-20260910/README.md)。预览已开启，普通收费仍关闭；到期固定版本等完整商业生命周期仍是独立门。

此前邀请共享检查点（以下为当时证据）：联系人已扩展为账号绑定邀请和逐人／逐项共享，API、Web、iOS 已完成。A 可创建链接／二维码，B 登录接受后只见获准内容；朋友 C 可有独立事项与细节级别。默认不共享，支持撤销。API 115 项、Web 48 项、原生 124 项单测及两项完整／辅助字号 UI 验证通过。**2026-09-10 已更新现有 AWS 合成测试环境：数据库迁移成功、服务 1/1、CloudFormation 完成，18 项 HTTPS／发布文件检查全部通过。** 实际接收人的托管登录／接受仍需独立验证，未发送真实亲友消息。[实现、录像、权限验证及部署结果](../output/qa/rillora-trusted-sharing-20260909/README.md)。

此前全层级 UI/UX 调整继续保留：[完整页面覆盖与运行证据](../output/qa/rillora-public-motion-20260909/README.md)。

前一认证检查点：Owner已完成Auth0管理员验证，Apple登录密钥已轮换、旧密钥已撤销、既有iOS连接已恢复。邮箱在上、其他方式在下，托管输入统一为灰色；真实页面已到达Apple官方的Rillora Account授权页。配置与入口验证已完成，本人Apple身份／协议确认／私有地图回调仍需独立完成。截图与回读见[Apple恢复报告](../output/qa/rillora-apple-restore-20260909/README.md)。本项目默认授权规则已写入[AGENTS.md](../AGENTS.md)。

前一检查点：原生Account中转页已删除，三个私有入口直接使用托管登录。Form、已部署Action及绑定已应用并回读，Owner的Google登录、协议确认和返回私有总览已经走通；确认页的排版、未勾选错误及取消也已实测。其余整App UI/UX改进保留。未创建或合并身份。当前状态与独立身份验证见[交接记录](handoff.md)，实际截图和证据见[托管登录复核](../output/qa/rillora-single-hosted-entry-20260906/README.md)。

公开法律站的七份正式英文文本保留原正文，已于2026-09-19通过[legal.rillora.xyz](https://legal.rillora.xyz/terms)第6版同步选定品牌及字体许可；Privacy/Cookie为2026-09-15-1，其余沿用2026-08-27-1。Google Branding链接已保存，Audience仍为External／Testing。应用没有可选跟踪；Sites／Cloudflare的聚合流量与必要安全Cookie按既有合同单独记录。这不开放产品账号、私人数据、市场或收费。

其他保留进度：AWS Frankfurt继续为非公开staging；普通用户仍Free，只有限时登记的验收账号可应用测试Family权益。StoreKit本地SK0完成，真实Sandbox商品可加载，购买仍被此前记录的Apple Simulator账号持久化故障阻断；实机工作由Owner明确延期。完整商业证据见[StoreKit合同](storekit.md)与[商业化合同](monetization.md)，不得把IAP server key和Apple登录key混为一项。

历史阅读检查点：2026-09-10完整阅读55份／16,011行项目Markdown，范围、逐段记录与指纹保存在[本轮复核记录](../output/qa/rillora-packaging-review-20260910/README.md)。本轮同步免费／付费合同与活动文档；交接收敛为当前状态，原长交接完整移入历史文件。当时父仓库没有tracked baseline；September23已建立独立源码基线，未改写旧历史。

基础设施继续遵守[分阶段成本与迁移合同](infrastructure-roadmap.md)：当前公共法律host零新增固定费用，真实敏感数据等待独立生产基线；现有域名、邮箱与AWS成本不因此归零。

`Rillora`是这个面向全球用户的数字遗产与事务连续性产品的锁定品牌名。它帮助用户提前整理重要的线上资产、负债、账号、设备和资料，说明每项事务应由谁在什么条件下处理，并为可信联系人或遗嘱执行人提供合法、清晰的下一步。

产品不承诺生成一份在全球自动有效的电子遗嘱，也不以保存所有密码为核心价值。

## Prior invitation and authenticated UI checkpoint — September11

September11: Overview/Profile now expose Invite someone, with Person→Access→Link and an actual QR/copy handoff. Received invitations are separate. Prepared Folio imagery and real state/interaction motion are implemented on native iOS and Web; the Web artifact is deployed to existing synthetic staging. [Focused contract](invitation-motion-ux.md), [QA/recordings](../output/qa/rillora-invite-motion-20260911/README.md), [current handoff](handoff.md).


## 当前产品承诺

> 用15至20分钟建立一份不包含高风险密码的数字事务应急地图，让被授权的人知道有什么、去哪里找、应该怎么处理。

## 首轮产品面

- Web：完整编辑、资料整理、执行人入口、导出和复杂设置。
- iOS：快速录入、复核、可信联系人管理和共享；消费者Simulation入口已移除。
- Shared Core：统一账户、领域模型、权限、审计、实验事件和安全策略。

Web与iOS在同一MVP验证周期内交付，但不复制同一套页面布局。

## 文档入口

任何产品或实现工作先读 [Product Constitution](product.md)。

| 文件 | 作用 |
| --- | --- |
| [产品宪章](product.md) | 产品定义、权威顺序、已锁定与待验证决定 |
| [MVP与市场验证](mvp.md) | 首版范围、核心旅程、事件和继续投入门槛 |
| [商业化与定价合同](monetization.md) | 两轮商业研究合并、免费／付费边界、首发单一年付层级、历史月付、试用与安全降级 |
| [单位经济与融资／收购准备](unit-economics.md) | 价格主假设、毛利、LTV/CAC、渠道费、合规成本、现金跑道和尽调数据合同；含可编辑工作簿与自包含审阅报告 |
| [Web/iOS平台合同](platform-contract.md) | 两端共享能力、平台差异和同步门槛 |
| [StoreKit实现合同](storekit.md) | StoreKit 2、本地Xcode测试、App Store sandbox、Apple交易／通知验证与分阶段证据边界 |
| [常用平台官方身后处理指南](provider-death-account-guides.md) | Apple、Google、Meta、GitHub、Microsoft、社交、支付、Coinbase／Binance和密码管理器的官方入口、步骤、材料与限制 |
| [信任、安全与法律边界](trust-safety-legal.md) | 数据、触发、披露、合规与禁止事项 |
| [公开法律页与发布门](public-legal-pages.md) | 七份正式英文文本、事实输入、Cookie边界与发布条件 |
| [法律文件中文版参考译文](legal-candidate-zh.md) | 已批准七份英文文本的中文参考；不是对外合同 |
| [质量门](quality-gates.md) | 产品、设计、跨平台、安全和证据验收标准 |
| [研究与来源](research.md) | 法律、平台、竞品和用户信号；仅作证据 |
| [竞品UX深度审计](competitor-ux-audit.md) | 当前公开站、注册墙、产品帮助、移动端、可借鉴模式与账户门 |
| [决策记录](decision-log.md) | 追加式批准、否决和取代记录 |
| [生产与恢复](production-recovery-20260923.md) | 当前部署限制、隔离恢复与验收 |
| [源码和回滚](source-control.md) | 独立私有仓库、CI、代码与数据恢复边界 |
| [当前交接](handoff.md) | 当前阶段、已完成、未完成和唯一下一步 |
| [项目旅程](journey/PROJECT_JOURNEY.md) | 持续记录项目为什么变成现在这样 |
| [设计合同](../DESIGN.md) | 已选视觉方向、跨平台层级、令牌与交互约束 |
| [正式Logo与字体许可](logo-design-20260919.md) | Owner已选03、正式资源、两端采用及免费商用依据；旧Logo方法仅作历史 |
| [Logo发现记录](logo-discovery.md) | 历史候选、否决理由与最终03选择 |
| [资产与许可证](asset-licenses.md) | 原型字体、图标和视觉证据来源 |
| [设计QA](../design-qa.md) | 源图与Web/iOS实现的同状态比较和修复记录 |
| [后端与数据架构](backend.md) | API、PostgreSQL、租户隔离和生产开放门 |
| [Start Here导出合同](start-here-export.md) | 无文件预览、明文指南、客户端加密与离线恢复边界 |
| [角色级披露策略演练](disclosure-rehearsal.md) | 三类独立状态机、角色最小字段和零通知／零释放边界 |
| [规划者角色策略](role-assignment-policy.md) | 逐事项／全计划角色、证据标签、撤销与快照失效合同 |
| [隐私过滤产品事件](product-events.md) | 本地第一方事件、严格属性白名单和保留边界 |
| [身份、恢复与首区](identity-data-region.md) | Auth0/AWS候选、OIDC协议、恢复与数据区域边界 |
| [区块链决定](blockchain.md) | MVP不上链及未来完整性证明的允许边界 |
| [仓库威胁模型](../SECURITY.md) | 资产、信任边界、攻击故事和严重度口径 |

## 当前证据边界

目前已有全球可行性研究、MVP范围、已选视觉方向、通过视觉QA的Web/iOS，以及运行在AWS Frankfurt的TypeScript/PostgreSQL测试环境。现有测试Web域为`https://app.staging.rillora.xyz`：静态资源通过私有S3和CloudFront提供，`/api/*`同源代理到API Gateway、VPC Link、常规Fargate和私有Single-AZ RDS。September17已经用同规格常规Fargate取代Spot；当前staging为API38／0075；生产API仍是独立task1／0070且客户入口关闭。各自部署及健康1/1证据见当前交接，不把旧业务验收记成重跑。公开首页、会话探测、未登录401、Auth0跳转、CSP/HSTS、TLS/CORS和数据库readiness均有实际HTTPS验证。Owner也已在模拟器完成Google身份登录。iOS无会话启动仍先允许公开浏览，私有操作直接进入托管登录，不把登录墙作为第一屏。

Web使用Cookie/CSRF，iOS只把Rillora本地Bearer会话存入Keychain，两类会话不能交叉使用；Auth0 provider token不持久化。Matter、联系人、角色、官方设置自报、非操作性演练和Start Here均不授予账号访问、所有权或法律权限。明文导出文件服务端不留副本；密文包采用客户端AES-256-GCM与RFC 9180 HPKE。当前云面只允许合成／Owner控制的早期试用。真实A/B邀请接受与撤销、旧价Stripe测试生命周期已有独立证据；独立生产数据／TLS及有界隔离恢复已验收；生产身份与邮件、普通用户正式付款、实际Apple购买／恢复、持续保留／恢复后支付对账及最终提交仍需完成。准确首发缺口见[发布合同](release-readiness.md)，不能把附件或自动身后披露等未来功能重新列为首发前提。`apps/ios-prototype`继续只是移动交互与视觉证据。
