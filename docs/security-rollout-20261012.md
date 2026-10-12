# Rillora 安全修复切换 — 2026-10-12

Status: CLOUD / HTTPS NATIVE / NAMED LOCAL CREDENTIAL DEPLOYMENT VERIFIED; GIT EVIDENCE CLOSEOUT IN PROGRESS
Last updated: 2026-10-12 (Asia/Hong_Kong)

Owner授权部署全部安全修复，按已有顺序切换，保持数据、定价和收费开关，先不发TestFlight，并多次重申默认最高授权。此合同取代此前源码阶段的线上冻结门；部署和市场开售仍分开。

## 源码与实际交付

云端及原生实施源为bfe9baaf520e051e70081daf7ed459f0926264b4／CI126。它纳入前30组与74a9c66ac的后5组，并补固定只读探针、旧回调兼容和新worker只读观察权限。本轮没有重复本机519项API全量；沿用已完成结果，GitHubCI另有实际运行。

实际安装发现两处本机工具兼容问题，已在042f4e1005f8754abfd21d48d3d4c7b9ea198166修复、推送并通过CI127。它只改变运维凭据工具／测试／说明，API、Web及iOS源码字节不变，不触发同一应用重建或再部署。

## 受控数据库切换

| 项目 | Preview | Production |
| --- | --- | --- |
| 原始运行基线 | API43、schema94 | API21、schema94 |
| 停写 | API与新worker的desired/running/pending均0 | 同左 |
| 一致基线 | 94摘要、68表指纹、未决身份删除0 | 同左 |
| 加密快照 | available，源／创建回执／归属匹配 | available，源／运行能力标签匹配 |
| 迁移 | 一次95—103、权限引导、加密核验与邮箱回填，退出0 | 同左 |
| 迁移后核验 | 103摘要匹配；68表原业务字段指纹相同 | 同左，另验证独立日志broker拒绝伪造envelope |
| 恢复 | 恢复模板UPDATE_COMPLETE且完全匹配 | 同左 |

指纹比对只排除明确迁移的表示字段／维护元数据，未用删表、重建真实数据或放宽检查掩盖差异。真实记录、原交易／账务、角色与内容保持；旧session全局邮箱摘要按设计移除，owner范围摘要回填。

Preview首次带标签快照请求因无AddTagsToResource而未创建；确认不存在后，用已有较窄无标签创建权限完成，并保存认证创建回执作为归属证据。没有为标签扩大IAM。Production通过固定broker创建带能力证明的备份；两份快照继续保留，不在验收后擅自删除。

原RDS、VPC／子网、内容KMS、既有Secrets及恢复journal资源未被替换。停写／恢复模板分别81→99与79→101资源，增加隔离边界；旧ECS任务定义的正常版本替换不是数据库替换。升级后的权限／邮箱schema不能只回滚旧应用镜像。

## 运行时与Web读回

- RilloraStaging、RilloraProduction、RilloraProductionWeb、RilloraPublicWeb、RilloraOperations五栈均UPDATE_COMPLETE，与审阅模板匹配。
- PreviewAPI44与productionAPI22、新独立worker各1个RUNNING；API容器HEALTHY。worker没有容器健康检查，准确记录UNKNOWN与实际稳定运行／无启动或重试错误，不能改称HEALTHY。[AWS健康检查定义](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html)。
- 四个后切换任务均实测镜像digest`sha256:75fa633d5d30cc4b74a0c9de5cfec9c187d2eab4f118f3b8b7842cb0214fc734`。后续API23只是审核到期参数更新，镜像、其他环境字段、secret引用相同。
- APIlive／ready均200；Preview未认证会话401／no-store。Production原审核期过期时准确返回403 service_not_open，不能把它误报成启动崩溃；续期后未认证会话401／no-store。
- Preview86、正式Web86、官网31，共203个静态文件逐一SHA256匹配。两个应用域的邀请AASA及Auth0关联端点无重定向200、应用标识和精确路径匹配。
- 两个环境直接RunTask实际AccessDenied；固定broker拒绝未审阅的无害命令，production拒绝用错误能力凭据读取本次既有快照。未用破坏性删除或外发SNS消息来测试拒绝。
- 恢复检查允许的CFN Conditional变化严格限于具名前端上传SourceObjectKeys及明确的派生引用；目的bucket、数据资源和来源绑定保护不变。Ops收紧快照legal-hold解除、生产告警改态与SNS伪造发布权限，模板精确读回。未取得人类IAM全局ListRolePolicies权限，也没有把该403当作会话过期。

