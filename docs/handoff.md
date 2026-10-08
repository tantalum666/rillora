# Rillora 当前交接

Status: DEPLOYED / STRIPE TEST WEBHOOK REPAIRED — WAITING FOR OWNER PREVIEW LOGIN
Last updated: 2026-10-09 (Asia/Hong_Kong)

## 当前任务与已完成

Owner要求修复实际www/Preview版本缺口，随后读Gmail Stripe告警并检查Web购买。
完整Markdown阅读与PR2/CI100/43browser/archive25沿用，不重跑已完成项。

- 三套Web已部署：www31/31、正式Web86/86、Preview86/86线上文件匹配；真实www1280中英、390手机菜单、768平板通过。
- Preview原会话已看到My plan/重复语言入口修正、Family权益/USD88.99与中文指南。旧identity404由后端落后造成；API38→39→40，当前1/1 HEALTHY、rollout COMPLETED。
- Preview仅补18项迁移0076–0093，93指纹/TLS通过，未轮换运行凭据。固定原108根RDS CA的构建修正6219c8296及CI通过。
- Gmail是TEST webhook500告警。8条事件来自本地fixture而非staging账户；8b1f91798修正映射核验并部署。2TEST/13production边界及CI37831640081通过；真实重发后provider未送达数0，8条已验签保留needs_mapping，无虚假权益。
- 原Preview账号旧USD9.99/月TEST订阅已取消，实际回调applied/expired_read_only；唯一旧expired/unpaid订单关闭，paid历史/原1事项保留。
- 原Preview账号48小时TEST资格已登记，香港October11 04:28自动到期；USD88.99年价v4不变，未开启Live或普通销售。

## 证据边界与阻塞

[Web部署](web-rollout-20261009.md)、[Stripe实际结果](stripe-webhook-20261009.md)及各自output/qa目录。
当前源码8b1f91798在codex/matter-category-bar-20261008。新工作[archive26](../collaboration/verification/web-stripe-20261009/README.md)已推送，fd17f52ea独立GitHub下载/解密核验422路径/289对象通过；旧1–25不重下。
Preview会话长时间空闲后实际401、无可用浏览器session；Chrome已停account，Owner本人条款/登录问题已发送，尚未回复。
不把新邮箱显示/按钮/当前托管年付流程写成通过；旧October6本地TEST闭环仅沿用原证据范围。

正式API仍16/schema0093；三正式审核身份原期限香港October9 04:00已过，本轮未延长。
原生仍35f37e1b2的本地1.0(11)，TestFlight暂停。价格、真实数据、FanPass、独立删除账号保留决定有效。
Live运行接入/经营税务事实/商店最终发布保持独立门。AWS本轮Owner实际MFA后可用，Stripe凭据可用，不重复索取登录。

## 唯一下一步

Owner完成当前Chrome的Preview原账号登录后，立即核对邮箱/原事项及TEST年付入口，继续真实云端Web
USD88.99托管结账、返回/回调/权益与管理验收；不要再注册、伪造同意或切换到正式扣款。

[上一交接](handoff-history-20261009-before-web-rollout.md)为HISTORICAL。
