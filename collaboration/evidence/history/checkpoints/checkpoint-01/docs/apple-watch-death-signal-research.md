# Apple Watch, Health Signals And Death-Detection Boundary

Role: focused platform, product and safety research  
Authority scope: Apple Watch / HealthKit capability, wearable-signal interpretation and Rillora roadmap  
Superseded by: newer Apple platform rules, stricter applicable law, security evidence or explicit Owner decision  
Do not use for: medical diagnosis, death certification, emergency response instructions or legal advice  
Status: RESEARCH COMPLETE; NO MVP SCOPE EXPANSION  
Last reviewed: 2026-08-16

## Executive Conclusion

Apple Watch可以向获准的App提供部分心率、跌倒和严重车祸事件，但不能向Rillora提供“用户已死亡”这一事实。当前公开API没有`death detected`、`no pulse`或“心跳停止”事件；没有新数据也不能区分未佩戴、没电、离线、设备更换、权限被拒、传感器失败、数据同步延迟与真正的医学事件。

因此Rillora不应尝试“通过Apple Watch知道用户死亡”。可接受的系统只能把特定设备事件归类为`SafetySignal`，最多开启一条不披露资料的福利确认流程；死亡申请、死亡事实核验、申请人身份、合法角色与分阶段披露继续是独立流程。

本轮建议：

1. P0 Web+iOS MVP不增加watchOS target，不请求HealthKit、Fall Detection或SafetyKit权限。
2. 若以后验证用户确实需要手表端，第一版应是用户主动操作的`I'm OK / Check in / Cancel concern`伴侣，而不是心率监控器；不响应没有自动后果。
3. 只有用户研究证明实时跌倒后的福利协助有价值、Apple批准专用entitlement、隐私／医疗／保险／目标法域审查通过后，才研究watchOS实时Fall Detection。
4. 任何心率、跌倒或车祸事件都不能直接创建死亡申请、缩短核验、启动冷静期或释放任何Matter。

## Evidence Classes

本报告严格区分四类结论：

- **Apple documented**：Apple开发者文档、支持文档和App Review规则明确写出的能力或限制；
- **SDK verified**：本机Xcode 26.5公开SDK header进一步确认的平台可用性与事件字段；
- **Technical inference**：从公开API表面得出的结论，例如没有公开死亡事件；这不是Apple对所有内部能力的声明；
- **Rillora recommendation**：基于本项目既有安全边界做出的产品决定建议，不表示Apple批准、医学有效或全球合规。

## Capability Matrix

| Question | Public capability | watchOS App required? | Practical latency / limitation | Suitable for proving death? |
| --- | --- | --- | --- | --- |
| 读取Apple Watch同步后的历史心率 | HealthKit授权后可查询心率样本 | 否；iPhone App可读已同步数据 | 后台读数间隔随活动变化；同步和后台投递无实时SLA | 否 |
| 读取低心率／高心率／不规则节律事件 | HealthKit存在相关只读事件类型 | 读取已同步记录通常不需要 | 只在系统达到通知条件时产生；低电量模式、权限和设备状态会影响可用性 | 否 |
| 读取历史跌倒计数 | HealthKit可查询`numberOfTimesFallen` | 否 | 可能延迟；只记录用户确认或系统升级处理的跌倒，用户驳回的事件不计入 | 否 |
| 实时收到跌倒事件 | `CMFallDetectionManager` | **是**；公开SDK仅watchOS可用 | 需要Apple单独批准entitlement、用户授权和兼容设备；App只获短时后台处理机会 | 只能用于福利确认 |
| 获取高频实时心率 | 活动中的`HKWorkoutSession`可提高心率采样频率 | **是** | 必须是真实、可见、可结束的Workout；耗电且不能伪装为全天死亡监控 | 否 |
| 收到严重车祸事件 | SafetyKit的Crash Detection事件 | iOS实现不要求Watch App；watchOS也有接口 | 需要专用entitlement、用户授权，且用户指定接收事件的App | 只能用于福利确认 |
| 收到死亡／无脉搏事件 | 未发现公开Apple API | 不适用 | 缺失数据不是0 bpm，也不是死亡 | **不存在可用证明** |

