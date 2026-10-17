# Rillora Product Constitution

Role: canonical product gateway and decision authority  
Authority scope: current product definition, terminology, constraints and document routing  
Superseded by: Owner后续明确决定，并记录在 `docs/decision-log.md`  
Do not use for: 具体法律意见、实现完成度、发布状态或历史过程  
Status: PRODUCT FOUNDATION ACTIVE  
Last updated: 2026-10-17 (Asia/Hong_Kong)

本文件是任何产品、设计、Web、iOS、安全、研究或商业任务的第一入口。它刻意保持为决策层；细节由Authority Map路由到聚焦文件。

## 2026-10-17 免费隔离托管及新增客户端

Owner要求继续长期托管和其他AI平台，尽量免费且不影响审核。[独立合成候选](architecture/ai-hosting-20261017.md)已运行于Cloudflare／Neon Free，原版Claude Code及Cursor完成真实OAuth、选定读取、刷新与撤销。Auth0仅新增一个候选登录应用，下游客户端各自独立；旧应用和生产不变。Owner没有Claude官网账号，不要求注册或升级。候选、客户开放、模型选工具和目录审核仍是不同证据。

## 2026-10-15 审核期间启动跨平台 AI 下一版本方向

Owner 要求当前 Apple 审核继续，新功能放到下一版本，并明确按方案实施及推Git；AI目标覆盖各平台。当前以[跨平台方案](architecture/ai-discovery-vnext-20261015.md)区分公开搜索推荐、目录分发和连接后的受权操作。[实施候选](architecture/ai-discovery-implementation-20261015.md)包含20页双语HTML、两个只读MCP工具、选定范围授权和多平台配置。[两家真实OAuth与撤销](architecture/ai-oauth-validation-20261016.md)已通过并清理临时资源；[官网独立部署](architecture/public-discovery-rollout-20261016.md)已完成20页／54文件的实际交付，Google和Bing所有权验证及站点地图提交完成。Google实际即时抓取成功，但常规报告仍未读取；Bing已成功解析20个地图网址，索引和推荐效果尚未证明。[临时公网HTTPS验收](architecture/ai-https-acceptance-20261016.md)又补齐浏览器选择、真实Codex OAuth、限定读取及同一未过期令牌撤销，临时资源已清理；长期托管、模型选工具及目录仍独立待验。正式登录配置不变；未使用的Default App仅有已声明的认证方法规范化。在审构建、生产数据、定价与收费状态保持。

## 2026-10-15 Web正式开放与Owner停止真机验证

旧身份窗口已过并重新取得拒绝证据，正式Web访问／新购已按原授权开启，价格与关闭自动计税保持；两条Apple新购仍独立关闭。审核账号双端登录及合成资料读写已验证。Owner明确“真机不用验证了”，余下真机检查不再作为本轮待办，不冒称通过；已确认的法律往返保留。[当前结果与边界](app-review-preflight-20261014.md)。

## 2026-10-14 Owner暂缓Auth0外壳，优先Apple提审复核

Owner认为当前Auth0页面问题可暂缓，要求再次严格核对Apple提审资料并继续其余上线工作。[当前提审复核](app-review-preflight-20261014.md)取代只处理Auth0文案的优先级；保留真实认证、旧身份令牌安全窗口、价格／数据／FanPass和TestFlight暂停。不得保证首次审核必过，也不得把过期／不可用的审核账号当作已填资料通过。

## 2026-10-13 法律页重复说明删除

当前平台排查见[Auth0稳定性与Apple发布前API](provider-diagnostics-20261013.md)：Auth0旧外壳未恢复；Apple官方发布前限制解释了当前401，将Production实测放在发布后开售前，不再阻塞提审。原工单关闭请求已收件，非已关闭证明。

Owner确认原生条款／隐私入口可打开，指出隐私页顶部外观和语言说明影响阅读，并明确不必独立展示就删除。按[本轮精简](legal-page-layout-20261013.md)移除法律站顶部重复块，不另造折叠入口；既有法律正文、版本、实际存储披露和单一语言保持。

## 2026-10-13 最终发布收尾

Owner要求把所有工作推进到可以正式上线的状态。继续[最终收尾](final-readiness-20261013.md)，利用既有Web身份等待窗口完成原生／Apple配置／商店材料与剩余验证；已通过项目沿用，不恢复零碎TestFlight分发，不改价格、真实数据、UI或FanPass。正式开售、Apple审核和真实设备证据各自按结果记录。

## 2026-10-13 Owner移除计税策略前置条件

Owner明确“忽略掉计税策略”。本次Web正式订阅收尾采用显式不自动计税，Stripe Tax保持关闭，不再等待税务登记或虚构免税评估；USD88.99与既有支付安全边界保持。[当前收尾合同](web-billing-activation-20261013.md)记录API25和disabled模式实际交付，以及旧Preview令牌至香港October14 04:21的独立安全窗口；普通新购在该窗口内关闭，未发TestFlight。

