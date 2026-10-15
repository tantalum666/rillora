# Rillora 当前交接

Status: WEB LIVE / APPLE WAITING FOR REVIEW / GIT REMOTE VERIFIED / NO TESTFLIGHT
Last updated: 2026-10-15 (Asia/Hong_Kong)

## 当前任务

执行[Apple提审复核与Web开放](app-review-preflight-20261014.md)。Owner暂缓Auth0外壳，并于October15明确“真机不用验证了”；余下真机检查取消，不再请求参与或伪称通过。Owner已明确确认法律页面返回后原账号／事项仍在。此前交接保留为[HISTORICAL](handoff-history-20261015-before-web-open.md)。

活动工作树：/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app；分支codex/security-findings-20261011；QA：output/qa/rillora-app-review-20261014。价格、真实数据、FanPass、账号保留和不分发TestFlight继续有效。

## 已完成

- 源码40c76496f已推GitHub，CI153三项成功。两份Web静态包已上线，117个线上文件匹配，全部其他云资源与参数保持。
- 旧身份窗口已过，4旧客户端停发与2旧M2M的403重新确认。正式同意Action已恢复，普通Web新购路线开启，USD88.99年付／关闭自动计税保持；没有新支付或API／数据库部署。
- Apple普通新购两条路线仍关闭，价格／产品／Sandbox登记不变。Production401沿官方发布前解释，不挡提审；发布后仍须实际核验再开放Apple销售。
- Apple双语图文、10张素材、联系人、13类隐私、18+、USA/HKG、年费、协议和14／手动发布已复核。年付双语权益描述及审核说明已修正并保存回读。
- 原加密审核密码已读并验证有效。专用合成账号完成正式Web与原生登录，Web建1示例、iOS改字段、Web重载读回通过。未重置密码；临时凭据已清除。模拟器Release元数据1.0(1)与真实商店14分别记录。
- 原机实际退出后复用原Google、Owner当场同意和同一次网络重试，原事项／家庭测试权益保持。Owner另确认真实法律往返。后续真机操作已按最新指令停止。

- Apple于香港October15 09:49接收提交6537a10c-38f2-425e-8b8e-c76e5fa730b1，App1.0(14)、年订阅及群组三项均等待审核；旧月订阅未加入，手动发布保持。

- 新archive39在3113de7a7已推送并从GitHub独立下载，276对象／316路径全部认证；CI154三任务成功。晚到回执为普通Git元数据，不重封归档。

## 证据边界

Web配置已开放，不代表新增了真钱交易或市场收入；金融测试保留既有日期。原生模拟器不替代真实StoreKit购买，剩余未订阅真机／VoiceOver已由Owner取消，不能标成通过。Auth0旧外壳仅暂缓，不声称已修复。已保留的删除验收账号不删除。Apple仍由正式审核决定是否通过，不能保证首次获批。

## 唯一下一步

按Apple审核结果续接：若有具体反馈，处理该问题；获批后先处理简化购买，再手动发布并验证Production授权／通知／对账，最后启用Apple普通新购。审核Sandbox登记当前至October27，若审核实际延后则在原范围内维护，不能放宽普通客户测试权限。当前已在等待审核，不重复提交或分发TestFlight；真机取消及Auth0外壳暂缓不重新打开。
