# App Review 再复核 — 2026-11-06

Status: CANDIDATE18 AND MATERIALS SAVED / CURRENT SANDBOX EXPIRY VERIFIED / OWNER RESUBMISSION HOLD
Last updated: 2026-11-06 (Asia/Hong_Kong)

Owner要求再次仔细检查，确保下一次审核的准备充分。继续不重新提审、不分发TestFlight；本轮没有重新购买、改价、人工授予套餐或改变真实用户资料。

## November6 登录恢复后的完成结果

Owner完成 Apple 登录后，实际草稿已独立读回构建 1.0(18)，发布方式仍为手动。最终 3,557 字符审核备注、当前购买页参考附件，以及中英文描述中的 Apple 标准许可链接均保存并重新读取一致。附件名为 `Rillora-18-plan-layout-reference.png`；原有专用凭据和联系方式保持，未再次读取或改写密码。

新版备注分别说明当前功能、登录步骤、USA/HKG、实际价格、外部服务、从 14 修复的问题、18 的真实购买／恢复结果及本次自然到期。下一版 HealthKit／Watch／文件录音不写成当前构建能力。英文 4 张 iPhone 图沿用此前检查点；这次逐张查看中文 2 张 iPhone 图和两语言各 2 张 iPad 图，未发现测试横幅或下一版功能宣传。

实际内购商品仍处于 `Ready for Review`，截图选择器禁用、备注只读；原提交详情也没有该商品的编辑入口。按照 [Apple 的状态限制](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-statuses/)，不绕过控件、不删除商品、不取消原提交来强行解锁。改将新参考图保存到可编辑的**版本审核附件**，备注明确旧内购字段仍描述历史 14，新附件才是当前布局参考。**没有宣称内购专属截图已经替换。** 该图的合成报价／隔离宿主证据边界保持，不能充当真实交易截图。

另发现商店已选 Apple 标准许可，但两个描述只有 Rillora 自己的条款链接。[Apple 官方说明](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement/)指出默认标准许可不会自动显示为商店许可链接；已在两语言描述末尾补上明确的标准许可链接，原许可选择和 Rillora 合同未变。同步修正两份 `config/app-store-listing.*.json` 中过时的“等待审核／未拒绝／14”当前状态，保留原日期快照。

当前只读核对：免费／付费 App 协议均有效；13 类已发布隐私标签仍含粗略位置与其他数据的 App 功能用途；App 和年付订阅均只开放 USA/HKG；年价分别 USD 119.99 与 HKD 888。App 维持效率分类、18+（旧系统 17+，部分地区另有换算）、Apple 标准许可及原生产／审核通知 URL，Mac／Vision 分发未开启。没有发布新的隐私声明或接受新协议。

AWS CLI 曾实际过期，但原浏览器会话有效，等价恢复成功，无新 MFA。一个新的受限只读任务于香港 13:43 完成：同一 November5 订单仍 `paid_reconciled`，订阅已为 `expired_read_only`，本期实际结束于 **2026-11-06 香港 09:01:19**；对应签名事件已 applied，当前 token／归属匹配。旧已付订单亦过期，另三条尝试均已取消；不是根据一个旧时间戳猜测到期。目录、原历史付款和用户内容未改；既有审核资格至 December4 香港20:00的事实保持。本轮不要求 Owner 重买或再恢复。

保存时还捕获到 Apple 附件上传会使同页未保存的文字回到先前版本；在上传完成后重新明确保存最终文字，并以刷新后的字段匹配关闭此问题。一次慢页面加载和一个重复元素定位失败仅为工具记录，没有计为产品通过或缺陷。

本次安全回执见[材料补齐记录](../collaboration/verification/app-review-materials-20261106/README.md)，原始提供方／会话资料仅留本机。以下“登录失败、仍续订、材料未保存”均是**同日早一检查点**，已由本节当前结果取代。

## 原拒审与候选

实际打开的ASC仍只有October30对1.0(14)的一条回复：2.2未完成／测试性质，及2.1(b)无法完成内购；设备为iPad Air11M3／iPadOS27.2。正文仍为原16处／15个不同链接，沿用[已完整阅读的逐项记录](app-review-link-recheck-20261031.md)，另重新读取当前官方审核资料、Sandbox配置和隐私说明。

拒审针对旧14，不能用手机已安装18推断商店已更新。本轮复用已签名的18-r2归档，未重新构建产品。Xcode27.1 Organizer在November6香港03:23显示全部Apple校验通过，随后上传成功。ASC独立读到18已处理为“准备提交”、没有测试组／邀请／安装；内部测试组明确为手动分发。它是供审核草稿选择的上传，不是TestFlight分发、重提或批准。

已在版本草稿解除14关联、选择18并点击保存，页面显示18及保存禁用；随后刷新实际返回authResult=FAILED。因此这个保存尚缺刷新后的持久性回读，不能宣称商店草稿已经最终核验。新的Apple验证页已保留给Owner；没有重传18或点击“更新审核”。