## 2026-10-13 Owner再次明确简洁套餐页

Owner要求套餐与权限只展示付费版权益、价格和订阅按钮。此要求纠正前轮仅去重提示的不足，去掉Web免费状态／两组折叠块／常驻刷新与重复订阅确认步骤；已订阅只管理原渠道。[本轮合同](plan-purchase-page-20261013.md)保持真实年价、单续订provider、接受记录和普通收费开关，未发TestFlight。

## 2026-10-12 继续原生和跨端验收

Owner要求只补剩余验收，已验证的不重复，能自主完成的直接做，暂停TestFlight。Owner随后暂后本轮手机本人验证、完成正式Web登录；[本轮验收](native-cross-platform-acceptance-20261012.md)记录真实Web结果、两处最小修正／部署与待补真机证据。当前Free及过期Sandbox资格不能冒充Apple实际退款／到期或有效订阅的双端一致。

## 2026-10-11 Owner要求修复各份Rillora审计报告

Owner随后明确开始部署这批修复，按已写切换顺序，保持现有数据、定价和收费开关，不发TestFlight，并重申默认最高授权。当前执行[安全修复切换](security-rollout-20261012.md)，取代以下源码阶段的“线上保持原状”执行门；不把部署授权当作部署完成或开售授权。

October12实际结果：五云端栈和两库103迁移已核验，203个Web文件匹配，手机14及原事项由Owner确认，HTTPS回调与9份具名本机凭据切换完成。旧审核期真实到期后，只续原3身份到香港October14 20:01供验收；价格／销售开关不变。实际GitHub私有仓库方案不强制分支保护，不能由CI通过推导该控制已启用。源码工具修复042f4e100／CI127通过；新增archive33已从GitHub独立下载并解密核验，发布测试样本稳定性修正5adf61570／CI129通过；最终证据与剩余发布步骤以handoff为准。

Owner随后明确要求继续修复第31—35组，先完成代码和测试，再一起推送GitHub，线上保持原状。
这取代“剩余五组只校准并保留”的本轮实施范围，不恢复部署、真实凭据迁移、购买或深度扫描。
已在同一安全修复分支从b6f5b8c97完成[五组续修](security-remaining-five-20261011.md)：实施74a9c66ac、API519／infra58及CI125通过，新archive32已从GitHub独立新下载解密核验。源码交付与实际启用分别记录，线上继续保持原状。

Owner明确修复最近各份Rillora审计报告中的问题，取代本轮此前只生成报告的范围；不重启暂停的深度扫描。当前以647317834为基线，在独立工作树逐项核对和处理73条导出记录，归并35组。[当前修复合同](security-findings-remediation-20261011.md)区分源码修复、局部／全量回归、原报告前提和未部署边界。Owner已明确批准显式live源码模式和精确合成夹具登记，两项自动审批阻塞已解除；源码076bd5a、CI124及新增归档的远端解密核验通过。Owner同时明确线上保持原状，不据此部署或开售。现有UI、真实数据、Free1/Family5、Web88.99／Apple119.99、FanPass及暂停零碎TestFlight保持。

## 2026-10-10 Owner选择第3项恢复与权限验收

Owner明确“把3做了”。本轮已补齐当前产物/权限与恢复后计费的验证，修复四处恢复缺口；真实TEST支撑的本地恢复、真实生产快照/Apple Sandbox云端对账、源服务恢复及临时资源清理分别有证据。[本轮合同](recovery-financial-acceptance-20261010.md)保持后续商店候选与客户开放独立，不重做已完成的付款或手机安装。

## 2026-10-10 Owner要求暂后配置Stripe Tax

Owner指出Stripe已经能收款，询问税务功能是否可以先放着。按此优先暂后Stripe Tax自动计税配置，不把该可选服务的pending状态当作支付账户不能收款或必须先启用它才能上线。当前正式账户收款/提现active已经重新只读核对；Rillora本身的开售开关和明确计费策略仍需单独完成。这个方向不等于任何地区免税，也不授权捏造评估/登记事实或制造真钱测试。[当前Live配置边界](live-configuration-20261009.md)。

## 2026-10-09 Owner要求直装、付款复核与完整单一语言

当前继续[付款与双语专项](payment-recheck-20261009.md)：集中直装原iPhone，重新核对Web/iOS购买退款及权益；中文和英文各自完整，去掉并排翻译、中文参考及英文优先提示。后者取代旧的英文同意/中文参考展示约束；保留历史法律接受与收据、真实数据、价格和FanPass。Stripe TEST/Apple Sandbox，暂停零碎TestFlight。

## 2026-10-09 Owner要求直接继续Stripe Live配置

