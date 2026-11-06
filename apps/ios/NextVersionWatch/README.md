# 下一版本轻量watchOS配套

Status: LOCAL BUILD AND SIMULATOR ACCEPTANCE COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-24 (Asia/Hong_Kong)

Watch端提供主动确认、上次确认与待同步／已同步状态、暂停／恢复提醒、刷新，以及静态表盘入口。所有状态语义来自[独立确认模块](../NextVersionCheckIn/README.md)，不在手表另建健康判定或内容权限。表盘入口只打开确认页，不会因为点击入口自动记录“我没事”。中英文分别完整呈现，沿用当前完整品牌图标的相同字节。

由`python3 tools/release/prepare_next_ios.py`生成`RilloraNext.xcodeproj`。组合`RilloraNext` scheme包含iPhone、现代Watch App与Widget扩展；`RilloraWatchNext`用于手表模拟器构建／UI测试。Watch最低watchOS10.4，依附iPhone，不独立运行；`WKApplication`和配套bundle关系均已通过实际安装读回。仅组合下一版包含这些目标，当前审核项目不变。

本轮使用现有Xcode26.6及iOS／watchOS26.5模拟器，没有升级工具。四项中英文已同步／离线UI通过。独立于夹具，真实WCSession／钥匙串完成手机离线期间确认、手表进程重启、手机恢复后的准确回执。Debug和组合Release可编译，App内嵌结构经实际文件核对；没有注册新的真实App ID、手机／手表安装或TestFlight。

系统队列并不承诺立即投递。等待期间明确显示待同步，旧账号／旧版本／过期操作不能静默改成新确认。真实设备连接、电池、后台投递、表盘安装与发布签名仍需未来下一版验证，不能由模拟器结果替代。完整边界见[实施合同](../../../docs/health-checkin-watch-development-20261024.md)与[验收回执](../../../collaboration/verification/health-checkin-watch-20261024/README.md)。
