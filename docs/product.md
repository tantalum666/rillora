# Rillora Product Constitution

Role: canonical product gateway and decision authority  
Authority scope: current product definition, terminology, constraints and document routing  
Superseded by: Owner后续明确决定，并记录在 `docs/decision-log.md`  
Do not use for: 具体法律意见、实现完成度、发布状态或历史过程  
Status: PRODUCT FOUNDATION ACTIVE  
Last updated: 2026-09-23 (private source baseline; production data foundation and recovery validation)

本文件是任何产品、设计、Web、iOS、安全、研究或商业任务的第一入口。它刻意保持为决策层；细节由Authority Map路由到聚焦文件。

## 2026-09-23 生产基础、恢复与独立源码仓库 — 当前任务

Owner要求先开始生产环境与恢复，并询问GitHub用于版本与回滚；随后明确FanPass及既有仓库仍在使用，必须保留。Rillora采用独立私有源码仓库方案，不删除、移动或覆盖FanPass及本地Web Git历史。当前先建立关闭客户流量的独立生产数据基础和隔离恢复流程；不能将测试站原地改名，也不因建仓或建库开放真实销售。具体状态与操作边界见[执行合同](production-recovery-20260923.md)、[源码管理](source-control.md)及handoff。

本轮实际结果：Rillora私有源码已推送并通过CI，Owner当场确认只给原有GitHub令牌新增Rillora范围；FanPass及Web历史保留。初次生产7日备份请求遭AWS Free Plan拒绝；Owner随后明确“你来升级”，现已直接升级并回读PAID／ACTIVE，生产7日私有数据库及日志已建立。真实RDS/KMS恢复、撤销／删除／旧会话重放及临时资源清理已通过本轮合成验收；生产客户入口与正式开放仍未完成。

## 2026-09-22 Owner采用信封加密 — 当前实施

Owner明确“那就先搞你建议的，后续再看情况进行端到端加密”，采用应用层内容加密＋独立密钥管理。完整在线E2EE留待后续，不再把选项2视为等待采纳。实施保留现有UI、Free／Family共同安全基线、分层共享、已付期旧副本及恢复／退出合同；不得称为平台不可读、E2EE或独立认证。源码哈希已刷新，详细实施与回滚方案见[实施计划](security-hardening-20260921/implementation/envelope.md)。现有staging已完成加密API与旧正文迁移、重复迁移零改动及DB明文拦截；云端最终权限和实际状态由handoff／QA单独记录。

## 2026-09-21 信息保护宣传与工程方向 — 研究结果

Owner询问竞品“银行级”等保护如何实现。当前[安全定位与证据](security-positioning-20260921.md)区分存储加密、应用层信封加密、客户端E2EE和独立鉴证。Agent建议首发补应用层内容加密及生产控制，但不将建议写成Owner已采纳架构或运行完成。普通Matter仍是服务端可读业务字段，加密恢复包不能扩大成全产品零知识承诺；最低保护继续覆盖Free和Family。没有新安全徽章或价格变化。

Owner调整Chrome扩展后，Stripe独立TEST账户icon／wordmark和Google OAuth Logo已实际保存；它们不再被文件权限阻塞。Auth0旧自定义模板的402及正式构建／公开首页仍由发布合同分别处理。

September22 Owner继续询问E2EE工作量与竞品可比性；[粗估与范围](e2ee-effort-20260922.md)区分8–15工程日信封加密与24–40工程日完整在线E2EE，非交付承诺。可以实现同类技术能力，不等于已具有竞品的独立证据或保证整体同级；本轮不选择架构、不改运行或发布安全声明。

## 2026-09-21 取消新月付 — Owner已明确批准

Owner随后明确“那就取消月付吧”：首发新购采用永久Free加US$88.80年付Family，停止新月付。已购账期、恢复／对账、Free1／Family5、授权截止副本和免费退出权利保留。目录、API、两端新购选择及provider停售分别验证；Apple差异化年价仍未获批准。当前实现、品牌覆盖与100用户容量边界见[September21执行记录](annual-brand-capacity-20260921.md)。此前[价值研究](subscription-value-20260921.md)是决定前的证据，不能继续作为“账期未批准”的当前门。

## 2026-09-21 双端渠道定价讨论 — 未改价

Owner询问Apple是否可高于Web。已核实现行规则及官方先例；建议同一Family跨端权益、按实际付款渠道定价，App内引导另按storefront控制。[渠道比较](channel-pricing-20260921.md)给出15%／30%佣金的候选价，但没有新Owner批准、后台保存或实际结算证据。当前目录、账期与已购权利不变。

## 2026-09-19 Logo重新设计 — 最新Owner指令

Owner随后对03原设计板明确“还是用这版吧”：**Legacy Imprint／传承印记03成为正式选定品牌**。01、02、04、05转为保留的历史方案；不继续优化05或重新询问旧选择。正式资源位于[品牌目录](../assets/brand/rillora/README.md)，[品牌配置](../config/brand.json)记录选择。主App图标及现有Web／原生品牌位置已采用；不改Graphite／Prepared Folio界面。Source Serif4 SemiBold与Inter的免费商用依据及分发声明见[字体核验](brand-font-license-20260919.md)。原03设计文件保持不变。September20 Owner指出手机页头图形不同，现明确所有App／页面页头统一使用完整03母版，只等比例缩放；compact不能切换成减少曲线的图形。实际构建／部署和发布缺口由handoff分别记录。

Owner要求先完成Logo设计，并明确“推翻之前我所有的logo限制，你直接自己重新设计”。所有此前Logo专属的概念／图形排除、字母限制、工具方法与逐门确认均被取代；Agent直接判断并制作完整第一版。Rillora名称、现有App UI、产品真相与其他人的实际权利保持各自范围。当前简报为[Logo September19](logo-design-20260919.md)。旧Logo章节与历史记录不再构成活动门，正式发布与88.80／9.99价格工作保留，暂时优先补齐品牌资产。

## 2026-09-19 正式发布优先与新价格

Owner要求后续按正式上线推进，停止把额外图标／装饰和未来扩展挤进首发关键路径；保持原UI及现有自助Free／Family。经营／商业登记按Owner“先忽略”暂缓，不追问、不视为已核验。正式缺口、证据与顺序统一由[发布合同](release-readiness.md)管理。

Owner随后明确把年付改为US$88.80、月付改为US$9.99，取代68／7.99的新购报价。Family功能版本2不变，新价格版本3保留历史价格／收据；Stripe/Web精确金额与Apple可选价格点分开核验。当前[价格合同](pricing-88-80-20260919.md)和[handoff](handoff.md)拥有实际状态；不把测试价格或目录配置当作可正式收款。

## 2026-09-19 支持采用的官方图标落地

Owner要求在合法前提下尽量使用官方Logo，特别指出Coinbase与Netflix。Coinbase已从其官方CDS开源源文件取得原始几何并接入两端，按源版权许可与独立的次要识别用途分别记录依据；Web补同源Design credits，完整许可随两端分发。Netflix的实际条款仍将内容中的使用列为事先审批，币安官方品牌包当前私有，不能将这些情况标成已获准。采用集合现为六个第三方图形标；当前逐项原因见[品牌用途合同](provider-mark-usage.md)，构建、安装和发布证据见[交接](handoff.md)。原视觉、权限、18份指南内容和商业门不变。