## What Apple Watch Heart Data Can And Cannot Tell Us

### HealthKit data access

HealthKit是用户iPhone和Apple Watch健康数据的中央存储接口。每台设备有自己的HealthKit store，系统可在配对设备之间同步；App必须声明数据类型和使用目的，并由用户逐类授权。用户可以随时撤销授权。

对Rillora尤其重要的是：Apple为了防止App推断用户是否拥有某种敏感健康数据，不会让App可靠地区分“读取权限被拒”和“没有样本”。在锁屏等受保护状态下，后台读取也可能暂时失败。换言之，服务端收到“没有心率样本”时没有足够信息解释原因。

### Apple Watch is not a continuous clinical monitor

Apple说明，Workout期间会持续测量心率，Workout结束后还会继续约三分钟；其他时间的后台读数频率会随活动变化。贴合度、皮肤灌注、低温、纹身、运动方式和传感器接触都会影响读数，理想条件下也可能无法每次获得可靠样本。

Apple Watch的光学心率传感器公开测量范围是30–210 bpm。这个事实本身已说明“没有样本”不能被解释为0 bpm；API交付的是测得的样本，而不是一个经过死亡鉴定的连续生命体征流。

高／低心率和不规则节律通知也不是持续诊断。Apple明确提示Apple Watch不能检测心脏病发作，不规则节律功能不会不断检查，低电量模式会关闭相关通知。即使收到低心率事件，它表达的也是“系统生成了低心率通知”，不是无脉搏、昏迷或死亡。

### Why a hidden 24/7 workout is not an acceptable workaround

`HKWorkoutSession`会在活动期间优化传感器并产生高频数据，watchOS App也可在Workout期间继续后台运行。但Apple要求App明显显示Workout正在进行，并让用户保存或丢弃结果。把一个永久Workout伪装成死亡监控会同时带来电量、用户体验、数据质量、App Review和健康产品责任问题，因此本项目明确列为`NO-GO`。

## Fall Detection

### Historical fall data without a Watch App

iPhone App经HealthKit授权后可以查询`numberOfTimesFallen`。这可以用于用户自己的健康记录展示，但不适合紧急响应：数据可能延迟，而且Apple说明只有用户确认发生跌倒或系统升级到紧急处理的事件才会被记录；被用户驳回的跌倒不会留下该计数。

### Real-time fall events require a Watch App and Apple approval

Apple确实为第三方提供`CMFallDetectionManager`。这比普通HealthKit历史查询更强：系统可以在发生事件时后台启动watchOS App，交付最近的跌倒事件并给予短时间执行，让获批App及时提供援助。

但它有四个硬门：

1. Apple单独批准的`com.apple.developer.health.fall-detection` entitlement；
2. 用户明确授权和`NSFallDetectionUsageDescription`；
3. 支持Fall Detection的Apple Watch；
4. **watchOS App**。本机Xcode 26.5公开header将`CMFallDetectionManager`标为`watchOS 7.2+`且`iOS unavailable`，并要求在watchOS App生命周期早期设置delegate。

事件的用户处理结果包括`confirmed / dismissed / rejected / unresponsive`。其中`unresponsive`只表示用户没有回应跌倒提醒、系统也未检测到恢复运动；它不表示医学死亡。

Apple自己的Fall Detection流程会优先提示佩戴者；如果检测到约一分钟不动，再进行约30秒倒计时，然后尝试联系紧急服务并通知紧急联系人。Apple同时说明系统不能检测所有跌倒，高冲击活动也可能触发误报。Rillora不能用自己较弱的福利流程替代或延迟这个系统应急路径。

## Crash Detection