Owner明确商业登记可按实际开业期限办理，要求直接配置。已核对IRD规则，取消把BR先办妥作为全部技术配置的先决条件，继续复用已批准的Rillora Live资料/密钥。[当前Live配置合同](live-configuration-20261009.md)取代刚才等待经营资料才开始任何配置的下一步。现已接通商品/目录、门户、受限密钥及API17真实Live通知；未知税务保持显式未配置，实际客户开放/交易结果分别验证。

## 2026-10-09 真实Preview的Stripe TEST闭环通过

Owner完成原账号登录后，已在真实Preview/Stripe托管TEST完成USD88.99年付、取消返回、拒付、成功返回、门户取消/恢复、去重、全额退款和终止。原账号/事项保留；新文案修正只发布Preview。
[云端验收合同](stripe-cloud-acceptance-20261009.md)取代早上“等待Preview登录/当前托管测试未完成”的状态。
这是TEST工程证据；正式Live配置仍需要真实经营/税务事实，不推导市场付款或销售开放。

## 2026-10-09 以实际Web部署和Stripe云端回调补齐验收

Owner指出www/Preview仍有旧问题，并要求随后读取Gmail的Stripe告警、检查Web购买入口。
已部署三套Web与匹配Preview API/schema；[实际部署合同](web-rollout-20261009.md)取代“合并即上线”的误解。
[Stripe当前合同](stripe-webhook-20261009.md)区分旧本地TEST、当前云端回调、临时测试资格与尚未开启的Live。
本人Preview登录实际过期后才请求恢复；不重复旧测试或代造同意，原生集中直装/TestFlight暂停保持。

## 2026-10-08 Dot增量整合与法律域名执行

Owner要求审阅、直接修复并合并新增Dot工作，随后明确由Agent执行法律域名续接，取代旧GoDaddy暂缓交接。
保留原生事项分类修正，整合双语指南与Web套餐/导航，修复实际原生搜索触摸和标识问题。
法律正式域名已切到既有Cloudflare Pages并取得独立DNS/TLS/七页及Mac Safari证据；具体
[整合与切换合同](dot-integration-20261008.md)区分源码合并、域名变更、应用部署和真机交付。
暂停零碎TestFlight、现有价格/真实数据/FanPass及本人决定门继续有效。

## 2026-10-08 Owner要求精简事项分类栏

Owner提供真机截图并要求优化分类显示。事项页采用紧凑单行横向分类，沿用当前品牌配色、
全部/七类和原筛选语义；具体样式是Agent在本次可逆范围内的实施选择。
[本轮实施与真机反馈](matter-category-refinement-20261008.md)。继续集中直装，有线/无线均可。

## 2026-10-08 Owner改为直接真机迭代，暂停零碎TestFlight发布

后续先集中修复，通过已配对iPhone直接安装验证；Owner补充有线、无线均可，以方便稳定为准。
不再每个小改动就上传/
分发TestFlight。保留现有账号、真实数据、价格及FanPass，稳定后再统一准备商店候选。
[当前直装工作流](direct-device-iteration-20261008.md)取代此前的TestFlight分发下一步。

## 2026-10-07 真机否定了已订阅套餐页结果

Owner确认安装9后指出仍无权益/价格且恢复进入设置。该项不能算验收通过；修正已订阅和报价
未就绪时回退旧页的分支，完整套餐页保持权益/币种价格/一个合适的主操作。已订阅沿用管理
入口，避免重复订单；恢复先核验既有签名记录。Owner本轮选择亲自操作手机。
[本次修复及证据](apple-plan-restore-20261007.md)。

## 2026-10-07 Owner要求部署并继续下一步

已将合并源码发布到受限生产API、Web、官网及Preview前端；三套线上静态文件逐一匹配。
原三身份及原Sandbox资格限期续至香港10月9日04:00，未增加身份或开放普通客户/正式收费。
原生1.0(9)已处理/内部组分发/草稿选用；Owner安装后发现的套餐/恢复问题以上方修复为准。
[本轮部署与边界](dot-rollout-20261007.md)取代“新源码尚未部署”的当前状态，旧审查证据保留。

## 2026-10-07 Dot增量审查、修复与合并

Owner要求读取GitHub的新工作，检查后合并并直接修复问题。账号识别、Web和原生体验三条
分支已保留共同祖先及最新购买实现，修复本机编译/测试发现的问题后通过PR1合入当前发布分支。
合并、Xcode运行和后续部署各自记录；现有价格、真实数据、构建8及FanPass保持。
[当前审查与验证](dot-integration-20261007.md)。

## 2026-10-07 云端双端体验修正与账号识别

Owner 要求修复原生指南／设置／折叠／事项语义，中文界面应在实际应用可用，并清楚显示当前登录账号。事项类型、主人整理进度与接收人复核必须分离；共享复核不是每项事项的必经步骤。原生采用二级语言外观设置、可验证的当前身份和实际支持的密码重置，不为通行密钥／二步验证编造控制。云端源码交付与原生运行、部署、provider 设置分别验证。[原生实施与边界](native-ux-refinement-20261006.md)。

