# 下一版本：多类健康数据与手表端取舍

Status: HISTORICAL RESEARCH CHECKPOINT / FIRST-STAGE IMPLEMENTATION TRACKED SEPARATELY
Last updated: 2026-10-24 (Asia/Hong_Kong)

本文件保存当时讨论的依据与取舍。Owner随后已明确开始开发；六类读取、独立提醒与轻量Watch的当前实现／测试见[实施合同](health-checkin-watch-development-20261024.md)。下列“尚未实现”只描述研究检查点，不能再作为当前执行门。

Owner指出HealthKit不应只限心率，还应考虑其他健康数据，并询问是否开发watchOS。讨论时据源码和Apple官方资料明确范围，没有扩展实际授权、读取个人记录、创建Watch target或修改当前审核。之前心率24小时／200条只是首段技术验证，不是产品最终范围。这里的具体指标分批、提醒和手表端方案记录当时Agent建议，不伪称已获Apple用途批准。

## 读取范围

“只读”表示不写入用户的Apple健康记录，与读取多少种数据是两回事。多类读取仍可保持写入集合为空，按实际功能逐类请求权限；不能默认申请全部健康历史。[按类型授权](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)。

| 建议阶段 | 数据 | 本人可获得的价值与边界 |
| --- | --- | --- |
| 第一批 | 心率、静息心率 | 查看近期测量与日常摘要；不是持续心电监护或死亡判断 |
| 第一批 | 步数、步行／跑步距离 | 查看近期活动记录；区分手机／手表／手动来源，不能简单叠加重叠数据 |
| 第一批可选 | 睡眠记录 | 查看有记录的睡眠区间；没有睡眠记录不等于没有睡觉或发生危险 |
| 辅助项 | 锻炼记录 | 补充明确记录的活动背景；不要求为了使用Rillora开始Workout |
| 后续有具体用途再加入 | 呼吸频率、心率变异性 | 提供本人能理解的趋势；暂不设医学异常阈值或加权死亡评分 |
| 暂不纳入首批 | 血氧、心电图、体温、临床病历等 | 先证明对当前功能的实际增量，不因API可读就收集更多敏感信息 |

类型存在由Apple的[数量类型目录](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier)、[睡眠类型](https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/sleepanalysis)及[数据架构](https://developer.apple.com/documentation/healthkit/about-the-healthkit-framework)支持。表中顺序和价值判断是项目建议；实际记录受设备、来源、用户授权和可用历史影响，不能承诺人人都有。

每类数据先表达测量时间、读取时间、来源、覆盖范围、重复／手动样本及未知状态。多个类型同来自一只Watch时，同步失败会同时影响它们；这是工程上的共同原因，不能计作若干独立异常证据。有限历史授权、空数据和拒绝读取也不能被错误解释为身体状态。

具体个人基线窗口、最小覆盖量、时区／旅行处理、睡眠区间合并和多设备活动去重须进入实现合同与合成测试。现在不凭讨论设置24／48／72小时提醒或披露默认值，也不把简单步数、心率展示包装成已证明有效的风险判断。

## watchOS的必要性

读取已同步的Apple Watch健康记录不要求先做Watch App。各设备各有HealthKit存储，系统负责同步，iPhone可查询其获授权且已同步的数据。[Apple架构说明](https://developer.apple.com/documentation/healthkit/about-the-healthkit-framework)。

普通iOS通知也可由系统转发到配对手表，即使没有watchOS App；实际去向取决于设备状态和通知设置。[Watch通知](https://developer.apple.com/documentation/watchos-apps/notifications)、[转发规则](https://developer.apple.com/documentation/watchos-apps/taking-advantage-of-notification-forwarding)。因此第一轮提醒闭环可以先在iPhone建立，不必把Watch开发当作前置依赖。

推荐之后提供轻量手表配套，围绕短操作：主动报平安、回应已有提醒、查看上次确认和待同步／已送达状态、暂停或恢复本人提醒。表盘入口／小组件有价值，完整办理包编辑与文件库继续由iPhone／Web承担。回应只是本人操作记录，不能显示成平台验证的健康证明；离线时不能伪称已送达。Apple也建议手表端聚焦简短操作。[watchOS体验](https://developer.apple.com/documentation/watchos-apps)。

Watch App需要自己的目标、能力／用途说明、权限体验、退出清理及通知／同步测试。它可在手表本地运行交互和读取当地可用记录，但不会带来全天无限后台或服务器实时数据流。后台投递有频率和预算限制；现有文档还要求后台查询用设备验证，模拟器不能替代。[后台投递](https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:))。

实时跌倒是另一项可选范围：Core Motion的事件路径需要Apple特殊entitlement，不能由普通多类HealthKit读取推导获批；历史跌倒记录又有不同的时效。[Fall Detection说明](https://developer.apple.com/documentation/coremotion/cmfalldetectionmanager)。本轮不申请、不启用，也不使用隐藏的持续Workout换取后台能力。

## 用途与交付顺序

Apple当前开发者协议要求HealthKit及其信息实际用于健康、运动或健身，并清楚体现在界面和说明中。给本人提供真实有用的健康记录查看／关怀流程是拟议方向，不能只换名称掩盖遗产解锁用途；这仍需要在真实实现提交时接受审核。Apple不提供概念预审，不等于已批准所有用途。[当前协议H节](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)、[审核5.1.3](https://developer.apple.com/app-store/review/guidelines/#health-and-health-research)。

既有个人健康数据本机处理边界保持：不进入普通内容、营销、MCP、日志或遗产披露决策。健康权限、本人报平安、死亡事实和家人内容权限保持独立。

建议顺序是多类iPhone读取和可解释的数据状态 → 独立提醒／本人回应闭环 → 轻量watchOS配套。当前代码仍只有前台心率切片；提醒、个人基线、其他指标、Watch App和真实健康验证均未完成。本轮是文档与官方资料复核，不重跑应用测试，不部署、不发TestFlight、不升级系统、不改变当前审核、真实数据、定价或收费。云端CI继续停用。
