# HISTORICAL — Apple全部链接复核前交接

下文为October30修复交付检查点。October31进一步发现的真实Sandbox及审核资料证据缺口，以当前handoff为准。

# Rillora 当前交接

Status: APP REVIEW REJECTION REMEDIATED / LOCAL BUILD15 READY / OWNER HOLDS RESUBMISSION
Last updated: 2026-10-30 (Asia/Shanghai)

## 当前任务

Owner要求直接修复Apple拒审，最新明确“先别重新提交”。[本轮合同](app-review-remediation-20261030.md)是当前入口；[原SEO交接](handoff-history-20261030-before-app-rejection.md)为HISTORICAL。继续保留真机验证停止、TestFlight暂停、本机CI和不调用子代理的要求。

## 已完成

完整阅读2.2／2.1(b)意见及两张原图；确认审核账号登记和API资格在October27到期，而Apple于October30审核。只续具名合成审核账号到November29 20:00；价格、市场、销售开关、其他账号与内容不变。原模板单参数更新完成，API1/1健康、镜像／其他环境一致。既有监控新增提前7天预警，真实15项检查通过，原订阅者保持。新Developer Program协议按Owner确认接受并回读成功。

普通套餐页去掉测试横幅／测试套餐后缀，保持购买安全条件。45项购买／恢复逻辑、1项实际本地StoreKit SDK、12项健康检查、12项基础设施、11项UI／双语静态检查通过；英文可购买／中文不可购买iPad合成画面分别验证。首次中文环境断言、SDK夹具弹窗顺序和初始build1元数据失败保留并修正。

本地1.0(15)从原14的精确原生基线加有限补丁独立构建，Release归档及App Store签名IPA通过；无下一版HealthKit／Watch／Duo／内容功能，无本地StoreKit文件。Apple仍选14、Rejected、手动发布；未上传15、发送回复、重新提审或分发。源码、证据与新增archive55保存到[本轮交付](../collaboration/verification/app-rejection-20261030/README.md)，源码／archive55已推4acf1cae3，独立远端482对象／674路径认证通过；PR10开放未合并，无新云端CI。

## 证据边界

当前没有新真实审核账号登录、App Store Sandbox服务器购买或真钱交易；本地SDK不替代这些结果。iPad模拟器为27.0，未安装审核员27.2。到期告警已实际部署／运行，没有重发通知投递演练。无Apple通过保证，不恢复Owner已停止的真机门；FanPass和原定价／实际数据保持。

## 唯一下一步

等待Owner决定恢复提交。收到指示后先核对具名审核登记、API和告警期限一致且未进入7天预警，再复用本地15候选继续；不要重复本轮修复、部署、测试、协议接受或旧索引提交。
