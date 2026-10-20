HISTORICAL — superseded by docs/handoff.md; retained pre-activation handoff.

# Rillora 当前交接

Status: WEB BILLING ACTIVATION SOURCE IN PROGRESS / TAX AUTOMATION DISABLED BY OWNER / NOT DEPLOYED / NO TESTFLIGHT
Last updated: 2026-10-13 (Asia/Hong_Kong)

## 当前任务

Owner最新明确忽略计税策略；按[本轮激活合同](web-billing-activation-20261013.md)补显式不自动计税路径与正式Web发布配置，不再把税务设置或虚构评估留作阻塞。19项Stripe／11项infra及两侧typecheck通过，源码尚未提交或部署。

Owner最新询问正式订阅仍关闭的原因及还差什么；本轮只读核对已完成，当前焦点转为明确Web开售收尾，不能把待验手机项目混成Stripe收款的前置条件。[上一交接](handoff-history-20261013-before-billing-opening-status.md)为HISTORICAL。

Owner要求套餐与权限只展示付费权益、价格和订阅主按钮；Web改版、两套部署及登录后正式页面读回均已完成。[本轮合同](plan-purchase-page-20261013.md)记录准确范围；[此前等待登录的交接](handoff-history-20261013-before-real-plan-ui-readback.md)为HISTORICAL。活动分支仍是codex/security-findings-20261011。

## 已完成

- 简洁家庭版卡、三项权益、USD88.99／年、唯一订阅／原渠道管理主操作；去掉免费徽章、折叠块、常驻刷新和额外勾选。点击订阅才验证并接受当次报价，重复点击／旧报价／错误模式及原续订provider限制保留。
- 源码759c00112／CI133通过，20项针对性Node及23个隔离浏览器场景保留原结果；两套Web各只换一个静态包，172线上文件一致，所有参数保留。archive35已在4ef71b47f5通过独立GitHub新下载认证，旧1—34未重下。
- Owner已恢复正式Web登录。本轮实际看到原Google账号及原1事项；中文与英文新版套餐页均为三权益、明确USD88.99年价和一个禁用订阅按钮，暂未开放说明与现有收费设置一致；旧免费状态／折叠块／复选框均消失。法律链接语言正确，最后恢复中文。真实截图排除私人标题栏，安全原件及回执普通入Git。

## 边界与待验项

Owner随后问为何Stripe已配置仍不能购买。October13已只读确认Live账户和商品／年价有效；API23仍review、正式Checkout false，应用tax.mode未配置。[最新开售差距](live-configuration-20261009.md#october13-当前为什么还不能订阅)单独记录，不能再把Stripe Tax服务pending解释为商户不能收款。此状态询问没有触发收费、价格或权限变更；原先手机暂后安排保持。

这次只补真实Web页面验收，未再构建、部署、交易、重购、恢复、改价或发TestFlight。当前Web未订阅画面不能证明Apple实际退款／到期或当前有效订阅双端一致。API、数据库、手机14和FanPass保持原状。

Owner先前表示手机本人验证暂不方便；剩余原机未订阅分支、VoiceOver、原生法律往返及当前有效Apple权益跨端对照仍待手机可操作。既有原机14首页／原事项、付款／恢复／退款和共享导出证据沿用其日期，不重做。

## 唯一下一步

从未提交候选继续完成Web正式订阅的路由／目录启用及部署验证：补受限、可核对的目录操作和Auth0审核入口切换，完成必要回归／源码检查与CI后按保留数据的顺序交付。tax.mode=disabled保持USD88.99，不再等待计税策略；当前线上尚未更改。旧支付、退款、归档和手机验收不重复，不发TestFlight。