## 2026-09-19 功能性账号图标进一步复核

Owner要求继续深入核对其他App／网站的实际Logo用法。已查证密码管理器和服务目录采用网站／账号身份图标的公开机制；功能性识别、独立指南和营销联名分开评估，不把逐家单独书面授权作为所有图标的唯一依据。公开许可与适用法律下的功能性引用评估仍分开记录，favicon格式和竞品使用不能自动授权。微软特定产品图标存在文档用途许可，不能误写成所有公司Logo获准。采用的固定图标保持本地／第一方资源，B仍只从获准字段识别；本轮更新[用途合同](provider-mark-usage.md)和[研究记录](provider-icon-practice-research.md)，没有新增运行资产或发布。

## 2026-09-19 第三方Logo用途复核

Owner要求重新研究公司Logo能否使用。当前判断区分法律上的诚实识别用途、品牌方特定场景许可与尚未确认的范围；不能把“未找到通用许可”直接写成“法律禁止”。Facebook与Dropbox已按独立指南中的次要识别用途采用官方原始素材，保留原色比例／留白／来源和无隶属关系说明。其他具体限制或未确认项见[品牌用途复核](provider-mark-usage.md)，不把本轮决定宣称为全球法律许可、合作背书或广告授权。

## 2026-09-19 事项上下文中的账号身后指导

Owner要求在A填写事项和B读取获准事项时直接出现相关指导，并核实公司图标和原始流程。入口现为Account inheritance；两端按明确的平台／标题做本地匹配，B只使用服务端已披露字段，不检索隐藏provider、Notes或账号标识。指南不会自动打开、保存猜测或改变权限；A读完可回原草稿。Instagram已采用官方原始glyph；Google／Microsoft等未清晰覆盖本商业场景的图标不强行采用。原始URL可展开，18份官方内容已复核，并区分可达表单／需本人登录／支持或法律审核；实际provider继承批准并未验证。详情见[指导合同](provider-death-account-guides.md)、[原始链接与检查](../output/qa/rillora-contextual-guidance-20260918/official-source-links.md)、[当前交接](handoff.md)。

## 2026-09-18 平台指导可发现性与内容扩展

Owner要求看得到Apple／Google／币安等指导，并扩充常用平台，重点是可执行步骤。目录现为18份共享指南，iOS未登录与已登录Profile均可进入Platform guides，Web提供公开Guides与既有工作区入口；阅读无需账号。Prepare／After a death／Documents先给逐步操作，再显示官方链接。币安以真实Legacy Inheritance／Inheritance Appeal流程取代旧的泛化客服入口，Binance.US及Yahoo区域边界单独说明。16份内容本次复核，Facebook／Instagram保留原复核日期和访问限制。具体内容、同源目录与证据见[指导合同](provider-death-account-guides.md)和[当前交接](handoff.md)，不把指导或勾选当作继承／转移完成。

## 2026-09-18 可操作的组件动效预览

Owner要求直接安装组件和动效查看效果。已采用MIT Pow／Shimmer，并在现有原生组件接入确认、筛选、展开和加载反馈；独立Rillora Preview使用同一代码提供无需登录的本地交互对比。它不建立真实账户、数据或消费者Simulation菜单。具体集成、许可、已验证范围与下一步见[组件预览合同](component-preview-20260918.md)和[当前交接](handoff.md)。

## 2026-09-18 组件复用与筛选适配

Owner进一步明确：组件库确认可商用后直接采用，正常履行署名／声明，不因这项义务回避复用。已确认并采用Figma官方SDS的Tag Toggle Group，修复Matters筛选文字截断，复核／账期复用同一原生适配。既有视觉方向、导航、权限和计费不变。具体许可、修改说明及验证见[资产登记](asset-licenses.md)与[当前交接](handoff.md)。这取代任何“默认不引入第三方组件”的推断，September17未导入库只是历史结果。

## 2026-09-17 登录后视觉一致性与动效精修

Owner最新明确要求统一登录后卡片颜色、改善简陋子页面并增加可商用的动效组件。在原Graphite／Prepared Folio和既有导航、Profile分组内统一共享材料与短交互反馈；不重开已撤回的改版。实现使用项目自有SwiftUI／CSS和既有MIT图标，未引入收费组件或未核验的Figma素材。顺手修复功能列表窄列、Free旧文案和类别切换后的退出历史；测试／发布与精确范围见[精修合同](surface-motion-20260917.md)及[当前交接](handoff.md)。这只取代旧的不同卡片底色规则，不变更价格、权限或商业门。

## 2026-09-17 真实邀请与验证返回修复

Owner控制的A/B已实际完成注册／邮箱验证／明确接受、授权字段只读查看、A撤销及B刷新后的拒绝读取。发现的多余登录已通过同一会话的服务端验证状态复核修复，API30／0060部署及实际Auth0云端隔离测试通过。邀请页补明确返回，Web同意区域依Owner要求放到注册／登录按钮下方，仍须未预勾选确认；空列表使用No shared items。既有UI方向、法律版本和收费门不变。精确真人／隔离测试边界与后续工作见[当前交接](handoff.md)及[QA](../output/qa/rillora-real-invitation-20260917/README.md)。

## 2026-09-17 当前测试支付与运行基线

68年付／7.99月付已在独立Stripe沙盒实际付款，并验证限定验收账号的Family5、取消／恢复、终止后的Free1／授权旧副本、全额测试退款及去重。一次真实Spot回收导致的回调空档已通过同规模常规Fargate基线修复，实际任务健康。此检查点不改变产品价格、现有UI或生产收费门，也不代表真人B接受、Apple交易或商户通过。精确证据见[当前合同](commercial-completion-20260916.md)与[QA](../output/qa/rillora-stripe-acceptance-20260917/README.md)。

## 2026-09-16 剩余软件完成 — 历史任务与保留边界

Owner要求“除了实体设备，把其他都搞好”。继续完成实际账号邀请验收、事务化人数限制、付费截止版本与取消／恢复、支付验收及文档清理，保留现有UI。范围、当次测试和外部依赖见[当前完成合同](commercial-completion-20260916.md)；局部测试或本人登录不等于收费开放。

## 2026-09-16 修复范围 — Owner最新明确约束

Owner明确纠正：“我不是叫你重做ui，你怎么把我的ui给改了”。后续工作保留原有UI、首页构图、导航分组、Profile结构及视觉语言，只针对具体缺陷修复行为、状态、回退和必要反馈。完整审计是问题证据，不自动授权重排页面或生成并采用新的视觉目标；默认执行授权也不得扩大为改版。本次擅自扩大的首页／导航／公开页／Profile／法律布局已撤回，生成概念标为弃用。原Prepared Folio方向和已部署P1修复保留。局部修复的范围与验证状态见[当前交接](handoff.md)。

## 2026-09-16 后续行为修复 — 已发布合成验收检查点

Owner进一步要求“开始修吧”。按[行为修复合同](ux-behavior-repair-20260916.md)推进：沿用现有页面与组件，修复暂停引导恢复、邀请状态、前台权限刷新、返回上下文，并在现有People区／Visible details折叠区补齐操作和真实投影。没有新增预览步骤、中转页或视觉目标。现已发布至原staging并完成合成验收：API149、native145通过／1旧跳过、Web75、37项应用HTTP／资源、25项法律站及12项云端权限预览检查通过；精确边界见合同与交接。未改版的结构建议和真人／实机验收不能记为完成。

