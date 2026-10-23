# GitHub整合与本机检查

Status: REVIEWED / LOCAL GATES PASS / CLOUD WORKFLOWS DISABLED / MERGE READBACK PENDING
Last updated: 2026-10-23 (Asia/Hong_Kong)

Owner要求检查GitHub工作、合适后合并，并停止使用云端CI。此指令取代旧交接中的“恢复账单／消费上限后重跑CI”。当前审核、线上服务、数据、价格、收费、FanPass和系统升级暂缓保持。

## 审查范围与判断

重新读取开放PR和远端分支：只有[PR9](https://github.com/tantalum666/rillora/pull/9)开放，只有`codex/ios-content-healthkit-20261023`尚未包含于当时main466b13002；其他分支均已包含。PR无已提交review、行内评论或讨论评论，因此没有遗漏的外部审查意见。

复核全部活动运行时代码差异及11份ContentKit源码正文：账户绑定和迟到结果、下载双方路径、字节与格式检查、录音文字状态、只在本机转写、临时文件、共享快照／撤销、Web保存与断网恢复，以及下一版编译开关。没有新增阻止开发源码合并的发现；七组上一轮修复仍是候选，详见[完整性复核](content-completeness-review-20261023.md)。

当前普通iOS工程不链接新内容／HealthKit模块，也不启用Duo条件；5份审核配置与pins逐字匹配主分支。两项之前失败的Duo横屏UI保留为下一版发布门，不把模块入库当作所有交互已通过。真人语音、健康与硬件保护、机构材料装配和真正身后交付同样没有因合并而完成。

## 本机验证替代

1. 在GitHub逐一停用Verify source、Web UX browser regression、Guard source publication，并实际读到Disabled。原文件移到`tools/ci/cloud-reference/*.disabled`，不再保留活动Actions YAML。
2. [本机入口](../tools/ci/README.md)保留源码、API、Web／基础设施、浏览器和Swift模块分组。先从明确的主分支SHA提取原可信扫描代码／例外，再扫描候选；不会执行候选的扫描政策来证明自身安全。
3. 不继承云端凭据、数据库URL、Node或shell启动注入，数据库限定既有本机测试端口；不创建／标记数据库，不装依赖、浏览器、系统组件，不注册常驻runner。错误／超时失败，不写虚假绿色状态。
4. 本机source组实际132项通过：release82、DNS10、Auth0 10、collaboration9、protected-credential9、journal-broker7、local-runner5。固定gitleaks8.30.1；源码32项原登记／0未知；全量可读清单校验通过。原CI测试命令保留，执行位置变化。
5. 浏览器配置可显式使用现有Chrome隔离上下文；默认配置不变。已检查配置加载，本轮没有重跑未变化的81项完整浏览器测试。

既有Web／API／基础设施证据来自ada1f5b32：源码39965263413、发布保护39965257514、完整浏览器39965263446成功（81通过／2项原有模型资格跳过）。已核对从该提交到11ccef3b8的这些运行时目录没有变化。之后仅原生首次录音保留草稿，78aaa5de1对应18项模块与实际编译通过。这些是沿用证据，不是本轮重跑。最新旧云端失败仍记录为账户门阻止启动，不改其历史状态。

本次新增可读证据在[保存包](../collaboration/verification/git-local-ci-20261023/README.md)。旧archive1–52保持，不重封或下载；新增非秘密文本／截图直接保存。最后回执后重建清单，并检查所有清单文件已实际进入Git索引。

## 后续发布边界

本轮只整合源码与检查执行方式。发布修复仍须兼容API先行，再Web；iOS继续下一版、暂不TestFlight。环境升级与两项横屏失败不因云端停用而跳过。后续流程不要为清除旧红色图标提高GitHub预算或恢复Actions；按实际变化选择本机验证并保存确切提交证据。
