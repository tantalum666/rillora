# Rillora 当前交接

Status: CONSOLIDATED FINAL READINESS IN PROGRESS / WEB TOKEN WINDOW RETAINED / NO TESTFLIGHT DISTRIBUTION
Last updated: 2026-10-13 (Asia/Hong_Kong)

## 当前任务

Owner最新要求把所有内容推进到可正式上线状态，按[当前收尾合同](final-readiness-20261013.md)继续，取代只等待Web窗口的下一步。活动工作树`/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`，分支codex/security-findings-20261011，基线20ec61222。本轮QA为output/qa/rillora-final-readiness-20261013；[上一交接](handoff-history-20261013-before-final-readiness.md)是HISTORICAL。

## 已完成与边界

上一轮API25／explicit disabled自动计税／117前端文件／Stripe18事件回调及archive36远端认证保持；价格、用户／订单、原机14、FanPass保留。普通Web客户／新购最后切换仍不能早于香港October14 04:21，旧令牌实际寿命加容差不因本次指令消失；不再要求计税策略确认。

本轮AWS与Apple均复用旧浏览器会话恢复，AWS实际STS通过；原iPhone通过既有配对可读取详情，不需要因最初缓存断开重复索取连接。未提交购买、同意、账号删除或TestFlight分发。原生14已复用归档完成商店签名导出及12项检查；Apple候选29项配置／24项路由、15项IaC、5项目录、10项broker检查通过，未部署。Owner随后已解锁镜像并要求继续，已复用原Google登录，实际账号条款提交待当场确认。

## 当前发现

de5d7838b／CI142已推送并完成兼容云端准备，实际目录已加入USA/HKG正式年价，市场仍关闭。正式保险库已复用原云端IAP配置，不改旧密钥或审核配置。新发现专用Apple reviewer尚未登记，正在加部署名单／期限范围内的受限登记。原生14已上传Apple待处理，没有TestFlight分发或提审；年付与群组简体中文已保存。

## 唯一下一步

先补Apple正式运行及具名到期审核通道的最小实现／反向验证，联动实际商店配置与原生最终候选准备。继续其他独立收尾，不空等Web令牌窗口，也不重复已完成的测试、安装或购买；全部结果分别记账后保存Git。
