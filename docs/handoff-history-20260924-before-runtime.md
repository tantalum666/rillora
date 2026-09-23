# HISTORICAL — handoff before production runtime preparation

Superseded by [current handoff](handoff.md). Preserved evidence; do not resume its old steps independently.

# Rillora Current Handoff

Status: PRODUCTION DATA FOUNDATION AND SCOPED RESTORE VERIFIED; CUSTOMER RUNTIME REMAINS CLOSED
Last updated: 2026-09-23 (Asia/Hong_Kong)

## 当前Owner任务与结果

Owner要求继续生产／恢复及独立GitHub，并明确保留FanPass；随后“你来升级”。AWS计划已直接升级PAID／ACTIVE，这轮私有源码、生产数据基础和真实合成恢复已完成。[执行合同](production-recovery-20260923.md)、[控制日志](recovery-control-journal.md)、[源码管理](source-control.md)。

## 已验证

- 私有[tantalum666/rillora](https://github.com/tantalum666/rillora)已推送；初始f7b797d／829文件和树回读一致，无gitlink。FanPass及Web原commit551b20f／.git保持原位。Owner已当场确认仅新增Rillora令牌范围。
- 运行代码11a9efb；[CI运行3](https://github.com/tantalum666/rillora/actions/runs/35871922739)通过。205API本地全套含真实本地DB副本／非superuser权限、28infra、13Python守卫及源码扫描通过。另以真实云端任务核验恢复隔离工具；没有新iOS验收。
- 生产栈UPDATE_COMPLETE，PostgreSQL16.13/db.t4g.micro/20GiB可用、私有、存储加密、删除保护、7日备份。独立KMS轮换365日；独立DynamoDB日志及隔离网络／维护任务均在用。没有客户HTTP/API服务。
- Schema0070，迁移／恢复任务revision2，镜像sha256:19b9287d289397801f607f2a6550c9a336d8771c04738116f388db775863fa46。日志coverage自2026-09-23T14:14:30.870Z启用。
- 真RDS快照、后续C撤销／D删除、隔离恢复与KMS解密通过：恢复前存在旧D密钥／会话；重放后B保留、C拒绝、D／密钥／内容消失、旧会话0；70份迁移校验和一致、明文0／无效引用0、重复重放零变化。四个合成账号／十个初始保护值，观察1206秒（含观察节奏，非SLA）。
- 恢复任务实际连接原库超时（原库可用），KMS GenerateDataKey与DynamoDB PutItem均AccessDenied。原库fixture账号／内容／密钥记录均0，临时DB／演练快照absent。原生产库正常；staging readiness仍ready。

## 边界

生产客户API/Web/iOS连接、身份／邮件、普通正式付款和最终上架仍未完成。快照后的计费变化触发隔离／provider对账；不提供未经核验的自动切换或零数据丢失保证。持续保留清理／旧手动快照退役仍有独立工作。控制tombstone及最小合成收据保留其必要期限，未声明所有备份字节已删除。现有staging仍API37／0067，原UI保留。E2EE、经营登记／实机延期决定不变。

## 唯一下一步

在现有独立数据基础上接好受控生产API、内部TLS与生产身份／事务邮件，再填Web/iOS正式连接；保留关闭销售的发布门。继续前按当前平台凭据实际状态确认依赖，不重新建库、重做演练、重复升级AWS或索取GitHub已批准范围。

## 恢复入口

[QA与完整结果](../output/qa/rillora-production-recovery-20260923/README.md)、work-state.json、production-artifact-manifest.json和.local/recovery/first-drill.json。原完整阅读基线92份／20,554行／206段继续有效，压缩后只补当前权威与修改文件。任何旧“Free Plan阻塞／等待Owner升级”均已被本轮实际结果取代。
GitHub Actions读取API受原令牌scope限制，已通过现有Chrome网页验收，不要求扩大scope。AWS CLI曾通过现有浏览器会话续期，先试STS，不因旧错误重复本人MFA。[早期交接—HISTORICAL](handoff-history-20260923-production-attempts.md)。
