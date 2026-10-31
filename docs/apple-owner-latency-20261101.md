# Apple 购买归属与等待修复

Status: PURCHASE/RESTORE VERIFIED / SEE FOLLOW-UP ACCEPTANCE / RESUBMISSION HELD
Last updated: 2026-11-01 (Asia/Shanghai)

Owner在原生16手动点击购买／检查待处理购买，Apple要求验证eason账户，约30–60秒后Rillora提示使用原购买账号；随后询问测试方法与取消绑定的风险。本任务继续原购买验收，不恢复最终提审或TestFlight。手机由Owner操作，不使用镜像输入；不迁移旧交易、不清除购买历史、不补造家庭版权益。

后续真实购买、恢复和同一原订单的验签／金额／权益核对已通过，见[最终验收合同](apple-purchase-acceptance-20261101.md)。以下前期诊断保留原检查点，不再把购买列为当前未完成；取消／实际到期仍独立。

## 身份与已证实的原因

Apple账户负责商店购买，Rillora账户负责应用内的订阅权益。代码没有按eason邮箱限制购买；归属依据是Apple签名交易、服务器登记的随机意图token及原交易绑定。服务端拒绝跨Rillora账号接管原交易，不能为测试删除这道边界。旧已验证的个人Sandbox订阅保持原归属。

本轮实际登录专用审核Web，读取当前购买接口：一笔started意图、一个当前账号拥有的token。它不是成功支付或新权益。当前手机交易正文尚未取回，不能仅从提示确定原购买者邮箱，也不能把30–60秒全部归因于API网络。

源码与失败复现确认：

- “检查待处理购买”和恢复原来调用同一路径；已知其他账号的历史仍可能进入AppStore.sync，再次触发Apple认证与全历史查询。
- 购买前没有检查当前／未完成的外账号交易。购买返回其他token时，客户端静默跳过，服务器意图仍started，用户得不到清楚解释。
- 只检查当前有效权益也不足以保护新付款：过期订阅仍可能保留原交易归属，不能把它自动视为可以由另一账号重购。

## 修复合同

1. 待处理检查只读当前／未完成签名交易及现有服务器意图，不调用AppStore.sync、AppTransaction.refresh或完整订阅状态查询；没有结果时明确保留待核对状态，不伪造取消。
2. 普通恢复先用可用交易。已知外账号记录直接说明归属；只有明确点击恢复且没有相关已验证历史时才强制同步。自动加载不触发该同步。
3. 新购前检查当前／未完成交易；已有本账号交易先核对，不创建第二单。没有现有权益时，再核对历史归属和完整性后才开付款面板；过期的外账号记录也不能进入新收费。
4. 签名／商品／环境／金额／服务器归属与finish授权保持。外账号交易不提交、不finish、不移交；服务器归属冲突明确显示。未知token不会被断言为某个已知邮箱。
5. 清洁的沙盒历史重新读回后可恢复操作；已有started意图复用原nonce。旧账号异步返回不能覆盖新账号状态。
6. 普通套餐页仍为家庭版权益、明确币种年价、一个订阅主操作与恢复／待处理辅助操作。只增加准确双语错误说明和已知归属冲突的禁购状态；没有加入内部测试横幅或额外确认框。

没有给真实Apple付款设置强行取消计时器。移除多余同步不代表能控制Apple系统认证耗时，也没有声称手机等待已降至某个秒数。

## 本机证据

- 原代码三项新复现全部失败，失败保留。
- 第一轮58项为57通过／1失败：原账号切换测试把“新账号应有的归属提示”误当旧响应泄漏。断言改为新状态不得被旧响应覆盖，单项复验通过。
- 加入并通过清洁历史、混合归属及迟到读取测试后42项通过；最后补过期历史与历史不可用的付款前保护，最终购买协调44项全部通过。
- 同轮StoreKit SDK／CommerceStore的19项通过证据沿用，未变化代码不重复跑；本轮有63个不同原生用例的通过证据，不声称最后一次执行了整套63。
- 本次双语静态检查9项通过；英文测试消息与中文目录分别检查，真机显示和实际耗时另验。
- 候选17从已隔离16源复制，只改三个运行Swift文件、三个语言条目和一个测试文件；不引入HealthKit、Watch、Duo或下一版内容，不改配置／价格。第一次17本地包保留为未安装的中间产物；最终r2另存，不覆盖原证据。

