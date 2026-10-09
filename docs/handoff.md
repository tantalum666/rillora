# Rillora 当前交接

Status: PHONE13 OWNER ACCEPTED / API20-42 SCHEMA94 AND FOUR WEB SURFACES DEPLOYED / STRIPE ASYNC REFUND ACCEPTANCE IN PROGRESS
Last updated: 2026-10-10 (Asia/Hong_Kong)

## 当前任务

Owner要求把集中修正直装手机，再严查Web/iOS付款退款；随后明确中文/英文各自完整，不显示并排翻译、中文参考或英文优先提示。保持价格、真实数据、FanPass和暂停零碎TestFlight。当前执行合同：[付款与双语专项](payment-recheck-20261009.md)。

## 已完成与边界

- 新源码eaf68c0a7已编译development1.0(13)，14签名/配置检查、原iPhone原位安装/版本读回/启动通过；Owner确认“已经订阅、港币888、没有夹杂英文”。未分发TestFlight；不冒称新的Restore点击或新Apple购买。
- 本轮API付款相关151、Web11通过。随后新增异步退款失败红例已修复，含备份恢复的相关55/31检查各自通过；Web历史退款挡重购也已修正。615bf1322已经推送且CI108通过；两套云端同模板更新UPDATE_COMPLETE，运行/静态文件及新真实TEST结果继续独立核验。
- 同三审核身份及原Sandbox资格有限续到2026-10-11T14:00Z；Auth0只改期限，运行同模板更新完成，资格只更新原一条。API18已完成最终云端健康/差异读回，较17仅期限改变。
- Stripe TEST与Apple Sandbox测试；无真钱测试、正式开售或普通用户开放。原Live目录/通知与云端TEST完整结果沿用，旧记录见下方历史交接。
- 新语言要求取代旧英文同意/中文参考展示规则；具体实现和受影响法律同意证据需要同步核对，不改写既有收据。
- 真实Apple只读记录确认原Sandbox订阅、HKD888/HKG签名记录及新客户端同步；无本轮新订单。Owner报告未点恢复已显示订阅，不等于新的Restore点击验收。
- 双语源码覆盖七份法律文件、同意、登录参数、Stripe结账/门户、可读导出和预演。94迁移两库校验通过；API20/Preview42健康，三套Web203公开文件逐项匹配，法律Cloudflare新部署50HTTP/18资源/14双语页面核验通过。eaf68c0a7的CI111三任务成功，441API/55infra。
- Auth0启用en/zh-CN，两个新同意表单及两条Action已发布并读回，原绑定/三身份/期限保持。CLI缺少update:forms，改用现有已登录控制台导入，无新增权限；原英文Form未修改、保留回退。桌面登录外壳的3句旧英文仍被套餐402锁住，中文模板已准备，尚未向外发送支持请求或购买套餐。
- Owner已当场同意新条款并允许复用原Google登录；真实Preview已回到原1事项。当前Stripe TEST中文取消未付款订单/拒付/成功付款/家庭版、中文Portal取消及英文Portal恢复已核对。Stripe目录固定英文名称/说明改为语言中立品牌Rillora/空描述；TEST及Live仅展示字段变化，价格/税务/账单名称/销售门保持。
- 官方5126测试卡退款已从succeeded转failed（expired_or_canceled_card），退款金额归零；Rillora先Free、后恢复Family及原已付周期的实际界面已读回。只提交一次USD88.99 TEST退款，未产生真钱。当前新TEST订阅仍active，需在后续边界检查中按精确ID清理；不要重复该退款。精确provider对象只在本轮.local-secrets保存。

## 唯一下一步

先交付待处理退款的新服务器修复：7726真实部分退款pending已经增加Charge累计退款金额；新增红例6个准确复现过早全额判断，修复后70项通过。第二张独立TEST付款目前仅退款USD10，剩余USD78.99尚未提交，待新镜像验证全额pending/成功及清理。之后补齐回调/数据库证据、Auth0旧外壳的受支持后续及全量Git追加归档。5126用例已通过并结束，手机13/四站/94迁移/新同意不重复。

[上一交接](handoff-history-20261009-before-payment-recheck.md)为HISTORICAL，不重开其已完成工作。
