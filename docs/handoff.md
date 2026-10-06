# Rillora 当前交接

Status: 首笔真实Apple Sandbox购买已验签；修复AUD报价/HKD付款页不一致，Stripe凭据已保存
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 当前任务

Owner 已要求开始真机及各项配置，原配对 iPhone16ProMax 已连接。最新明确允许Agent通过
iPhone镜像查看和操作，取代早前亲自操作的限制；本人Apple密码仍由Owner输入。
当前分支 `codex/device-config-20261006`，基线 `909bea4f0`。
[本轮合同与执行顺序](device-config-20261006.md)。

## 已完成与当前观察

- 上轮API14/schema0093、双语Web/WWW和18个原生验收结果、Stripe88.99TEST及archive19远端核验保留。
- Apple会话已由Owner恢复；创建手动分发的Rillora Owner QA内部组并发送本人邀请。
  Owner已安装1.0(5)，用Gmail登录并看到原有事项；设备工具核对版本一致。
- 另两个外部邮箱邀请在首次BetaReview联系步骤被Owner暂缓。空外部组保留，未发送邀请/提审。
- 手机恢复购买显示暂不可用。云端只读诊断确认会话/测试资格有效。客户端缺少AppTransaction
  初次不可用时的用户触发刷新已修，红测复现后17用例通过。1.0(6)已归档、导出、13项检查，
  已上传且Apple处理完成，测试说明及原内部组已保存。手机已确认更新6，Apple验证后出现
  Sandbox不会扣款标记；AppStore.sync仍报无法完成请求并跳App Store设置，不算恢复通过。
- Owner最终锁定Apple美国US119.99/年，Web88.99不变。旧US68Sandbox绑定已retired，云端
  Apple商店已保存119.99并重新打开读回，原8个可售地区保持。新11999 Sandbox绑定已创建并
  通过真实数据库报价/验签目录金额解析；历史68/Web8899/SKU不变。API14已同镜像滚动加载，
  最终1个健康实例、ready200/匿名401，普通销售关闭。
- Stripe已按明确批准复用X身份/银行；Rillora描述符为RILLORA，准确软件说明、包含的Lite，
  税务/Climate暂未启用，可选公开电话关闭。共享实体网站编辑已取消，没有改变FanPass。
  Owner已亲自最终提交且批准仅Rillora的Live插件授权。接口确认收款/提现启用、无待补资料。
  Live8899商品/年价暂inactive，门户已配置，18事件回调已创建并禁用，签名秘密保护保存。
  3写/9读服务器RAK已当场批准、完成Stripe邮件验证并创建；SDK实际读取账户/商品/价格通过。
  本机及AWS Secrets Manager读回一致。AWS首次版本自动带AWSCURRENT，但内容是
  preparationOnly，正式解析器实际拒绝；API没有配置ARN/读取权限/付款开关。
  经营/税务事实、完整运行配置及真实交易仍未完成。
- AWS CLI已复用有效浏览器会话刷新，STS确认Rillora身份。不要重复要求MFA。
- 后续实际Apple响应返回AUS，年付商品为测试追加澳大利亚后9地区；AUS199.99/HKG888/USA119.99
  三条Sandbox报价及验签配置已加载到同一API14，健康/匿名边界通过，普通市场未开启。
- Owner已完成首笔购买，界面Family测试权限。云端只读核对：Sandbox/HKG/HKD888.00签名收据、
  active订阅，以及初始购买通知/客户端回传均applied。原AUD199.99预备订单closed/canceled，
  真实HKD收据未改写。Owner指出报价无币种且与最终Apple页不同，要求直接修复。
- 币种/购买前刷新修复已通过38个聚焦用例，1个既有StoreKitTest跳过；构建7已上传处理，
  尚未分发。Owner最新要求去掉额外勾选及展示里的Large text控件，改为权益/年价/一个购买按钮。
  该简化已实现并正在验证，将准备构建8，保留7作为未分发的中间产物。
  源码e229c4668/CI61仍只包含构建6修复，最新购买页源码尚未提交。

## 证据边界与保留决定

本轮QA为 `output/qa/rillora-device-config-20261006/`；精确设备标识、认证和个人资料
留在受保护本地目录，不上传。真机安装/登录/Sandbox识别已有结果；首笔Apple Sandbox购买已验签；购后恢复和真实
收款尚未证明。Stripe处理器当前资格已读回，不等于经营及税务事实已经全部完成。

Owner已恢复真机范围，但仍保留独立删除验收账号。UI、价格、真实数据及FanPass不变。
审核访问原到期时间仍为2026-10-06T17:08:57Z（香港10月7日01:08:57）；新的测试/提交
动作先核对有效性，不能默默延长。未知经营/税务/银行事实和最终声明需具体核验。

## 唯一下一步

验证并分发Owner要求的简洁购买页构建8：实际权益、明确币种的年价、一个购买按钮，
移除额外勾选及预览测试控件，保留刷新报价防误购。随后在原手机核对升级/恢复与跨端权益，
不重复成功购买。全部新源码/合资格产物追加Git及archive20；Stripe经营税务事实、外部
邀请暂缓及保留删除账号不变。审核访问到期后不擅自延期。

[上轮交接](handoff-history-20261006-before-device-config.md)为HISTORICAL。