证据目录：`output/qa/rillora-apple-owner-latency-20261031/`。目录沿用开始日期，实际收尾为香港November1。当前部署继续沿用October31两API和三套Web的[回执](release-product-audit-20261031.md)，本轮原生修复不重复部署服务端。

## 测试账号与剩余一步

优先复用已有目的明确的`Rillora StoreKit Sandbox Tester 3`，本机Keychain元数据确实存在。August24记录为USA独立测试账号且当时没有成功交易；这是历史记录，尚未验证现在的凭据及购买历史。当前没有读取其密码、创建新账号或清理历史。App Store Connect账号管理返回authResult=FAILED且登录表单未渲染，不把空白加载页当作可操作登录页。

安装17后，Owner仅在iPhone的开发者Sandbox账户位置使用独立测试身份，Rillora继续使用专用审核账号；无需更换iCloud或普通商店主账号。先核对界面币种与系统Sandbox，再完成购买、一次恢复及后台权益读回。原个人购买另按原Rillora账号恢复，不用于给审核账号转权益。若既有tester实际不可用，再按Apple页面准备新tester，不从旧文档推断当前可用。

Owner随后确认连接／解锁，设备查询实际成功读到旧16。复用同一最终r2的IPA哈希及签名，17已原位安装、设备读回1.0(17)，启动成功；没有卸载、重建、重复业务测试或改动订阅。第一次启动命令把设备参数放到App参数之后，被CLI拒绝（exit64，未启动）；改正参数顺序后exit0，原失败另存，不写成产品运行故障。

Owner实际检查一次待处理购买，确认当前为Rillora App Review、返回“Apple暂未返回匹配购买结果”且没有再次弹Apple密码。耗时未给出，不宣称具体速度改善；也不是成功付款。新[安装及人工回执](../collaboration/verification/native17-install-20261101/README.md)保留这些分开的证据，真实新交易／权益／恢复／到期仍未完成。

Owner已使用既有Tester3登录独立Sandbox，17实际显示USD119.99；点击订阅未出现Apple系统确认页，中文为“暂时无法完成此操作，请重试”。AWS会话仍有效；同时间段日志出现409业务冲突、回应17–27毫秒，但原隐私日志没有路由／具体码，不能精确归因或把服务器时间当手机耗时。已确认中文未单独映射购买错误，等待临时英文提示定位真实原因；原订单保持，不盲目重试。

钥匙串密码显示已收起、详情关闭、临时文本引用清理。一次工具回读的选区块意外包含测试密码，已告知Owner；值未写入项目文件／Git。没有重置密码、创建账号、改iCloud／媒体与购买主账号或清空历史。新Web验证标签当前未登录，没有新的后台交易查询结果；最终重提／TestFlight继续暂停。

## Git保存

源码／归档提交`b628c18051824515a806a987badfaf9463bb7765`已推到[PR10](https://github.com/tantalum666/rillora/pull/10)，仍开放未合并。确切main base本机发布门通过，commit的完整二进制diff与门检记录一致。archive58独立从GitHub下载后663对象／1,164路径认证通过，旧1–57不重下。一个安全语言检查日志最初受Git忽略规则影响漏入索引，最终回执显式补入并核对全部清单路径受跟踪；扫描规则与例外未改。云端作业总数314、最新October23，不宣称云端CI成功。

## 官方依据

- [AppStore.sync](https://developer.apple.com/documentation/storekit/appstore/sync%28%29)：强制同步会要求用户认证，应由明确用户动作触发。
- [appAccountToken](https://developer.apple.com/documentation/appstoreservernotifications/appaccounttoken)：用于关联商店交易与应用账户的UUID，不是Apple邮箱。
- [创建Sandbox Apple账户](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account)：开发签名应用使用独立Sandbox身份，邮箱不能已经是普通Apple账户。
- [Sandbox Testers API](https://developer.apple.com/documentation/appstoreconnectapi/sandbox-testers)：账号创建／删除使用App Store Connect，不能臆造公开创建API。
