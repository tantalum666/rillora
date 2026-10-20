# Stripe退款解释与测试边界纠正

本轮只查询官方公开规则、解释资金流并修正Agent自己的发布验收要求；没有读取私有后台、发起付款/退款/取消/提现或改动生产配置。

- 原处理手续费不会随退款退回；退款需显式发起，从可用Stripe余额退至原支付方式，余额不足可等待补足；入账时间由银行决定。
- 未退款的正常收款扣费后计入Stripe余额，按提现安排转至商户银行。
- Stripe禁止使用真实支付资料在Live模式做测试。因此撤回上线前先自付自退的验收门；保留已完成TEST闭环及Live非资金验签，真实客户交易发生后单独观察。
- 官方来源：https://docs.stripe.com/refunds 、https://docs.stripe.com/testing 、https://docs.stripe.com/payouts 、https://stripe.com/en-hk/pricing 。通过Stripe docs CLI及官方Web于2026-10-09读取，不保存整篇第三方文档或账户信息。
- 修改：release-readiness、production-commerce、live-configuration、handoff、release-gates；decision-log追加明确为Agent纠正/平台规则而非Owner新授权；PROJECT_JOURNEY追加过程。
- 验证：12项required/status不变，文档差异和相关证据路径检查；不重跑产品测试或前一轮已通过的七项登记测试。
- 阅读：延续output/qa/rillora-release-status-20261009/reading.json及原全文基线；补读当前被修改文件的相关段与Stripe docs技能/官方规则。
- 保存：本目录只有非敏感文字/状态，完整逐字节复制到collaboration/verification/stripe-refund-boundary-20261009；旧archive1–28保持。
