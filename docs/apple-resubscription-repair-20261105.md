# Apple 到期后再次订阅的归属修复

Status: DEPLOYED TO PREVIEW AND PRODUCTION / SAME ORDER RECONCILED / OWNER CONFIRMS SUBSCRIBED
Last updated: 2026-11-05 (Asia/Hong_Kong)

## 实际问题与证据

Owner在已原位安装的1.0(18)购买后仍见Free，恢复返回“Your purchase is saved by Apple. Restore purchases to finish checking your access”。这不是已证实的显示延迟。香港20:51的新HKD888订单已started／pending，随后两次请求返回409；原资格到December4仍有效，业务目录指纹一致。

既有受限只读诊断进一步确认：Apple签名有效，交易token匹配新意图，商品／币种／金额／地区匹配，原订阅编号已存在且属于同一商务账号。旧0096函数遇到已存在原订阅编号时，只接受此前已绑定的token，提前返回，没让同账号的新started意图走后续精确验证。因此合法的再次购买被当作未绑定拒绝。客户端把这个失败显示为通用恢复提示；普通刷新不会解决服务器拒绝。

## 修复及保留的保护

新增0109迁移，只替换原归属解析函数；0001–0108不改。已知token恢复路径保持；未知新token必须有完整的server-issued、已start的意图，并且planner与原商务账号都匹配。原商品、价格、币种、storefront、环境、同意和时间窗口检查仍执行；新token不能转移原订阅给另一个账号，未准备／未start或错误金融事实仍拒绝。

新增的诊断只输出布尔匹配事实与时间，仍限定已登记审核账号和最多500条，不返回token、原始JWS、身份或用户内容，也没有新增公开API。正常API和worker镜像没有改变；维护镜像仅叠加此诊断模块与0109SQL，其余109份迁移字节与源码匹配。

## 本机、部署与失败保留

- 真实隔离PostgreSQL16.14／55435复现先失败409；修复后67项Apple生产／Sandbox／preflight／配置集成通过，包含到期后重购、跨账号、错误金额／币种／环境／旧收据／未开始意图，以及原恢复和退款分支。类型检查与build通过。只让这些既有测试使用已支持的PGPORT，不修改原5432数据库或迁移校验和。
- CREATE OR REPLACE保留函数owner continuity_commerce_resolver、SECURITY DEFINER、空search_path和非public执行权限；本机元数据独立读回通过。
- 两维护任务定义先更新并读回，唯一直接变化为镜像；Lambda／IAM只是相同模板的任务ARN引用，物理身份保持，普通API／worker和全部参数不变。生产先运行增强只读诊断，没有提前迁移生产。
- 数据库按Preview109成功→Preview五项权限探针通过→正式109成功→正式六项权限探针通过执行。签名租户、篡改owner拒绝、SQL不能读签名材料／确认日志及伪造恢复日志拒绝保持。两API readiness返回200。
- 生产加密、私网、删除保护和7天PITR保持；Preview原配置是1天PITR，同样加密／私网／删除保护。未把Preview误写成7天，也未为这次函数替换降低或扩展备份设置。
- 保留错误：一次本机工作目录错误导致未生成迁移的复测仍红；旧Docker不支持provenance参数，在构建前拒绝，使用现有legacy builder；staging容器名与prod不同的守卫在执行前拒绝；采集器把数组传给dict保存函数出错，改正后只重读已经STOPPED成功的原任务，没有重复迁移。部署角色不具备RDS读取权限时改用既有受限operator，未扩权；staging数据库按真实CloudFormation物理ID读取。

## 实际闭环

正式修复后Owner对同一购买做一次恢复并回复“现在显示已订阅了”。随后独立后台读回同一20:51订单：completed／paid_reconciled，HKD888，Apple收据888000毫单位，订阅active，事件applied、签名true、错误为空，业务目录指纹仍8c6853dd507de8e0673beba4c8ee466fb3c3a1568a47f9e1e2b1baa65bdb2530。最后读到的Sandbox续订发生在香港21:52:01，本期到22:52:01；这是测试加速周期，不是正式年费只有一小时。

没有人工改成Family、取消重建订单、移动跨账号归属、清历史或要求重新买一次。旧17首购／恢复／自然到期证据保留，本轮额外验证的是18与修复后服务器的真实再次订阅及恢复。当前仍不上传App Store、不发TestFlight、不重新提审；其他未验证金融情形不冒称通过。

## 保存和后续

[安全回执](../collaboration/verification/apple-resubscription-20261105/README.md)分开保存本机、维护镜像、数据库迁移、权限、实际订单和Owner反馈。原始设备／认证／云端账户／维护能力和本机数据库只留私密目录；普通可读清单和新原件归档追加，不重封旧档。云端CI与子代理未使用。

Owner随后要求延长Rillora App／Web用户登录并保留网络等安全条件；已明确不是AWS等管理后台会话。该新任务已在November6按[独立会话合同](longer-user-sessions-20261106.md)部署并回读；不将109付款修复与110会话部署混为同一次验证。
