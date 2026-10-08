# Stripe TEST回调修复与当前Web购买入口

Status: WEBHOOK DELIVERY REPAIRED AND DEPLOYED; OWNER TEST ELIGIBILITY READY; HOSTED WEB FLOW PENDING LOGIN
Last updated: 2026-10-09 (Asia/Hong_Kong)

## Gmail与provider实际证据

Owner要求当前Web工作完成后读Gmail告警、检查Stripe按钮和当前付款流程。该信为Stripe October8发送的staging TEST webhook投递告警：13次HTTP500、首发October5、预计October14停止继续尝试；不是Live扣款失败或账户封禁。独立Rillora TEST账户及现有endpoint核对一致，未删除/禁用回调，未触碰FanPass。

8条失败事件准确对应October5/6本地隔离验收的同一订阅。metadata账户只存在于当时本地fixture，不在staging。旧代码把格式正确的TEST UUID当作本地账户，后续null context抛Error500。修正通过现有RLS/SECURITY DEFINER解析器核验本地映射；找不到的已验签TEST事件持久保留为needs_mapping/account_mapping_missing并返回202，不自动创建账户、授予Family或冒充已应用。Live缺映射仍503，购买同意与严格关联保持。

## 代码、测试、部署与实际回调分开记录

- 回归先复现500，修复后2项TEST聚焦测试通过；13项production boundary、typecheck/build通过。初次测试错把重试计数当投递总次数，按真实语义修正，保留原失败记录。
- 源码8b1f91798已推送，[CI37831640081](https://github.com/tantalum666/rillora/actions/runs/37831640081)的source/API/Web-infrastructure三任务通过。
- 仅更新staging API/维护任务两处镜像，UPDATE_COMPLETE；API40为1/1 HEALTHY、ARM64，实际digest与构建一致。schema93、前端、roles/secrets/environment/network/healthchecks保持。
- 官方CLI向原endpoint逐条重发8条原事件；provider未成功投递数从8降为0，has_more=false。云端独立读回8条全部signature_verified=true，保留needs_mapping/account_mapping_missing。手工成功投递不保证Stripe取消原自动重试安排；重复到达仍走相同安全路径。
- 原Preview账户旧TEST月订阅的取消事件实际验签、applied、无错误；订阅转expired_read_only。这证明真实云端签名/账户映射/权益更新，不等于新的年付托管购买完成。

## 缺少购买按钮的原因与处理

Dot保留了TEST和production两个控件分支。普通销售原本关闭，Owner原Preview账号没有有效commerce_validation_accounts记录，因此TEST入口未显示。不能用加一个无效按钮代替运行配置。

后台还有历史USD9.99/月TEST订阅active，以及August19创建的已expired/unpaid TEST Checkout。沿用Owner要求完成Web测试的授权，仅取消确切旧TEST订阅，invoice_now=false/prorate=false；不删除账单、不迁移历史价格、不产生真实扣款。取消回调实际applied后，按provider已过期且无payment_intent/subscription的读回，事务化关闭唯一旧待付TEST订单及attempt，保留两笔paid历史。原账号/1条事项保持，未创建身份或法律同意。首次资格登记因旧active订阅被保护条件拒绝并回滚，随后才处理。

原Preview账号已登记48小时TEST资格，到2026-10-10T20:28:23.969401Z（香港October11 04:28）自动失效；ordinary billing policy保持。provider及服务器当前年价为USD88.99、年度price-v4。这是Agent在既有验收授权下选择的临时范围，不是新的市场/价格决定或正式客户开放。

## 旧测试与剩余真实验收

[October6原验收](release-12-stripe-20261005.md)实际完成USD88.99 TEST拒付/成功、返回、取消/恢复、退款/终止与去重，但使用本地隔离身份/同意和CLI relay，不能证明当前Auth0会话或云端直连。本轮不能说从没测过，也不能拿旧结果替代当前验收。

当前Preview会话实际401，已停原account页等待Owner亲自确认并登录。之后检查邮箱/原事项、真实TEST按钮、USD88.99托管Checkout、返回登录态/签名回调/Family投影和管理路径。不通过维护脚本伪造真实用户会话或本人购买接受。

Live运行接入、市场/经营与税务事实仍未完成；本轮只动TEST。已准备的Live商户/受限密钥、商品与回调草稿不是正式购买入口已开通，更不能把TEST成功称为真钱收款完成。

## QA与隐私

output/qa/rillora-stripe-webhook-20261009记录源码CI、红绿回归、部署差异、provider投递状态、云端inbox与历史TEST清理/资格回执。原邮件、provider完整对象、认证和精确账户映射留在.local-secrets/stripe-webhook-20261009；可读镜像脱敏，凭据和会话不归档。本轮Stripe/AWS凭据实际有效，不重复索取登录。唯一下一步在[交接](handoff.md)。