## 2026-10-07 购买页只显示权益、价格和购买操作

Owner明确取消多余勾选框和展示给用户的Large text测试控件。iOS购买页直接显示家庭版相对免费版的实际权益、Apple返回的币种及完整年费、一个购买主按钮；续订/取消说明与条款链接紧邻按钮，最终付款由Apple系统窗口确认。按钮点击针对当时可见报价记录独立订阅接受，页面加载不提交接受，价格变化必须重新展示后再点购买。账号注册clickwrap、历史收据和退款/恢复入口保持各自合同。[当前实施](device-config-20261006.md)。

## 2026-10-06 Apple最终美国年费锁定119.99

Owner再次否定旧68，并明确选择Apple美国商店US$119.99／年。Web仍为US$88.99，年付及Family共同权益不变。此选择取代99.99/119.99候选未定状态；不表示SBP15%已获批或已发生交易。旧Sandbox报价已停止新购，实际商店改价/新绑定/真机验证见[当前合同](device-config-20261006.md)。

## 2026-10-06 Owner恢复真机与各项配置

Owner要求“现在开始真机和各项配置的工作”，已连接原配对iPhone；先选择亲自操作，随后明确允许Agent通过iPhone镜像查看和操作。恢复真机验收及发布配置调查，沿用已完成的构建、部署和Stripe TEST证据；未知个人/经营事实、最终声明及实际交易仍按具体步骤核验。独立删除验收账号的保留决定继续有效。[当前真机与配置合同](device-config-20261006.md)。

## 2026-10-05 Owner选择双语验收、部署并优先Stripe Web

Owner要求完成当前清单第1／2项，付款验收先处理Stripe Web。继续原有受限边界和WebUSD88.99年付；真机、账号删除及经营事实暂缓不被自动撤回。[当前执行合同](release-12-stripe-20261005.md)区分新本地验证、部署、商店候选和真实交易。

## 2026-10-05 Owner要求仔细审校中文版

中文作为正式产品文案逐条核对含义、语气和双端一致性，按[当前中文口径](chinese-copy-guidelines-20261005.md)维护。“事项地图”“查找指引／详细资料”“账号身后处理指南”“导出指引副本”分别对应现有概念；不改变共享权限、法律原文、定价或用户数据。原有英文显示保持；联系人姓名新增上下文键以避免误用事项名称。

## 2026-10-05 Owner要求跟进Dot的GitHub工作

在保留当前发布修复与Owner暂缓决定的基础上，整合Dot四条分支的验收、双语源码和AI提案。已补本机编译及聚焦浏览器验证，修复四项复现问题；中文上线仍与源码整合分开，AI/MCP继续只作后续提案。[当前跟进记录](qa/dot-followup-20261005/README.md)给出准确覆盖与剩余项。

## 2026-10-05 Owner要求可维护的中文Web界面

Owner要求直接实现中文界面并推送Git。本轮为Web应用和官网增加简体中文/English切换，集中语义词典、浏览器偏好、格式化与回归测试；不改市场、价格、权限或英文法律合同，也不暗示Auth0/邮件/iOS已翻译。[实施与维护合同](web-localization-20261005.md)及[QA](qa/chinese-web-20261005/README.md)明确浏览器环境受阻、未部署和原真实核心验收仍保留。


## 2026-10-05 Owner明确中文界面也包括原生iOS

Owner补充「不只是做web哦，ios也要做」。在真实SwiftUI应用加入English／简体中文String Catalog、原生逐应用语言设置、错误与可访问性文案；与Web共享术语，不改变权限、价格、法律同意或真实数据。代码与静态校验不是原生编译／安装完成。[原生维护合同](native-localization-20261005.md)与[QA](qa/chinese-ios-20261005/README.md)记录Mac离线、Xcode／模拟器未运行的边界；仍需双端验收。


## 2026-10-05 Owner保留独立验收账号

Owner在最终删除确认处明确选择“保留，暂不删除”。保留这一个独立测试身份及其合成记录，实际账号删除验收转为Owner暂缓；取消待提交删除，并按既有边界结束测试会话、回收临时审核访问。该选择不能记成删除通过。已完成的导入、重新认证、共享、恢复与原生构建证据继续有效；真机和商业事项仍沿用原暂缓决定。[当前实际记录](real-core-acceptance-20261004.md)。

## 2026-10-04 Owner继续真实双端核心验收

Owner要求先完成真实双端核心流程的剩余步骤。接着已完成的审查部署与构建，验收共享范围／撤销、导出／恢复、重新认证与可丢弃身份的删除。沿用已有注册、邮件与恢复结果；实际失效的会话才恢复。真机购买和商户事实仍保持暂缓，现有UI、价格、真实数据与FanPass不变。[当前验收合同](real-core-acceptance-20261004.md)。