## 2026-09-16 P1修复 — 已发布基线

Owner在完整审计后要求“直接开始修复”。UX01–06现已完成本地修复和现有合成staging部署验收：按接收人导出、保存失败与草稿恢复、加载故障态、保存状态、备份／读取／导入／归档恢复／删除及权益真实性。API23运行1/1，0043–0047校验和匹配；Web、普通iOS Debug、法律站第4版及Auth0证明一致。云端发现的导入权限缺口已修正；148项API、36项HTTPS、25项法律站及受控完整功能链通过。见[修复合同](p1-reliability-repair-20260915.md)和[部署QA](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md)。这是合成验收，不是真实注册／送达／法律接受或收费证明；UX07–22和商业生命周期仍开放。

## 2026-09-11 邀请与登录后动效 — 已实现检查点

Owner再次确认Free一位共享联系人的完整路径，并要求先出图再还原登录后体验。现行[邀请／动效合同](invitation-motion-ux.md)把Overview与Profile的发出入口明确为Invite someone，按Person→Access→Link生成真实链接／二维码；接收入口单独归入Shared with me。选定第二张Prepared Folio概念，使用真实生成资产、状态连线、步骤／权限／复制反馈及Reduce Motion适配。接收完成或链接版本改变后，刷新移除旧二维码；未保存草稿保留。

本轮已完成Web／原生合成跨端接受、B/C不同权限、QR解码与撤销检查；native135通过／1旧StoreKit跳过，Web58通过，API未改动，聚焦11共享加1注册返回通过。现有staging只更新Web资源，31项HTTPS／文件匹配检查通过；API20仍1/1，0040–0042沿用此前部署。Free1/Family5商业名额、付费截止版本和收费上线仍为独立未完成项。证据见[当次QA](../output/qa/rillora-invite-motion-20260911/README.md)。


## Brand — LOCKED

正式主品牌名是 **Rillora**，大小写固定为首字母大写的`Rillora`。该名称适用于全球产品、Web、iOS和品牌识别；其他英文候选不再是活动命名方向。

`Rillora`是由`rill`与`flora`构成的合成词：细流表达安静、持续的传递，植物生命表达生长、根系和代际延续。它是品牌叙事，不是对自动转移、法律效力或信息必然送达的产品承诺。

Owner已购买`rillora.xyz`。`login.rillora.xyz`锁定为Auth0身份子域，公共DNS、Auth0托管TLS和默认自定义域已生效，根域为未来公开站保留；这不等于商标通过、公开发布、生产身份完成或接受一字之差`Rilora`风险。下文历史句中的“域名策略尚未锁定”现仅指根域公开站与防御性域名策略，不再否定`rillora.xyz`取得和身份子域分工。

Logo现已按Owner September19最新指令重新设计，所有以前的Logo限制均取消。旧的非字母限制、The Next Reader单一命题、形态排除及逐级门仅作为[历史探索记录](logo-discovery.md)保留，不能阻止当前设计。Agent自行选择方向并制作完整第一版，当前产物与边界见[Logo设计简报](logo-design-20260919.md)。中文名、标语、最终Logo采用和商标注册仍是各自状态；新的视觉设计不等于已完成商标清查。已有Rilora近似名称／App与.com占用的历史预清查结论也不能被误写为本轮新检索。

## Product Promise

如果用户明天死亡、失能或无法处理事务，被授权的人应能在不冒充用户的前提下：

1. 知道重要资产、负债、账号、设备和资料是否存在；
2. 知道每项事务应由谁处理；
3. 理解用户希望转移、关闭、删除、纪念化、延迟公开或永不披露什么；
4. 找到官方机构、必要文件和正确申请入口；
5. 看见哪些事项尚未准备好，而不是获得虚假的“全部已解决”保证。

## Product Definition

`Rillora`的当前工作定义是 **Digital Legacy & Estate Continuity / 数字遗产与事务连续性**。

它是一个持续维护的协调层，连接：

- 事务地图；
- 用户意愿；
- 可信联系人和合法角色；
- 平台官方身后机制；
- 当地法律文件的位置；
- 触发、验证、申诉和分阶段披露流程。

它不是银行、法院、公证人、律师、遗嘱执行人、密码管理器或第三方平台的替代品。

## Four Jobs To Be Done

1. **Discovery**：发现并持续整理重要事务。
2. **Authority**：明确谁有权在什么情形下处理。
3. **Execution**：告诉处理人合法且实际可行的下一步。
4. **Privacy**：按项目和接收人表达披露、保留或销毁意愿。

## Terminology — LOCKED

- `Asset Map / 事务地图`：资产、负债、账号、设备和资料的存在性与定位信息。
- `Planner / 规划者`：生前建立计划的用户。
- `Trusted Contact / 可信联系人`：可接收通知或参与验证的人，不自动等于继承人。
- `Executor / 执行人`：依法或依有效文件处理遗产或事务的人。
- `Recipient / 接收人`：被指定接收某项资料的人，不自动拥有资产所有权。
- `Claim / 申请`：有人报告死亡、失能或失联并请求启动验证。
- `Release / 披露`：在验证后按权限分阶段交付信息；不等于转移资产。

文案不得把“知道账号存在”“拥有密码”“获得平台访问”“具有法律授权”和“取得所有权”混为一谈。

## Project Execution Authorization — Current

Owner于2026-09-09明确：“本项目全部默认授权与确认”。当前项目目标范围内的必要工作直接执行，已具体说明的Apple登录密钥轮换也已授权；仅在确有平台本人交互、缺失必要信息或更高优先级规则时交回对应步骤。以 `AGENTS.md` 的最新执行协议为准，授权不等于完成或验证。

## Decision Status Model

- `LOCKED`：在明确范围内已决定；更改需要新的决策记录。
- `PROVISIONAL`：当前有效假设；可用于原型和测试，不可伪装成验证事实。
- `DEPRECATED`：保留作历史证据；不得成为默认方向。

## Product Truth — LOCKED

