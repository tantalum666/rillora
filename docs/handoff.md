# Rillora 当前交接

Status: NATIVE18 INSTALLED / REPURCHASE REPAIRED AND VERIFIED / LONGER USER SESSION WORK ACTIVE
Last updated: 2026-11-05 (Asia/Hong_Kong)

## 当前任务

Owner最新要求延长登录保持，已明确仅Rillora App／Web用户自己的登录，且要设置网络／IP变化等安全条件，不是AWS／Auth0／Stripe管理会话。Agent已说明拟采用最长30天、闲置7天、陌生网络／客户端同账号再确认，敏感操作另验；当前仍在核对可信网络来源与现有会话实现，尚未改代码或部署时限。Auth0付费功能、管理角色长期密钥、无限期令牌都不是本轮目标。

## 已完成

- 原iPhone16ProMax/iOS27.2有线原位从17升到18，复用相同已验签IPA，独立读回和启动成功。未卸载、清数据或重建原生包。[安装记录](native18-device-install-20261105.md)。
- Owner随后发现新购买及恢复后仍Free。实际新HKD888订单pending、两次409；签名／token／金额／原账号均匹配，旧0096函数错误拒绝同原订阅编号的新购买token。0109及限定诊断已实现；本机先复现失败，67集成／类型／build通过。[修复与证据](apple-resubscription-repair-20261105.md)。
- 维护镜像304422f4仅叠加诊断JS和109SQL。两维护任务定义读回，仅镜像和既有ARN依赖变化；API／worker镜像、IAM模板、数据／价格／收费和FanPass保持。先Preview109＋五项权限，后正式109＋六项权限，均成功；两readiness200。
- 修复后Owner恢复同笔交易并确认“现在显示已订阅了”；后台同单completed／paid_reconciled，HKD888收据签名true、active／applied，最后本期至香港22:52:01。没有人工Family、转移归属、取消重建或要求重买。正常Sandbox加速续订不是正式年价期限。
- 原审核资格DB／API／监控到December4、14天预警及安静跟进保留；18付款与旧17证据分开。App Store／TestFlight／重提仍暂停，云CI及子代理不用。

## 当前证据和资源边界

当次QA `output/qa/rillora-native18-install-20261105/`；设备、认证、本机PG目录在其private子目录，云状态及操作能力在 `.local-secrets/native18-purchase-20261105/`，不得公开。SQL迁移109已在线，不得再次执行任务；采集器错误仅重读原任务。安装及付款修复的Git保存尚在收尾，原18代码头1b069bec0、PR10保持。

本机独立PG16.14端口55435与仅rillora-build Colima目前运行；FYP和其他虚拟机未操作。后续会话验证可复用这套本机环境，任务结束时只停止本轮启动的资源。AWS已用原身份完成一次本人验证，再由官方same-device localhost callback接回CLI，无第二次MFA、无授权码落盘。现有会话仍可用，不重复认证。

已查自身会话默认8h绝对／30min闲置，API运行环境没有覆盖这两项；Native opaque token在ThisDeviceOnly Keychain，Web为HttpOnly/Secure Cookie。既有reauth仅更新authenticated_at且保留同一会话，敏感操作10min；网络风险需要允许认证挑战路由通过，不能形成自锁。当前API经CloudFront→HTTP API，不能信任任意客户端IP头；AllViewerExceptHostHeader会传CF viewer metadata，但仍需验证来自本项目边缘而非直接API伪造。方案尚未定稿／实现，避免把这些研究写成已上线保护。

## 唯一下一步

先完成本轮109付款修复与设备回执的Git保存，再继续实现并验证Rillora用户长期会话和可信网络／客户端风险判断；不改管理登录、不复活旧撤销会话、不弱化付款／删除等保护，不重复已完成购买。保持重提／TestFlight暂停。