## 原生HTTPS与到期问题

原机development1.0(14)直接安装成功，版本独立读回；签名、原Keychain／应用标识、生产连接、设备授权、HTTPSassociated domains和双语等13检查通过。未卸载、换Apple账户或发送TestFlight。

初次启动被iOS锁屏阻止。Owner解锁后进程启动成功，但反馈App内服务未开放。真实原因是原3身份审核期已于2026-10-11T14:00Z结束。Agent按既有验收授权只续原3身份48小时，到香港2026-10-14 20:01，API23与现有Auth0Action分别读回一致；费用开关、身份范围、表单、绑定顺序和其他参数不变。

Owner确认进入首页且原事项仍在，Auth0同一原生client在12:14Z记录成功登录、表单提交和授权码交换。随后两个客户端均退休旧私有协议回调，仅保留`https://login.rillora.xyz/ios/com.rillora.ios/callback`。HTTPS证据来自已签名安装源码的useHTTPS、关联文件和精确allowlist；provider日志独立证明登录／换码，并未记录redirectURI。生产有本次真实原生结果，Preview共用该实现及关联配置，未虚构第二次真实登录。

## 本机凭据保护

实际签名安装暴露codesign -R将表达式当文件名的问题，已在安装和读取两处补字面表达式前缀。实际AWSCLI2.36.20又证明整包cli-input-json会重复读管道；现仅支持既有SecretsManager put-secret-value的SecretId、SecretString及可选ClientRequestToken，用独立匿名管道送入普通字符串选项，stdin关闭，凭据不进argv或临时JSON文件。原始CR在执行前拒绝，当前多行密钥按JSON转义后保持原字节；调试、参数覆盖及其他字段／操作拒绝。

本机9项测试含实际AWSCLI到本机回环HTTP接收器，长Unicode及转义换行匹配；8项Auth0工具、源扫描32已审阅／0未知通过。正式签名需求正例、错误identifier拒绝及SecureEnclave合成／篡改／无人值守拒绝通过；Owner完成非秘密本人验证。

主检出已快速前进至042f4e100，原具名交接stash与QA副本保留，两个检出均安装相同签名助手。主目录9份支持的Auth0／Apple文件已逐份加密、本人验证读回后原位替换；失败保护和每份恢复记录保留。没有provider轮换、共享账号权限调整、归档age身份迁移或FanPass变更。它不能证明其他旧副本／备份已擦除，也不防御本人授权使用期间整个OS失陷。

## 真实平台限制与收尾

GitHubCLI保护读取403是token范围，不是登录失效。已用有效浏览器读取：经典保护和规则集都未配置，两个界面明确当前私有仓库方案不会强制执行。未购买套餐、迁移组织、添加token范围或创建徒有配置的规则。CI及部署脚本检查不冒充GitHub服务器强制保护。

先前用户默认FullAccess与旧执行轮次沙箱不一致，已在下一轮实际变为danger-full-access／network enabled／approval never；未修改自身安全控件或继续发起终端提权。

archive33已在d33e0b31f推送，独立空LFS缓存新下载并解密验证全部536对象／665路径；旧1—32归档未重下。CI128的发布扫描负例使用随机hex，某些样本会落入扫描器启发式忽略范围，导致测试偶发失败；本机复现低于固定3.5熵门槛的一例后，改为稳定合成摘要，73项工具测试通过。远端当次随机字节未记录，不伪称重建了它的精确忽略原因；扫描规则、例外登记及拒绝断言均未改。该变更只有测试夹具，不改变部署源码或需要重新部署。最终修正CI／回执收尾见handoff。

原始provider、认证、数据库指纹／日志及设备信息留在`.local-secrets/security-rollout-20261011`，不入可读Git；脱敏QA与签名产物按既有合同分层保存。后续正式开售、统一商店候选／送审和实际市场结果仍是独立任务；本批不发TestFlight、不制造支付或删除保留账号。
