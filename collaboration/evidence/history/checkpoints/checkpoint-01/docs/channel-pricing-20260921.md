# Web 与 Apple 内购的渠道定价

Role: current rule/source check and advisory fee comparison
Status: CHANNEL DIFFERENTIATION REAFFIRMED; SBP ENROLLMENT SUBMITTED; EXACT APPLE PRICE AND EFFECTIVE FEE OPEN
Last reviewed: 2026-09-30 (September29 portal and SBP submission; fee examples retain their stated historical assumptions)

## September29 小型企业计划申请 — 当前状态

Owner明确确认没有其他关联开发者账户、上一年度总净收入不超过US$100万，
随后当场确认最终真实性声明及提交。Apple已显示收到Small Business Program
注册申请；这只是申请回执，尚未证明批准或15%生效。当前年付仍为美国US$68、
加拿大CAD99，未保存最终渠道价。原有99.99／119.99候选继续按实际生效费率
另行确定，Web88.99不变。[本轮证据](apple-review-validation-20260929.md)。

## September26方向纠偏 — 定价方向保持，申请状态以上文为准

Owner提醒“之前不是说apple跟web价格做差异化？”。恢复按实际付款渠道成本
差异定价的方向：Web现按同日稍后Owner决定改为US$88.99/年，Apple IAP采用较高的渠道价，Family权益
跨端一致。刚才按“最接近88.80”推荐88.90，并要求从88.90/88.99/88.00选择，
偏离了这一目的；该推荐及问题现已撤回，不再作为活动决策门。

原有条件化候选是：15%佣金获批并生效时AppleUS$99.99；首发仍适用标准30%
时AppleUS$119.99。候选不等于Owner已批准最终金额或已保存后台。当前官方
完整价格CSV已确认99.99与119.99均存在；是否存在88.80不再决定商业策略。

本次只读看到付费App协议有效，以及Small Business Program的申请页面，未取得
已批准/生效记录，也未填写或提交申请。不得由协议有效、项目规模小或通用价格表
的proceeds列推定实际佣金。Apple官方仍区分普通订阅首年及满一年后的收入比例，
SBP另需获批并到生效时间；下文官方来源仍适用。下文Stripe数值只保留当时的
模型假设，不冒充本轮真实生产费率或银行到账。无provider价格/收据/权益变更。


## Later September26 Web revision

Owner then sets the website to88.99. This changes only the Web quote, not the Apple
near-parity withdrawal or the conditional99.99/119.99candidates. The older fee-only
88.80calculation below keeps its dated assumptions; it is not a new quote or actual
settlement result. [Current Web price](pricing-88-99-20260926.md).

## 判断

后续：Owner已另行取消新月付，执行见[September21实施](annual-brand-capacity-20260921.md)。本研究中的Apple年付候选仍未批准，月付候选仅留作历史比较；下文“不改目录／未停售”描述研究当时，不构成当前账期规则。

可以为相同Family权益设置不同的Web与Apple IAP价格。Agent建议按真实付款渠道差异化，保持账户权益跨Web／iOS一致；不能因为用户使用iPhone浏览官网就自动加价。现有88.80年付／9.99月付和此前年付-only建议均保持各自状态，本轮没有Owner批准新价或停售月付。