## 2026-10-03 Owner选择先完成部署与新iOS构建

Owner明确“先完成1和2”。部署本轮审查修复、0092/0093及匹配客户端，并准备新的可提交iOS候选；其余本人／真机／商户与正式公开发布门保持独立。本轮API11/schema0093与Web/WWW已部署，新1.0(3)已上传处理，最终加密声明已获当场确认并保存，Apple显示准备提交。[当前执行合同](review-rollout-20261003.md)。

## 2026-10-02 严格全项目代码审查与直接修复

Owner要求完整、细致审阅整个项目代码并直接修复问题，该轮覆盖源码、数据库、Web／iOS、基础设施及工具的逐文件审查。保持现有UI、价格、真实数据与FanPass，已完成部署和本人认证沿用原证据。[本轮审查合同](code-review-20261002.md)记录覆盖、复现、修复与测试；局部通过不能当作全项目审查完成。October3已完成活动源码全文审查、28项修复、CI47和全量追加保存；审查收尾时新源码／0092–0093尚未部署，随后已按上方Owner选择完成受限生产部署。当前状态与下一步以handoff为准。

## 2026-10-02 继续完成所有无需本人参与的发布准备

Owner明确“把那些不用我参与的工作全做了”。优先完成独立准备，不再把等待原生条款勾选当作唯一可执行任务。沿用已经验证的实现／部署，准备并上传仅限内部TestFlight的受限构建、保存既有商店图与测试说明；本人认证、真实设备／交易和最终申报仍保留各自证据门。[本轮合同](independent-release-closeout-20261002.md)。

## 2026-10-02 注册错误提示与真实收件纠正

Owner明确指出误点注册时不能只显示通用错误。使用Auth0支持的错误文案，明确引导已有用户登录／找回密码，保留账号枚举保护；QQ收件以本人实际结果为准，provider已接收不能冒充收件箱成功。[当前验收与修复](release-123-20261001.md)。

## 2026-10-01 优先完成部署、真实账户与Apple沙盒验收

Owner明确先完成剩余清单第1／2／3项：发布已修复版本、真实账户／邮件闭环，以及Apple沙盒购买恢复。继续使用已验证工程，受限测试身份不等于开放普通客户或正式收费。[当前执行合同](release-123-20261001.md)。

## 2026-10-01 Owner采用Resend事务邮件

Owner明确“现在用Resend”，已注册账户、安装插件并完成本机CLI认证。此决定取代September28的SES优先方向；保留Auth0身份系统与GoDaddy域名，接入Resend原生发信provider。域名、受限密钥、TLS／关闭追踪及两项官方模拟收件传输已验证，真实收件／验证／重置／邀请继续单独验收；不以邮件接通冒充正式上线。[当前Resend合同](transaction-mail-resend-20261001.md)。

## 2026-09-30 全量 Git 与 Dot 协作保存

Owner明确要求“所有Rillora的工作”推到Git。范围包括当前源码、工程／包锁、产品历史、研究、设计源稿、发布候选、QA原件、旧仓库历史和代码检查点，不以源码已推送替代完整保存。直接可读副本须脱敏；原始工作产物经加密后由Git LFS保存。实际凭据、真实数据库备份、机器诊断与可重建缓存仍不公开进入仓库，按[源码与完整保存合同](source-control.md)逐项记账。保持UI、价格、真实数据、FanPass及原发布门。 全量保存、远端LFS原件解密读回和CI42已完成；[最终回执](../collaboration/verification/closeout.json)记录准确范围，后续发布仍以handoff为准。

## 2026-09-30 Dot review质量修复

Owner提交Dot代码审阅并再次要求长期可维护的实现。逐项核实13项报告、修复调用／权限／并发边界并补真实路径验证，撤回“独立发布工程已经完成”的判断；已有部署和测试保留其原证据范围，不能替新修复背书。[当前修复合同](code-review-repair-20260930.md)。

## 2026-09-30 App Store 商店图需要设计

Owner指出直接截图不够好看，要求设计真正的商店展示图。保留原始截图作为真实界面素材，增加与现有品牌一致的标题、构图、设备展示和清楚的卖点顺序；不改App内部UI、价格、真实数据或发布状态。[当前商店图合同](app-store-presentation-20260930.md)。

## 2026-09-30 独立发布工程与 Owner 参与门

Owner要求继续完成所有不需要本人参与／确认、且不依赖AWS回复的正式发布前工作。保留现有UI、定价、真实数据和FanPass；推进受限审核环境、数据保留／恢复、敏感操作认证、独立生产身份服务及提交材料。实际登录／法律确认、真实交易、最终价格／申报和provider回复仍分开验收。[当前实施与证据合同](release-engineering-20260930.md)。

## 2026-09-29–30 Apple审核购买与小型企业计划

