# 原生与跨端剩余验收 — 2026-10-12

Status: REAL WEB OBSERVED / TARGETED COPY FIX PREPARED / PHYSICAL PHONE OWNER-DEFERRED
Last updated: 2026-10-12 (Asia/Hong_Kong)

Owner要求继续完成剩余原生和跨端验收，已验证的不重复，能自主完成的直接做，不发TestFlight。镜像实际停在Mac本人验证后，Owner选择本轮暂不方便、先检查其他部分；正式Web由Owner重新登录原Google账号。此选择不撤回已完成的手机14登录／原事项确认，也不是永久取消真机验收。

## 复用的证据

- October4/5真实共享范围、撤销、原生导出／Web读取导入、近期认证及安全取消删除沿用[核心验收](real-core-acceptance-20261004.md)。保留账号，不重新删除。
- Apple实际HKG/HKD888购买、已验签续订／回传、Owner恢复结果、手机13订阅／币种／中文结果沿用[付款复核](payment-recheck-20261009.md)。没有重新购买、恢复或退款。
- Stripe TEST的部分／全额、pending／成功／失败逆转、重复事件及清理沿用同一付款证据；October10隔离恢复沿用[已完成合同](recovery-financial-acceptance-20261010.md)。
- October12两库103、五栈、手机14及HTTPS登录沿用[安全部署](security-rollout-20261012.md)，不重跑迁移／全库回归／原生构建。

## 当前观察与范围

正式Web确为原Gmail账号，原1事项可读。套餐及账单请求均200：GLOBAL_US、当前Free、无生效validationOnly、正式销售关闭、USD88.99年价且无新购按钮。原Sandbox验收资格截止October11，与当前不生效相符；单靠这个响应不能确定Apple订阅本身是否已到期，也不能拿October10手机旧截图证明今天的跨端一致。

当前Free分支的中文／英文文本、明确币种、免费权益和到期保留说明均实际可见；原生折叠控件用Enter完成收起／展开，中文偏好恢复。Playwright按button角色定位summary失败属于工具语义差异，系统AX与实际键盘操作成功，不冒称产品无键盘支持。日志警告来自MetaMask扩展，未见Rillora页面错误。

真实页面重复显示两条“暂不开放新订阅”。最小修正只在外层已显示关闭提示时省略内嵌账单面板的重复句；独立面板及市场开放但报价不可用时的说明保持。当前源码已通过两份聚焦Web测试；新前端构建、发布和线上读回尚未完成，不把本地补丁称为线上修复。

## 仍不能替代的证据

- 原机未订阅分支、VoiceOver朗读／焦点、从原生打开法律页需要实际手机操作。Owner本轮已暂后，不用模拟器冒充真机。
- 当前有效Apple权益在两端的对应，需要原Sandbox资格及同一次真实订阅状态；不放宽受限RunTask、不修改已付记录来制造通过结果。
- Apple退款／撤销／到期的源码、既有本地测试和真实签名事件分别记账。不能用Stripe结果或本地合成回调声称已取得新的Apple实际退款。

QA：`output/qa/rillora-native-cross-platform-20261012`；含账号／系统验证的截图及原始provider资料仅留`.local-secrets/native-cross-platform-20261012`，不入可读Git。沿用同一发布工作流的完整Markdown阅读记录，只补新增／变化文件和聚焦正文。