普通AppStore规则没有要求网站和IAP同价。Apple审核指南第3节说明开发者定价，第3.1.1(a)明确提及外部购买可有较低价格；第3.1.3(b)允许符合条件的多平台服务访问在网站取得的功能。价格不同、App内外链宣传、跨端使用是三个分别核验的事项。[Apple现行审核指南](https://developer.apple.com/app-store/review/guidelines/)。

## 已核实的官方先例

- [Telegram Premium FAQ](https://telegram.org/faq_premium)：直接版中的PremiumBot订阅因为不承担Apple／Google平台费而更便宜；同一账户可在支持的设备使用权益。这不意味着Rillora可以在所有iOS地区放置相同购买入口。
- [Patreon官方帮助](https://support.patreon.com/hc/en-us/articles/27992185537037-How-iOS-in-app-purchases-work-for-fans)，页面更新2026-08-26：创作者可以提高iOS内购价以抵消费用，或保持同价自行承担。美国用户选Web结账时可用Web价；选择Apple IAP时才看到相应内购价。

没有把Spotify／Netflix不在App内出售订阅的做法当作当前双价格先例，也没有引用未经官方确认的YouTube具体差额。

## 先把三种成本分开

1. **Apple佣金**：俗称“苹果税”，但它不是政府征收的VAT／销售税。标准自动续订通常在用户首个付费服务年按30%计算，累积一年后续订为15%；获批且生效的SmallBusinessProgram可从符合条件的交易开始适用15%。其他地区特别条款不套用本例。[Apple订阅收入说明](https://developer.apple.com/app-store/subscriptions/)、[Small Business Program](https://developer.apple.com/app-store/small-business-program/)。
2. **消费税**：取决于客户所在税区、税种、含税标价及交易安排；Web并不天然免税。Apple佣金与适用税款分别处理。含税市场不能直接用含税售价乘0.85或0.70推断最终银行到账。[Apple开发者协议Schedule2](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)。
3. **Web费用**：Stripe支付、国际卡、Billing、换汇、出款、税工具、退款／拒付等要分别列出，不能用美国2.9%作为香港账户的默认实际成本。Rillora尚未取得本轮真实生产交易的结算费用。

SmallBusiness资格按开发者及关联账户所有App的适用proceeds核验，需申请获批并生效，不能只凭Rillora用户少就认定15%。本项目现有证据未确立已获批，继续保留15%和30%两档。

## 美元示例：比较交易／订阅管理费后余额

计算假设是**无消费税的美元销售、香港Stripe标准费、国际卡、USD结算、无币种转换**。官方价格列出3.4%+US$0.30，国际卡加0.5%，Billing按量0.7%；本例合计4.6%+US$0.30。[Stripe HK Payments](https://stripe.com/en-hk/pricing)、[Stripe HK Billing](https://stripe.com/en-hk/billing/pricing)。

下表不是银行实际到账或毛利：未计出款／非默认货币费用及最低收费、换汇、VAT／销售税、税工具、退款／拒付、云服务和支持成本。适用不同商户费率、付款方式或税区时必须重算。

| 年付情景 | 标价USD | 本例费用 | 交易／订阅管理费后余额USD |
| --- | ---: | --- | ---: |
| Web现价 | 88.80 | 4.6%+0.30 | 84.42 |
| Apple假设同价、15% | 88.80 | 15% | 75.48 |
| Apple候选价、15% | 99.99 | 15% | 84.99 |
| Apple假设同价、30% | 88.80 | 30% | 62.16 |
| Apple候选价、30% | 119.99 | 30% | 83.99 |

Apple88.80行只是对比算术；此前实际美国可选价格点没有精确88.80，本轮没有改变该事实。用税前示例Web余额除以`1−Apple佣金率`，可得相近余额所需Apple价：15%时约99.31，30%时约120.59。建议99.99／119.99作为易理解的候选，允许少量差额；不是把Web价简单加15%／30%，也未在本轮后台核实或保存候选价格点。

如最终保留月付，候选为Web9.99／Apple15%时10.99／Apple30%时12.99；相同口径的余额约9.23／9.34／9.09。若Owner采用年付-only，则这些月付候选不应上线。其他币种／storefront使用其实际可选本币价格，不能直接显示本表美元金额。[精确复算](../output/qa/rillora-channel-pricing-20260921/fee-comparison.json)。

## 与80–90%毛利目标的关系

提高IAP标价可以补回每单的绝对收入，但不会改变Apple按售价抽成的比例。沿用项目把渠道费计入交付成本、以消费者税前销售收入作分母的管理口径，30%Apple通道在服务成本之前只剩70%，不能靠加价将这个单渠道毛利率变成80–90%。整体目标依赖Web渠道占比、真正获批的15%和服务成本。正式财务的principal／agent列报应按适用会计事实确定，不以改分类美化毛利。

年付价格仍需用户愿意支付；保护费后余额不等于验证价格、转化或续费。不要仅为提高渠道毛利虚构Apple专属功能或削弱Web购买者的iOS权益。

## App内如何显示

- **美国AppStore storefront**：按本轮官方指南，可包含外部购买按钮／链接／行动号召，无需该外链entitlement。产品仍需正确实现购买、返回、权益同步及审核说明；iOS用户通过Web结账适用Web价格。
- **香港及没有适用例外的普通storefront**：可以提供IAP，并让符合多平台规则的已购用户登录使用；不要展示引导外部交易的“官网更便宜”文案、链接、二维码或其他CTA。
- **有特定地区例外的市场**：分别适用entitlement、附加条款、披露、API、报告和费用；不把美国规则推广到全球，也不在本轮重新宣称旧地区矩阵全部最新。
- 地区依据为StoreKit storefront，不用IP、设备语言、香港运营者身份或手机型号代替。
- 网站购买的Family在iOS使用同一账户权益，不能要求补差价；Apple购买同样可在Web使用。独立渠道的账单／取消入口要明确，已有有效订阅时避免重复购买。
- 对用户解释为“购买渠道的价格可能不同，会员权益一致”，不能把平台佣金误称为Apple替用户征收的政府税。具体价格宣传按地区规则显示。

## 落地建议与未完成

优先核验／申请SmallBusinessProgram；若15%实际生效，Agent倾向Web88.80／AppleIAP99.99年付。若必须按30%销售，以119.99为候选再检验购买意愿。保持US外部Web主路径、普通非美IAP路径及同一权益模型。

实施前仍需Owner选定渠道价、按实际价格点和税区核算、版本化provider price绑定、同一权益／防重复购买和每个商店页面验收。这不是再次授权工程的要求；本轮Owner询问的是商业建议，未指令实际改价。Apple后台、Stripe对象、目录、税务配置与现有收据均未修改。

前一[低频使用建议](subscription-value-20260921.md)也未自动采纳。两项建议可以独立决定：是否提供月付，以及不同付款渠道如何定价。
