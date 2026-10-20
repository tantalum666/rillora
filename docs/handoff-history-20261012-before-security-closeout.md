# HISTORICAL — superseded by the completed cloud cutover and native acceptance

This checkpoint records an earlier in-progress state. Its next step is no longer active.

# Rillora 当前交接

Status: PREVIEW VERIFIED / PRODUCTION MIGRATED AND STOPPED FOR VERIFICATION / NO TESTFLIGHT
Last updated: 2026-10-12 (Asia/Hong_Kong)

## 当前任务

Owner要求开始部署整批安全修复，按已有切换顺序，保留数据、价格和收费开关，先不发TestFlight；并重申默认最高授权。
旧源码任务已完成，新部署任务正在执行：Preview恢复后任务／HTTP／日志核验通过；production停写、冻结基线、加密备份和迁移已完成，正在后置核验，尚未恢复服务。详见[当前切换合同](security-rollout-20261012.md)。
活动工作树：`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`；
分支`codex/security-findings-20261011`，部署起点3a9f6a289d89d8a938a3f4cc6198d23e6609f8a6。
主检出保持旧工程基线，只作为接续入口。

## 当前部署进度

- 新轮次实际权限已为danger-full-access／network enabled／approval never，AWS只读及工作树写入已验证，无新增提权。Preview API44 HEALTHY、独立worker1 RUNNING／UNKNOWN，均1/1、COMPLETED；无启动／重试错误，健康200及两条未登录session401／no-store通过，首页匹配候选。
- production停写栈已UPDATE_COMPLETE且匹配，两个写入服务0；冻结audit-before退出0，68表指纹／schema94／未决删除0。新加密快照available并通过能力标签／源归属核验。迁移任务2249e0fbc90e44fb95151195b40fc224退出0；audit-after已提交，随后执行authority，不能重复迁移或提前恢复。
- 原生直装14已完成archive、development导出及13项签名／同Keychain／生产连接／精确设备／双语检查，未安装。Auth0 AASA无重定向200，应用标识及回调路径匹配；旧回调保留。
- 正式Web／官网／运维变更集已准备，尚未execute。GitHub两个保护界面均明确当前私有仓库方案不执行规则；没有创建虚假有效规则或更改计划／组织。具名凭据助手实际安装发现codesign -R缺少表达式前缀，修复排在冻结云端切换完成后，不在停写期间更换已验证源码。

- bfe9baaf520e051e70081daf7ed459f0926264b4／CI126三任务通过。Preview stopped变更集已执行，2026-10-12T06:34Z读回UPDATE_COMPLETE且模板完全匹配；停写后audit-before退出0，schema94、68表指纹和未决删除0已保存。不能重复execute或恢复旧API后直接迁移。
- Preview新加密快照已available，源实例／创建回执／归属一致；原带标签请求因缺AddTagsToResource而未创建，确认不存在后沿用已有较窄权限创建无标签快照，没有扩权。迁移任务9141ef7031ec47768906ee90e525b650退出0，不能重复迁移。
- 迁移后数据／权限任务均退出0：schema103及全部摘要匹配，68表原业务指纹不变，未决删除0；SQL读授权密钥／确认日志被拒绝，无签名tenant与篡改owner被拒绝，合法签名owner可读。2026-10-12T08:06:48Z恢复变更集UPDATE_COMPLETE、模板完全匹配。恢复后HTTP／实际任务状态与worker日志尚未单独核验，不能把CFN成功写成真实核心流程已验收。
- 恢复变更集的唯一条件替换为Preview前端上传自定义资源的SourceObjectKeys。核对目的bucket及所有其他属性原字节一致后，执行器只增加该精确例外；没有允许数据库／bucket替换。正式Web、官网及运维候选已生成并比较，尚未部署。
- Auth0两个原生客户端已加入HTTPS回调和应用关联元数据，暂保留已批准旧回调；Preview同意Action已发布，production原代码已匹配。绑定顺序、表单和原审核到期时间保持。尚未取得新原生登录结果。