Owner优先推进Apple发布工作，并确认无关联开发者账户、上一年度总净收入不超过US$100万，另当场批准小型企业计划的最终声明和提交。已收到Apple申请回执，不推定15%获批或生效。TestFlight／审核购买使用明确的Sandbox验证路径、限期审核账号和原有共享权限引擎；不能混成真实收入或放松正式验签。已生成的签名分发包仍关闭账号入口，不等于可用TestFlight或已提交审核。[当前Apple合同](apple-review-validation-20260929.md)。

## 2026-09-29 双端全盘审计与应用级外观

Owner指出Profile会自动变深色并要求修复、仔细审计Web与手机全盘UI/UX。原生外观偏好现应覆盖所有标签、子页面和弹窗，取代之前仅公开首页可切换的范围；Owner随后明确选择Web工作区也统一System／Light／Dark。保留已有布局与业务权限。审计使用当次页面与交互证据，真实身份／付费等验证单独标记。[当前审计合同](ui-ux-audit-20260929.md)。

## 2026-09-29 原生未登录首页采用新版官网视觉

Owner明确选择“希望原生 App 首页也采用新版官网的视觉”。现将纸色／墨绿、书册主视觉与简洁操作移植到SwiftUI未登录首页，取代此前保留该首页旧布局的限制；已登录工作区及业务权限保持原合同。[本轮原生合同](native-home-20260929.md)。

## 2026-09-29 官网 Home 与手动主题

Owner要求加入Home导航，并明确明暗切换按钮应放在Sign in右侧、接近最右边。采用System默认和手动Light/Dark，显式选择仅保存在本机，System清除偏好；说明与发布guard同步。该最新要求取代纯自动／不存偏好的旧UI约束。免费导出是询问建议，Agent建议维持当前免费基础导出／退出权利，本轮不修改权益。[控制与建议合同](website-appearance-controls-20260929.md)。

## 2026-09-28 官网导航、系统主题与许可位置 — Owner最新修正

Owner要求书封Logo居中，官网自动跟随系统深浅主题，深色沿用墨绿色；删除计时walkthrough和01/02连续编号，产品／安全／价格／帮助进入顶部导航的独立页面。许可说明归入法律信息，并由条款页提供入口；完整声明保留但不混入服务条款正文，也不新增用户同意。首页只保留能解释用途与共享范围的交互。具体以[当前官网合同](landing-page-20260928.md)为准，取代此前冲突的V2布局；账号和生产发布门保持独立。

## 2026-09-28 官网 landing 与完整图标 — Owner明确范围

Owner明确要求重做公开介绍页为有品质的landing page，右上角加入账号入口并运用可商用组件与动效；随后选择入口连接现有测试版、明确标注Preview。这是公开官网的改版授权，应用内部UI沿用原样。正式身份／付款仍按发布合同验收，不能因首页改版就开放或宣称正式服务完成。Owner同时指出favicon与正式Logo不同，现取消micro小尺寸例外，所有产品位置均使用完整03母版。视觉、路由和验收见[官网改造合同](landing-page-20260928.md)。 同日后续反馈要求增加内容、连贯页面与动画，并将具体平台操作指南移到登录后。该变更覆盖Web／iOS访客指南入口；Free仍可在登录后阅读。WWW可展示明确标注、无存储的交互演示，App自身公开Overview沿用原合同。

## 2026-09-26 最终上线长任务 — Owner明确目标

Owner要求设置长任务，自行拆解、实施并仔细检查，持续推进到可正式上线，代码须能长期维护。现有产品范围、UI、03品牌、Free／Family和历史权利保持；执行及证据由[发布合同](release-readiness.md)和当前handoff管理，不以准备完成冒充真实上线。正式邮件审核出现新的实际拒绝，已从AWS工单和Owner指定Gmail交叉核对；具体原因未知，合法替代发送服务进入评估，尚未切换或采购。[当前邮件记录](production-identity-mail-20260924.md)。

## 2026-09-26 Web price88.99 — Owner locked

Owner changes the website annual price toUS$88.99. Use immutable price-v4 with
8899cents and Family capability-v2; preserve old amounts/receipts and annual-only
new sales. This is Web only, not approval of Apple parity. Apple channel-price
resolution remains separate. [Current price contract](pricing-88-99-20260926.md).

## 2026-09-26 Channel pricing correction

Owner reminds that Apple and Web pricing should differ by payment channel. Resume
that cost-based direction (Web nowUS$88.99 after the later same-day Owner change) and the prior conditional Apple99.99/
119.99 candidates after actual fee validation. Withdraw the later88.90/88.99/88.00
near-parity recommendation/question. Same Family entitlement works across clients;
exact Apple price and provider activation remain unapproved/unapplied.
[Current channel contract](channel-pricing-20260921.md).

## 2026-09-26 Apple production preparation

