# 真实Preview云端Stripe付款验收

Status: TEST LIFECYCLE PASSED / PREVIEW COPY FIX DEPLOYED / LIVE CONFIGURATION CONTINUES
Last updated: 2026-10-09 (Asia/Hong_Kong)

Owner完成原Preview账号登录并要求继续。沿用早上已完成的部署/回调修复与archive26，本轮使用实际Auth0会话、正式staging服务、Stripe托管TEST Checkout和真实签名回调。未创建合成用户会话、代造本人条款或重新注册。

## 实际结果

| 环节 | 本轮证据 |
| --- | --- |
| 身份与原数据 | 页面显示原Gmail，原1条事项仍在；旧identity404/后续401门已解除 |
| 价格/按钮 | 套餐页USD88.99/年；真实测试按钮可用；Stripe沙盒US$88.99/年一致 |
| 取消返回 | 仍登录且Free；再次继续复用同一Checkout/订单 |
| 官方拒付卡 | Stripe明确拒付；真实API200返回pending订单、Free1，无新增Family |
| 官方成功卡 | 唯一8899USD TEST已付发票；返回仍登录，服务器paid_reconciled/Family-v2、5联系人和共同维护 |
| 门户取消/恢复 | 到2027-10-09期末取消仍保留已付权益；恢复同一订阅，发票仍1张 |
| 重复回调 | 同一checkout事件重发成功，provider待投递1→0；订单/订阅/事件/对账计数不增加 |
| 全额测试退款 | provider退款succeeded8899USD，真实API回Free并记录refunded |
| 测试结束 | 订阅canceled，无追加发票/proration、无自动续订；历史收据保留 |
| 独立云端复核 | 只读维护任务verify-full，8精确事件全验签/applied/无残留error；一订单/一付款尝试，原事项1条 |

部分回调有重试，最终全部应用；不宣称首投零错误。历史paid_reconciled订单不被改成“未付款”；退款由provider收据、签名事件与权益override证明，不称完整会计台账。取消/退款操作均为TEST，Apple Sandbox与其他真实账号/付款未改变。

## 顺手修正的实际文案问题

TEST区域把已结束账期写成“将于……结束”，并在测试按钮上方笼统说“暂不开放新订阅”。现在已结束账期用过去时，退款/撤销不再显示像未来权限期限的账期；限时测试身份明确显示“正式订阅尚未开放。以下操作仅用于测试。”英文同步。

源码35515ef3f仅3个Web文件，22项既有相关测试/build/source scan通过，[CI37890571237](https://github.com/tantalum666/rillora/actions/runs/37890571237)三任务成功。只部署Preview静态资源键，81资源与API40/schema93/身份/计费配置保持。UPDATE_COMPLETE，86线上文件逐一匹配，实际中文页面确认。没有新API、WWW/正式Web或原生发布。

AWS CLI真实过期后原浏览器会话可复用，CLI和STS已恢复；Chrome对本地callback页面的显示拦截没有导致认证失败，未要求Owner重复MFA。

## 剩余门

当前Preview为已退款后的Free TEST，保留管理/历史入口；临时资格仍在原48小时范围，不延期。TEST完整通过不等于Live已开放。随后Owner明确要求直接继续配置，并指出商业登记的开业后一月期限。按[最新Live合同](live-configuration-20261009.md)继续，取消此前先等资料才开始任何配置的门；不把未知税务/个人事实补成已验证，也不把TEST当作真钱收款。

[早上回调修复](stripe-webhook-20261009.md)、[Web部署](web-rollout-20261009.md)、[当前交接](handoff.md)。QA在output/qa/rillora-stripe-cloud-checkout-20261009；本轮构建字节在output/release/rillora-stripe-cloud-checkout-20261009。全部新增合格工作追加保存，真实认证、完整provider对象和私人UI保持受保护排除。
