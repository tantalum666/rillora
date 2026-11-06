# Apple 同账号再次订阅修复

Last updated: 2026-11-05 (Asia/Hong_Kong)

[完整报告](../../../docs/apple-resubscription-repair-20261105.md)解释旧原订阅编号／新token的误拒。原接口409及[签名交易匹配事实](repurchase-before-safe.json)与本机先红后绿相互对应；0109只允许精确已开始意图绑定同一原账号，跨账号／金额／地区／时间等边界保留。

67项本机集成、类型检查／build通过。维护镜像只加两层，[字节核对](maintenance-image-verified.json)证明旧源和配置不变。Preview／正式迁移各成功一次，[Preview权限](staging-audit-authority-result.json)和[正式权限](production-audit-authority-result.json)分别五／六项全通过，[readiness](post-migration-public-health.json)均200。

[Owner反馈](owner-subscription-confirmation.json)与[同单后台读回](repurchase-after-safe.json)一致：completed／paid_reconciled、HKD888、已验签收据、active／applied，业务目录不变。没有人工权益或新购买要求。手机保持已装18，无新原生包或TestFlight／重提。

全部原始设备、身份、授权码、云配置及本机数据库排除；小型安全摘要可读，其余本轮安全原件另追加加密归档。旧1–61及18IPA不重封／重下。保存和部署不等于长期会话功能已完成，Owner的新用户登录需求另行推进。

新增archive62本地认证完成：45路径／45原件／20669密文字节。[目录](catalog.json)、[捕获范围](snapshot.json)和[认证回执](archive-verification.json)分别保存。本机数据库和设备解包副本不包含；原18IPA保持在60。本轮失败及已成功任务采集修正保留，不重复数据库迁移。
