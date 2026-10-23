# HISTORICAL — Duo适配前的原生交接

下文保存当时检查点；当前任务只看[handoff](handoff.md)。

# Rillora 当前交接

Status: NEXT IOS SOURCE AND SYNTHETIC TESTS COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-23 (Asia/Hong_Kong)

## 当前任务

Owner要求继续补齐下一版iOS办理包、文件、原声并接好HealthKit，先开发测试，不影响当前审核，暂不发TestFlight，完成推GitHub。[本轮合同](ios-content-development-20261023.md)取代“先核实审核结果才开始开发”的旧门；[上一Web交接](handoff-history-20261023-before-ios-content.md)保留为HISTORICAL。

## 已完成

独立RilloraNext工程与RilloraContentKit已实现原生文件选择／有界读取／版本编辑／导出／删除，三分钟PCM录音／播放／可选本机转写／单独确认文字，以及办理包编辑、步骤依赖、资料版本、现在共享／撤销、接收人进度。使用同一既有API，Bearer和账号在请求前固定，退出后的迟到结果拒绝。HealthKit仅在下一版链接，主动只读心率、不上传／不导出／不触发披露。

14项纯模块测试、当前15项原生用例的最后相关结果、8项隔离／资源检查及API夹具类型检查通过。两种语言实际完成系统文件导出→重新选取导入→API字节一致；真实本地API／SQL覆盖上传幂等、冻结版本、未确认文字不交付、前置步骤、进度、换安排撤销、再次明确共享／撤销和权益到期取回。原生UI写入进度后经API读回，撤销后的界面和辅助功能树均关闭。证据逐项有日期，不伪称最后一个命令重跑全部用例。

修正独立工程重复Info.plist、权限资源覆盖主中文资源、进度区域标识遮蔽子控件、撤销后旧辅助功能节点残留。开发过程初始解析的新依赖已回到当前项目的确切pins；后续原生验收使用原pins。数据库原有规则会在更换亲友或披露安排时撤销旧共享，文案／断言已按此校正，未改变服务端规则。

原主工程／Info.plist／entitlements／Xcode项目指纹一致；没有云端部署、Apple后台修改、签名门户改动、归档上传、TestFlight或真机安装。价格、收费、原数据和FanPass保持。本机合成API已停止，合成数据库及模拟器文件保留为QA样本。

## 证据边界与Git

真实麦克风录音、Apple本机识别授权／质量、个人HealthKit授权与手机／手表读数、真机数据保护尚未验证。模拟器不能返回真实文件保护类，旧不适用断言已明确归档，未取消源码complete保护。原HealthKit6项合成测试沿用October22，本轮补组合工程与中英文入口，不重复购买／恢复／退款或已部署Web验收。

源码基线main466b13002，工作分支codex/ios-content-healthkit-20261023。完整阅读沿用上一工作流正文链，变化文件与原生规范已补读；当前记录在output/qa/rillora-ios-content-20261023。源码b17d76f32和archive50已推送至[PR9](https://github.com/tantalum666/rillora/pull/9)，新归档已完成独立远端下载／解密及425对象／792路径核验。最终候选CI以PR原生记录为准，不由push推断通过。源码、安全摘要及新增原始证据保存状态以[本轮Git回执](../collaboration/verification/ios-content-20261023/README.md)和实际GitHub检查为准，旧archives1–49不重封、不重下。

## 唯一下一步

按Owner后续分发安排进入下一版真实设备权限与媒体／健康读取验收，再准备更新发布；当前不要求Owner重新登录、不启动真机测试，也不发TestFlight。本轮Git提交／CI只核对新增结果，不重复已完成部署。
