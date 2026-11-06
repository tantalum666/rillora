# Rillora 第31—35组安全边界修复

Status: OCTOBER11 SOURCE CHECKPOINT PRESERVED / OCTOBER12 DEPLOYMENT RECORDED SEPARATELY
Last updated: 2026-11-06 (evidence-link correction only; original test/deployment dates retained)

后续状态（2026-10-12）：Owner已授权并完成[实际安全切换](security-rollout-20261012.md)，含两库103、隔离运行时／worker／日志broker及9份具名本机凭据迁移。以下保留October11源码阶段的原日期、测试分母和当时未部署边界，不再作为线上冻结指令；当前唯一下一步见handoff。

Owner明确要求继续修复剩余五组，先完成代码和测试，再一起推GitHub，线上保持原状。
起点为b6f5b8c97，沿用[原报告映射](security-findings-remediation-20261011.md)的findingId和原始出处；
本文件取代这些组仅做分类的当前实施状态。原扫描不重启、不改写。

## 共同约束

保留现有UI／客户端接口、价格、真实数据与订阅、历史财务／法律记录、已有邀请和恢复合同。
1—99迁移不改字节，后续迁移只有本地测试。没有新部署、真实凭据读取／迁移／轮换、删除、购买、
手机或TestFlight操作。Git源保存与云端启用是不同结果。

## 实施边界

| 组 | 被关闭的具体路径 | 合法兼容及不扩大的声明 |
| --- | --- | --- |
| 31 | 仅有数据库密码／SET ROLE／自设主人GUC不能取得事务授权；证明绑定数据库、登录、连接、事务、角色、主人和到期时间；未启用RLS的列级授权表也受保护；8个definer不再继承迁移管理员权限 | 应用签发器仍受信任；不是抵抗完整API进程控制的承诺。既有主人、接收人投影、Auth0及支付执行保持。管理员／隔离恢复明确按真实session_user识别，不能由普通SET ROLE伪装 |
| 32 | API无直接Dynamo写权限；数据库只能为本事务实际捕获的控制记录生成envelope，独立broker验证后返回绑定回执；SQL无回执不能标记已发布 | 保持提交前发布、暂时失败回滚、单调revision、保守回放及独立coverage；任意API JSON转发不构成凭据 |
| 33 | HTTP不持有Auth0删除密钥、不领取／完成删除任务；独立任务仅处理数据库中的lease，另行验证密封的近期Auth0签名身份与任务主体 | 保持设备预生成receipt、202状态、撤销、退避、204／404重试和财务保留。旧会话缺证明时在改变账号前走已有重新认证；受控API当前已见到的合法会话仍是独立信任边界 |
| 34 | 裸SHA邮箱摘要改为带密钥、按owner分区的HMAC；session不保存全局摘要；不保留普通运行时旧SHA匹配后门 | 用旧32字节摘要作转换输入，无需恢复邮箱或重发全部邀请；同owner重复检测保持。掩码提示、实际已接受的关系及旧备份不冒称被匿名化 |
| 35 | 已列明的Auth0／Apple运维工具只保留设备绑定的Secure Enclave密文封套，解封需用户在场；上传通过独立匿名管道，避免秘密进入命令参数或临时JSON文件 | 提供显式迁移／核验工具，失败保持原件，无明文回退。此轮不迁移真实凭据；不能证明旧副本／备份被擦除，也不声称抵抗用户批准使用期间的整个OS失陷 |

## 验证要求