SafetyKit允许获批App接收严重车祸事件，包括事件时间、位置以及系统是否尝试Emergency SOS响应。iOS App可以承担该路径，所以“仅为了Crash Detection”不要求开发Watch App；当前SDK也向watchOS公开接口。

它仍需要Apple专用entitlement、用户授权和用户指定事件接收App。Crash Detection证明的是系统检测到一次严重碰撞，不证明车内人员身份、伤情、死亡、法律身份或资料披露资格。因此它和跌倒一样，只能成为`SafetySignal`。

## The Fundamental False-Trigger Problem

### Signal absence is not evidence

以下状态在Rillora看来都可能表现为“没有新心率”或“设备沉默”：

- 用户睡觉时没戴；
- 手表没电、关机或坏了；
- iPhone／Watch离线或尚未同步；
- 用户更换设备；
- 用户撤销HealthKit权限；
- 设备被锁，App暂时不能读受保护数据；
- 传感器接触不良、环境太冷、纹身或运动干扰；
- 系统节流或终止后台任务；
- 用户主动不再使用Rillora；
- 用户真的出现紧急情况。

这些原因不能由公开API可靠区分，所以缺失必须建模为`UNKNOWN`，不能建模为`NO_PULSE`、`DEATH_SUSPECTED`或`CONTACT_FAILED`。

### Positive safety events are also not proof

跌倒可能发生在运动中、手表佩戴者可能不是账户本人、车祸中的手机可能不属于伤者，低心率也可能是睡眠、运动适应、药物或传感器问题。反向风险同样存在：真正死亡可能没有兼容手表、没有佩戴、没有电、没有网络或没有产生系统事件。

因此仅靠设备事件会同时产生高误报与高漏报；一旦误报会导致敏感资料泄露，漏报又会制造虚假的安全承诺。

## Required Product Separation

Rillora必须把以下对象和权限分开：

- `SafetySignal`：设备报告的一次健康／安全事件；
- `WelfareCheck`：不披露Matter的可逆确认流程；
- `Claim`：由某个有身份的人主动提出的死亡／失能／失联申请；
- `DeathFactVerification`：对死亡事实及证据真实性的核验；
- `AuthorityVerification`：对申请人法律角色和可执行范围的核验；
- `Disclosure`：完成必要复核后按Matter和角色逐步提供最少信息。

唯一允许的因果路径是：

```text
Apple safety event
  -> SAFETY_SIGNAL_RECEIVED
  -> WELFARE_CHECK_PENDING
  -> planner confirms safety / concern is closed
     OR an identified person separately opens a claim
  -> DEATH_CLAIM_OPENED
  -> identity review
  -> death-fact document review
  -> legal-role review
  -> multi-party confirmation
  -> cooling-off + planner notification/cancel/appeal
  -> staged, least-privilege disclosure
```

禁止存在以下边：

```text
no heart-rate data ----X----> claim
fall / crash ----------X----> death verified
device silence --------X----> cooling-off timer
safety signal ---------X----> recipient access or data release
```

Apple自己的Legacy Contact也是有价值的平台先例：申请人仍需访问密钥和死亡证明，具体要求可能因国家／地区变化。Apple没有把Watch沉默替代为死亡事实。

## Recommended Rillora Experience

### If a future safety signal is received

1. 先让Apple的Emergency SOS／Fall Detection完成系统应急动作；
2. Rillora只建立无敏感内容的福利确认记录；
3. 尝试向规划者发送普通`Are you safe?`确认，支持`I'm OK`和`I need help`；
4. 只有用户预先明确选择时，才可通知一个专门的福利联系人；通知不得暴露Matter、资产、债务、接收人或处理意愿；
5. 福利联系人可以建议联系当地应急服务，但不能按一下按钮就“确认死亡”；
6. 若有人实际报告死亡，必须进入独立申请入口，并按现有claim状态机审查。

Rillora不得承诺24/7紧急响应，除非未来真的建立有SLA、人员、地区覆盖、升级程序、保险和审计的服务能力。

