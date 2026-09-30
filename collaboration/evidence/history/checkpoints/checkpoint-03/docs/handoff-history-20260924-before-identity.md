HISTORICAL: superseded by the current handoff. Do not execute its old next step as a new instruction.

# Rillora Handoff — HISTORICAL, before identity and mail

Status: CLOSED PRODUCTION HTTPS AND MONITOR VERIFIED; GODADDY CLI READY
Last updated: 2026-09-24 (Asia/Hong_Kong)

## 当前Owner任务与结果

Owner要求继续正式生产工作，随后确认GoDaddy/AWS登录、原Auth0邮箱身份恢复，以及精确证书CNAME保存；最新又要求设置GoDaddy CLI，并当场确认所示OAuth权限／条款。已完成关闭客户入口的生产API/TLS部署与公开监控，官方CLI及仅Rillora的项目入口已实际读写／清理验收。[运行合同](production-runtime-20260924.md)、[GoDaddy CLI](../tools/godaddy/README.md)。

## 已验证

- RilloraProduction UPDATE_COMPLETE，API task revision1／1个常规Fargate任务HEALTHY、rolloutCOMPLETED。镜像8426279e5de8…匹配代码4215c25及本地artifact。Schema0070／原独立私有加密保护7日RDS保留，无SQL重跑。
- ACM证书8435fada-00ca-4c0e-880b-ff26e0fb6191 ISSUED／export-enabled／renewalELIGIBLE。Owner确认的单条CNAME在GoDaddy、两个权威DNS和两个公共解析器均一致。实际Gateway内部TLS、精确VPC Link组8443入口回读通过；live/ready200，六类账户／私有／provider路径503/no-store且不发session。
- 公网IP的完整TLS握手无响应；本机裸TCP却报告三个端口连接，结果不一致、根因未确认。保留原始不确定结果，不宣称裸TCP超时或全面渗透测试。云端安全组无任何公网CIDR，仅许可其VPC Link组。日志分页回读79项及独立50项样本，只含批准的request/response字段；不宣称旧日志已删除。
- Operations UPDATE_COMPLETE／10个public targets，实际云端调用ok/failed0；原15分钟日程保持，原SNS订阅／投递及缺心跳证据保留。新prod目标分别是live、ready、账户仍关闭；旧Environment维度名为历史连续性保留。
- 原Auth0邮箱密码／MFA路径已回到rillora-dev（EU），CLI成功回读原Web/iOS及服务clients。Google同邮箱是不同管理身份，今后不再误选。外部email provider仍404未配置。AWS CLI也已恢复；不要根据历史错误重复本人登录。
- gddy0.2.20官方校验安装；显式keyring模式、refreshable OAuth、四项Owner确认的最小所需scope。rillora-dns别名固定rillora.xyz/prod，写入默认preview／--apply另执行。临时TXT真实20→21→20，原zone完整digest恢复一致；FanPass没改。原生gddy权限仍是账户级，不把项目guard称为provider隔离。

## 证据边界

生产用户入口、生产身份／邮件、Web同源分发／原生Release五项连接、普通真实购买与上架仍未完成。原UI、88.80年付、Free／Family、E2EE延期及经营／实机Owner暂缓均保持。现有staging仍API37／0067，未重部署。当前使用按量，未买RI/Savings Plans或GoDaddy套餐。前轮恢复／撤销／删除结果保留，不重复演练。

## Historical next step — superseded

接生产身份／事务邮件和最终Web/iOS连接：先核对原Auth0中的生产客户端、Google正式项目及可靠邮件配置，再接app.rillora.xyz同源入口；保持账户与销售关闭到对应验收。AWS/Auth0/GoDaddy均已有CLI能力，先检查实际会话并复用，只有真的过期才走平台要求的续期。不重新建库、重做证书、误建Auth0租户或索取已确认的CLI权限。

## 恢复入口

[QA](../output/qa/rillora-production-runtime-20260924/README.md)、work-state.json、transport-acceptance.json、runtime-final-stack.json、certificate-issued.json、operations-config-readback.json及godaddy-cli/cli-write-acceptance.json。源代码212API／29infra以CI5为检查点；本次另跑6health、7Operations及4DNS guard，实际云端/CLI结果分别记录。后续源码/CI最新回读在closeout.json。原92份／20,554行／206段全量阅读基线继续有效，压缩后聚焦恢复。[本次前段交接—HISTORICAL](handoff-history-20260924-access-recovery.md)。