- 产品面向全球，但法律效力与执行规则必须按司法辖区和平台处理。
- Web与iOS在首轮MVP市场验证前都必须具备核心闭环。
- 未认证的Web与iOS入口都先允许访客了解产品、工作方式与安全边界，不把登录墙设为第一屏；只有明确的`Sign in / Sign up`以及保存、添加、编辑或读取私有计划的动作才进入认证。Web保留Header中的安静Account工具入口；原生iOS把唯一的公开身份入口集中到`Profile`顶部并从Overview移除重复入口。Owner于2026-09-06明确选择直接托管登录：该顶部入口以及`Add a matter`等真实私有动作立即进入`login.rillora.xyz`的Auth0托管认证，不再显示原生Account中转页、邮箱预填页、provider选择器或原生法律页。标准iOS域名提示由系统负责；取消返回触发登录的产品页面。未登录Profile除此之外允许打开收到的邀请、阅读公开Platform guides，并保留唯一的Safety & privacy任务入口和About Rillora；没有实际Rillora权限或设备任务时不得添加跳转系统Settings的入口。开发身份直达只允许在有界自动化／本地QA中显式启用，不得成为Owner看到的默认产品入口或任何生产入口。
- “允许理解产品”不等于把全部教育内容堆在首屏，也不等于只留一句抽象品牌话和一张看不出用途的卡。Web公开首屏和原生iOS公开Overview必须低文字负担但用途清晰：用`What exists / What happens / Who can help`可选择的图形与简短反馈让用户理解真实产品，不创建假账户、假联系人、假Matter或名为`Example / Sample / Synthetic example`的公开路径；旧的编号文章结构和静态三行版已由2026-09-09的交互地图取代。`Account`作为工具性入口保留，但原生iOS只在`Profile`聚合页出现；Profile的每个入口必须完成明确任务或提供可核验状态，不得用重复产品说明、不可更改的假设置或同一Safety入口填满页面。创建动作必须排在产品地图与分开的事件事实之后；在较高视口中可以同屏出现，但不得回到解释产品之前的登录墙。所有未认证一级页面以及Account选择使用产品、任务和账号语言，不把`Free plan`、`no card`或套餐名称做成标题、主按钮或重复安抚；永久Free的真实权益只在用户主动查看`Plan & access`或触发具名付费能力时解释。工作流程、隐私、法律与安全解释按上下文渐进披露，不以缩小字号掩盖信息过载，也不以“极简”为名删掉产品意义。
- 核心安全事实不能依赖难读的caption脚注来“形式上出现”。公开Overview用三个短事实明确区分`Death / Incapacity / Unreachable`，不再追加解释段落或第二套免责声明；Account选择只承担创建／登录任务，不在操作按钮后堆地图、密码或密钥脚注。深层任务用图标事实条和必要的一句任务上下文表达`No contact / No release / No authority`等边界，完整政策仍由Safety & privacy和对应任务页面渐进披露。
- 创建账户或首次登录后必须立即进入可用的私有计划总览；强制问卷、不可关闭的“Quick win”或完整资料采集不得阻塞浏览、手动添加第一项事务或离开引导。引导只能是可跳过、可退出、可恢复的辅助路径；注册本身、回答动机问题或阅读建议不得被计为准备完成、保护增强或法律效力。
- 创建或使用Rillora私有账户必须先完成简短、未预勾选、版本化的法律clickwrap：明确同意Terms、确认已阅读Privacy并同意电子记录。它不是问卷、准备度或provider选择器；不得加入营销、套餐或自动续费授权。当前iOS直接托管路径把必要确认放在同一个Auth0事务中，使用受支持的LEGAL字段和Post Login Action；不再在App内重复收集邮箱或同意。新客户端必须获得精确当前版本／bundle digest及三个true字段的托管记录后才交换Rillora会话，不能自行把默认值当作本人同意。App不收集Auth0密码；API仍验证原始token，并在同一事务中提交planner、append-only acceptance与session。Web的现有紧凑确认路径保持其独立合同。旧session、stale version、错误digest或missing／false checkbox均不可使用私有API。注册同意不等于订阅同意；每笔recurring purchase仍需独立、清晰、当下的价格／续费／取消确认。
- 公开Web当前只使用认证事务、已认证session、CSRF和记住必要存储提示的本地值；没有广告、跨站跟踪或第三方行为分析Cookie。当前banner是信息提示，不把`Got it`伪装成对未来可选技术的同意。任何可选分析／营销存储必须先保持关闭，直到适用法律要求的事前同意、同等易用拒绝、管理、撤回和opt-out preference signal处理真实可用。
- 公开收费availability不再锁定为USA-only。最新Owner方向是：所有通过版本化市场登记门的国家／地区都应开放，而不是为了流程简单只上美国。Apple storefront可选择不等于法律、运营或Web支付已经通过；App下载、服务资格和购买渠道继续分层判断。`USA`与`HKG`是第一波核心候选：美国保留Web Stripe主路由／StoreKit fallback，香港iOS可使用StoreKit，香港Web Stripe必须等待真实香港经营／Business Registration、live KYC、银行／税务和支持门。其他英语或StoreKit市场在其privacy／consumer／tax／support行通过时同批或随后开放；EU／EEA、UK、中国大陆及有特别备案／税表／支付规则的地区仍逐项过门，不自动继承“All Countries”。
- 共享核心是统一领域模型、权限、状态、审计和实验事件，而不是共享一套像素级界面。
- MVP默认不保存银行卡密码、完整助记词或可直接转账的单点秘密。
- 未签到、未登录或订阅过期不能单独触发敏感资料披露。
- 死亡、失能和失联必须是独立状态与验证路径。
- 用户可以逐项指定接收人和意愿；“全部给一个人”不是强制默认值。
- 外部平台的删除、转移和访问结果只能按其官方规则描述，不能保证。
- 产品本身必须支持可导出、迁移和退出计划，避免用户被一家公司的寿命永久绑定。
- Owner于2026-09-21取消新月付；仅永久Free与US$88.80年付Family。历史9.99／7.99月付价格、已购账期与收据保留，不静默迁为年付。Apple年价因缺少精确88.80价格点，具体替代金额待Owner选择；99.99／119.99渠道建议未获批准。Owner明确不招人，功能优先自助、运营优先有界自动化；未来功能和服务迁移完整规划、按证据分期，不默认无限AI或人工代办。收费可用性、市场需求及持续自动化必须分别验证。
- MVP核心数据和流程保持链下可更正、可撤销和可删除；区块链不承载个人数据、密文、可关联哈希、身份、申请或释放逻辑。

- Owner于2026-09-11要求账户入口统一`Sign in / Sign up`；访客只可打开收到的邀请，创建／发送邀请需登录，新接收人注册后返回继续明确接受。去除登录后的`Opening Rillora`中转、Profile中的消费者模拟／重复角色演练与动机卡片。事项采用单页分类表单，必填定位信息由三端共同校验，每类保留末尾可选Notes；Crypto区分交易所和链上公开钱包定位。具体以[当前录入合同](account-matter-ux.md)为准。

## Market Hypotheses — PROVISIONAL

首批用户不按年龄定义，而按“数字事务复杂度 + 对他人的责任 + 当前触发事件”定义。

候选人群包括：

- 跨国生活或持有多国账户的人；
- 有伴侣、孩子或其他依赖者的人；
- 创业者、开发者和创作者；
- 持有投资或加密资产的人；
- 最近处理过亲友遗产的人。

首个付费客群尚未锁定，必须由MVP中的完成、邀请、演练、复访和真实付款行为决定。

## Non-goals — LOCKED For MVP

- 全球自动生效的电子遗嘱；
- 自动转移银行资金、证券或所有第三方账号；
- 用账号密码冒充死者登录；
- 托管完整加密货币助记词；
- 只凭失联时间自动释放全部秘密；
- AI数字分身、死亡机器人或纪念社交网络；
- 在没有本地法律审查时声称“合法、有效、保证执行”。

## Authority Map

