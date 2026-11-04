# Rillora 当前交接

Status: PURCHASE INTERACTION REPAIR / FINAL CANDIDATE LOCAL VALIDATION / RESUBMISSION HELD
Last updated: 2026-11-05 (Asia/Hong_Kong)

## 当前任务

Owner要求复核并修完Apple拒审问题，随后报告手机套餐页订阅按钮橙／灰反复切换，灰色区域点击误开Subscription Terms。优先修这两个实际交互问题；不重新提审、不发TestFlight。Owner选择提供截图，不再次要求连接手机、重买或恢复。当前手机独立证据是17-r2，新的18只在本机准备。前一AWS／Kiro交接已移入[HISTORICAL记录](handoff-history-20261104-before-app-review-recheck.md)，外部申请仍等待回复，Kiro仍暂缓。

## 已完成

- 重新读取当前Apple拒审原文：仍为14的2.2和2.1(b)，无新拒审理由；原16处／15个独立链接的完整阅读沿用October31，当前关键官方页再次核对。免费／付费协议均有效，年付仍Ready for Review，仅USA/HKG开放。原14仍被选入版本；年付审核图／备注仍描述14，不能把源码更新当它们已替换。
- Auth0原管理会话经Owner恢复后核对：专用审核账号存在、没有封禁；既有正式Action没有旧审核日期门。没有修改密码、已验证邮箱状态或重新索取凭据。
- 专用审核资格已按原31天上限续到2026-12-04T12:00Z（香港20:00）；DB／生产API／现有监控匹配，两个CloudFormation栈UPDATE_COMPLETE。API镜像／秘密／角色及其他环境保持，其他账号、目录、价格和收费不变。现有15分钟监控预警提前14天，真实探针aggregate ok、failed0；没有重做邮件投递演练。新增每日安静跟进只在必要变化／续期时通知，不等于无限期访问。
- 本机复现：连续三条交易核对多触发三次报价重载；禁用订阅区域实际触发同一Form行的法律链接。已将交易后的权益刷新和报价重载分开，并给三个链接限定独立按钮样式；iPad与iPhone中英文禁用区域／显式条款／可用购买点击6项通过。74项购买／CommerceStore／语言测试在明确英文测试环境后通过，原中文环境导致英文断言失败的记录保留。

## 证据边界与正在进行

后台收据的pending独立回读回归已修正并通过，最终18-r2本机归档／App Store导出完成；同源开发签名包也已导出并验签；archive60–61本地认证合计1,806路径／927原件通过，Git发布门和远端保存继续中。[完整结果](app-review-readiness-20261104.md)。原始运行记录在 `output/qa/rillora-app-review-readiness-20261104/`，敏感云端资料在 `.local-secrets/app-review-readiness-20261104/`；这些不是公开证据包。

原17的真实Sandbox购买／恢复及November2自然到期沿用同一订单独立证据，不重做；手动取消与退款不是本轮新证明。18尚未安装到手机、上传、选入审核或提交；没有实际iPadOS27.2设备证据，本机M3模拟器为27.0。不能宣称所有问题已在用户手机消失或Apple必定通过。

## 唯一下一步

完成最后Git发布与新归档远端认证后，只补最终候选手机页面稳定性读回，不要求再次购买；审核图／Notes与候选一致后，仍等待Owner解除重提暂停。云端CI、子代理和TestFlight不使用。
