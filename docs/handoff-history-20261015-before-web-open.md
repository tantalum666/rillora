# HISTORICAL — 2026-10-15 Web开放前交接

已被[当前交接](handoff.md)取代，不是活动下一步。

# Rillora 当前交接

Status: APPLE SUBMISSION PREFLIGHT IN PROGRESS / AUTH0 SHELL OWNER-DEFERRED / WEB TOKEN WINDOW RETAINED
Last updated: 2026-10-14 (Asia/Hong_Kong)

## 当前任务

Owner于October14明确暂缓Auth0旧外层文案，优先再次彻底检查Apple提审资料，并继续其余可自主完成的正式上线工作。执行[本轮预检](app-review-preflight-20261014.md)；既有支持请求不重复发送，Auth0延期不等于已修复或免除真实认证／身份隔离要求。前轮诊断与2bad532eb均已保存，旧交接在[HISTORICAL](handoff-history-20261014-before-review-preflight.md)。

Owner要求推进到正式上线状态，沿用[当前收尾](final-readiness-20261013.md)和[商店预检](app-store-preflight-20261013.md)。活动工作树/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app，分支codex/security-findings-20261011；本轮QA是output/qa/rillora-final-readiness-20261013。旧20ec61222交接保留为[HISTORICAL](handoff-history-20261013-before-final-readiness.md)。

Owner最新反馈确认原生Terms和Privacy均能打开，要求删除隐私页顶部外观／语言重复说明；[本轮修正](legal-page-layout-20261013.md)已只删壳层插入点并发布，不加折叠。78f262a3a／CI148通过，Cloudflare e2d5857d为当前成功生产版本；191Web／8法律产物／126包检查／50HTTPS及18资源、线上中英文移动／桌面通过。正文、版本及同意摘要不变，QA为output/qa/rillora-legal-layout-20261013。

## 已完成

- 新运行源码eb2b3c4d2／CI145三任务通过，Apple独立Production／审核context、具名合成审核资料、有限登记和独立停售已兼容部署；模板／参数匹配，无schema103迁移。生产Apple四告警OK，真实云健康检查通过，旧任务／收件人保留。
- 原归档14商店签名导出／12检查／上传／Apple处理／选入手动草稿完成，未分发TestFlight。Owner原Google真机14登录及条款、原1事项、Family测试／HKD888／管理Apple，与同账号正式Web对应；无新购买、恢复或退款。
- 审核联系人与Owner明确授权的专用加密审核凭据已保存并重载核验；Owner确认的13类隐私标签已发布。18+、免费下载安装、App及年付USA/HKG草稿范围已保存。月付原已0地区，未重复修改。
- 英文仍为主语言，四iPhone／两iPad英文设计图已更新保存，中文两iPhone／两iPad及独立文案已保存。10图原图摘要／尺寸／可编辑源核验通过；年付审核图／说明已保存。
- Owner已批准两份技术询问及Auth0社区首次注册条款。Apple私密工单102995248851收件，Auth0一篇帖子收件待管理员批准，无公开帖子链接或官方技术答复。两份均不再待外发授权，不重复发送。
- Apple预检操作序列中App14／年订阅／群组三项于香港21:18过早进入等待审核，Agent说明后主动撤回；重载确认为“已移除”／“被开发者拒绝”，不是Apple驳回。材料保留，手动发布不变，当前无活动审核或公开发布。
- [新增archive37](../collaboration/verification/final-readiness-20261013/README.md)568路径／530对象／37,831,161字节，本地及cba5b92bb的GitHub独立新下载认证通过；旧1—36不重做。源码与可读秘密扫描、文档链接通过，最终回执正常入Git。
- cba5b92bb的CI146三个任务全部通过；最终跟进只改文档／回执与可读清单，不改运行源码、封存原件或重做部署。

## 证据边界与阻塞

Web普通客户／新购仍不能早于2026-10-13T20:20:46Z，按香港October14 04:21执行原令牌寿命加容差及fresh拒绝复核。计税策略不再阻塞；USD88.99及既有税自动化关闭保持。

Apple官方员工说明正式发布前Production API不开放；当前未发布及同JWT Sandbox200／Production401符合这一限制。Production成功不再作为提审前置条件；原生／专用审核账号验收后走独立Sandbox送审，获批后关闭简化购买，手动发布后核验Production授权／通知／对账，再开放两条Apple新购。具体解锁时刻与发布后结果仍须实测，不能无条件401回退Sandbox。Owner已恢复实际过期的Developer登录，原工单102995248851收到关闭请求；没有Closed状态，不再等待该答复作为提审门。

Auth0中文正式页本轮仍见旧外壳3句英文及英文辅助区域名；本地翻译未部署。Owner已明确暂缓免费标准外壳恢复，当前仍未完成，社区1篇pending，官方支持群组暂无可用私信入口；没有新支持单或付费／Classic切换。旧模板脚本已修为读不到模板就全程不写，7项模拟provider检查通过。剩余未订阅真机、VoiceOver、原生法律往返及审核账号实际首次登录未冒领通过。Owner随后明确镜像已解锁，已连接并只启动原Rillora，原账号保持；但工具点按／滚动／拖动／输入无实际页面变化，重绑／居中／缩放未解决。Owner已回复两条法律链接都能打开；返回原账号未在自由文本中明确确认，不再把打开检查写成待回复，也不重复要求登录。原真实数据／定价／历史交易／保留删除账号和FanPass不变。

## 唯一下一步

完成当前Apple提审复核：实际保存的双语材料／功能一致性、独立审核账号登录与可达核心流程、订阅审核配置、隐私与账号控制，以及剩余原生验收。全部必要项通过后再准备重提，保持手动发布和不分发TestFlight；Production401不作为提审前置条件。可独立推进的Web切换仍须在香港October14 04:21后完成既定旧身份拒绝复核，不能提前开放。Auth0文案按Owner最新决定暂缓。
