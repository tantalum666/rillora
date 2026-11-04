# App Review 复核与订阅按钮修复 — November4–5

Last updated: 2026-11-05 (Asia/Hong_Kong)

[结果与边界](../../../docs/app-review-readiness-20261104.md)记录Owner手机17截图中的真实缺陷。交易核对曾重复清空／重载报价；SwiftUI Form默认法律链接曾响应禁用订阅区域。修复保留每次购买前新鲜报价、金额／币种／条款和原账号校验，并独立更新后台pending结果。没有添加确认框或未来功能。

[验证总结](validation-summary.json)：74项购买／CommerceStore／双语通过；iPadM3/iOS27.0和iPhone布局/iOS26.5合计6项真实坐标测试通过；12项监控与17项静态本地化／下一版隔离检查通过。新回归先失败的原始结果、语言环境及测试标签期望错误保留；没有把本地服务当Apple交易。17实际购买／恢复／自然到期沿用原合同，不重做。

[候选隔离](native18-r2-source-isolation-final.json)只有7条源路径／5条资源键叠加到冻结17-r2，198文件不增下一版功能。[归档](native18-r2-archive-readback.json)、[App Store包](native18-r2-app-store-readback.json)和[开发签名包](native18-r2-development-readback.json)均为本机1.0(18)，签名／生产入口通过，没有HealthKit、Watch、录音权限或本地StoreKit文件。尚未安装手机、上传、TestFlight或重提。

[资格维护](review-window-deployment-verified.json)只续原专用身份到2026-12-04T12:00Z，DB/API/原15分钟监控匹配，14天预警；API镜像／秘密／角色及其他环境保持，监控物理资源未替换。现有[Auth0动作范围](auth0-deployed-action-scope.json)没有旧截止门，密码未改。原始身份、认证和云配置留私密本机，没有发布维护能力或原请求资料。

[商店读回](asc-readback-safe.json)仍是14Rejected、年付Ready for Review，USA/HKG，免费／付费协议有效。[新备注](app-review-notes-draft.txt)只是草稿；当前商店图片／备注仍描述14。不能把源码或合成画面当作已替换商店材料。[发布预检](release-preflight.json)仍明确未通过总体发布门，实际签名产物自身没有配置阻塞。

本轮原件新增archive60，排除原始认证／账户／设备／提供方与全部本机秘密，只保存明确安全的QA、原始本地测试、冻结源码和签名产物（加密）。旧1–59不重封／重下；完整清单和远端只验证新档。Git成功不等于手机18已更新或Apple已批准。无云端CI、子代理或真实交易。

archive60本地认证完成：1,752路径／883原件／72,607,692密文字节。[目录](catalog.json)、[捕获清单](snapshot.json)、[解密认证](archive-verification.json)及[保存工具参考](preservation-helper.py.reference.txt)可独立核对。最后955个修改文档内相对链接通过；精确远端验证在推送后另存，不重封本档。

最后发布门曾因新增UI测试目标使两个已批准的公开Auth0客户端ID声明行号变化而拒绝。已将UI测试移到[独立生成器](../../../tools/release/prepare_purchase_ui.py)，普通审核project.yml／pbxproj／scheme及扫描例外文件恢复原字节，未关闭规则或添加例外。新工程实际构建并运行1项交互检查通过；CLI输出、Info.plist路径和重复资源的原始生成／构建失败也保留。详情见[工程隔离](ui-project-separation.json)。

新增archive61只保存这段后续工程验证及初次发布门失败，不重封60。两档合计1,806路径／927原件；61为143,067密文字节，[跟进目录](catalog-followup.json)与[独立认证](archive-followup-verification.json)均已保存。两个构建错误发生在生成结果包之前，对应原始构建日志和结构化错误已保留，不伪造xcresult。
