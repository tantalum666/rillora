# 下一版本多类健康只读模块

Status: SOURCE AND SYNTHETIC CHECKS COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-24 (Asia/Hong_Kong)

## 当前实现：多类读取

按Owner最新顺序，现已扩展为心率、静息心率、步数、步行／跑步距离、可选睡眠及锻炼。用户逐类选择并主动读取最近24小时；活动使用HealthKit合并统计，睡眠合并实际睡眠区间，锻炼展示最近一项实际duration。逐类保留无数据／失败／有界截断状态、来源与测量／读取时间，不把无授权结果当作0或身体异常。写入集合始终为空，原始记录仅保留页面内存，关闭或后台清除，迟到结果丢弃。

模块仍沿用`RilloraHeartRateKit`包名以保持工程引用，公开入口已变为`HealthEntryView`。不依赖网络、文件持久化、确认模块或披露逻辑。DEBUG模拟器的合成reader只供UI测试；Release不含其环境开关。现有10项多类纯模块、两语言实际入口UI和组合Debug／Release编译通过；取代原6项单心率测试，不叠加计数。个人HealthKit权限／真实样本未读取，其他指标和基线未实现。

使用`swift test --package-path apps/ios/NextVersionHealth`和`python3 tools/release/prepare_next_ios.py`。完整[实施合同](../../../docs/health-checkin-watch-development-20261024.md)和[本轮证据](../../../collaboration/verification/health-checkin-watch-20261024/README.md)为当前状态；当前审核的六份关键文件与基线一致，无真机分发、TestFlight或工具升级。

## October22–23单心率切片（HISTORICAL，范围已被上节取代）

October23：已在[组合下一版工程](../NextVersionContent/README.md)接入真实入口，中文／英文模拟器导航均通过；主审核工程仍不链接模块，未请求个人健康权限。`project.healthkit-next.yml`的资源组织同步修正为变体组，防止覆盖主中文资源或重复拷贝主Info.plist。以下October22独立库证据保留其日期，不能当成本轮真实设备采样。

Owner已明确不再等待概念预审答复，继续读取Apple Watch同步到Apple Health的健康数据。Apple案例103002496561仅回复不提供概念预批准，未批准具体用途。权威范围见[接入合同](../../../docs/healthkit-preparation-20261020.md)。

模块只在用户主动选择后请求心率读取，写入集合为空；前台单次查询最近24小时、最多200条。数值、时间、重复项和来源标签用于正确呈现记录；手动／未知设备标记不会冒充Apple Watch验证结果。空结果不能区别无记录与未授予读取许可。没有后台监测、健康上传、日志、导出、MCP、自动联系、死亡判断或资料放行。

记录只在页面状态中保留；退出／切后台清除并取消查询，迟到结果丢弃。系统权限表出现时保留请求，非活跃画面覆盖以避免任务切换快照暴露。用户可停止并清除当前页；这不撤销系统已授予的权限，撤销需在系统健康权限中操作。

## 与当前审核隔离

普通`project.yml`、现有entitlements、主Info.plist及当前Xcode项目保持不变。当前Profile仅多出编译条件块，正常配置不包含模块或新入口。

下一版使用独立`project.healthkit-next.yml`生成`RilloraHealthNext.xcodeproj`，继承现有项目并只为下一版增加本地Package、心率用途说明、HealthKit entitlement和`RILLORA_HEALTHKIT_NEXT_VERSION`条件。生成的项目／Info.plist不提交，配置是可重建来源；不得将其上传或替换当前在审版本。

```sh
xcodegen generate --spec apps/ios/project.healthkit-next.yml
swift test --package-path apps/ios/NextVersionHealth
```

本轮6项合成Swift测试通过；独立Package的iOS17.4最低目标在iOS26.5 SDK下arm64及x86_64编译通过；下一版项目已生成并解析本地依赖。只构建独立库，没有打包、安装、签名、分发或上传新的Rillora App，没有修改开发者门户能力。

尚未证明真实个人授权、手机／手表采样或同步行为，也没有承诺提醒有效性。Owner“真机不用验证”的当前决定保持；以后下一版发布前的实际用途、隐私材料和必要设备验证独立处理。