Apple administration is restored. The production verification/price-binding
foundation is locally tested, while actual offer selection and transaction wiring
remain open. Both unsubmitted products now disallow platform multiseat purchases,
consistent with the existing single purchaser/household contract; this adds no new
plan or recipient rights. The exact Apple annual-price choice depends on channel costs and verified fee
status; the near-parity question has been withdrawn. [Apple preparation](production-apple-20260926.md).

## 2026-09-26 Production annual purchase preparation

The ordinary annual purchase/consent/provider path is implemented and locally
verified with explicit test/production separation. Closed Web delivery includes
safe billing-return routes; cloud API credentials/migrations and live sales are
still unconfigured. Existing price/UI and Owner-deferred merchant facts are unchanged.
[Production commerce](production-commerce-20260926.md) separates these engineering
results from actual payment, Apple and public release gates.

## 2026-09-25 Closed production client checkpoint

Owner asks to start the remaining release engineering. The independent closed
product host and native production connection configuration are now prepared and
verified; customer access stays off. Session/deletion-proof storage is separated
by origin and the original UI/test identities remain. Current implementation and
evidence are in[the client contract](production-clients-20260925.md), while
[release readiness](release-readiness.md) retains identity, commerce and submission
gates. Correctly filled Release fields do not mean the app is ready for sale.

## 2026-09-24 免费身份、事务邮件与公开入口 — 历史准备检查点

Owner提出先继续测试、临上线再清理，并要求复核Free月活。实际Auth0后台及官网均为Free25,000MAU；35USD/月只是Essentials的500MAU起步档。现阶段保留Free，不购买新增固定套餐；正式Web/iOS客户端及独立audience已准备但全部connection关闭，旧测试绑定不变。上线前按清单退役测试身份权限、会话及明确的测试数据，再接生产；不得仅删事项后继续共用测试删除密钥。[身份与邮件合同](production-identity-mail-20260924.md)。

独立事务邮件域名、DKIM/TLS/抑制及实际模拟器事件与告警动作已验证。SES接口标记DENIED，但已读取的AWS工单实际要求补充资料并邀请继续审核，没有陈述最终拒绝原因；Owner同意后已提交补充回复并回读工单，生产发送仍未批准，Auth0邮件尚未切换。公开官网www已实际部署、DNS/HTTPS/渲染验证，复用原UI、03Logo和18指南，账户/收费仍关闭。根域HTTP302、Chrome HTTPS跳转和现代Node监控客户端均已验证；旧TLS客户端差异保留记录。[公开站合同](public-product-website-20260924.md)。Google正式项目的政策、品牌与最小三项身份scope已保存，Owner另行批准的OAuth凭据已受保护保存；旧测试连接不变，正式发布和真实登录仍分开验收。

## 2026-09-24 继续生产接入与计费比较 — 已完成传输检查点

Owner要求继续下一步并比较按量与套餐。[生产传输合同](production-runtime-20260924.md)已部署独立API、内部HTTPS与证书加载，保持客户接口关闭；实际健康／就绪、权限配置、关闭响应及云端监控已核验。AWS、GoDaddy和原Auth0邮箱管理身份已恢复；GoDaddy官方CLI另已安装、钥匙串认证并通过Rillora临时记录创建／清理验收。既有生产数据／恢复证据保留，不重建数据库或重做已完成演练。发现的回调／邀请／错误日志内容风险已在源码修复，云端旧日志不宣称已清除。后续域名操作使用[项目CLI入口](../tools/godaddy/README.md)，原生GoDaddy授权仍为账户级，项目命令限制在Rillora。

[成本比较](cloud-cost-options-20260924.md)建议现阶段保留按量，稳定后评估一年免预付RDS折扣；不购买长期承诺。Paid Plan已开通且抵扣金仍有记录，不是包月或费用上限。价格仍是Free＋88.80年付，现有UI、FanPass、E2EE及Owner暂缓项不变。

## 2026-09-23 生产基础、恢复与独立源码仓库 — 已完成的数据检查点

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

