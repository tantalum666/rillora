# Rillora 当前交接

Status: SECURITY ROLLOUT PREPARING / EXISTING SERVICES RUNNING / NO TESTFLIGHT
Last updated: 2026-10-12 (Asia/Hong_Kong)

## 当前任务

Owner要求开始部署整批安全修复，按已有切换顺序，保留数据、价格和收费开关，先不发TestFlight；并重申默认最高授权。
旧源码任务已完成，新部署任务正在准备，尚未停止服务或迁移数据库。详见[当前切换合同](security-rollout-20261012.md)。
活动工作树：`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`；
分支`codex/security-findings-20261011`，部署起点3a9f6a289d89d8a938a3f4cc6198d23e6609f8a6。
主检出保持旧工程基线，只作为接续入口。

## 当前部署进度

- 原AWS MFA已恢复；跨夜过期后又复用浏览器会话续期，无需再次MFA。Auth0确认CLI过期后也已完成同scope续期，实际生产客户端回调已读回。
- 云端初次基线：production API21／Preview43，均为1/1、COMPLETED，正式购买关闭／通知开启、review不变；五个相关栈均UPDATE_COMPLETE。原始模板／参数保存于本工作树`.local-secrets/security-rollout-20261011`。
- 构建依赖与现有Colima已就绪，API镜像及Preview／正式Web／官网候选构建通过；没有清理其他项目。补齐两个固定只读核验脚本、旧原生回调兼容选项，以及运维读取新worker状态／日志和Preview自身stack输出的最小权限。
- 新维护broker8项、Auth0工具8项、发布工具73项、infra59项／类型检查通过；源扫描32匹配／0未知。API源码仍与CI125一致，不重新声称本轮运行519项。
- 两个环境的实际只读任务都已STOPPED/exit0：94迁移摘要匹配源码、9类现有服务角色安全、未决身份删除0、内容强制加密、68表指纹保存。原始日志／指纹仅存受保护目录。
- 停写／恢复模板已冻结：Preview81→99资源、production79→101资源；无旧资源删除，原数据库／内容KMS／既有秘密／VPC子网／journal不变，收费／审核参数不变。停写阶段各2个服务为0；Preview新前端留到恢复阶段。当前尚未部署。

## 既有源码修复证据

- 一次新的只读边界调查已完成。补确认：运行时SQL能伪造旧日志发布确认，8个运行时可达definer继承管理员所有权；不能只把这些归因于完整API控制。
- 五组边界已实现：事务授权／强制RLS和窄definer；独立日志envelope／回执；无HTTP的删除工作器及独立签名核验；owner作用域邮箱HMAC／旧摘要回填；用户在场Secure Enclave封套与匿名管道上传。
- 最终API58文件519/519、typecheck/build通过；infra58/58及类型检查通过；发布工具73、维护broker7、凭据工具7、Auth0工具7、日志broker4、collaboration9通过。当前Swift源码编译与合成硬件往返／无人值守／篡改／账户绑定拒绝全部通过。
- 一次新候选复核发现迁移命令漂移及遗漏删除worker停写检查，两项已补修并验证。源扫描32个已审阅命中／0未知；只移动3处同字节既有登记行号，没有新增例外。1—99迁移和发布脱敏器原字节匹配基线。
- 实施／归档提交74a9c66ac50cb8f5f68afe7c3d673c9d2f742897已推送；[CI125](https://github.com/tantalum666/rillora/actions/runs/38146452345)三任务全部成功。Web／iOS源码未改；本机沿用上轮客户端证据，GitHub本轮另外执行了Web检查，未新增真机验收。
- [archive32及回执](../collaboration/verification/security-remaining-five-20261011/README.md)保留249路径／232原件，345,291加密字节；独立空LFS缓存重新下载后逐对象解密核验通过。前31档案不重封／重下。最终回执提交只更新文档元数据，实施代码沿用CI125。

## 证据边界

上一轮076bd5a／CI124／archive31已完成，保留其日期与范围，不重跑旧购买或重新下载旧档案。
源码阶段1—99迁移原字节保持，新迁移只进入专用本地测试库。新部署阶段已执行两次云端只读任务并恢复既有登录，尚未部署、迁移、修改provider设置、真实凭据、
资金、手机、TestFlight、保留账号或FanPass。原深度扫描继续停止；不改原报告状态。

源码隔离并不意味着所有API／OS完全失陷风险消失。新的存储工具也不证明旧明文副本或备份已迁走。
精确合同见[剩余五组实施记录](security-remaining-five-20261011.md)。

## 唯一下一步

提交并取得部署兼容补丁的CI结果，然后按[当前切换顺序](security-rollout-20261012.md)先Preview执行冻结模板、核验2个服务停写、取得冻结数据基线及备份，再迁移95—103／核验／恢复；通过后才切production。
当前已获部署授权，不再要求Owner重复批准；不改变收费开关、不发TestFlight或制造购买。

[部署前交接](handoff-history-20261012-before-security-rollout.md)及[上轮已完成交接](handoff-history-20261011-before-remaining-five.md)为HISTORICAL。