- 使用真正的NOSUPERUSER/NOBYPASSRLS runtime LOGIN，验证租户／角色／连接／事务篡改、身份伪造和明文授权密钥不可读取；同时运行正常HTTP创建／读取。
- 直接重现无外写伪造mark、NULL／假回执、后续事务或载荷变化；独立broker验证签名、coverage、幂等、旧revision和冲突。
- 独立删除证明验证主体、issuer、client、Auth0签名、auth_time、请求时间、session绑定；API不能claim/finish或获取worker凭据。
- 从旧schema和旧邮箱摘要升级，证明pending邀请、accepted状态、重复检测、幂等、错误密钥拒绝及session摘要清除。
- 凭据工具用纯合成存储替身检验取消／失败不回退、不回显、失败导入保留原件、引用幂等及匿名管道；macOS助手编译、真实硬件拒绝无人值守解封与将来本人确认后的真实凭据迁移分别记录。
- 先类型／语法，再新攻击负例和合法控制，再相关整包回归；完成后一次新只读候选复核。旧通过证据不当作本轮重跑。

## 官方依据

PostgreSQL的[行级安全规则](https://www.postgresql.org/docs/16/ddl-rowsecurity.html)要求同时考虑
superuser/BYPASSRLS、owner及restrictive策略；使用其[pgcrypto HMAC](https://www.postgresql.org/docs/16/pgcrypto.html)
进行受保护的验证。身份证明按[AWS KMS encryption context](https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html)
绑定用途和会话；本机存储使用[Apple Secure Enclave](https://developer.apple.com/documentation/Security/protecting-keys-with-the-secure-enclave)
及[CryptoKit P-256 KeyAgreement](https://developer.apple.com/documentation/cryptokit/secureenclave/p256/keyagreement/privatekey)。
这些资料支持技术选择，不是本产品已部署或独立认证的证明。

## 实现与兼容处理

- 新增0100—0103，已有1—99迁移逐字节保留。0100校验实际登录与角色属性、全表强制RLS及事务授权；8个管理员所有的definer转为专用最小权限服务。运行时秘密无法由SQL角色读取。
- 0102将实际捕获的控制记录、generation、revision和原样事件文本绑定到envelope和回执。HTTP／删除工作器只能调用独立日志broker；日志签名密钥不在这两个进程中。低权限SQL调用旧unsigned mark、NULL／伪造回执或重放不同事务均失败。管理员迁移／隔离恢复另有明确授权，不冒充普通运行时。
- 0103把领取／完成删除任务交给独立数据库登录和无HTTP监听的工作器。工作器解封后重新验证Auth0签名、issuer、client、subject、auth_time及原请求时间；延迟重试按原请求时刻验证，不能把已过期的历史身份重新当作新同意。API只能加密证明，不能解密或获取删除密钥。
- 密封ID token是新增的短期身份数据：绑定会话与KMS用途，默认近期窗口10分钟，失效／撤销后由有界清理器清除；任务复制其必要证明直到成功完成。访问／刷新token仍不持久化。旧会话缺证明时先进入已有重新认证，尚未改变账号。存在未完成旧身份删除任务时迁移整批拒绝，须先按旧流程完成或人工核对，不能造出证明／成功状态。
- 0101及`migrate-email-matches.ts`用现存32字节摘要与owner范围生成HMAC，清除session全局摘要，不需要恢复原邮箱。错误密钥、缺少回填或重复混用拒绝启动／写入；升级只改摘要表示，不重新套用新购名额而破坏历史记录。公开预览仍仅限有效pending；同一已绑定接收人的接受重试与过期错误语义保持。
- macOS原型最初考虑Data Protection Keychain，核对裸CLI的配置限制后改用CryptoKit设备密钥封套；没有为此创建App ID、签名配置或线上权限。正常调用要求已有Rillora团队签名助手；固定非秘密硬件测试不允许传入真实秘密或禁用真实读取的用户在场要求。[凭据工具操作合同](../tools/security/README.md)。

## 独立复核与最终检查

本次单独完成一次只读边界调查和一次新的候选复核。调查纠正第32组先前的“完整API RCE才可自证”分类：旧SQL自身已能伪造发布完成。原报告不改写。
候选复核在SHA256 `a96760fa4d9f33c48fede4ae8adfdf23ede78bffd942e81f81a94d6fb689fbb7`上发现两处真实回归，父代理核对后修复：

1. CLI仍发送旧迁移命令。现用同一`production-migration.json`驱动CLI、维护broker和CDK；回归直接把Python主程序生成的请求送入真实Node broker。旧未决调用仍按原请求精确核对，不能静默换命令重试。
2. 恢复停写检查只检查API，遗漏新删除工作器。现在受信任stack输出、broker配置和DescribeServices权限包含所有源写入服务；任一服务desired/running/pending非零或缺失清单均拒绝。工具不会自行停服务。

| 本轮检查 | 结果／证据边界 |
| --- | --- |
| API全量 | 58文件、519/519通过、0跳过；typecheck/build通过。复核后的工具/IaC改动不改API，沿用该全量并重新完成API类型／构建 |
| 基础设施 | 8文件、58/58通过及类型检查；包括HTTP权限移除、独立worker权限、完整停写清单，未部署AWS |
| 发布工具／维护broker | 73项Python、7项Node通过；含真实调用链与未决重试、worker单独活动负例 |
| 凭据工具／Auth0工具／日志broker | 分别7、7、4项通过；均为本地合成输入，不调用真实provider |
| macOS助手 | 当前源码编译成功；真实Secure Enclave控制往返、拒绝无人值守解封、篡改拒绝、账户绑定拒绝全通过。未安装正式签名助手，未进行本人确认后的真实秘密读取 |
| Web／iOS | 本轮未改客户端，保留上轮Web191及iOS287通过／1既有跳过，不写成重跑或新真机验证 |

API最初全量失败、历史邀请兼容修正、旧Keychain原型和前两次测试库重置保护拒绝均保留过程证据。
最终只重建核验过的25个loopback专用合成测试库，真实数据未触及。
已有秘密登记仅3处同字节行号移动；没有批准新秘密、扩大例外或关规则。发布脱敏器的旧明文收集保护曾被自动审批拒绝删除，现已原字节保留；新封套不会被批量解封。

## 以后启用的必要顺序（本轮没有执行）

1. 完成受控维护窗口的切换计划，核对所有源写入服务和未决删除任务。不能让旧运行时继续写入已升级的权限／摘要schema。
2. 按环境独立初始化数据库授权、邮箱匹配、日志认证秘密及身份密封KMS，部署受限broker与独立worker的基础资源；先保持服务停止和原review／closed边界。
3. 用固定维护路径执行迁移、运行时引导、内容校验、邮箱回填，核对旧1—99及新迁移校验和、日志coverage和generation。未决旧删除任务必须先核对完成。
4. 启动匹配API和独立worker，验证真实IAM／DB／Auth0／KMS拒绝路径、合法邀请和删除队列，再恢复源服务。已改变安全schema不能只回滚旧应用镜像。
5. 本机凭据另行安装签名助手、本人确认非秘密probe后，逐个受支持文件计划／迁移／读回；不擅自清除备份、轮换provider或迁移归档身份。

结果是这五组具体路径的源码修复与本地验证，不是线上隔离生效、全进程失陷防御、旧副本擦除或新的全面审计结论。
Git与证据保存状态见[当前交接](handoff.md)和[保留的当次QA记录](../collaboration/verification/security-remaining-five-20261011/README.md)。

## Git交付完成

全部源码、测试和新增证据已推送至私有分支
[`codex/security-findings-20261011`](https://github.com/tantalum666/rillora/tree/codex/security-findings-20261011)，
实施提交[`74a9c66ac50cb8f5f68afe7c3d673c9d2f742897`](https://github.com/tantalum666/rillora/commit/74a9c66ac50cb8f5f68afe7c3d673c9d2f742897)。
[CI125](https://github.com/tantalum666/rillora/actions/runs/38146452345)三个任务全部成功；CI另运行Web检查，
不冒称本机或iOS新增验收。归档32从独立空缓存重新下载，232原件／249路径全部匹配该不可变提交的
远端清单。[新增保存包及回执](../collaboration/verification/security-remaining-five-20261011/README.md)。
最终回执提交只更新文档／元数据，原件不重封、旧档案不重下；线上与真实凭据仍保持原状。
