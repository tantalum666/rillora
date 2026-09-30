# HISTORICAL — Before the September 19 Logo reset

Superseded by the Owner request to prioritize Logo design and revoke all previous Logo restrictions. Release and pricing evidence below remains dated evidence. Current task: [handoff](handoff.md).

# Rillora Current Handoff

Status: RELEASE PREPARATION ACTIVE; PRICE V3 DEPLOYED TO STAGING; APPLE ANNUAL CHOICE PENDING; LIVE SALES CLOSED  
Last updated: 2026-09-19 (Asia/Shanghai)

## 当前任务

按正式 Web+iOS 发布推进，保留现有 UI、自助服务和不招聘范围。Owner 最新决定：US$88.80/年、US$9.99/月，取代新购报价 68/7.99；Family 能力版本 2 不变。经营／商业登记按 Owner 要求暂缓，不追问、不视为已核验。实体设备保留此前排除及其证据缺口。[发布合同](release-readiness.md)，[当前价格](pricing-88-80-20260919.md)。

## 本次已完成

- **阅读**：92 份自有 Markdown、20,554 行、206 个正文分段全部完成，截断处补读；读取期间源文件未变。[完整阅读记录](../output/qa/rillora-release-readiness-20260919/full-read-completion.json)。
- **价格**：0061/0062 已按源校验和应用；新增价格版本 3，保留历史金额、供应商绑定与收据。Web/native 继续从共享 API 取价。独立 Rillora Stripe TEST 的 88.80 年付／9.99 月付 Price 已创建并回读；历史订阅对账仍使用原价。本轮没有完成新 v3 付款。冻结成本输入下复算通过 33 项算术检查。
- **发布验证**：API 179、Web 80、infra 20、发布预检单元测试 5 项通过；API32／migration definition25 部署完成，ECS 健康 1/1，待启动 0，42 项 HTTP／安全头／资源检查通过。数据库至 0062；Web 资源包 `430a74040cebd84049e01c0c0f1e5e1880176952b307f41b7e496930c5a3cdc0.zip` 与法律 Sites5 未变。未重跑原生构建、完整原生测试或本人登录。
- **依赖**：qs 6.16.0、API/infra Vitest 4.1.11、Web Browserslist 4.29.0 和 mapping 2.11.25；三项目最终 npm 审计均无已知公告。这不等于全面安全审计。
- **运维**：修复 CloudWatch 无权向 SNS 发布的真实缺陷，权限限定本账户四个告警。Owner 指定邮箱已确认订阅，测试 ALARM／自动 OK、真实缺心跳／恢复四封邮件进入 Inbox。15 分钟日程启用，实际定时调用 7/7 通过。缺心跳实测约 75.4 分钟，不能承诺 45 分钟最大延迟；监控目前只覆盖公开／测试端点。
- **Apple**：本人登录完成，免费／付费协议有效、银行可用、税表使用中。副标题、效率分类及英文版本文案已保存到未提交草稿，发布方式为手动。月付 US$9.99／HK$88 已保存并回读。

## 待答复与证据边界

Apple 完整价格表不支持精确 US$88.80，已向 Owner 提问选择 US$88.90（建议）、US$88.99 或 US$88.00，Web 保持 US$88.80。未收到选择前，Apple 年价仍是旧草稿 US$68；不得自行近似。后台 Apple Sandbox 仍映射 v1，需要在实际交易验收前做版本化对齐。目录配置不是 Apple 购买／恢复通过，也没有提交审核或正式收款。

复用 Chrome 的 Apple tab1082156570／browser2，只有真实操作证明过期才再认证；Stripe tab1082156441 为独立 Rillora TEST。连接器过期不等于浏览器过期，禁止使用关联另一个项目的默认 Stripe CLI。

尚无独立生产环境、普通用户正式购买闭环、生产恢复／删除保留实测、最终图标／TestFlight／App Review 或公开产品首发。原有普通 Simulator 和真实 A/B 撤销状态未变，未创建初始 Git commit、branch、stash 或 live charge。

## 唯一下一步

继续发布合同中的隔离生产环境／身份／恢复工作，保持公开销售关闭。若 Apple 年价答复到达，先按精确选择保存、回读并更新渠道价格记录，再回到这条发布主线。不要重启 UI 改版、未来功能或重复本次全库阅读。

## 恢复入口

上下文压缩后精简读 AGENTS、product、当前 handoff、最新决策及发布／价格合同和待改文件即可。[本次 QA](../output/qa/rillora-release-readiness-20260919/README.md)，[工作状态](../output/qa/rillora-release-readiness-20260919/work-state.json)，[运行证据](../output/qa/rillora-release-readiness-20260919/final-runtime-state.json)。[上一资产检查点 — HISTORICAL](handoff-history-20260919-before-release-preparation.md)。