### Notification wording boundary

可接受：`Rillora received a device safety signal and could not confirm Alex is safe. This is not a death notice. If you believe there is immediate danger, contact local emergency services.`

不可接受：`Alex may have died`、`No heartbeat detected`、`Rillora detected a death`、`The plan will be released unless Alex responds`。

## Privacy, App Review And Global Compliance

### Data minimization

如果未来进入技术验证，优先在设备端把原始数据转换为极少的派生事件；默认不把逐次BPM、完整健康历史、位置轨迹或传感器流上传服务器。可研究的最小记录是：

```text
signal_type
occurred_at
source_platform
user_resolution
received_at
consent_version
retention_expires_at
```

即使如此，位置和健康事件仍可能是高度敏感资料。它们需要独立的授权、撤回、保留、访问控制、加密、删除和事故响应，不得进入广告、营销画像、定价歧视或普通产品分析。

### Apple platform fit

Apple要求App只在健康／健身功能确有需要时请求HealthKit，并说明具体用途；App Store规则限制健康数据用于广告、营销和数据挖掘。Apple还禁止App把操作系统或硬件的内置能力本身当作收费点。因此即使未来获得权限，Rillora可以收费的价值也应是长期计划整理、协作、审查和合规运营，而不是“读取Apple Fall Detection”。

更根本的问题是用途匹配：以身后资料释放为核心的产品请求健康权限，会面对比普通健身App更高的App Review与信任门槛。当前没有证据证明Apple会为此批准HealthKit或Fall Detection entitlement。

### Global legal boundary

欧盟GDPR把健康数据列为特殊类别；处理通常需要满足Article 9中的适用基础和条件。自动化决定若产生法律或类似重大影响，还会触及Article 22的人类介入和申诉要求；新技术、高风险监控或大规模特殊类别数据可能需要Article 35 DPIA。

这些规则不能直接外推为全球统一结论。正式上线前仍需按实体、处理地点、用户所在地、应急服务边界和健康／保险监管逐市场审查。本报告不构成法律意见。

## Roadmap Recommendation

### P0 — Current MVP: no wearable integration

- 保持Web+iOS范围；
- 不创建Watch target；
- 不申请HealthKit、Fall Detection或SafetyKit entitlement；
- 不在营销中写“检测死亡”“监测生命体征”或“自动通知身后联系人”；
- 真实死亡申请与披露保持关闭，继续完成现有人工核验和安全合同。

这是推荐方案。它避免把一个未经验证的产品假设变成长期健康数据责任，也不会阻碍未来增加watchOS companion。

### P1 — Optional manual Watch companion

前提：用户访谈／可用性测试证明手腕端有明确用途。

- 主动`I'm OK`；
- 查看最近的普通复核／确认请求；
- 撤销误报；
- 一键打开iPhone App或系统Emergency SOS；
- 不读取心率；
- 不因未响应启动申请或披露。

这需要Watch App，但不需要以健康数据权限开始。

### P2 — Read-only HealthKit technical spike

前提：Owner另行批准研究范围，并先完成purpose statement、数据流图、保留计划、威胁模型更新、DPIA筛查、App Review预沟通和实体设备测试计划。

- 仅在真实iPhone + Apple Watch测试；Simulator不能证明后台HealthKit投递；
- 优先验证系统事件元数据，不收集逐次BPM；
- 只在设备端生成`SafetySignal`；
- 任何网络上传使用合成测试账户和最小字段；
- 没有claim／release side effect。

### P3 — Real-time Fall Detection companion

前提：用户需求成立、Apple批准entitlement、watchOS target通过实体设备与电量测试、福利响应SLA和地区边界成立、医疗／隐私／保险／安全审查通过。

- `CMFallDetectionManager`只创建福利确认；
- 系统Emergency SOS优先；
- 明确不保证检测所有跌倒或所有紧急情况；
- 用户可撤回，联系人可更换，误报可关闭；
- 永远不能直接进入死亡事实核验或披露。