## 再复核发现的会话交界问题

新长期会话的普通API与审核专用购买入口各有一次认证。后者漏传同一个SessionSecurity服务；若身份检查恰好在两次查询间变为到期，会返回503。新增真实隔离PG回归明确证明旧调用503、传入同一服务后200；没有放松四小时核验、账户范围、近期认证或付款验证。

39项会话／身份／法律合同检查、类型检查和build通过。仅app.js及apple-review-access.js叠加到已部署4a2e镜像，得到266b79fb镜像；先Preview后正式按镜像更新，两环境各1个HEALTHY实例、无待定任务、readiness200且未登录私有请求401。参数、角色、数据、价格、30天／7天策略和边缘摘要保持；没有重复110迁移。

## 审核账号与真实购买证据

- 原Auth0管理CLI确实过期；浏览器原SSO有效。对比旧授权92项与请求91项，没有新增权限，等价恢复后精确查到原审核用户存在、未封禁、邮箱密码身份保留、没有MFA登记或密码重置。没有要求Owner重登Auth0或改密码。
- 审核资格仍有效至2026-12-04T12:00Z；原14天预警与维护边界保留。该日期与密码、普通用户会话、TestFlight构建期限分别处理。
- 原17首次购买／恢复／自然到期和18的[同单再次订阅及恢复](apple-resubscription-repair-20261105.md)有真实设备与后台证据，均沿用，不重复交易。
- 新的只读观察必须纠正“已经最终到期”的推断：虽然早一快照的账期曾结束，Apple随后仍发送签名续订。November6香港04:22读到同一已核对订单仍active，本期至香港04:58:34，最后签名续订事件已applied。该期限不是最终停止续订的保证；最终重提前必须再次确认有效订阅已结束、账号可从Free完成新购。不得把原始state字符串或单个旧expiry时间单独当作当前权益结论，也不得手动改账本来做出过期账号。
- 专用example.test邮箱没有真实邮箱验证。它可用作规划者登录、编辑和购买；作为接收人接受邀请仍需真实已验证邮箱，这是现有安全边界。本轮不伪造该标志，不把个人Gmail／QQ凭据交给Apple。

## 材料与平台规则

当前英文商店正文描述的是已实现的事项、逐项共享、官方指引、导出和年付家庭版，没有加入下一版HealthKit／Watch／文件录音承诺。已观察到的四张继承iPhone营销图不含付费页，本轮不重复替换这些未受影响图。

新的IAP审核参考图来自与18-r2相同的PlanAccessView、ApplePurchaseSection、主题及CommerceStore代码；独立本机界面宿主使用合成报价，只做一次导航及截图，1项通过。图为原生1320×2868PNG，无测试横幅；它是界面参考，不是真机18截图或新的交易证明。相关英文可见文本一致；整份字符串目录另有一条未显示错误文案差异，已记录，不能宣称全部宿主字节等于商店二进制。模拟器点按插件两次未生效，未计为产品故障或通过，改用正常XCTest捕获，未重跑旧整套测试。

[Apple审核资料要求](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review)包括有效账号、设备／系统、外部服务、地域差异及可验证的过期订阅场景。[Sandbox配置](https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases)要求真实商品／交易可测试，并明确填写地区限制；不要求先获商品批准。待保存备注已补USA/HKG、真实18测试日期、旧月付仅恢复、外部服务和参考图来源，不先写虚假的已过期状态。

[Apple隐私定义](https://developer.apple.com/app-store/app-privacy-details/)要求按IP实际用途披露。原已发布13类记录已有“粗略位置—App功能／安全”及“其他数据—会话元数据”，覆盖本轮同用途的国家／网络哈希；没有新增广告追踪或位置权限。仍需在恢复Apple登录后核对当前已保存标签。隐私政策／服务条款正文不变，新的存储时长已在独立版本Cookie Notice公开并验证。

## 当前剩余门与保存

当前材料准备及真实过期状态已按顶部结果完成；内购锁定字段以版本附件和明确备注补充，原字段保留历史。唯一执行门仍是 Owner 明确的重提／TestFlight 暂停。解除重提暂停后，才更新原审核提交并最终重新提交；届时只刷新有时效的服务／账号资格，不重跑已通过的购买、迁移、上传或测试。Apple 的实际下一轮结论无法由准备检查保证，真实 iPadOS27.2交易未新增验证。

QA：`output/qa/rillora-app-review-recheck-20261106/`；原始认证／提供方资料仅留private目录和`.local-secrets/app-review-recheck-20261106/`。安全回执见[本轮证据](../collaboration/verification/app-review-recheck-20261106/README.md)。Apple包装校验、上传、草稿保存、实际交易及审核批准是不同状态；本轮没有承诺下一次一定获批。