| Task | Read next | Role |
| --- | --- | --- |
| 正式上线、剩余工作、发布预检与排期 | `docs/release-readiness.md` | 当前首发范围、缺口和验收；不等于发布批准 |
| P1可靠性／导出范围／草稿／自助退出修复 | `docs/p1-reliability-repair-20260915.md` | 已部署P1基线及验收；新一轮发布状态见handoff |
| 全应用UI/UX审计、体验缺口及下一轮修复优先级 | `docs/ui-ux-audit-20260915.md` | 修复前证据及当前处理状态；不是新视觉定稿 |
| MVP范围、用户旅程、指标或付费测试 | `docs/mvp.md` | 验证合同 |
| 免费／付费边界、套餐、月年付、试用、退款或订阅生命周期 | `docs/monetization.md` | 商业化与权益合同；价格仍待市场验证 |
| Family共同复核、接收人问题反馈、建议审批、修正历史或复核计划 | `docs/family-maintenance.md` | 已实现的共同维护预览与证据；不是收费或真实通知证明 |
| 单位经济、毛利、LTV/CAC、成本分配、现金跑道、融资或收购尽调准备 | `docs/unit-economics.md` | 财务模型与证据合同；不是融资建议或市场结果 |
| 88.80年付、新月付停售、历史收据或价格修订 | `docs/pricing-88-80-20260919.md` | 当前报价与历史金额；渠道价不可从建议推定 |
| September21年付实施、Logo全入口核查、100用户容量 | `docs/annual-brand-capacity-20260921.md` | 当前部署、provider回读、容量实测及未完成品牌位置 |
| 自助、运营／安全／支持／营销自动化、全部功能分期或供应商迁移 | `docs/solo-operations-and-portability.md` | 当前单人经营与迁移合同；planned不等于持续运行 |
| 历史49–88价格敏感性 | `docs/pricing-band-20260910.md` | HISTORICAL研究；当前新价由September19的88.80／9.99合同管理 |
| 个人身份首发、运营主体、首发地区、个人收款、公开法律身份或未来转公司 | `docs/individual-operator-launch-plan.md` | 个人运营与公司迁移合同；不是法律／税务意见或发布批准 |
| Global／中国大陆分区、香港个人经营路径、Stripe／Paddle或支持邮箱 | `docs/global-mainland-commerce-plan.md` | 地区与商业运营聚焦合同；不授权注册主体、收款、报批或发布 |
| iOS外部支付、美国Stripe路径、Storefront路由、Reader／服务例外或App Review风险 | `docs/ios-external-payment-research.md` | iOS支付聚焦合同；不等于Apple预先批准或收费授权 |
| StoreKit 2实现、本地Xcode测试、App Store sandbox、Apple交易／通知验证或IAP服务器边界 | `docs/storekit.md` | StoreKit工程与证据合同；不等于Paid Apps Agreement、App Review、权益或收费完成 |
| Web与iOS职责、功能同步或共享模型 | `docs/platform-contract.md` | 平台合同 |
| 密码、加密、死亡验证、披露、隐私或法律文案 | `docs/trust-safety-legal.md` | 信任边界 |
| 银行级／AES／零知识等宣传、内容密钥架构或独立安全证据 | `docs/security-positioning-20260921.md` | 当前能力与提案边界；不是认证或加密重构完成 |
| 公开Privacy Policy、Terms、法律页事实输入或是否可发布 | `docs/public-legal-pages.md` | 公开法律页草案与发布门；不是法律意见 |
| 中文理解七份正式英文法律文本、责任／退款／保留／Cookie或翻译选择 | `docs/legal-candidate-zh.md` | Owner已批准的中文参考译文；不是对外合同或法律意见 |
| 死亡证明真实性、申请人权限、律师／公证协助或权威登记接口 | `docs/death-verification-evidence-research.md` | 聚焦证据与架构研究；不授权真实披露 |
| Apple／Google／Meta／GitHub／Microsoft／支付或加密平台的官方身后设置、家属申请入口、材料和结果边界 | `docs/provider-death-account-guides.md` | 常用provider官方入口与产品指导合同；不是法律意见、登录授权或转移保证 |
| 是否可以进入设计、开发、测试或发布下一阶段 | `docs/quality-gates.md` | 验收合同 |
| 法律、平台、竞品或用户证据 | `docs/research.md` | 证据，不是决定 |
| 新决定、否决或取代关系 | `docs/decision-log.md` | 追加式决策记录 |
| 当前阶段或上下文压缩后的恢复 | `docs/handoff.md` | 当前交接 |
| 项目判断为什么变化 | `docs/journey/PROJECT_JOURNEY.md` | 历史与经验 |
| Web/iOS视觉、组件或交互实现 | `DESIGN.md` | 已选设计合同 |
| Rillora Logo、字标、App图标或品牌资产 | `docs/logo-design-20260919.md` | Owner已推翻旧Logo限制；当前设计、产物与验证 |
| Rillora历史Logo方法、形态限制与旧失败 | `docs/logo-ai-workflow.md` → `docs/logo-form-brief.md` | HISTORICAL；不再是活动门 |
| Logo探索、候选谱系或当前选择门 | `docs/logo-discovery.md` | Logo发现记录；不等于最终批准或商标通过 |
| 第三方公司Logo、账号图标、指示性使用或官方素材许可 | `docs/provider-mark-usage.md` → `docs/provider-icon-practice-research.md` | 当前采用方法与实际产品证据；不是全球法律许可 |
| 字体、图标或视觉资产来源 | `docs/asset-licenses.md` | 原型许可证记录 |
| API、PostgreSQL、认证边界或运行状态 | `docs/backend.md` | 后端实现合同 |
| Start Here预览、打印或加密包 | `docs/start-here-export.md` | 导出与披露合同 |
| 死亡、失能、失联的角色级披露策略演练 | `docs/disclosure-rehearsal.md` | 非操作性状态机与最小字段合同 |
| 账户文案、登录返回、Profile清理、事项分类必填和Notes | `docs/account-matter-ux.md` | September11当前任务与交互合同 |
| 联系人邀请、账号绑定接受、按接收人／事项共享 | `docs/trusted-sharing.md` | Owner主动共享合同；不开放身后释放 |
| 规划者编辑角色、范围、证据与撤销 | `docs/role-assignment-policy.md` | 角色记录与生命周期合同；不建立真实授权 |
| MVP事件、属性、来源或保留边界 | `docs/product-events.md` | 隐私过滤的第一方事件合同；不等于市场证据 |
| 身份提供商、passkey、恢复或首个数据区域 | `docs/identity-data-region.md` | 身份与区域合同 |
| 域名、服务器、云资源、零收入成本、性能、安全、迁移或扩容阶段 | `docs/infrastructure-roadmap.md` | 基础设施／成本／迁移合同；不授权付费资源或真实数据 |
| Account到托管注册／登录的体验、Auth0页面视觉或认证提示状态 | `docs/authentication-experience.md` | Universal Login产品与视觉合同；不改变凭据或API授权边界 |
| 访客与过期会话首页、完整多级页面交互、动态选择和低文字密度 | `docs/interaction-experience.md` | 2026-09-09全深度交互与动效修订；当前实施覆盖合同 |
| Web3、链上存储或完整性证明 | `docs/blockchain.md` | 区块链边界决定 |
| 仓库资产、信任边界或严重度 | `SECURITY.md` | 威胁模型 |

## Dated Evidence Archive — current release status is in handoff

