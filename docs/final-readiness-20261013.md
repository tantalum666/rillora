# 正式上线收尾 — 2026-10-13

Status: IN PROGRESS / WEB TOKEN WINDOW RETAINED / NO TESTFLIGHT DISTRIBUTION
Last updated: 2026-10-13 (Asia/Hong_Kong)

Owner要求进入收尾，把所有内容推进到可正式上线状态。此指令取代“只等Web身份窗口”的单项下一步，继续其余可自主完成的原生、Apple后台、商店材料与发布检查；已完成的支付／退款、代码审计、安全迁移和部署不重复。保留现有UI、Free1／Family5、WebUSD88.99与AppleUSAUSD119.99、真实数据和FanPass，沿用计税策略不再阻塞的决定。此前不分发TestFlight的具体要求仍保持，本轮先集中准备最终商店候选。

## 不重新打开的证据

上一轮20ec61222及archive36完成代码／部署／Git保存；API25、explicit disabled自动计税、117前端文件、18事件Live回调和原账号记录保持。旧4客户端停发／2服务403及当前86400秒令牌寿命已实测；客户最后开放仍须等香港October14 04:21，并做拒绝复核，不能通过本次范围扩展省略。[现有合同](web-billing-activation-20261013.md)。

原生已验证14的源码为bfe9baaf5。本轮先比较原生源树／共享目录与当前版本；若未变化，复用同一archive进行商店签名导出，不重新编译、重复安装或购买。真机首页／原事项及之前真实购买／恢复按原日期保留，未订阅、原生法律往返、VoiceOver与当前权益对照仍独立记账。

## 本轮实际入口与发现

AWS本机最初明确过期，后通过原浏览器会话自动续期且STS确认原Rillora账号；浏览器回调显示ERR_BLOCKED_BY_CLIENT发生在CLI成功后，不能据此要求再次登录。Apple也已复用现有开发者登录进入实际Rillora草稿。原iPhone列表初显断开，但有界设备详情请求已通过既有配对连接，不据缓存状态索取数据线或密码。

当前IaC固定关闭Apple正式购买；live配置也整体拒绝Apple审核context。既有Apple合同允许生产和审核作为分别加载、分别验签的context，Apple官方要求App Review使用Sandbox。因此需要补正式Apple后台与明确的、到期的审核账号通道，同时维持所有普通开发／合成／旧诊断测试功能关闭。不能把“Web已具备付款能力”当作iOS正式购买或App Review准备完成。

实现前提：普通Production收据只接受Production签名；审核只接受Sandbox签名、既有目的限定的登记和精确账号／期限。增加的审核访问范围只作用于审核购买路由，不限制普通用户的核心资料，也不让普通客户获得测试权益。金额／币种／产品／appAccountToken／单续费渠道／幂等／回调验签和恢复日志全部保留。实际启用与本地代码／测试分别记录，先核对Apple真实配置和当前目录，不猜测未确认地区价格。

依据：[Apple的审核Sandbox要求](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases)、[首次订阅与App同批送审](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase)。

Owner先暂后镜像验证，随后明确“iphone镜像解锁了，你可以使用了”，本轮已重新接回并复用原Google登录。当前实际停在账号条款，需要本次法律同意，后台独立工作继续。商店签名14已由原归档导出并通过12项检查，原生实现未重编译；29项配置／原守卫和24项审核路由／账本相关检查通过，仍未部署新Apple配置。

## Apple候选实现和本地验证

新增独立的正式配置保险库准备／启用和到期审核通道。审核账号仍需两层校验：精确身份及有限期限、现有验证账号登记；不增加普通开发／TEST路由。受限维护命令只允许inspect／prepare／renew-review，保留固定数据库、网络和最新目录指纹。prepare仅添加USA119.99／HKG888的独立Production行，不修改共享市场销售开关、Web价格、旧Sandbox／订单／订阅；其他商店不因草稿供应范围自动开售。续期只作用于原本已登记且无正式订单的最多3个身份。

29项配置检查、24项审核路由检查、15项基础设施检查、5项真实隔离数据库目录检查、10项broker边界检查已通过；前两组存在4项重复，不相加冒充唯一测试数。API类型检查首轮发现可选属性／元组类型不匹配，已修正；最终类型／构建和秘密扫描分别保存日志。香港15:24实际Apple价格表读回USA119.99／HKG888／AUS199.99一致，9地区供应仍为旧草稿，尚未改价或送审。

## 执行顺序

1. 补齐Apple实际配置、具名到期审核通道和必要反向测试；准备精确、保留数据的云端差异。
2. 复用原生14的已验证源码／归档准备商店导出，核对真实商店材料与剩余设备行为；不再依赖旧Preview登录。
3. 在Web身份窗口结束后完成已准备的最后开售切换；若之前独立工作已结束，则如实保留时间门。
4. 保存全部新增源码、失败／成功证据与可审阅候选到GitHub，更新当前交接和逐项真实阻塞。需要本人交互时只请求实际发生的一步，继续不依赖它的工作。

QA：output/qa/rillora-final-readiness-20261013。实际设备标识、账户／凭据、完整provider资料留在.local-secrets/final-readiness-20261013，不能放进可读Git。
