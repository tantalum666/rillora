# Rillora 安全修复切换 — 2026-10-11/12

Status: PREPARING / NO SERVICE STOP OR DEPLOYMENT YET
Last updated: 2026-10-12 (Asia/Hong_Kong)

Owner要求开始部署整批安全修复，按已记录顺序切换，保持现有数据、定价和收费开关不变，先不发TestFlight；并再次明确本项目默认最高授权，不重复询问已授权操作。
这取代前一交接中的线上冻结任务边界。源码入口仍为已附加工作树`codex/security-findings-20261011`，
基线3a9f6a289，实施74a9c66ac／CI125及前30组修复一并纳入。

## 已核对与范围

- 初次云端只读基线：production API21、Preview API43，同镜像d0754266…，两个服务均1/1、COMPLETED；五个相关栈均UPDATE_COMPLETE。正式Stripe／Apple收费关闭、正式通知开启，审核模式保持；Preview原TEST模式保持。
- 当前代码、519项API／58项infra及CI125不重复全量审查；只补部署兼容、实际资源、权限、数据与端点证据。
- AWS与Auth0会话均出现实际过期，按原账户恢复。跨夜后AWS再度过期，已复用浏览器会话刷新，无新增权限；Auth0续期请求与原保存scope相同。认证结果以CLI/API读回为准。
- 已安装锁定构建依赖并启动已有Colima实例；未清理其他容器、镜像或FanPass。尚未执行停服务、数据库迁移、CFN部署、实际删除或交易。

## 切换次序

1. 保存当前模板、参数、镜像、所有源写入服务与收费开关；完成旧删除任务、现有迁移摘要和数据指纹预检查。所有准备完成前保持服务运行。
2. 准备精确构建／变更集、受限维护与日志broker、独立worker及独立环境密钥。保留现有数据库、内容KMS、付款配置、NoEcho参数和旧手机仍需的回调。
3. 先在Preview按维护窗口停写，保存一致基线／备份，执行95—103及引导、内容校验、邮箱回填；读回数据和权限，再恢复原desiredCount。生产采用同样的分步门，不在两个环境同时开始不可回退的schema切换。
4. 新API／Web／Auth0 Action／HTTPS关联分别核验。旧原生回调须采用有界兼容切换，不能在新客户端尚未交付时直接退役旧入口；当前不上传或分发TestFlight。
5. 核验新旧字段转换之外的原有内容、账务、权益、价格与开关保持；核对新权限隔离、日志回执、删除队列与健康。原像不能直接回滚到已改变权限／邮箱摘要的schema。
6. 本机凭据工具安装与具名迁移单独记录本人在场门；不能把云端部署当作旧明文和备份已擦除。旧归档身份不迁移，不制造真实购买／退款。

## 当前下一门

准备已完成：broker8、Auth0工具8、发布工具73及infra59／类型通过，源扫描32匹配／0未知。固定探针拆成数据和权限两份，分别小于ECS overrides8192限制；任意改字节均拒绝。Preview运维补自身stack输出读取，两环境补新worker状态／日志读取，均不增加秘密读取或任意RunTask权限。

实际两库均为schema94且摘要与源码匹配，旧9类服务角色属性安全、未决身份删除0、内容加密强制开启；每库68表指纹已保护保存。初次权限查询失败发生在任务创建前，随后改用已有部署读取角色；未把权限403误报成登录过期。两个只读任务均退出0。

已生成并冻结Preview和production的停写／恢复模板，分别81→99及79→101资源；没有旧资源删除，原RDS、内容KMS、既有Secret、VPC／子网及journal字节不变，原收费／审核参数保留。Preview停写模板暂保留原Web及router，恢复时再更新匹配前端。当前没有开售／商店提交或云端切换成功的声明。

下一门是提交兼容补丁并取得CI，再顺序执行Preview受控停写、冻结基线／备份、迁移、核验和恢复，随后处理production。
原始配置、认证及私密基线仅放`.local-secrets/security-rollout-20261011`；脱敏QA放`output/qa/rillora-security-rollout-20261011`。

独立worker没有TaskDefinition容器健康检查，后续记录其实际RUNNING、数据库连接／任务与日志结果，不把UNKNOWN写成HEALTHY；Docker镜像的检查不会自动成为ECS检查。[AWS定义](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html)。
