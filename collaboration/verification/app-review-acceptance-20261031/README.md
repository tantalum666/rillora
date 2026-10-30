# 候选15直装与审核Web对照 — 2026-10-31

Status: WEB PREFLIGHT VERIFIED / PHONE PAUSED BY OWNER / APPLE PURCHASE NOT ATTEMPTED

本目录是[当前补验合同](../../../docs/app-review-sandbox-acceptance-20261031.md)的安全回执，不是付款通过或重新提交证明。Owner在开始本轮必要验收后说明先断开iPhone；此后停止手机／镜像操作与主动重连。重提、TestFlight继续暂停。

## 已有实际证据

- [开发导出核对](development-export-check.json)复用原15归档，不重新编译；UUID／Info一致，签名及配对设备资格核对通过。
- [原位安装](install-result.json)和[设备版本读回](installed-version-readback.json)确认1.0(15)，iOS27.2。未卸载或清空数据。
- [服务器资格检查](inspect-before-receipt.json)确认目录指纹与October30一致、专用审核资格有效至November29 12:00Z，未改价格、其他身份或部署。
- [同一密码Web对照](reviewer-login-comparison.json)和[登录后页面](reviewer-web-signed-in.png)确认专用审核账号可返回原合成事项。[最终事件摘要](auth0-final-event-summary.json)保留四次原生密码错误与Web成功，不含完整提供方日志、主体或凭据。
- [实际认证GET回读](authenticated-web-readback.json)显示USD119.99／年和HKD888／年的服务器Sandbox报价；当前Free、无订阅、无待处理购买。没有准备订单或提交交易。

## 未完成与证据限制

原生输入／登录失败仍待定位；镜像短文本测试成功不能证明完整密码输入正确。现有密码已在Web验证，因此没有重置。恢复手机时先清除非秘密测试输入并关闭显示密码状态，或重开登录页。

真实Apple Sandbox购买、权益回写、恢复及过期订阅审核场景尚未完成。新Free账号不能冒充过期订阅；服务器报价不等于StoreKit商品读取或Apple付款。最终审核截图／说明仍待这些事实，最新[审核备注草稿](review-notes-draft.reference.txt)只作工作副本，未保存到Apple或发送。

## 保存与验证

[阅读记录](reading.json)沿用原完整正文阅读链。[检查点](checkpoint.json)与[收尾记录](closeout.json)注明本轮结果、Owner暂停、修改规范和沿用测试。新开发签名IPA只进入新增archive56；原开发App解包目录是同一IPA的重复副本，不重复归档。认证数据、实际设备标识、全桌面截图、私人提供方对象和凭据排除可读材料；设备绑定的签名产物仅加密保存。

原archive1–55、本机工程检查和已完成部署不重做。当前没有应用实现改动，仅运行准确基线的本机发布／扫描／清单及Markdown链接核对。新增归档本地认证与独立远端读回分别记录，GitHub保存不代表Apple验收。没有云端CI、子代理、提审或TestFlight。

[archive56清单](snapshot.json)已封存23路径／23对象，共7,259,503密文字节；[本地认证](archive-verification.json)通过。后续回执作为普通Git元数据追加，不重新封存本次或历史归档。
