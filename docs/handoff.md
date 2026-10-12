# Rillora 当前交接

Status: SECURITY DEPLOYMENT AND NATIVE ACCEPTANCE VERIFIED / GIT EVIDENCE CLOSEOUT IN PROGRESS / NO TESTFLIGHT
Last updated: 2026-10-12 (Asia/Hong_Kong)

## 当前任务

按Owner授权部署整批安全修复，保持真实数据、定价和收费开关，先不发TestFlight。云端／原生／本机指定凭据已完成，当前只收尾本次证据的Git保存。活动工作树仍为`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`，分支`codex/security-findings-20261011`。
主项目目录已从647317834快速前进到042f4e100，同一历史保留；旧交接以具名stash及QA副本保存。不要再使用“主检出仍是旧工程”的历史指令。

## 已完成

- 云端源码bfe9baaf5／CI126：Preview与production先停写、冻结数据和可用加密备份，再各执行一次95—103及引导／回填；103迁移摘要全部匹配，除声明的表示变更外，每库68表原业务字段指纹一致，未决删除0。数据库越权、无签名租户、篡改主人及伪造日志回执被拒绝，合法签名主人读取通过。
- 五个栈全部UPDATE_COMPLETE并匹配候选：Staging、Production、ProductionWeb、PublicWeb、Operations。Preview API44／production API22及独立worker均1/1稳定；API HEALTHY、worker RUNNING／UNKNOWN，日志无启动／重试错误。四个原运行任务实测同一镜像digest75fa633d…fc734。
- 三套Web共203文件逐个匹配，应用／Preview邀请AASA与Auth0关联端点通过；固定维护broker与IAM实际拒绝人类直接RunTask、未审阅命令及错误备份能力凭据。
- 原iPhone已原位安装并读回1.0(14)，13项签名／同Keychain／生产连接／精确设备／双语检查通过。初次启动因锁屏受阻；Owner解锁后进程启动成功。随后“服务未开放”确认为旧审核期已过，不是安装或数据丢失。
- 为本次验收仅将原3个身份续期48小时，到香港2026-10-14 20:01；API23与Auth0期限一致，镜像、其余环境／秘密和全部收费开关不变。Owner已重新进入首页并确认原事项仍在；Auth0记录成功登录及授权码交换。新客户端交付后，两个原生客户端都已移除旧私有协议回调，仅保留HTTPS。生产有本次真实原生结果；Preview未虚构另一场真实登录。
- 本机助手实际安装发现并修复codesign表达式格式与AWS CLI重复读取整包JSON管道两处问题。上传现在限于具名Secret字段的独立匿名管道，拒绝原始CR和调试／覆盖参数；9项（含真实CLI到本地回环）、8项Auth0工具及源扫描32匹配／0未知通过。042f4e100已推送，[CI127](https://github.com/tantalum666/rillora/actions/runs/38245830482)三任务成功。
- 正式签名助手在两个本机检出安装并验证；本人非秘密硬件验证通过，主目录9份指定Auth0／Apple文件均已加密并逐份本人验证读回一致。无provider密钥轮换、无归档身份迁移，不声称旧副本／备份擦除。
- 当前实际执行环境为Full Access／approval never；没有再发起终端提权。先前会话权限不一致已经解除。

## 边界与保留项

普通客户与正式收费仍关闭；未发起购买／退款、未删除保留账号、未更改FanPass、未发TestFlight、未重启深度扫描。保留此前付款／退款及旧归档的准确日期，不冒充本次重跑。

GitHub现有私有仓库页面明确显示经典保护和规则集均不强制执行，当前也未配置；这是实际平台限制。没有购买套餐、迁移组织、创建虚假有效规则或新增token权限。CI通过和本次部署检查不等于GitHub服务器已强制保护。

源码和部署只关闭列明路径，不承诺抵抗完整API／OS失陷。当前真实手机结果是登录与原事项读取，不新增付款／退款／删除通过结论。详见[切换与证据合同](security-rollout-20261012.md)。

## 唯一下一步

archive33已封存665路径／536对象，本地解密与可读资料扫描通过。现在只完成Git推送／CI及独立远端下载解密核验；不重复任何迁移、部署、本人认证或购买。当前源码最新042f4e100／CI127，当前QA和文档尚待本次增量Git闭环。

[前一进行中交接](handoff-history-20261012-before-security-closeout.md)及[部署前交接](handoff-history-20261012-before-security-rollout.md)均为HISTORICAL。
