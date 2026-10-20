# HISTORICAL — Before matter category refinement

Status: 无线直装与原内容已确认；恢复弹窗的独立QQ沙盒账号已由Owner核对
Last updated: 2026-10-08 (Asia/Hong_Kong)

## 当前任务与已完成

Owner最新明确暂不继续TestFlight分发，先集中修问题、直接推到手机；有线、无线均可，方便稳定即可。
[当前直装合同](direct-device-iteration-20261008.md)。源码c0cec8680已推送
codex/apple-plan-restore-20261007，包含套餐页所有状态和已有购买优先核验修复。

- 44聚焦测试通过/1既有StoreKit跳过，34原生guards、8中英完整页面和最后两次Restore点击
  结果沿用原证据。9已被Owner确认安装，但套餐/恢复失败；10保留未分发；11此前已处理、
  说明/原内部组1人保存并重读；本次已确认11的开发签名直装结果，不能写成TestFlight11验收。
  App Store草稿最后验证仍9/手动发布。
- 今天不再上传/分发TestFlight；复用原Release11archive，导出development签名直装包。
  12项检查通过：原bundle/版本/Team/应用标识、生产连接、Keychain、编译UUID均一致，
  签名/Profile有效且包含指定手机，开发者模式已启用。没有重编实现或重跑产品测试。
- 原iPhone16ProMax通过localNetwork无线原位安装成功；设备读回com.rillora.ios/1.0(11)，
  前台启动成功。最初一次App-info断线后安装已恢复，没有使用线缆、卸载、清空数据或换账户。
- Owner确认原事项和所询页面内容都在；随后报告恢复时Apple要求QQ账号。本人只读检查确认
  设置→开发者→Sandbox Apple Account正是QQ；媒体与购买/TestFlight使用另一个原账号。
  当前直装包是development签名，Apple按独立沙盒账号认证，Rillora没有向StoreKit传入邮箱。

## 证据边界与保留项

直装完成和真机UI/恢复通过必须分别确认。开发版不能伪造Apple环境或以本地状态授予权益。
API16/schema0093和既有Web/WWW/Preview部署保留，原3身份到期2026-10-08T20:00:00Z。
10月7日HKD888订阅active读回仅为当日证据，不冒充今日状态。价格、Free1/Family5、
真实数据和FanPass保持；外部邀请/独立删除仍暂缓，Live经营税务/真实交易及最终发布仍未完成。
archive23已推送至a14c7bb74，并从GitHub独立新下载后解密核验4,208路径/507对象。
archive1–22不重复下载或重建。两种Apple账号的购买历史不能混为一次恢复结果；未切换账号、
清除购买记录或新购，当前没有物理恢复成功证据。

## 唯一下一步

沿用已确认的直装结果继续集中处理Owner反馈；购买验收明确记录当前独立Sandbox账号，
原TestFlight购买的恢复需在对应购买账号/分发环境下单独验证。暂停零碎TestFlight的指示保持。

[上一交接](handoff-history-20261008-before-direct-device.md)为HISTORICAL。
