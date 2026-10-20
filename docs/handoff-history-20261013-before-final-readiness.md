HISTORICAL — superseded by the final-readiness continuation.

# Rillora 当前交接

Status: WEB BILLING CONFIGURED AND DEPLOYED / SALES HELD FOR RETIRED IDENTITY TOKEN EXPIRY / NO TESTFLIGHT
Last updated: 2026-10-13 (Asia/Hong_Kong)

## 当前任务

Owner最新明确“忽略掉计税策略”。[本轮合同](web-billing-activation-20261013.md)已完成明确关闭自动计税、真实后台／目录准备及客户端交付；当前剩余的是旧Preview身份令牌到期，不能再要求税务策略批准。活动分支codex/security-findings-20261011，实际执行工作树为`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`；原始QA及未到期恢复守卫位于该工作树的`output/qa/rillora-web-billing-activation-20261013`。主目录只同步Git内容，勿误找不存在的本轮output。[上一交接](handoff-history-20261013-before-web-billing-activation.md)为HISTORICAL。

## 已完成

- tax.mode=disabled／automatic_tax=false实际写入并读回，只改一个字段；原Rillora商户、USD88.99年价、密钥／门户／价格保持。独立live IaC、正式Checkout／通知与受限目录工具已发布，API25健康，原两库103和数据保留。
- 目录启用及随后close-new-sales均完成，后者只关闭新购路线／市场，不撤销历史权益、不改用户／订单。Stripe18事件Webhookactive；本次没有创建付款或退款。
- 正式客户端和官网入口部署完成，117线上文件一致，指南转正式App。最终受限文案也已交付：f87ac62c9／CI141通过，117文件匹配，真实官网中英文价格／入口／帮助说明读回通过；新增archive36的540路径／486对象已通过本地及e29d417b6的GitHub独立新下载解密核验，最终回执普通入Git。CI139对应8d28dc298三任务通过，兼容／正式后台分别53aa24484／474702c06；原套餐页真实双语验收继续保留原日期。
- 发现旧Preview身份服务授权未退役后，恢复原三人审核Action并暂停新购；4旧客户端grant_types均为空，两项旧M2M真实取令牌请求均403。生产权限／连接、条款表单和所有真实账号保持，历史空用途grant元数据不通过扩大权限强删。

## 边界与阻塞

当前Management API token寿命86400秒、已签发token不可即时撤销。停发核对为2026-10-12T20:15:46Z，加300秒容差后，**最早香港2026-10-14 04:21**完成最后开放。该时间不是等待Owner批准或税务资料。日志0命中不证明不存在未到期令牌。

普通客户／新购目前仍关闭，不能用live产物或后台开关冒称已开售。Owner现有Gmail等测试账户的Sandbox／TEST历史继续保留，不能用于Live自付；本次没有真钱生命周期证明。正式浏览器会话已实际退出，未伪造新同意或重复索取登录。

原生14首页／原事项已获Owner确认；本轮手机本人验证按Owner安排暂后，剩余未订阅分支、VoiceOver、原生法律往返及当前有效Apple跨端对照保持待验。没有安装或分发TestFlight；App Store提交、保留的独立删除账号、FanPass均保持各自边界。

## 唯一下一步

到香港2026-10-14 04:21后，按本轮合同复核旧身份取令牌仍被拒绝及到期边界，再恢复已准备正式同意Action、以当前指纹开启Web新购并同步官网开放文案／真实读回。无须重做API25部署、支付／退款测试或申请，不再以计税策略阻塞。
