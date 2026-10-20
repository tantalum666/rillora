# 下一版本 HealthKit 接入准备

Status: PLAN PREPARED / APPLE CASE103002496561 SUBMITTED / NO HEALTH COLLECTION ENABLED
Last updated: 2026-10-20 (Asia/Shanghai)
Branch: `codex/healthkit-preparation-20261020`
Baseline: `5e4d6d6920e4d38b842f94f35832022057c1c2e8`

## Owner范围与审核隔离

Owner明确“开始吧，但是不要影响当前审核”，承接普通HealthKit读取、最小数据范围、用途说明和Apple用途咨询的前述计划。本次完成下一版本准备及独立的私密咨询，不扩展为真实健康数据采集、死亡判定或资料放行。

从最新main建立独立分支。基线静态检查未发现HealthKit／HKHealthStore／NSHealth权限或watchOS目标。记录iOS源码树以及project.yml、entitlements、Info.plist、Xcode项目和发布配置指纹；收尾再次比对。它证明本轮没有改这些文件，不冒称重新验证Apple已上传的签名二进制或当前审核状态。

本轮不变更App Store构建、版本选择、审核说明、隐私标签、开发者App ID能力、签名配置、TestFlight、生产API、真实共享、定价或收费。当前App Review进度案例继续独立保留；咨询明确只涉及未来更新。

## 先取得用途答复

[独立英文咨询](apple-healthkit-inquiry-20261020.md)如实说明Rillora数字遗产定位，并分别询问：

1. **A：可选安全确认提醒。** 健康数据在本机处理，只用于用户主动开启的提醒，不授予数字资料访问。
2. **B：关联条件披露。** 未来可能把健康信号触发的确认、未回应及其他条件用于执行本人预设的非健康资料访问；明确这不是死亡证明，并询问该用途是否受限，包括仅传送派生确认状态的情况。
3. **C：独立身后申请。** 由可核验死亡证据、接收人身份与指定范围决定访问，健康信号不构成放行条件；询问A能否与C共存及所需隔离。

不将B隐藏在“健康助手”文案后，不推断本机处理或个人同意可豁免用途限制。普通HealthKit capability并非特殊资格申请；本次不申请实时跌倒／车祸entitlement。若Apple要求另一个私密渠道，沿本案移交，不公开用户资料或重复发送多个工单。

## 最小数据与首个技术切片

以下为用途明确后可执行的首个只读验证范围，未在App中启用：

| 项目 | 准备决定 | 理由／边界 |
| --- | --- | --- |
| 数据类型 | 仅`HKQuantityTypeIdentifier.heartRate` | 不一次申请全部健康类型；步数和其他信号待明确需求再单独评估 |
| 写入 | `toShare`为空 | 不写入或修改用户健康记录 |
| 初始查询 | 用户手动操作、前台、最近24小时、最多200条样本 | 这是有界SDK验证窗口，不是日常基线或疾病判断阈值 |
| 读取字段 | bpm、测量起止时间、数据来源／设备信息、相关手动录入标记 | 只用于质量和来源判断；元数据不等于防伪身份凭据 |
| 初始保留 | 样本仅在本次进程内存，退出／关闭功能清除 | 不先创建长期健康数据库 |
| 网络与共享 | 不上传原始样本或健康风险分数；不进入日志、分析、广告、MCP、导出或亲友页面 | 不把既有共享许可当作健康数据许可 |
| 后台／Watch App | 首个切片均不启用 | 前台读取闭环成立后才研究必要性；采样与同步不承诺实时 |
| 无手表或不授权 | 现有Rillora功能继续可用 | 健康能力为独立可选项，不能成为注册／使用门槛 |

24小时／200条是Agent对技术验证的可逆范围选择；不是Owner批准的提醒时间、医学安全期或披露条件。持续异常识别和个人基线尚未实现。

## 授权与读取的工程合同

1. 先调用`HKHealthStore.isHealthDataAvailable()`检查设备能力。
2. 用户主动选择开启后，才请求心率的只读权限。未来代码按标准HealthKit capability和用途说明配置；本次不修改现有签名／权限文件。
3. 授权请求回调成功只能表示授权流程完成，不能向用户声称读取一定已获准。HealthKit不会可靠区分未获读取许可与无可用样本。
4. 页面分别表达“不支持”“尚未开始授权”“系统授权步骤已完成”“暂无可用记录”“有记录可读取”“读取暂时失败”；不以空数组显示“用户失联”或“权限已授予”。
5. 对支持局部历史授权的系统尊重其可读时间范围；实际API须按工程SDK／OS availability检查，不能把新版文档的方法无条件用于旧系统。
6. 样本先检查时间、单位、有限数值、来源与已知手动录入状态；0值、异常或未知来源不自动变成紧急事件。读取时间与测量时间分开记录，旧同步不能当作实时身体状态。
7. 不把同源断网造成的多项缺失当作独立证据。未佩戴、没电、换设备、撤权或设备锁定等原因可能无法从API准确区分，应保留未知状态。
8. 首个切片只验证授权／读取／关闭，不产生死亡分数、自动联系或披露任务。未定的24／48／72小时规则不写入生产默认值。

当前[条件披露候选](conditional-disclosure-vnext-20261019.md)保持独立。若Apple不允许B，不能把由健康数据触发的未回应改名后输入普通失联规则；后续实现范围须按实际用途答复修订。

## 双语用途说明草稿（仅对应A，未装入App）

`NSHealthShareUsageDescription`中文草稿：

> Rillora读取你选择的心率记录，用于你主动开启的个人安全确认提醒。记录仅在本机处理，不用于判断死亡或自动开放资料。

英文草稿：

> Rillora reads the heart-rate records you choose for optional personal safety check-in reminders. Records are processed on this device and do not determine death or unlock information.

这两段只在真实实现满足A且用途适配后使用；若未来行为改变，必须同步用途、隐私说明和权限，不能继续沿用较窄文案。Clinical Health Records、HealthKit Research、写入、位置或运动权限均不在本次范围。

## 后续验收与进入代码的条件

先确认Apple对A／B／C的适配意见，再确定首个实现范围。将来验证应覆盖：无设备能力、拒绝或撤销、部分历史授权、没有样本、锁屏读取失败、延迟同步、手动／第三方样本、重复／未来／无效样本、关闭功能后清理、两种语言的权限说明及无权限时原功能可用。

这些是后续验收计划，本轮没有运行HealthKit测试或重新请求Owner的真机操作。既有“当前真机不用验证”的决定不被本文件撤回；未来真正需要读取健康数据时，必须另有明确测试范围及用户在系统内的个人授权。

## 本轮官方依据

- [HealthKit能力](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit)：Xcode启用标准capability。
- [设置HealthKit](https://developer.apple.com/documentation/healthkit/setting-up-healthkit)：仅按实际用途选择能力；本轮不需要临床记录。
- [授权健康数据](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)：按类型授权、读取拒绝隐私和局部历史范围。
- [Apple当前开发者协议](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)：HealthKit／Motion实际用途限制，应用自己计算也不豁免。

官方资料只证明平台规则与接口形态。实际提交、Apple答复、capability配置、个人授权、设备读取、规则有效性、分发和资料交付必须分别证明。

## 本轮完成结果

Apple已通过独立开发技术邮件入口受理案例103002496561；现有登录复用成功，未要求Owner重新验证。当前仅有收件证明，尚无用途答复。[原始发送文本、截图与基线](../collaboration/verification/healthkit-prep-20261020/README.md)已保存；所有原生／发布配置指纹保持。本轮准备完成，后续按同一案例答复确定A／B／C允许范围，不重复申请或自动开始采集。
