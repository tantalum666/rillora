# Rillora Stripe Live配置接续

Status: LIVE NOTIFICATIONS/CATALOG/VAULT CONNECTED AND VERIFIED — CUSTOMER CHECKOUT REMAINS CLOSED
Last updated: 2026-10-10 (Asia/Hong_Kong)

## October10 Stripe Tax暂后与实际收款能力

Owner要求Stripe税务功能先放着，已按Stripe Tax自动计税服务暂后处理。刚只读核对正式Rillora账户：charges_enabled/payouts_enabled/details_submitted均true，card_payments active，currently_due/past_due空、disabled_reason为null。Stripe官方Checkout创建API把automatic_tax标为optional；Tax Settings pending/head_office缺失不阻止这个账户本身的收款能力。

这纠正此前把可选自动计税配置和支付账户开通混为一个上线前置项的表述。Rillora当前仍由自身发布开关、市场路由及not_configured策略阻止新购；本次只修正优先级/登记，未改源码、运行秘密或开售开关。正式结账可采用不启用Stripe Tax的合法计费方案，但不能把“暂后工具配置”写成全球免税或已经有reviewed_no_collection评估。

依据：[Checkout创建API](https://docs.stripe.com/api/checkout/sessions/create)、[Checkout功能](https://stripe.com/payments/checkout)、[Stripe Tax说明](https://docs.stripe.com/tax)。本轮[脱敏账户/源码核对](../collaboration/verification/stripe-tax-deferral-20261010/verification.json)与原付款证明分开。实际税务义务依经营地和销售情况判断；本次没有作出具体法律/税务结论。

## HISTORICAL — October9接通结果

- 原Rillora Live商户可收款/提现且没有待补身份资料；原Family商品和USD88.99年价现active并默认关联，个人SaaS税分类txcd_10103000。原Portal已核对，支持期末取消/付款资料/发票，不换套餐。
- 复用原受限key/签名密钥，严格not_configured税务结构已经安装。API17已部署为1HEALTHY/COMPLETED，79资源保持、原身份期限保持，无新数据库迁移。
- Live webhook现enabled、保留原18事件。一次Stripe真实product.updated配置事件已成功投递；生产库独立确认签名有效、ignored/无错误、0资金账本事件。没有创建Live订单或订阅。
- 正式价格绑定已在生产库准备。新购报价/Checkout开关、市场销售/生产权益标志保持关闭，价格内部状态和税务配置保持未配置；不能称普通用户已可付款。
- 36API/9infra/CI37894861343三任务通过。所有新配置、源代码、部署和验签证据按archive28保存；前一TEST包archive27已从GitHub新下载解密通过。

## 最新Owner指令与纠正

云端TEST闭环完成后，Owner明确“这个不急啊，不是开业后一个月内办都行吗，你直接配置”。
继续正式Stripe配置，取代把BR先办妥作为全部配置工作的阻塞；不再重复询问已经暂后处理的登记状态。
税务局[实际登记说明](https://www.ird.gov.hk/eng/tax/bre_abr.htm)明确独资/合伙等业务通常在开始经营后一个月内申请；有限公司另走一站式登记。Agent此前一概要求先完成BR过严。
这没有把未知开业日期、已经登记、全球税务豁免或新平台声明写成事实。

## HISTORICAL — October9独立读回

Rillora Live账户countryHK/business_typeindividual；charges_enabled/payouts_enabled/details_submitted为true，card_payments active，currently_due/past_due/pending_verification空。Stripe Tax settings实际pending，缺head_office；没有把它写成会自动完成。CLI当前选择TEST，--live请求被明确要求切换，不是登录失效；Live MCP可用。

复用October6已有Product、USD88.99年度Price、Portal、18事件Webhook及受保护RAK/签名密钥，不重复创建或扩大权限、不触碰FanPass/共享主体资料。

## 实施方向（尚未执行的部分不能当完成）

先补齐实际Live接入能力和配置，再核对真实云端。当前代码把Live回调接入和新购/税务就绪绑在一起，且生产review模式拒绝Live集成；需要把已验签通知接收与客户购买开放明确分开，保持review身份限制、TEST/Live账本隔离和新购校验。

对尚未评估的税务保持明确未配置状态，不能伪造reviewed_no_collection、税务登记号、总部地址或个人声明。商品税分类按实际消费者SaaS用途核实。准备税务资料、技术接入和开放普通客户是分别记录的结果；Owner最新授权允许继续配置，不把缺少BR文件作为技术配置前提。

QA位于output/qa/rillora-live-configuration-20261009，原始个人/provider/凭据仅在.local-secrets/live-configuration-20261009。已完成TEST证据在[云端验收](stripe-cloud-acceptance-20261009.md)，不重复付款/退款。


## 实施检查点

已实现独立ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS：只在原受限生产review边界接收Live签名通知，保留原身份/期限；完整新购开关仍独立。未配置税务使用显式not_configured结构，不伪装assessmentReference；新购报价/创建和路由均关闭，已购管理/取消与验签继续可用。
36项API边界/账本测试、9项infra测试及API typecheck/build及infra typecheck通过；首次类型检查暴露测试夹具的联合类型未收窄，已修正并保留失败日志。秘密扫描只移动原有相同两行PEM标记检查的行号，原digest/例外总数不变，29已审核/0未知。
实际Live Product和8899年度Price现active，原Price成为default_price，商品类别按官方消费者SaaS定义设txcd_10103000；金额/币种/年期不变。tax_behavior暂保留unspecified，未推断税务或锁死含税/未税选择。已有门户active，支持期末取消、付款信息和发票，无换套餐或暂停。Live订阅实际0条。
这些provider配置和本地代码尚不等于生产API已接通；接下来完成准确secret、IAM/镜像最小差异、真实Live通知验签及远端保存。


生产发布进行中：987327d37的CI37894861343三任务成功。新通知配置已复用旧密钥、SDK核验，并由AWSPENDING晋为AWSCURRENT，原PREPARED版本保留。CloudFormation差异仅3镜像、API2环境字段、精确secret2读取动作和一个ARN输出，79资源保持。云端已开始滚动；本机CDK轮询曾遇到cloudformation域名ENOTFOUND，先独立核对实际完成状态，不重复部署。Live回调仍暂禁用，待新服务验证后启用。


## 完成与下一步边界

上方“实施方向/发布进行中”是本轮过程记录，当前结果以本节和顶部为准。CDK本机DNS轮询错误后只做独立读取，确认UPDATE_COMPLETE；未重发部署。真实HTTP健康200、无签名回调400、旧审核门403分别验证。正式回调只开放付款相关18事件，临时product.updated已移除。

技术接入已经完成，BR未完成不再是它的前置门。对外开售仍是单独步骤：当前Tax Settings缺head_office、没有税务评估/登记事实，不凭Owner的配置指令填入虚构地址/号码或全球免税结论。后续按实际公开发布范围完成新购/税务策略配置与生产非资金验收；真实客户购买发生后单独核对，这与已通过的TEST和非资金Live通知验证分开。

Owner随后询问真钱退款，官方[测试规则](https://docs.stripe.com/testing)明确禁止用真实支付资料在Live模式做测试。
撤回Agent此前要求上线前先做真钱付款/退款测试的说法；不要求Owner向自身商户付款，也不创建人为订单。
保留沙盒全流程证据，实际资金交易仅在真实客户购买发生时观察，不把尚无真实收入当作必须制造收入的前置条件。