2026-09-11本轮账户／邀请／事项改造已在本地完成：API136通过，native133通过／1项既有StoreKit跳过，Web58应用测试通过，两端实际Crypto保存／重开与Notes已检查。`/v1/overview`和native会话首屏、0041分类字段／Notes、0042共享字段白名单已实现；现有合成staging两阶段更新完成：migration15退出0，API20为1/1、CloudFormation完成，30项HTTPS／发布文件检查通过，云端0040／0041／0042校验和与源码一致。AWS旧登录命令和STS已确认成功，禁止因浏览器回调错误重复索取认证。最终状态以[QA](../output/qa/rillora-account-matter-ux-20260911/README.md)及handoff为准。

2026-09-11较早价格／自动化基础检查点：Owner选68年费、明确不招人，Agent选7.99月费。完整自助／功能／支持／营销／运维／安全／迁移合同和服务／任务登记已建立；迁移0040及API目录本地130项测试通过，保留旧测试交易。现金交付毛利与本人劳动分列，模型87项独立数值检查通过。公开监控本地6项、infra15项与独立CDK合成通过；7个公开URL的HTTP状态与指定安全头复核符合预期。人类AWS会话随后已恢复；告警接收与云端持续探针仍未验证。未改外部支付商品、未部署独立运维栈、未发布社媒、未上线AI客服或宣称无人值守安全。工程主线仍是准确截止版本／名额／取消恢复的最小可售闭环，见[当前经营合同](solo-operations-and-portability.md)、[当前价格](pricing-68-20260911.md)和[交接](handoff.md)。

2026-09-10历史小项目检查点（报价已被68取代）：Owner要求49–88年价，尽快上线、少维护个人收入或未来收购，期望80–90%毛利。本轮固定原阶段成本进行比较：79为主报价候选、88为上限，月付配对建议8.99；均无WTP证明。70%Web／30%Apple首年30%时，79千户毛利79.9%、88为80.6%；真实获批Apple15%后分别84.6%／85.2%。单靠加价达90在原渠道下不可行。稳定后100户约4.8小时/月工作、替代持续劳动后约303美元/月，是未实测预算；不因“睡后收入”忽略维护。自建完整AI客服平台退出上线前置项，先补最小可售商业闭环，保留隐私／恢复／商户证据门。[区间与范围合同](pricing-band-20260910.md)。没有运行或支付商品变化。

2026-09-10最新阶段经济修订：Owner要求纠正早期固定成本／人工客服假设，并询问赛道毛利与Apple15%门槛。Rillora按面向家庭的垂直订阅软件经营，规模后毛利目标75–85%；已用当前行业原始资料、AWS公开Frankfurt价目和按咨询量计算的AI／人工升级重建0／10／30／100／300／1,000户模型。49参考年价下，100户含直接劳动毛利65.9%，1,000户76.0%；若真实获批Apple15%则约80.7%。约30户仅覆盖月均持续现金支出，不包含本人取薪／一次性上线投入／所得税。90%AI独立解决率尚未验证；1,000户不会因户数自动丧失SBP，门槛按关联账户合并App Store proceeds且需申请获批。没有实际账单、AI支持上线或资源调整。此阶段模型取代下段平铺成本结论，见[当前经济合同](unit-economics.md)。

2026-09-10较早重定价检查点（经营假设已由上述阶段模型取代）：Owner否定共同复核足以支撑US$99，选择 **US$49/年、US$6.99/月**前瞻验证价；永久Free与单一Family保留，39/59作敏感性，99退为条件扩展。该轮平铺成本的26.72美元贡献／48.2%千户毛利仅保留为[历史情景](unit-economics-pricing-reset-history-20260910.md)，不是当前阶段模型。旧测试商品金额仍未改变。

2026-09-10 Family功能落实：Owner要求直接规划并实现可体现年费价值的功能。API／Web／iOS现已实现并部署Shared reviews：按现有权限发起复核、接收人确认／报问题、指定一人提出provider／location更正、本人审批更新真实事项、保留修改前后历史与复核日期，并可分享不含私密标识或权限的收件箱入口。API129、Web产品54＋法律隔离7、原生129／既有跳过1及最终聚焦5、基础设施10通过；实际Web A/B/C、原生A/B、草稿保护和AX5／Reduce Motion已观察。AWS迁移14退出0、API19服务1/1、27项HTTPS／文件检查通过；预览开启，开发身份关闭，普通收费仍关闭。完整协作者所有权、外部通知、全计划历史、人数商业限制与到期固定版本不在本轮完成范围；不宣称US$99意愿已验证。见[共同维护合同](family-maintenance.md)与[交接](handoff.md)。

2026-09-10同轮竞品收费复核：以MyLifeLedger、Quicken LifeHub、Everplans、Trustworthy、GoodTrust官方价格／帮助页对照收费价值。较低价直接替代品存在；“地图而非密码”、逐项共享和提醒不是已证明的独有优势。竞品的年付月均价、首次制作费、当前协作者与未来接收人不能混成同一单位。Rillora仍需以低负担录入、接收人的具体可执行准备与真实共同维护结果验证差异，US$99继续只是待验证假设。未开通竞品账户／收费服务或改变本项目套餐，详见[当前商业比较](competitor-ux-audit.md)。

2026-09-10同轮商业追问修订：Owner指出“只订一个月”仍永久保留多人更新的问题。本轮将到期后资料取回与持续服务分开：Free保留一位指定的实时共享接收人，其他已接受者只读已获准的付费期固定版本；本人核心文本仍可编辑／导出。此设计取代早先同日“所有已接受者继续读取后续更新”的提案。固定版本和商业访问模式尚未实现，当前无收费／配额切换；月付后正常取消不是滥用，年付价值仍需共同维护的真实结果验证。以[商业合同](monetization.md)及[本次追问记录](../output/qa/rillora-packaging-review-20260910/expiry-followup/README.md)为准。

2026-09-10商业与文档复核：完整阅读55份／16,011行项目Markdown后，对照权益目录、邀请API和两端Plan & access。永久Free＋单一Family及Free一人路径是既有决定；本轮明确“一人”按向外共享关系计算，Family五人是可调整的首发假设，接收别人分享与逐项隐私控制两版免费。现有邀请接口尚未执行套餐人数限制，Family共同维护／自动复核／历史也未交付，普通收费和权益变更继续关闭。具体合同、验证分母和安全降级见[monetization.md](monetization.md)，当次证据见[复核记录](../output/qa/rillora-packaging-review-20260910/README.md)。开工／压缩恢复／收尾协议已强化，交接只保留当前状态；以下各段是注明日期的既有检查点，不代表本轮重跑测试或当前任务仍需重做所有旧门。

2026-09-10邀请与共享检查点：Owner明确要求A邀请B、B注册／登录接受，并对B／C分别设置事项与细节范围。Web与iOS已完成联系人创建、链接／二维码、按接收账号绑定、只读共享与撤销。默认不共享；Name／Directions／Details逐人逐项设置；未选内容不返回标题或数量。API 115、Web 48、原生124单测和两项UI流程通过（保留一个既有StoreKit跳过）。AWS登录恢复后已完成现有合成staging的数据库／API／Web两阶段更新；迁移退出0、CloudFormation完成、服务1/1，18项HTTPS／文件一致性检查通过。本地合成接受和云端部署不是实际亲友身份或送达证明；接收人的真实provider闭环仍需独立验证。以 [共享合同](trusted-sharing.md) 与 [交接记录](handoff.md) 为准。

