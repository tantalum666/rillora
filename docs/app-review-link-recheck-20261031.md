# Apple 拒审消息与全部链接复核 — 2026-10-31

Status: ALL MESSAGE LINKS READ / CONFIGURATION RECHECKED / SANDBOX ACCEPTANCE GAP OPEN / RESUBMISSION HELD
Last updated: 2026-10-31 (Asia/Shanghai)

Owner要求再次看清Apple原消息，并打开其中每一个链接。本轮重新读取实际App Store Connect原提交：仍只有October30的一条Apple消息，1.0(14)仍被拒，年订阅和群组可供审核。正文16处链接对应15个不同目标（论坛重复一次）；全部打开，动态文档改用Chrome读取完整正文。另跟读App Review Help、TN3186、兼容设备测试和完整审核资料四页。继续保持Owner“先别重新提交”、停止真机验证与TestFlight暂停；无外发、上传、部署或重复业务测试。

## 必须纠正的结论

October30已经修复一个确定的服务器阻断点：审核资格先于审核到期，并补了提前告警；普通套餐呈现及本地15候选也已完成。但这些只能证明修复交付，不能写成Apple2.1／2.2已经验收闭环。截图虽有价格，也不能据此断言Apple描述的所有加载／购买问题只有一个原因。

[2.2](https://developer.apple.com/app-store/review/guidelines/#2.2)要求正式产品具备可用的完整功能。移除测试横幅不会代替真实订阅能力。[2.1(b)](https://developer.apple.com/app-store/review/guidelines/#2.1)要求内购完整、当前有效、可找到和可操作；配置了却不能找到的项目需要解释。

[审核内购配置](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases)明确审核使用真实Sandbox商品和服务器交易，无需商品预先批准，并要求提审前完成Sandbox测试。October30的45项逻辑、1项本地StoreKitTest和合成画面不能替代本次修复后的真实链路。October7真机HKD888成功记录仍是旧版本／旧账号的历史证据。

## 逐链接结果

| 正文链接 | 已读内容及对Rillora的意义 |
| --- | --- |
| [App Review](https://developer.apple.com/distribute/app-review/) | 完整产品、有效账号与后端、如实资料；可在原审核对话沟通。没有要求另开重复工单。 |
| [Tips from App Review](https://developer.apple.com/forums/thread/810791) | Apple Staff锁定帖实际指向App Review Help；已继续打开及跟读相关子页。 |
| [2.2 Beta Testing](https://developer.apple.com/app-store/review/guidelines/#2.2) | 判断产品能否使用，不能只改测试字样。 |
| [TestFlight](https://developer.apple.com/testflight/) | 测试分发渠道。拒审消息说未完成时用它测试，没有强制必须新增一轮TestFlight分发。 |
| [内购配置总览](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases) | 账号协议、商品ID／本地化／价格／地区、签名及服务器配置都需完整；元数据更改在Sandbox同步可需一小时。 |
| [补全内购资料](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/view-and-edit-in-app-purchase-information) | 审核截图／说明与可选推广图不同；已提交字段可能暂不可修改。 |
| [Sandbox测试](https://developer.apple.com/documentation/StoreKit/testing-in-app-purchases-with-sandbox) | 可开发签名直装，无需先上传商店；交易与服务器验证必须使用真实Apple测试环境。未执行任何账号切换或清空购买历史。 |
| [StoreKit](https://developer.apple.com/documentation/storekit) | 框架概览已读；现有产品实际调用Product.products、AppTransaction和交易／状态接口，非静态价格代替购买实现。 |
| [签署协议](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements) | Account Holder的付费协议与Developer Program协议分开核对，不重复接受已生效协议。 |
| [协议生效状态](https://developer.apple.com/help/app-store-connect/manage-agreements/view-agreements-status) | 已签不等于Active；实际商务状态见下方，不索取或公开银行／税务敏感值。 |
| [Developer Forums](https://developer.apple.com/forums/)（正文两处） | 讨论和进一步技术支持入口，未发帖或新建账号。 |
| [2.1(b) App Completeness](https://developer.apple.com/app-store/review/guidelines/#2.1) | 完整可操作的内购和必要说明；旧月付保留但关闭新购要明确解释。 |
| [审核Sandbox配置](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases) | 限制storefront／设备时，要明确写入App Review Notes；不能只列两个价格。 |
| [Contact Us](https://developer.apple.com/contact/) | 原消息的旧hash路由自动跳到当前联系首页，已读主题／原案例入口；未发送请求。 |
| Apple App Review Survey | 原精确链接已在Chrome打开到自愿反馈介绍页；这是反馈问卷，不是新拒审要求。未作答、未提交，私有调查路径不放入可读Git。 |

[逐项阅读回执](../collaboration/verification/app-review-links-20261031/link-review.json)记录16处链接、浏览器补读、失败的静态读取和4个跟读目标。全站导航／页脚不计作Apple消息链接，也不递归遍历无关API。

## 补充官方页面暴露的具体缺口

[TN3186](https://developer.apple.com/documentation/technotes/tn3186-troubleshooting-in-app-purchases-availability-in-the-sandbox)逐项要求匹配商品／Bundle ID、正确环境、有效签名、会员及财务状态。本轮只读检查现有15归档：Bundle ID为com.rillora.ios，Profile App ID匹配且无通配符，2027-09-29到期，无本地.storekit打包；签名校验沿用October30。没有把本地签名检查当作远端证书撤销状态或真实购买。

[完整审核资料](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review)要求注明测试设备／OS、外部服务、地域差异，并对自动续订提供能测试完整购买流程的已过期订阅demo账号。旧App Notes没有明确“只支持USA/HKG”、测试设备／OS及服务清单；现有记录也未证明专用审核账号已具备所需过期订阅场景，不能将未订阅和已过期混为一谈。已补本地备注草稿及待验项，未伪造订单、订阅或系统同意。

[兼容设备](https://developer.apple.com/help/app-review/before-submitting-for-review/test-compatible-devices)强调实体设备和兼容模式。本轮15只有M3／27.0合成模拟器结果；不能称实体iPad或审核员27.2已通过，也不能用去掉iPad目标来假定不再被iPad审核。Owner已停止真机验证，本轮继续遵守；该指令不构成真机验证通过的证据。

## 当前商店只读核对

| 项目 | 实际结果 |
| --- | --- |
| 协议／财务 | 免费、付费协议均“有效”；银行“可用”；两份税表“使用中”；合规“有效”。未更改任何资料。 |
| 年付商品 | com.rillora.family.annual；群组22325627；1年；可供审核；中英文名称／描述完整，审核截图存在。 |
| 地区 | 年预付只选USA和HKG，其他地区未选；只读打开后取消，未改变选择。 |
| 旧月付 | com.rillora.family.monthly，准备提交，销售地区0；源码仅年付可新购，月付只保留历史恢复／交易处理。 |
| 价格 | 延用已批准USD119.99／HKD888及October30证据。当前价格表默认175地区不代表175地区都销售；本轮筛选没有形成新的精确价格行读回，不冒称重验。 |
| 年付审核说明 | 已写明不再新售月付，并明确附图来自实体build14的既有HKD888订阅。它不是新候选购买结果；未来重提需同步最终候选说明／画面。 |
| 可选推广图 | 当前为空，页面明确可选；审核截图已存在，不能把两种图混成“缺必填素材”。 |

## 已完成和未完成

已完成原文与全部直接链接阅读、补充技术／资料规则核对、提供方只读配置与现有签名归档检查，以及两份未发送的本地备注／回复草稿。没有新的应用实现或业务测试，也未重复October30部署和归档55。

提交前仍需：针对本次候选完成真实Sandbox商品→报价→购买→服务器权益及恢复的闭环；核对／补齐过期订阅审核场景；同步最终审核说明和适用截图；保留实体设备证据的真实边界。既有真机／TestFlight暂停未被本轮阅读请求撤销，不能自行恢复分发或操作手机。当前唯一下一步是等待Owner确定这些剩余验收与重提的继续范围，而不是直接提交已经准备好的15。