### Separate future spike — SafetyKit Crash Detection

因为iOS可独立接收事件，它不要求Watch App；但同样需要Apple批准和用户指定，价值与Fall Detection高度重叠。除非用户研究显示严重车祸福利确认是核心场景，否则不应与P2/P3同时扩大范围。

## Explicit No-Go List

- 用无心率、低心率或权限沉默判定死亡；
- 用跌倒事件的`unresponsive`枚举显示“死亡”；
- 把未签到、设备离线和健康数据缺失拼成自动dead-man switch；
- 使用隐藏、永不结束的Workout获取全天高频心率；
- 在服务端长期保留原始BPM、完整健康历史或不必要的位置轨迹；
- 在福利通知中披露资产、债务、Matter、接收人或处理意愿；
- 让手表事件缩短身份、文件、合法角色、多人确认、冷静期、取消或申诉；
- 暗示Rillora替代本地应急服务、医生、验尸机构或政府死亡证明；
- 把读取Apple内置安全能力作为单独付费卖点。

## Decision Gate

本轮是研究结论，不是watchOS开发批准。若Owner未来希望继续，真正需要确认的不是“要不要加一个Watch页面”，而是以下产品门：

1. 我们是在做数字遗产连续性，还是进入实时个人安全／福利响应业务？
2. 谁负责收到信号后的实际响应，覆盖哪些国家、时区和语言？
3. 用户愿意为该流程授权哪些数据，错误通知会造成什么伤害？
4. Apple是否批准相应entitlement，目标市场是否允许该处理？
5. 即使没有任何设备数据，死亡申请与人工核验是否仍能独立完成？答案必须是“能”。

在这些门成立前，正确的工程决定是保留领域扩展点，不创建Watch target、不请求权限、不收集健康数据。

## Primary Sources

Apple platform and user documentation:

- [HealthKit framework](https://developer.apple.com/documentation/healthkit)
- [About the HealthKit framework](https://developer.apple.com/documentation/healthkit/about-the-healthkit-framework)
- [Authorizing access to health data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [Protecting user privacy](https://developer.apple.com/documentation/healthkit/protecting-user-privacy)
- [HealthKit Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/healthkit)
- [Heart rate on Apple Watch](https://support.apple.com/en-ae/120277)
- [Getting the most accurate measurements](https://support.apple.com/en-au/105002)
- [Heart health notifications](https://support.apple.com/en-us/120276)
- [HealthKit heart rate type](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartrate)
- [HealthKit low heart rate event](https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/lowheartrateevent)
- [Executing observer queries](https://developer.apple.com/documentation/healthkit/executing-observer-queries)
- [Enable background delivery](https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:))
- [Running workout sessions](https://developer.apple.com/documentation/healthkit/running-workout-sessions)
- [HealthKit falls quantity](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/numberoftimesfallen)
- [CMFallDetectionManager](https://developer.apple.com/documentation/coremotion/cmfalldetectionmanager)
- [Fall Detection entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.health.fall-detection)
- [Use Fall Detection with Apple Watch](https://support.apple.com/en-la/108896)
- [SafetyKit](https://developer.apple.com/documentation/safetykit)
- [SACrashDetectionEvent](https://developer.apple.com/documentation/safetykit/sacrashdetectionevent)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Legacy Contact](https://support.apple.com/en-us/102631)

Legal primary source used only for issue spotting:

- [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

Local SDK verification:

- Xcode 26.5 `WatchOS26.5.sdk` public CoreMotion headers: `CMFallDetectionManager` is watchOS-only, requires an Apple entitlement and can relaunch a watchOS App in the background;
- Xcode 26.5 `iPhoneOS26.5.sdk` public SafetyKit headers: crash event APIs are available on iOS and newer watchOS versions;
- local SDK inspection confirms public compile-time availability only; it is not entitlement approval, device testing, App Review approval or production evidence.
