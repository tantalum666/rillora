# Rillora 当前交接

Status: 简洁购买页构建8已分发；首笔HKD888 Sandbox购买已验签，购后恢复待手机连接
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 当前任务

Owner要求完成真机/发布配置，随后要求明确币种并使报价与Apple付款一致，最新明确去掉
购买页额外勾选及Large text测试控件，直接显示权益、年费、一个购买按钮。
分支`codex/device-config-20261006`，最新源码`08afb3821`/CI63成功。
[当前执行合同](device-config-20261006.md)。原完整Markdown阅读和全部已通过证据继续有效。

## 已完成

- 构建6真机安装、Gmail原账号登录和原事项读取；Owner亲自完成首笔Apple Sandbox购买。
  云端验签为HKG/HKD888.00，active至2026-10-07T14:25:09Z，初始购买通知及客户端回传
  均applied。先前AUD199.99预备订单closed/canceled，历史和实际收据不改写。
- Apple美国US119.99/年已锁定并保存，WebUS88.99保留；旧68不再新购。年付草稿原8地区
  加AUS供实际Sandbox测试；USA/HKG/AUS报价及验签配置已加载同一API14/schema0093。
  普通市场、销售及App分发范围未打开，ready200/匿名401检查保留。
- 构建8直接显示Family实际增量权益、明确币种的年费和一个Subscribe按钮；续订/取消说明
  及政策链接紧邻，Restore为次要操作。按钮接受当时可见报价；进页不接受/下单，报价变化
  先返回展示。购买前重新取Apple商品并核对金额/币种/店面，途中店面变化中止旧报价。
- 39聚焦回归通过/1既有StoreKitTest平台跳过，11静态检查，中英文实际渲染与13签名检查通过。
  8已上传处理，测试说明/原内部组1人已保存重读；App Store草稿选8、手动发布已重读。
  7只保留为未分发中间产物。源码已推送，archive20的3,102路径/677对象本地及GitHub新下载解密核验均通过（3e46e5130）。
- Stripe本人已提交开户、批准Rillora Live与运行RAK并完成邮件验证；接口确认收款/提现
  启用且无当前待补要求。8899商品/年价inactive，门户已配置，18事件回调disabled。
  3写/9读密钥实际核验并保护保存本机/AWS；首版本自动AWSCURRENT但preparationOnly
  被正式解析器拒绝，API没有配置ARN/读权限/收费开关。FanPass/共享主体资料保持。

## 证据边界与阻塞

购后Restore、构建8物理安装、跨端权益和VoiceOver尚未证明；手机镜像实际显示iPhone使用中，
已发出锁屏连接请求。此前失败的Restore不冒充成功。不要重复购买、重新登录或清理真实数据。
QA在`output/qa/rillora-device-config-20261006/`；凭据/原始设备日志/个人申报仍为保护本地材料。
审核访问到期仍为2026-10-06T17:08:57Z（香港10月7日01:08:57），不能默默延长。
经营/税务事实、完整StripeLive运行与真实交易、最终商店申报/审核和客户开放未完成。
外部两名TestFlight邀请与独立删除验收账号继续按Owner决定暂缓。

## 唯一下一步

在原iPhone恢复镜像后，直接从TestFlight更新1.0(8)，核对原Family测试权限并做一次购后
Restore及跨端读回，保留原HKD888购买；若审核资格已到期，先明确解决访问期限再执行。
本轮全量保存已完成，继续沿用，不重跑已完成构建/测试/部署/本人认证。原始秘密不进入Git。
源码CI63已验证；证据提交后的单独CI因浏览器连接结束、CLI缺Checks/Actions读取权限未读回，
不能写成新一次成功，也无需因此重新登录Apple/AWS。

[上轮交接](handoff-history-20261006-before-device-config.md)为HISTORICAL。