- 原AWS MFA已恢复；跨夜过期后又复用浏览器会话续期，无需再次MFA。Auth0确认CLI过期后也已完成同scope续期，实际生产客户端回调已读回。
- 云端初次基线：production API21／Preview43，均为1/1、COMPLETED，正式购买关闭／通知开启、review不变；五个相关栈均UPDATE_COMPLETE。原始模板／参数保存于本工作树`.local-secrets/security-rollout-20261011`。
- 构建依赖与现有Colima已就绪，API镜像及Preview／正式Web／官网候选构建通过；没有清理其他项目。补齐两个固定只读核验脚本、旧原生回调兼容选项，以及运维读取新worker状态／日志和Preview自身stack输出的最小权限。
- 新维护broker8项、Auth0工具8项、发布工具73项、infra59项／类型检查通过；源扫描32匹配／0未知。API源码仍与CI125一致，不重新声称本轮运行519项。
- 两个环境的实际只读任务都已STOPPED/exit0：94迁移摘要匹配源码、9类现有服务角色安全、未决身份删除0、内容强制加密、68表指纹保存。原始日志／指纹仅存受保护目录。
- 停写／恢复模板已冻结：Preview81→99资源、production79→101资源；无旧数据资源删除，原数据库／内容KMS／既有秘密／VPC子网／journal不变，收费／审核参数不变。Preview已恢复；production现停写等待后置核验。

## 既有源码修复证据

- 一次新的只读边界调查已完成。补确认：运行时SQL能伪造旧日志发布确认，8个运行时可达definer继承管理员所有权；不能只把这些归因于完整API控制。
- 五组边界已实现：事务授权／强制RLS和窄definer；独立日志envelope／回执；无HTTP的删除工作器及独立签名核验；owner作用域邮箱HMAC／旧摘要回填；用户在场Secure Enclave封套与匿名管道上传。
- 最终API58文件519/519、typecheck/build通过；infra58/58及类型检查通过；发布工具73、维护broker7、凭据工具7、Auth0工具7、日志broker4、collaboration9通过。当前Swift源码编译与合成硬件往返／无人值守／篡改／账户绑定拒绝全部通过。
- 一次新候选复核发现迁移命令漂移及遗漏删除worker停写检查，两项已补修并验证。源扫描32个已审阅命中／0未知；只移动3处同字节既有登记行号，没有新增例外。1—99迁移和发布脱敏器原字节匹配基线。
- 实施／归档提交74a9c66ac50cb8f5f68afe7c3d673c9d2f742897已推送；[CI125](https://github.com/tantalum666/rillora/actions/runs/38146452345)三任务全部成功。Web／iOS源码未改；本机沿用上轮客户端证据，GitHub本轮另外执行了Web检查，未新增真机验收。
- [archive32及回执](../collaboration/verification/security-remaining-five-20261011/README.md)保留249路径／232原件，345,291加密字节；独立空LFS缓存重新下载后逐对象解密核验通过。前31档案不重封／重下。最终回执提交只更新文档元数据，实施代码沿用CI125。

## 证据边界

上一轮076bd5a／CI124／archive31已完成，保留其日期与范围，不重跑旧购买或重新下载旧档案。
源码阶段1—99迁移原字节保持。Preview完成迁移／恢复及后置线上核验；production迁移完成但仍停写等待核验与恢复。没有移动真实本机凭据、操作资金、安装手机、TestFlight、保留账号或FanPass。原深度扫描继续停止；不改原报告状态。

此前用户默认配置与运行轮次权限不一致已在新的执行轮次解决；当前实际Full Access／approval never。保留原诊断而不继续询问重复批准，也不声称Agent修改了自身权限。

源码隔离并不意味着所有API／OS完全失陷风险消失。新的存储工具也不证明旧明文副本或备份已迁走。
精确合同见[剩余五组实施记录](security-remaining-five-20261011.md)。

## 唯一下一步

检查production的同一audit-after任务、运行authority并接受原数据指纹核验，随后只执行一次production恢复模板。再依序执行已准备的三个辅助栈、实际权限／端点核验、原生直装和本机助手修复，最后增量Git保存。Preview所有已完成步骤、两库迁移及Auth0设置均不得重做。精确请求在`.local-secrets/security-rollout-20261011`，当前远端源码仍bfe9baaf5／CI126，新QA／文档尚未推送。
当前已获部署授权，不再要求Owner重复批准；不改变收费开关、不发TestFlight或制造购买。

[部署前交接](handoff-history-20261012-before-security-rollout.md)及[上轮已完成交接](handoff-history-20261011-before-remaining-five.md)为HISTORICAL。