2026-09-09 Apple恢复检查点：Owner完成管理员MFA后，既有Rillora Apple连接已采用替换密钥及网页登录Services ID；旧登录密钥已撤销，iOS绑定已恢复且其他绑定保留。实际邮箱优先页面显示Apple，浏览器点击到达Apple官方Rillora Account授权页；390px／320px无横向溢出，输入文字统一灰色，iOS新事务进入及取消已观察到。这关闭配置与入口验证，不等于本人Apple身份、协议确认和私有地图回调完成。

2026-09-06最新认证入口决定：Owner明确选择“删除图一，直接使用托管登录”，取代原生Account中转页。iOS的私有意图直接进入Auth0托管流程，必要协议确认也在托管事务内完成。新客户端必须收到当前同意记录后才交换Rillora会话。Form、已部署Action及绑定已应用并回读，Owner的Google登录、必要确认、code exchange与返回私有总览已观察到；最终确认页的初始、未勾选错误及取消状态另经实际UI检查。邮箱在前、其他方式在后，保留简短Google提示；同邮箱自动合并未启用。Apple的配置门已由上述9月9日检查点关闭，其实际身份验证仍独立记录。其余整App UI/UX改进继续有效。以 `docs/handoff.md` 与 `docs/authentication-experience.md` 的最新状态为准。

2026-09-06整 App UI/UX 检查点：Owner明确将审阅范围扩大到整个原生App。当前候选采用灰色输入、移除Account底部域名说明、事务直达与待复核优先、可搜索列表、持续可见的字段标签、未保存修改保护、描述清楚的工具入口和分开的预览／导出选择。原生单元测试 `111 / 0 / 1`、常规字号 UI 的 14 项路径及额外 AX5 路径通过。横屏通过显式窗口几何请求与实际宽高断言验证，自动旋转的设备行为仍单独开放。当前实现、证据和唯一下一步见 `docs/handoff.md`，具体视觉规则见 `DESIGN.md`。这不改变共享领域、身份、法律或发布边界。

2026-09-06较早原生身份检查点：Account布局、三入口、默认未勾选／勾选／撤回、邮箱校验、Cancel重置、Apple＋Passkey可见与Google隐藏已经由Simulator运行验证；原生测试`106 / 0 / 1`、默认字号聚焦UI `3 / 3`、AX5同意路径`1 / 1`。Terms／Privacy实际打开Safari，托管系统提示和Passkey系统请求均可取消。Passkey仍停在系统跨设备／蓝牙需求，没有真实credential assertion、Auth0 token或Rillora session；Apple identity key的既有轮换门仍开放。具体证据与下一步以`docs/authentication-experience.md`和`docs/handoff.md`为准。以下较早测试总数保留其各自检查点，不代表本轮重新执行。

