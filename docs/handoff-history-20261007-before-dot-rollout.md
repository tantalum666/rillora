# HISTORICAL — before October7 Dot rollout

This dated handoff is superseded by [current handoff](handoff.md).

# Rillora 当前交接

Status: Dot三条分支已审查修复并通过PR1合并；当前线上/商店仍为原检查点
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 当前任务与已完成

Owner最新要求审阅GitHub、直接修复再合并。已将共享身份8cc5e100、原生3c6e05b1c和Web75d4d7d9f
整合，保留完整operator e950078及构建8购买实现；[PR1](https://github.com/tantalum666/rillora/pull/1)
已合入`codex/device-config-20261006`，合并提交`eb5fb1a70`，审核源码`5a547339a`。
[审查/修复与证据](dot-integration-20261007.md)。旧云端“不合并”范围已被本次Owner指令取代。

- 实际修复SwiftUI Section初始化错误及跨文件XCTest私有fixture引用。XcodeGen重新生成工程。
  分类UI测试的装饰图片可点击假设、导航栏搜索位置假设已按截图修复；没有删掉产品断言。
- 原生Debug/Release成功，272单测通过/0失败/1既有StoreKitTest平台跳过；中英各3个新UI
  场景全部通过。Web174、API类型/构建和17聚焦测试、66guards、源码29已审/0未知扫描通过。
  PR CI73和20/20浏览器场景通过（0跳过/失败/flaky），GitHub实际合并已读回。
- 原始/中间/最终Dot浏览器包及新整合包共4份已下载并核对GitHub SHA256；本轮所有合资格
  本机日志、结果包、截图/视频、编译产物和原始失败记录追加archive21，7,314路径/913对象本地及GitHub独立新下载解密核验均通过（06519bde8）。
- Dot修正的archive20可读清单保留，25份被Git忽略的本机生成副本移出协作树；原3,102记录
  和密文不变。原任务模拟器已关闭、合成fixture已停止，未操作用户其他模拟器或FanPass。

## 保留边界与阻塞

本次没有部署、上传新TestFlight、修改provider或发送真实重置邮件。线上仍API14/schema0093，
商店/内部测试仍1.0(8)；新账号显示和原生UX源码不能写成已经上线。
构建8的币种/新鲜报价/单按钮购买、原HKD888Sandbox签名购买和历史都保留。Apple美国119.99/
Web88.99、Free1/Family5不变。原审核访问2026-10-06T17:08:57Z已过，未擅自延期。
真实购后恢复、物理新构建验收、经营/税务及StripeLive接入/真实交易、最终审核/客户开放未完成。
外部两名TestFlight邀请和独立验收账号删除保持Owner暂缓。秘密/真实日志/私人申报仍不进入Git。

## 唯一下一步

以当前已合并源码准备匹配的下一轮受限发布候选；真实账号验收开始前先明确处理过期的审核访问，
不把本轮合成测试当作生产或本人验证，不重复原成功购买。

[此前云端交接](handoff-history-20261007-before-dot-integration.md)为HISTORICAL。
