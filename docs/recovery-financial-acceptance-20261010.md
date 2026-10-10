# October10 最终安全与恢复后计费验收

Status: RELEASE ITEM3 VERIFIED / SOURCE RESUMED / EXACT TEMPORARY RESOURCES REMOVED
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

此配置修复580f7e1b3/CI119已通过并部署，实际仅2资源改变、79资源保持，正式API/镜像/网络不变。隔离库的只读预检查已确认TLS、generation及原Stripe凭据读取；3账号/2事项、14条journal，其中1条Apple Sandbox订阅标记与恢复库检查点完全相同。

这进一步复现了旧对账标记导致跳过provider重查的缺陷；另一个真实受限角色试验发现先JOIN plans却未建立owner上下文，强制RLS会隐藏计划。三个新增红例失败后修复：先在隔离管理员范围解析主人，再设置事务级owner上下文；只复用本次冻结后、五分钟内且未超前、与当前订阅一致的专用恢复核验记录，普通备份检查点不算核验。相关22项通过，包含真实受限非superuser/non-bypass-RLS账号及过期/未来记录拒绝；云端运行新恢复代码仍待最终镜像更新。

三笔原Stripe TEST订单已用现有受限测试密钥重新只读核对，并完成真实本地pg_dump/pg_restore：以先前已付Checkout重建隔离基线，恢复出的每笔2条有效权益，在读取当前真实provider状态后都变为0；结果分别为已结束/已退款/已退款。每笔错账户、过期、provider不可用共3个故障注入拒绝，重复对账不新增读取/权益，原合成事项不变，API读取明确记录signature_verified=false。此为真实provider支撑的本地数据库恢复，不冒称原始云端Stripe库快照，未制造新交易或修改Stripe状态。

c6125d988/CI120的恢复镜像已部署到维护/恢复任务，未更新正式API。实际云端冻结源服务后，恢复命令读取1个真实Apple Sandbox当前状态，完成隐私/财务/最终控制重放；源服务随后恢复为原API21、原镜像、1/1 HEALTHY。恢复库仍有3账号/2事项，合法Apple家庭版权益仍有效、2条权益记录，新增1条已验签并应用的恢复观察。恢复角色对源库连接、KMS GenerateDataKey及journal PutItem三个负向检查均实际拒绝。没有推广恢复库或修改支付平台。

最后的缺失覆盖检查新增红例9过/1失败，证明外部inventory完全缺失时旧函数会错误返回“无需对账”。新增只读coverage检查要求每个恢复出的计费账号有独立恢复记录，缺失则保持隔离；相关23项通过。cb6fd6133/CI121通过并更新维护/恢复镜像，实际恢复库上的有效inventory、缺失inventory、错误generation三个只读正/负验证均通过，没有第二次暂停源服务。

## 完成结果与回滚底线

本轮4处恢复缺口均修复。完整云端财务重放证据属于c6125d988；最后cb6fd6133仅增加更严格的只读覆盖前置条件，并已在同一真实恢复库核对该条件。两者不能被描述成同一次完整命令运行。

源服务已精确恢复原模板/API21，1/1 HEALTHY，实际/health/live与/health/ready均200。临时恢复实例及对应手动快照已分别读回absent；原生产库available、private、encrypted、deletion-protected，7天备份保留。资源driver的acceptancePassed=false是其不代替数据验收的设计，独立验收见本轮acceptance-summary.json。

兼容回滚底线：普通API不得退回f7592a3之前的退款逻辑；维护/恢复任务不得退回cb6fd6133之前的恢复逻辑；数据schema94和当前加密/控制日志格式保持。回滚不能把旧克隆直接接给用户，不能把旧备份检查点当作新金融核验。只恢复当前访问真相；缺失身份/目录及完整历史账务仍需明确恢复步骤，不承诺自动无损故障切换。

第3项对当前源码、运行产物、恢复和权限的验收完成。后续商店最终包属于第4项，普通客户开关/身份切换属于第5项；其新变更需各自验证，不把未生成的未来产物算作本次已通过。Owner保留的具体账号删除验收、现有订阅与外部邀请决定不变。

## 操作与保留边界

AWS旧CLI会话实际过期后，通过原浏览器会话恢复成功，没有要求Owner重复认证。已经按既有guarded driver登记唯一恢复run并创建标记的临时快照；只向对应rillora-recovery目标恢复，不覆盖原库。

实际生产commerce恢复命令要求源API短暂静止及新鲜证明；只有隔离目标可用、全部准备完成后才进行该可逆步骤，并恢复同一源服务的原desiredCount/镜像。源数据、价格和平台订阅均不更改。结束后只清理本轮标记的恢复实例/快照，原库及保留中的独立删除验收账号不在删除范围。

QA位于output/qa/rillora-recovery-financial-20261010，原始快照/任务请求、精确provider映射及认证日志仅在.local-secrets/recovery-financial-20261010。尚未完成不得把release-security或backup-retention总门直接勾过；最终收尾需独立结果、当前交接/旅程和全量Git增量保存。