- 死亡验证：已完成Apple Watch安全信号、死亡证明真实性、申请人权限、律师／公证协助和美国／英国／欧盟权威来源可用性的聚焦研究。当前锁定死亡事实、申请人身份、合法权限与Rillora披露范围四门分离；上传扫描／图片只作case intake，AI检测不能授权释放。未来采用按法域适配的Evidence Rail和`Verified Release Corridor`，但当前没有任何已开放corridor、已选供应商或真实证明验证能力，非操作性演练继续零通知、零核验、零释放。
- 全球法律和平台扫描：已完成初版研究，不构成法律意见。
- 市场与竞品：已有官方页面和公开用户信号，尚无本项目真实用户数据。
- MVP：范围已定义，Web核心状态已接入API；Web根页与原生iOS无会话启动都先显示无需账户的公开产品状态，`Account`和私有计划动作才提供登录／创建账户，所有私有计划API仍要求真实Auth0会话，开发规划者直达不再默认启用。Auth0 EU Free开发租户上的Web与iOS真实登录、本地会话和退出已用合成身份验证，隔离虚拟WebAuthn认证器已验证Web Passkey；Owner也已在iPhone模拟器本人完成一次Auth0登录，Agent没有接触凭据。`login.rillora.xyz`的DNS、托管TLS、默认域以及Web与iOS Debug在该issuer下的登录／会话／退出已验证；iOS还证明了Keychain进程重启恢复。两端现支持经15分钟预览与双确认生成最小披露UTF-8明文指南、客户端AES-256-GCM密文包和独立离线Owner恢复密钥；服务端不能解密。生产拒绝启用的本地合成流程还验证了一次性接受、P-256公钥登记／撤销和收件人侧解密合同。三端又完成死亡、失能、失联三套独立非操作性状态机、精确角色字段预览，以及全计划／逐事项角色记录编辑；政策变化会使冻结演练快照过期。服务端还实现八个严格属性白名单的第一方本地进度事件，但没有第三方收集、清理任务、外部用户或市场结果。真实Apple设备／原生Passkey、恢复、Release身份、真实邀请／身份绑定接受／投递、真实证明核验、真实设备密钥持久化、KMS附件、真实释放和市场测试仍未完成。
- Web/iOS：Calm Continuity已选；Web是API连接的React实现，并已把模拟接受、真实接受和仅联系人记录分开显示。`apps/ios`已在iOS模拟器通过共享API完成动机单选、Matter CRUD、可信联系人记录管理、官方设置自报、死亡／失能／失联的非操作性计数快照与角色级策略演练、Start Here预览、明文分享、恢复型客户端密文包，以及仅内存的合成收件人设备密钥／解密演练。策略演练包含事件专属阶段、多人核验、示意冷静期、本人取消／申诉状态和精确字段白名单，但始终保持零通知、零证明核验、零释放。它不证明真实邀请投递或接受、真实收件人身份、设备密钥长期保管、provider设置改变、真实申请处理、生产端到端加密、生产认证、手动新路径UI、真机或TestFlight完成。`apps/ios-prototype`继续只作为移动交互与视觉证据。
- 常用provider官方指引：2026-08-20以Apple、Google、Meta、GitHub、Microsoft、LinkedIn、X、PayPal、Coinbase、Binance、Bitwarden和1Password的官方页面建立首批十一类Web／iOS指导目录。生前可设置与身后申请被分开；每项提供简短步骤、通常材料、provider专属边界、最后复核日期和HTTPS官方外链。iOS仍只对既有五项保存`self_reported`状态；额外平台是可执行参考，不伪装成provider验证。Binance明确记录为按地区／实体发起的inheritance support申请，未声称存在公开global Legacy Contact开关。该功能检查点为Web `40 / 40`、iOS `91 passed / 0 failed / 1 skipped`、Debug build及Apple官方链接真实打开；后续StoreKit工作把完整native套件提高到`94 passed / 0 failed / 1 skipped`，不改变provider证据边界。它仍不证明外部设置完成、文件有效、provider批准、资产／账号转移或法律权限。
- 登录后iOS根页面：2026-08-20根据Owner实图反馈，空计划Overview／Matters／Profile从重复说明卡收敛为图标与行动优先的根层级。Overview只保留一个Add动作和一张圆环／Matter／联系人进度面；Profile统一action surface并删除根级`Policy version`和长权限说明，准备／支持入口使用普通字号两列、辅助字号一列的SF Symbols任务网格；空Matters改为一个图标、一句提示和一个Add动作。该UX检查点为Owner控制的空计划Simulator默认字号与AX5、真实route push／Back、Debug／Release build、native `87 passed / 0 failed / 1 skipped`及Layout Matrix build-for-testing；后续完整native套件为`94 passed / 0 failed / 1 skipped`。它不证明填充数据全组合、完整XCUITest矩阵、真机辅助技术、外部理解或发布。
- 安全：仓库级威胁模型、最小权限数据库角色、强制RLS、OIDC身份映射、typed Cookie/Bearer本地会话、CSRF边界、客户端加密合同和集成测试已完成初版。Auth0 EU Free开发身份、虚拟Web Passkey和`login.rillora.xyz`托管TLS／默认域已联调，Web与iOS Debug均在新issuer下完成合成身份登录、会话和退出；Start Here服务端只保存密文、公钥和封装后的密钥，不接收恢复私钥、收件人私钥或明文。合成收件人路径使用独立最小权限数据库角色、单向能力摘要和生产启动禁用开关。披露策略演练另以数据库约束和三端响应验证固定`simulationOnly: true`及所有操作性标志为`false`。Owner交互式本地API已停止，本机PostgreSQL只保留自动化测试用途；Frankfurt合成staging已通过非root operator完成私有RDS、分离migration/runtime身份、Fargate Spot、API Gateway和CloudFront两阶段部署，正式staging域可达，但只获准处理合成数据。Owner也已本人完成一次模拟器云端Auth0登录；这不构成生产身份或真实敏感资料许可。真实恢复、原生Passkey、Release配置、真实收件人密钥生命周期、生产对象存储/KMS、冗余与私有出口、DPIA、生产渗透测试和独立审计尚未完成；Vercel未用于认证后产品面。
- 商业：永久Free、一个Family权益层级和月／年两个账期保持锁定；US$9.99／US$99是该历史检查点的测试金额，已由2026-09-10的US$6.99／US$49前瞻验证假设取代，所有公开市场／销售路由和普通entitlement mutation关闭。Stripe Phase 1C已在独立Rillora测试账户完成付款、signed Webhook、Portal取消、全额退款、duplicate、dispute revoked／won与past-due／恢复，所有对账均未改变普通Free access。StoreKit SK0的Xcode本地完整矩阵继续有效；App Store Connect现另有非直播同组月／年商品、八个代表storefront和两个保留的目的限定Sandbox tester。官方Apple `x5c`验证、设备交易／Notifications V2 intake、App Store Server API signed-status规范化和durable subscription／reconciliation executor已在本地实现，只有authoritative snapshot提交成功才返回finish授权，且每次都记录`entitlement_mutation_applied=false`。此前Pro Max的`Products unavailable`已定位为残留Xcode-local StoreKit服务；干净iOS 26.4／26.5 Simulator均从真实USA Sandbox目录返回年付US$99与月付US$9.99。新增Debug-only purchase scheme只在本地合成planner／API下开放真实Sandbox按钮，且服务端确认前不finish。当前API`98 / 98`、iOS`101 / 0 / 1`、AWS IaC`9 / 9`；Chrome最终key的`.p8`已安全落盘并通过PKCS#8／OpenSSL／官方客户端构造及真实Apple `4040010`认证探针，前两把无私钥key已撤销，Apple只保留一把有效key。Owner明确确认后，原tester与两个新建tester在两套干净Simulator上都由AuthKit识别，但Apple账号持久化随后统一失败为`AMSErrorDomain 100 / Password reuse not available for account`，因此没有payment sheet或交易。被一次UI自动化回显的replacement credential已撤销／删除并轮换；当前第三套只在Keychain。数据库StoreKit Sandbox inbox／event／subscription／reconciliation／mutation均为0，普通`commerce-v1`仍Free。Apple-enabled secrets／stack仍只synth未部署；实体iPhone当前离线。App Review、真实Sandbox购买完成／通知／restore、Apple-enabled staging、live Stripe KYC／税务和真实收费仍是独立门。StoreKit细节见`docs/storekit.md`；套餐、地区与经济边界继续见`docs/monetization.md`、`docs/global-mainland-commerce-plan.md`和`docs/unit-economics.md`。
- 运营主体与市场：Owner已锁定开发、封闭测试和首次公开发布都由真实个人运营，不为发布虚构公司；`Rillora`是产品／品牌，不是尚不存在的合同方、商户或数据控制者。Owner另披露持有非永久香港身份证，这使真实香港个人／独资经营路线进入条件评估，但不自动证明经商许可、香港税务居民、Business Registration、银行／运营实质或免除中国大陆全球所得申报。Global公开收费不再限制为美国单一storefront，而是开放所有通过版本化market register的ready国家／地区；`USA`与`HKG`是首波核心候选。美国Web／iOS可在真实香港经营链与Stripe live门通过后使用Rillora Web外部结账，StoreKit保留审核fallback；香港及普通ready非美iOS使用StoreKit，香港Web Stripe仍等待真实经营／Business Registration、KYC、银行与税务。购买界面按瞬时StoreKit storefront判定，服务资格另按服务市场、支付账单国和现有订阅求交集；任何Apple Account地区都不是居住证明。Stripe与StoreKit共用一套服务端权益／财务账本，同一家庭层级最多一条活动续费渠道，换区不自动迁移或重复购买。日本／巴西／韩国、EU/EEA、UK及其他特殊规则市场逐项过门；中国大陆继续使用共享核心但分离数据／身份／支付／法律平面的独立App路线。Apple可选店面不自动成为法律开放；只有ready rows进入实际availability。完整合同见`docs/individual-operator-launch-plan.md`、`docs/global-mainland-commerce-plan.md`与`docs/ios-external-payment-research.md`。
- 私人运营者输入：2026-08-27 Owner已私下提供英文法定姓名、香港居住／税务国家输入和地址，并确认香港法／非专属法院、责任cap、一年索赔期、按渠道退款、长期活跃账户保留、个人运营、独立购买同意和`USA / HKG`首波意图。Owner随后明确授权把此前提供的地址作为Rillora公开法律服务地址使用；六项发布字段的值与公开用途因此全部确认。准确个人值仍不得进入仓库、Markdown、普通测试或日志，只能在release build中受控注入。当前工作不由Agent判断签证／NOL／自雇或商业登记资格；运营许可不因条款成立而成立。
- 正式法律文本与Cookie提示：Owner于2026-08-27确认全部十二项审阅结果，七份英文文本统一为`2026-08-27-1`正式版本，页面状态为`Effective`；Terms／Privacy bundle SHA-256为`73d9cb6039b97f72d802e543d03944355e68b2bc59a7f859326ce3236b704d2b`。2026-08-29六项字段通过隐藏输入进入Git忽略的本地`0700/0600`配置，Owner本人确认最低必要公开字段，Agent未读取或截图个人字段。2026-09-03法律专用Sites version 3已于`https://legal.rillora.xyz`公开，七路由／DNS／TLS／安全头／脱敏渲染及Web／发布`48 / 48`通过；Google OAuth Branding又保存并重载回读根域、Privacy与Terms精确URL，Audience仍为`External / Testing`。它不证明真实用户同意、Google验证／生产发布、市场开放或任何条款在所有司法辖区必然可执行。