Logo现已按Owner September19最新指令重新设计，所有以前的Logo限制均取消。旧的非字母限制、The Next Reader单一命题、形态排除及逐级门仅作为[历史探索记录](logo-discovery.md)保留，不能阻止当前设计。Agent自行选择方向并制作完整第一版，当前产物与边界见[Logo设计简报](logo-design-20260919.md)。中文名、标语和商标注册仍是各自状态；最终Logo已由Owner明确选定完整03母版；新的视觉设计不等于已完成商标清查。已有Rilora近似名称／App与.com占用的历史预清查结论也不能被误写为本轮新检索。

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
- 未认证的Web与iOS入口都先允许访客了解产品、工作方式与安全边界，不把登录墙设为第一屏；只有明确的`Sign in / Sign up`以及保存、添加、编辑或读取私有计划的动作才进入认证。Web保留Header中的安静Account工具入口；原生iOS把唯一的公开身份入口集中到`Profile`顶部并从Overview移除重复入口。Owner于2026-09-06明确选择直接托管登录：该顶部入口以及`Add a matter`等真实私有动作立即进入`login.rillora.xyz`的Auth0托管认证，不再显示原生Account中转页、邮箱预填页、provider选择器或原生法律页。标准iOS域名提示由系统负责；取消返回触发登录的产品页面。未登录Profile除此之外允许打开收到的邀请，并保留唯一的Safety & privacy任务入口和About Rillora；具体平台操作指南按Owner September28最新要求放到登录后；没有实际Rillora权限或设备任务时不得添加跳转系统Settings的入口。开发身份直达只允许在有界自动化／本地QA中显式启用，不得成为Owner看到的默认产品入口或任何生产入口。
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
- Owner于2026-09-21取消新月付；仅永久Free与年付Family；Owner于September26把Web新购年费改为US$88.99，并于October6最终选定Apple美国商店US$119.99／年。两渠道Family权益一致；Apple其他币种按实际商店价格显示，不扩大已通过的市场范围。旧68以及99.99／119.99条件化候选不再是活动报价决定，SBP15%是否生效仍需独立证据。历史价格、已购账期与收据保留，不静默改价或迁为年付。[当前价格与配置](device-config-20261006.md)。Owner明确不招人，功能优先自助、运营优先有界自动化；未来功能和服务迁移完整规划、按证据分期，不默认无限AI或人工代办。收费可用性、市场需求及持续自动化必须分别验证。
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
| 跨平台 AI 发现、GEO、推荐、插件／MCP 下一版本 | `docs/architecture/ai-discovery-vnext-20261015.md` → `docs/architecture/public-discovery-rollout-20261016.md` → `docs/architecture/ai-oauth-validation-20261016.md` → `integrations/ai/README.md` | 公开官网已交付；搜索索引、MCP托管闭环、模型与目录分别取证，不打断现有审核 |
| 真实双端核心流程的剩余验收 | `docs/real-core-acceptance-20261004.md` | 当前会话、共享／撤销、导出／恢复、近期认证及删除的实际结果 |
| 本轮审查修复部署、新iOS构建与加密声明 | `docs/review-rollout-20261003.md` | API11/schema0093与新构建3的实际结果；真实验收与公开发布仍分开 |
| 严格全项目代码审查、当前缺陷与直接修复 | `docs/code-review-20261002.md` | 当前逐文件覆盖、复现与验证；与历史Dot报告和实际部署分开 |
| Resend事务邮件、GoDaddy DNS、Auth0发信或实际收件验收 | `docs/transaction-mail-resend-20261001.md` → `docs/production-identity-mail-20260924.md` | 当前发送服务、凭据边界和邮件证据；SES旧工单不再阻塞Resend |
| Git完整保存、Dot协作、旧证据或发布候选检索 | `docs/source-control.md` → `collaboration/README.md` | 全量文件清单、脱敏证据、加密原件与历史；不是部署或数据库恢复证明 |
| 正式上线、剩余工作、发布预检与排期 | `docs/release-readiness.md` | 当前首发范围、缺口和验收；不等于发布批准 |
| P1可靠性／导出范围／草稿／自助退出修复 | `docs/p1-reliability-repair-20260915.md` | 已部署P1基线及验收；新一轮发布状态见handoff |
| 全应用UI/UX审计、体验缺口及下一轮修复优先级 | `docs/ui-ux-audit-20260929.md` | 当前主题修复与全盘审计；September15为历史回归线索 |
| MVP范围、用户旅程、指标或付费测试 | `docs/mvp.md` | 验证合同 |
| 免费／付费边界、套餐、月年付、试用、退款或订阅生命周期 | `docs/monetization.md` | 商业化与权益合同；价格仍待市场验证 |
| Family共同复核、接收人问题反馈、建议审批、修正历史或复核计划 | `docs/family-maintenance.md` | 已实现的共同维护预览与证据；不是收费或真实通知证明 |
| 单位经济、毛利、LTV/CAC、成本分配、现金跑道、融资或收购尽调准备 | `docs/unit-economics.md` | 财务模型与证据合同；不是融资建议或市场结果 |
| Web88.99年付、新月付停售、历史收据或价格修订 | `docs/pricing-88-99-20260926.md` | 当前Web报价；Apple渠道价分开决定；保留历史金额 |
| September21年付实施、Logo全入口核查、100用户容量 | `docs/annual-brand-capacity-20260921.md` | 当前部署、provider回读、容量实测及未完成品牌位置 |
| 自助、运营／安全／支持／营销自动化、全部功能分期或供应商迁移 | `docs/solo-operations-and-portability.md` | 当前单人经营与迁移合同；planned不等于持续运行 |
| 历史49–88价格敏感性 | `docs/pricing-band-20260910.md` | HISTORICAL研究；当前Web新价由September26的88.99合同管理 |
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
