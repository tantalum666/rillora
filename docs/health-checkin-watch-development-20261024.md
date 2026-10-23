# 下一版多类健康读取、报平安与watchOS开发

Status: SOURCE AND LOCAL ACCEPTANCE COMPLETE / NOT DISTRIBUTED / CURRENT REVIEW UNCHANGED
Last updated: 2026-10-24 (Asia/Hong_Kong)

Owner明确要求按[既定顺序](healthkit-multisignal-watchos-20261024.md)实现iPhone多类健康读取和提醒确认，再做轻量watchOS配套，完成后推GitHub；只用本机测试，不影响当前审核，暂不TestFlight。分支`codex/health-checkin-watch-20261024`从`f017648ca`开始。沿用已有全文阅读链，只补本轮变化文件及官方API证据；不重新做已完成部署、购买、身份验证或Duo失败用例。

## 实施合同

- 健康模块读取本人选择的心率、静息心率、步数、步行／跑步距离、可选睡眠及锻炼；最近24小时，有界样本，写入集合为空。活动量使用HealthKit的合并统计；睡眠取实际睡眠阶段的重叠区间并集；锻炼展示最近一项记录的实际duration，避免把暂停也当锻炼。没有医疗阈值、死亡评分或后台采样承诺。
- 健康记录只留当前页面内存；退出／切后台清除，拒绝与无记录不强行区分，单类型失败不抹掉其他类型，数据时间与读取时间分别展示。呼吸频率／HRV等后续项本轮不扩入。健康模块不依赖提醒、网络、文件、内容或MCP。
- 报平安为独立的主动确认／本机提醒。用户明确开启后选择24小时／3天／7天间隔，每次手机接收确认后重新安排；默认关闭。间隔是用户选择的提醒周期，不是医学安全期或资料披露时限。不联系亲友、不创建披露任务，也不读取健康模块输出。
- 提醒状态和待同步操作用ThisDeviceOnly钥匙串保存；没有云端账户或后端新增服务。通知文案不带账号、健康值或计划内容。拒绝／撤销通知、安排失败和确认保存成功分开显示。权限请求只发生在用户点开启时。
- 手表只交换版本化的最小确认状态／命令，不交换账号ID、令牌、原始健康值或计划资料。每次账号关联有独立binding；旧账号、旧revision、过期／未来时间、畸形／过大消息拒绝。操作持久化待同步，收到手机回执才标为已同步；重复命令幂等。离线重试上限24小时仅是传输有效期，过期不产生任何后果。
- Watch先提供主动确认、查看最近确认／待同步、暂停／恢复、刷新和静态表盘入口。没有手表独立遗产权限、健康监控、实时跌倒申请或假装全天Workout。真实配对传输、系统通知投递、个人健康与硬件保护必须另有设备证据，模拟器不替代。

## 隔离与证据

继续使用`project.next.yml`和独立本地packages；当前`project.yml`、主Info.plist、entitlements、主语言目录、Xcode工程与Package.resolved六文件均与基线逐字一致。通知的延迟本地化目录由生成器仅为下一版合并，不能覆盖主语言文件。现有收费、价格、真实数据和FanPass不变；不注册真实Watch App ID、不签名上传、不安装真机、不升级macOS／Xcode。

最终相关结果如下；只统计每类最后适用的独立用例，不把重跑次数相加。原6项心率切片已由多类用例覆盖，不叠加统计。

| 检查 | 结果与范围 |
| --- | --- |
| 健康纯模块 | 10项通过：合并统计、睡眠区间、来源／无数据／无效样本、部分失败、关闭后的迟到读取 |
| 确认与消息纯模块 | 23项通过：持久化失败、离线重启、幂等、过期／旧账号／旧版本拒绝、后台SDK回调、账号重验期间通知串行化 |
| 下一版源码隔离／双语 | 13项针对性检查通过；发布时另执行可信base的完整本机source组及全量可读扫描 |
| iPhone模拟器UI | 中英文2项，加拒绝通知1项通过；全部健康值为合成，不请求个人健康读取 |
| iPhone系统适配 | 4个独立检查通过：设备钥匙串存取删除、实际通知队列安排与移除、通知操作需前台／系统认证、主bundle的延迟双语文案 |
| Watch模拟器UI | 中英文已同步／离线待同步4项通过；这些UI夹具与下方真实SDK证据分开 |
| 配对模拟器真实SDK | 实际WatchConnectivity及钥匙串完成在线回执、手机离线后确认、手表App重启保留、手机恢复后回执；手机分别展示操作与收到的时间 |
| 编译与产物 | iOS／watchOS Debug、组合Release编译成功；Watch与Widget实际嵌入iOS包；三个Release可执行文件不含验收环境开关 |

真实SDK联调发现Swift6把回复闭包继承为MainActor入口，系统后台回调导致断言崩溃。已通过nonisolated、Sendable回调工厂修复，并加入后台执行器回归，再用真实配对模拟器完成上述在线／离线流程。另修复重新验证账号期间旧通知安排操作取消新请求的竞争：异步OS操作结束前保留串行槽位。不能把这些问题归责为Apple不稳定。

初始失败也保留：未签名模拟器无法访问钥匙串，改为本机ad-hoc签名后通过；通知未授权时不能断言已安排，实际模拟器授权后通过；Watch安装缺少WKApplication、不可用的DisclosureGroup、UI控件定位／就绪和对比度问题均已修正并复测。没有放松存储、权限或成功回执断言。

本轮QA目录为`output/qa/rillora-health-checkin-watch-20261024/`，包含延续阅读链、初始5文件及最终6文件隔离核对、原始成功／失败结果、双语截图和SDK回执。安全可读结果见[本轮交付](../collaboration/verification/health-checkin-watch-20261024/README.md)，原始包仅追加archive53，旧1–52保持。Git发布使用本机可信base扫描和完整可读清单，云端CI继续停用。

## 尚未证明的发布事项

这次完成的是源码与本机验收。个人健康系统授权／真实样本、真实iPhone与Watch无线同步、后台长时间通知投递／耗电、硬件保护、表盘实际安装体验和下一版商店材料仍是独立发布证据。没有声称模拟器替代它们。个人基线、健康异常触发、呼吸频率／HRV、死亡或失能核验／亲友披露没有在本轮实现。既有两项Duo横屏UI问题、内容模块真实语音和机构材料装配继续保留；当前审核、线上服务、TestFlight及系统升级不变。

## 官方实现依据

- [HKStatistics合并来源](https://developer.apple.com/documentation/healthkit/hkstatistics)
- [Statistics query descriptor](https://developer.apple.com/documentation/healthkit/hkstatisticsquerydescriptor)
- [HealthKit授权](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
- [WatchConnectivity通信方式](https://developer.apple.com/documentation/watchconnectivity)
- [watchOS目标配置](https://developer.apple.com/documentation/watchos-apps/setting-up-a-watchos-project)
- [通知转发与设备状态](https://developer.apple.com/documentation/watchos-apps/taking-advantage-of-notification-forwarding)

接口可用不等于Apple用途批准、实际投递或医学有效。当前只实现本人记录查看和独立确认，不连接健康信号与遗产披露。

Git交付：源码95ba39236已推[PR10](https://github.com/tantalum666/rillora/pull/10)，archive53远端独立下载认证508对象／751路径通过。云端运行总数仍314，本轮源码运行0；PR未合入main，后续补记仅文档／回执，不重跑未变化的应用检查。
