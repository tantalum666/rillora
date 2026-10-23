# 下一版本 HealthKit 接入准备

Status: NEXT-VERSION APP INTEGRATED / PERSONAL HEALTH ACCESS NOT TESTED
Last updated: 2026-10-23 (Asia/Hong_Kong)
Preparation branch and baseline (historical): `codex/healthkit-preparation-20261020`, `5e4d6d6920e4d38b842f94f35832022057c1c2e8`

## 2026-10-23 组合原生开发检查点

Owner要求继续接好下一版HealthKit与三项内容功能，先开发测试、不发TestFlight。[原生开发合同](ios-content-development-20261023.md)记录组合工程、现有依赖pin保留及中文／英文入口验收。健康模块没有新增网络、文件、内容模块或披露调用，原六项合成模型测试沿用October22结果；真实个人系统授权／采样没有发生。当前审核主工程、用途说明和entitlements保持原样，仅下一版工程有对应能力。后续不再把“等待审核结束才开发”当作活动门，但设备验收和分发仍分别处理。

## 2026-10-22 当前执行门

已实际读取Apple回信：不提供概念预批准，未对A／B／C作出适配结论。Owner明确不再等预审，继续读取Apple Watch同步的健康数据。现在进入以下最小心率只读切片的下一版源码与合成测试；旧文中的“先等用途答复才实现”被本节取代。当前审核、已上传构建及门户签名能力保持，下一版代码不因此自动分发或取得审核批准。

首个切片只提供本人主动读取和查看数据质量，不先承诺后台持续监测或已实现安全提醒；健康数据与普通亲友办理／披露逻辑无调用路径。个人健康记录未实际采集。

## October20准备范围（HISTORICAL）

Owner明确“开始吧，但是不要影响当前审核”，承接普通HealthKit读取、最小数据范围、用途说明和Apple用途咨询的前述计划。本次完成下一版本准备及独立的私密咨询，不扩展为真实健康数据采集、死亡判定或资料放行。

从最新main建立独立分支。基线静态检查未发现HealthKit／HKHealthStore／NSHealth权限或watchOS目标。记录iOS源码树以及project.yml、entitlements、Info.plist、Xcode项目和发布配置指纹；收尾再次比对。它证明本轮没有改这些文件，不冒称重新验证Apple已上传的签名二进制或当前审核状态。

本轮不变更App Store构建、版本选择、审核说明、隐私标签、开发者App ID能力、签名配置、TestFlight、生产API、真实共享、定价或收费。当前App Review进度案例继续独立保留；咨询明确只涉及未来更新。

## October20咨询背景（HISTORICAL）

[独立英文咨询](apple-healthkit-inquiry-20261020.md)如实说明Rillora数字遗产定位，并分别询问：

1. **A：可选安全确认提醒。** 健康数据在本机处理，只用于用户主动开启的提醒，不授予数字资料访问。
2. **B：关联条件披露。** 未来可能把健康信号触发的确认、未回应及其他条件用于执行本人预设的非健康资料访问；明确这不是死亡证明，并询问该用途是否受限，包括仅传送派生确认状态的情况。
3. **C：独立身后申请。** 由可核验死亡证据、接收人身份与指定范围决定访问，健康信号不构成放行条件；询问A能否与C共存及所需隔离。

不将B隐藏在“健康助手”文案后，不推断本机处理或个人同意可豁免用途限制。普通HealthKit capability并非特殊资格申请；本次不申请实时跌倒／车祸entitlement。若Apple要求另一个私密渠道，沿本案移交，不公开用户资料或重复发送多个工单。

## 最小数据与首个技术切片

以下为Owner已授权进入下一版本实现的首个只读验证范围；当前在审App未启用：

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

## October20提醒用途说明草稿（HISTORICAL，未使用）

`NSHealthShareUsageDescription`中文草稿：

> Rillora读取你选择的心率记录，用于你主动开启的个人安全确认提醒。记录仅在本机处理，不用于判断死亡或自动开放资料。

英文草稿：

> Rillora reads the heart-rate records you choose for optional personal safety check-in reminders. Records are processed on this device and do not determine death or unlock information.

这两段只在真实实现满足A且用途适配后使用；若未来行为改变，必须同步用途、隐私说明和权限，不能继续沿用较窄文案。Clinical Health Records、HealthKit Research、写入、位置或运动权限均不在本次范围。

## 后续验收与进入代码的条件

按October22新授权实现上述最小切片，不再等待不存在的概念预审。验证应覆盖：无设备能力、拒绝或撤销、部分历史授权、没有样本、锁屏读取失败、延迟同步、手动／第三方样本、重复／未来／无效样本、关闭功能后清理、两种语言的权限说明及无权限时原功能可用。A／B／C实际用途仍须在未来真实实现提交时接受Apple审核，不能把这次回信记为批准。

这些真实设备验收仍未执行；October22已完成的合成模块测试和库编译见下方检查点，不与个人健康读取混同。既有“当前真机不用验证”的决定不被本文件撤回；未来真正需要读取健康数据时，必须有明确测试范围及用户在系统内的个人授权。

## 本轮官方依据

- [HealthKit能力](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit)：Xcode启用标准capability。
- [设置HealthKit](https://developer.apple.com/documentation/healthkit/setting-up-healthkit)：仅按实际用途选择能力；本轮不需要临床记录。
- [授权健康数据](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)：按类型授权、读取拒绝隐私和局部历史范围。
- [Apple当前开发者协议](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)：HealthKit／Motion实际用途限制，应用自己计算也不豁免。

官方资料只证明平台规则与接口形态。实际提交、Apple答复、capability配置、个人授权、设备读取、规则有效性、分发和资料交付必须分别证明。

## October20准备结果（HISTORICAL）

Apple已通过独立开发技术邮件入口受理案例103002496561；现有登录复用成功，未要求Owner重新验证。当前仅有收件证明，尚无用途答复。[原始发送文本、截图与基线](../collaboration/verification/healthkit-prep-20261020/README.md)已保存；所有原生／发布配置指纹保持。本轮准备完成，后续按同一案例答复确定A／B／C允许范围，不重复申请或自动开始采集。

## October22源码检查点

已完成[独立只读模块](../apps/ios/NextVersionHealth/README.md)，6项合成Swift测试、iOS17.4最低目标双架构库编译、3项发布隔离检查通过。真实健康读取未发生；当前主项目、entitlements、Info.plist和在审包未变。下一版单独生成项目，只增心率只读capability和对应双语用途说明，表述为“本人查看近期心率”，没有冒用上文尚未实现的提醒文案。Profile入口仅在下一版编译条件下出现。

当前不再等待Apple概念预审；后续实机采样、个人系统授权、用途说明／隐私材料最终核对及下一版分发仍各自需要证据。
