# October10 最终安全与恢复后计费验收

Status: IN PROGRESS — OWNER SELECTED RELEASE ITEM3
Last updated: 2026-10-10 (Asia/Hong_Kong)

Owner明确“把3做了”，对应发布清单的最终产物、权限和恢复后计费对账。沿用既有完整阅读、基础RDS/KMS恢复、真实TEST付款和手机13结果，不重复购买/退款、安装、全库审查或无变化的部署。Stripe Tax自动计税暂后、免费Auth0、现有价格、真实数据、FanPass和暂停零碎TestFlight保持。

## 本次需取得的证据

- 真实支付平台的当前订阅/退款事实与隔离PostgreSQL恢复后的权益一致；不得将TEST对象改标Live，也不把API查询伪装成已验签webhook。
- 当前schema94生产快照在单独私有恢复实例中保持隔离，隐私/权限控制先重放；使用真实Apple Sandbox签名状态及当前provider读取进行对账。基础传输/加密测试沿用September23结果，本次只补金融和最终部署边界。
- 缺失/过期/错账户/provider读取失败等条件不能推进恢复检查点或开放流量；重复执行不得重复授予权益。恢复角色不能接入源数据库、生成内容密钥或写控制日志。
- 最终运行镜像、迁移摘要、权限和回滚底线明确。不能回退到缺少退款失败逆转或pending退款修复的旧计费镜像；恢复和代码回滚不是同一步。

## 已定位的配置缺口

当前实际RecoveryTask17使用最终API镜像，但只有APPLE_REVIEW_SECRET_ARN，没有STRIPE_PRODUCTION_SECRET_ARN，也没有对应AWS读取授权。新增infra断言准确失败（8过/1失败），补充后9项与类型检查通过。

修复只让既有隔离恢复任务读取指定的现有Rillora billing secret（GetSecretValue/DescribeSecret），不新建Stripe密钥、扩Stripe权限、开启购买或扩大网络。恢复命令只执行provider读取；原有数据库隔离、KMS decrypt-only及journal read-only约束保持。代码/本地验证不等于已部署，实际变更集与运行读取继续独立核验。

## 操作与保留边界

AWS旧CLI会话实际过期后，通过原浏览器会话恢复成功，没有要求Owner重复认证。已经按既有guarded driver登记唯一恢复run并创建标记的临时快照；只向对应rillora-recovery目标恢复，不覆盖原库。

实际生产commerce恢复命令要求源API短暂静止及新鲜证明；只有隔离目标可用、全部准备完成后才进行该可逆步骤，并恢复同一源服务的原desiredCount/镜像。源数据、价格和平台订阅均不更改。结束后只清理本轮标记的恢复实例/快照，原库及保留中的独立删除验收账号不在删除范围。

QA位于output/qa/rillora-recovery-financial-20261010，原始快照/任务请求、精确provider映射及认证日志仅在.local-secrets/recovery-financial-20261010。尚未完成不得把release-security或backup-retention总门直接勾过；最终收尾需独立结果、当前交接/旅程和全量Git增量保存。
