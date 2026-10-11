# Rillora 当前交接

Status: GROUPS31–35 SOURCE AND LOCAL TESTS COMPLETE / GIT PRESERVATION IN PROGRESS / ONLINE UNCHANGED
Last updated: 2026-10-11 (Asia/Hong_Kong)

## 当前任务

Owner要求继续修复第31—35组，先把代码和测试做好，再一起推到GitHub，线上保持原状。
这取代上一轮“已完成源码、等待恢复部署”的下一步；源码与本地验证已完成，正在统一保存Git，不部署、不动真实凭据。
活动工作树：`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`；
分支`codex/security-findings-20261011`，本轮起点b6f5b8c971196db3f513a7dbb5f6dc36efae8b6a。
主检出保持旧工程基线，只作为接续入口。

## 当前进度与证据

- 一次新的只读边界调查已完成。补确认：运行时SQL能伪造旧日志发布确认，8个运行时可达definer继承管理员所有权；不能只把这些归因于完整API控制。
- 五组边界已实现：事务授权／强制RLS和窄definer；独立日志envelope／回执；无HTTP的删除工作器及独立签名核验；owner作用域邮箱HMAC／旧摘要回填；用户在场Secure Enclave封套与匿名管道上传。
- 最终API58文件519/519、typecheck/build通过；infra58/58及类型检查通过；发布工具73、维护broker7、凭据工具7、Auth0工具7、日志broker4、collaboration9通过。当前Swift源码编译与合成硬件往返／无人值守／篡改／账户绑定拒绝全部通过。
- 一次新候选复核发现迁移命令漂移及遗漏删除worker停写检查，两项已补修并验证。源扫描32个已审阅命中／0未知；只移动3处同字节既有登记行号，没有新增例外。1—99迁移和发布脱敏器原字节匹配基线。
- 本轮尚未commit/push；接下来仅剩增量证据封存、Git推送、CI与独立远端核验。Web／iOS未改，沿用上轮证据，不冒称重跑。

## 证据边界

上一轮076bd5a／CI124／archive31已完成，保留其日期与范围，不重跑旧购买或重新下载旧档案。
本轮1—99迁移原字节保持，新迁移只进入专用本地测试库。没有线上、provider、真实凭据迁移、
资金、手机、TestFlight、保留账号删除或FanPass变更。原深度扫描继续停止；不改原报告状态。

源码隔离并不意味着所有API／OS完全失陷风险消失。新的存储工具也不证明旧明文副本或备份已迁走。
精确合同见[剩余五组实施记录](security-remaining-five-20261011.md)。

## 唯一下一步

完成本轮增量证据封存、Git推送、CI与独立远端核验，随后保存最终交接；期间保持线上原状，不转回旧部署下一步。

[上轮已完成交接](handoff-history-20261011-before-remaining-five.md)为HISTORICAL。
