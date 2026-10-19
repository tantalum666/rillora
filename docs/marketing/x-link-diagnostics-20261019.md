# X 官网入口的浏览器连接警告

Status: CURRENT X ENTRY RECOVERED / OWNER RETEST PASSED / ROOT TLS1.2 GAP RECORDED
Last updated: 2026-10-19 (Asia/Hong_Kong)

## Owner反馈与检查范围

Owner从X打开设置的rillora.xyz时看到不安全提示，随后明确是浏览器“连接不安全／连接不私密”，不是X的内容风险提示。本轮只检查公开域名、TLS与跳转、当前X资料链接和Google安全浏览状态，没有更改账号设置、网络安全策略或部署。

读取原X标签时Owner正在Edit profile中填写HTTPS的www地址；保留这份编辑状态，没有代为保存／关闭。另开只读资料页观察当前已保存链接，实际短链接跳转与浏览器点击均验证到https://www.rillora.xyz/，最终渲染英文官网，没有绕过任何安全警告。观察到的账号为rillora_xyz；不把它推断为所有平台handle已统一。

## 当前实际结果

| 检查 | 结果与边界 |
| --- | --- |
| HTTPS根域名 | 302到HTTPS的www；TLS1.3和主机名／证书链验证通过；GoDaddy证书有效至2027-04-10 |
| HTTP根域名 | 302到HTTPS的www，没有降级跳转 |
| HTTPS的www | 200，HSTS一年；Amazon证书有效至2027-04-09；TLS1.2与TLS1.3验证均通过 |
| HTTP的www | 301到HTTPS的www |
| X当前已保存链接 | t.co返回301到https://www.rillora.xyz/；实际点击进入官网，无警告 |
| 根域名TLS1.2 | 当前解析到的两个GoDaddy转发地址均返回ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION；SNI保持rillora.xyz，未跳过证书验证 |
| Google安全浏览 | 显示“未发现不安全的内容”，但提供方数据更新于2026-09-24；不是October19新扫描 |

完整安全可读回执和截图见[验证目录](../../collaboration/verification/x-link-diagnostics-20261019/README.md)。

## 判断

当前www证书没有过期或主机名不匹配的证据；根域名转发层存在已复现的TLS1.2兼容性差异。该差异可影响不支持TLS1.3的客户端或检测器，但原警告没有完整错误代码，因此不能把它认定为唯一根因，也不能把Google的历史安全分类当作全面安全审计。

当前X链接直接使用HTTPS的www，已避开根域名GoDaddy转发。此保存状态由读取页面确认，不是Agent修改完成的功劳。初次检查时尚缺Owner复测与具体NET::ERR_CERT等错误；桌面Chrome成功没有单独作为用户侧恢复的证明。

同轮后续：Owner已从X重新点击，明确回复“现在可以正常打开”。当前入口恢复因此由Owner复测确认；原始错误代码仍未知，不改写为已精确定位唯一根因。现有营销文案／链接配置没有http(s)裸根域入口，继续统一使用https://www.rillora.xyz/，无需为当前恢复结果改动DNS、服务器或安全设置。

## 后续边界

本轮没有关闭证书校验、浏览器安全浏览、HTTPS保护或放宽TLS策略；未改DNS、网站内容、价格、数据、App Review或TestFlight。没有以“误判”名义发送X／GoDaddy申诉。根域名兼容性修复若后续需要，应保留现有邮箱／验证DNS与可用www入口，先准备替代方案，不能为消除警告临时禁用安全保护。

X的[官方链接说明](https://help.x.com/en/safety-and-security/phishing-spam-and-malware-links)区分平台链接警告与误分类申诉；Owner已说明是浏览器连接警告，本轮没有把两者混用。
