# Rillora Stripe Live配置接续

Status: IN PROGRESS — OWNER AUTHORIZES CONFIGURATION WITHOUT WAITING FOR BR COMPLETION
Last updated: 2026-10-09 (Asia/Hong_Kong)

## 最新Owner指令与纠正

云端TEST闭环完成后，Owner明确“这个不急啊，不是开业后一个月内办都行吗，你直接配置”。
继续正式Stripe配置，取代把BR先办妥作为全部配置工作的阻塞；不再重复询问已经暂后处理的登记状态。
税务局[实际登记说明](https://www.ird.gov.hk/eng/tax/bre_abr.htm)明确独资/合伙等业务通常在开始经营后一个月内申请；有限公司另走一站式登记。Agent此前一概要求先完成BR过严。
这没有把未知开业日期、已经登记、全球税务豁免或新平台声明写成事实。

## 当前独立读回

Rillora Live账户countryHK/business_typeindividual；charges_enabled/payouts_enabled/details_submitted为true，card_payments active，currently_due/past_due/pending_verification空。Stripe Tax settings实际pending，缺head_office；没有把它写成会自动完成。CLI当前选择TEST，--live请求被明确要求切换，不是登录失效；Live MCP可用。

复用October6已有Product、USD88.99年度Price、Portal、18事件Webhook及受保护RAK/签名密钥，不重复创建或扩大权限、不触碰FanPass/共享主体资料。

## 实施方向（尚未执行的部分不能当完成）

先补齐实际Live接入能力和配置，再核对真实云端。当前代码把Live回调接入和新购/税务就绪绑在一起，且生产review模式拒绝Live集成；需要把已验签通知接收与客户购买开放明确分开，保持review身份限制、TEST/Live账本隔离和新购校验。

对尚未评估的税务保持明确未配置状态，不能伪造reviewed_no_collection、税务登记号、总部地址或个人声明。商品税分类按实际消费者SaaS用途核实。准备税务资料、技术接入和开放普通客户是分别记录的结果；Owner最新授权允许继续配置，不把缺少BR文件作为技术配置前提。

QA位于output/qa/rillora-live-configuration-20261009，原始个人/provider/凭据仅在.local-secrets/live-configuration-20261009。已完成TEST证据在[云端验收](stripe-cloud-acceptance-20261009.md)，不重复付款/退款。


## 实施检查点

已实现独立ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS：只在原受限生产review边界接收Live签名通知，保留原身份/期限；完整新购开关仍独立。未配置税务使用显式not_configured结构，不伪装assessmentReference；新购报价/创建和路由均关闭，已购管理/取消与验签继续可用。
36项API边界/账本测试、9项infra测试及两端typecheck/build通过；首次类型检查暴露测试夹具的联合类型未收窄，已修正并保留失败日志。秘密扫描只移动原有相同两行PEM标记检查的行号，原digest/例外总数不变，29已审核/0未知。
实际Live Product和8899年度Price现active，原Price成为default_price，商品类别按官方消费者SaaS定义设txcd_10103000；金额/币种/年期不变。tax_behavior暂保留unspecified，未推断税务或锁死含税/未税选择。已有门户active，支持期末取消、付款信息和发票，无换套餐或暂停。Live订阅实际0条。
这些provider配置和本地代码尚不等于生产API已接通；接下来完成准确secret、IAM/镜像最小差异、真实Live通知验签及远端保存。
