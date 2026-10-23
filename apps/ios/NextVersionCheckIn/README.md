# 下一版本独立报平安模块

Status: SOURCE AND LOCAL ACCEPTANCE COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-24 (Asia/Hong_Kong)

本模块服务于本人主动确认与可选本机提醒。[实施合同](../../../docs/health-checkin-watch-development-20261024.md)规定它与健康读取、亲友通知、遗产披露完全分开。默认不开启通知；本人可选24小时／3天／7天，每次手机接收确认后重新计时，暂停／拒绝通知不妨碍手动确认。确认记录不代表健康认证。

`CheckInPhoneStore`负责账号关联、先落盘后回执、通知状态及异步串行；`CheckInWatchStore`先保存待发操作，再通过系统SDK发送，只有匹配手机回执才完成。手机状态和手表待发箱使用AfterFirstUnlockThisDeviceOnly钥匙串，不同步iCloud。Watch消息没有账号ID、登录凭据、原始健康数据、亲友或计划内容；binding、revision、幂等ID、24小时传输有效期和32KiB上限限制旧操作与畸形输入。切账号／解绑会清除旧关联，临时重验保留正确的未完成串行操作。

`CheckInPhoneLink`／`CheckInWatchLink`是WatchConnectivity适配层；SDK回复回调必须从`CheckInDelivery`的nonisolated Sendable工厂建立，再显式进入MainActor。不能直接把MainActor闭包交给系统后台回调，否则Swift6运行时会崩溃。本轮真实配对模拟器发现并验证此修复。

通知必须由本人点开启后请求。安排失败与已记录确认分开显示；通知按钮要求前台和系统认证，重新验证后再执行，并核对通知的binding／revision。主App delegate持有唯一通知／Watch代理，避免View重建接管delegate。延迟通知文案来自`Configuration/NotificationStrings.xcstrings`；生成器仅为下一版合并到主bundle，语言可随通知投递时的系统设置变化。

```sh
swift test --package-path apps/ios/NextVersionCheckIn
python3 tools/release/prepare_next_ios.py
```

23项纯模块、iPhone4项系统适配及3项UI、Watch4项UI的最后相关结果见[交付证据](../../../collaboration/verification/health-checkin-watch-20261024/README.md)。真实SDK在线回执与手机离线／手表重启／手机恢复也在配对模拟器通过。UI夹具只编译到DEBUG模拟器，Release不包含其开关。个人设备、后台长时投递和硬件保护未被这些结果证明；不启动云端CI，不上传TestFlight。
