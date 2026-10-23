# 下一版本心率只读模块

Status: SOURCE AND SYNTHETIC CHECKS COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-23 (Asia/Hong_Kong)

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
