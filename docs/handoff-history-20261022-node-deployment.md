# HISTORICAL — development baseline handoff

Preserved on 2026-10-22; superseded by [current handoff](handoff.md).

# Rillora 当前交接

Status: NODE SECURITY CONTAINER DEPLOYMENT COMPLETE
Last updated: 2026-10-22 (UTC)

## 当前任务与完成

已完成Owner批准的Node22.23.4窄范围升级、staging先行与production滚动部署。源码[PR5](https://github.com/tantalum666/rillora/pull/5)合并为4347d7db803388a8f1308f76adcc9348b66d6584，三个必需PR检查及main216均成功。云端API588／Web198／infra68等结果沿用原检查点，没有在本机重做整轮开发。

[完整部署交接](qa/node-security-deployment-20261022/README.md)保存当前七类消费者、三种实际应用基线、前后镜像／任务定义、实际change-set模板核对、健康、失败与恢复记录，以及只恢复镜像的可执行回滚步骤。两栈均UPDATE_COMPLETE；四个常驻服务各1/1、pending0且COMPLETED，两API健康；公开检查7/7通过。Production API32、删除worker8、migration27、recovery28；staging API45、worker2、migration38。维护任务只更新定义，未执行。

## 验证与保留边界

四个运行任务的实际digest与ECR精确digest拉取并在本地只读／断网执行的Node22.23.4 ARM64镜像一致。ECS Exec原本关闭并保持关闭，未直接在远程任务内执行版本查询。删除worker没有容器健康检查，UNKNOWN是既有配置；不冒称实际删除功能已测试。四个AWS托管Node22 Lambda的更新模式／补丁版本读取受现有权限限制，仍未知；Cloudflare兼容运行时独立、未改变。

实际模板除七处Image外完全一致，所有参数保留原值；任务定义非镜像配置一致。CloudFormation同步了现有服务、maintenance broker和策略中的任务引用，没有直接权限扩展。三组应用package／依赖／dist／migrations／证书文件逐项相同；未改数据库、schema、功能开关、价格、Apple审核／手动发布、Web产物或未来功能。schema106是既有记录，本轮未查询／迁移数据库。没有新服务、收费runner、长期凭据或Mac Node升级。

## 唯一下一步

本次容器部署工作完成。后续按Owner指定的下一任务继续；不重开已完成原生／付款验收或自动发布未来功能。当前部署交接提交的实际GitHub检查与结果记录在关联部署PR，push本身不作为CI成功。原[源码待部署交接](handoff-history-20261022-node-source.md)和[上一轮Git整合交接](handoff-history-20261022-before-node-security.md)仅保留为HISTORICAL。
