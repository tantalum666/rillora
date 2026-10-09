# October9直装、付款专项复核与完整双语

Status: IN PROGRESS — PHONE12 INSTALLED; REFUND FAILURE FIXED IN SOURCE, NOT YET DEPLOYED; LANGUAGE CLEANUP ADDED
Last updated: 2026-10-09 (Asia/Hong_Kong)

Owner要求先把修复版本直装原手机，再细查Web/iOS付款、退款等流程；随后要求中文/英文界面各自完整，移除中英并排、中文参考和英文优先提示。这取代旧的保留英文同意文案/仅给中文参考的展示决定；价格、真实数据、FanPass及暂停零碎TestFlight保持。

当前已完成：cfccbd3d4所含当前原生源码已编译/导出为development1.0(12)，12项签名/配置检查通过，原iPhone原位安装、独立读回12及启动成功。无卸载/账号切换/TestFlight。首次启动CLI参数位置错误已纠正，属Agent命令问题，不是App故障。

本轮151项服务器付款相关测试、11项Web检查通过；新增异步退款失败回归15项中14过/1失败，确认同一期已退款override在退款随后failed时无法清除。实际Stripe官方支持这一状态变化，需要直接修复并补生产/TEST同构验证，不能用既有成功退款测试代替。

原三审核身份及原Owner Sandbox资格只续期至2026-10-11T14:00Z；Auth0原会话恢复成功，Action只改期限/绑定不变，运行同模板期限更新UPDATE_COMPLETE，现有资格UPDATE一条/未新增身份或付款。最终runtime差异/健康读回继续。Preview本人登录单独恢复，不代造同意。

本轮边界：Stripe只用TEST、Apple只用Sandbox。不得真实卡Live测试，不动普通客户/正式收费/税务设置，不把测试证据说成零风险保证。真实资金及生产访问继续独立。

待完成：修复/复验退款失败；读取最新真实TEST/Apple服务器及手机状态，覆盖购买/价格/取消/退款/恢复/重试/去重/跨端；完成Web/iOS单一语言及法律/同意显示检查，集中直装最终修正；必要的受影响API/Web部署、文档和全量Git追加保存。

QA：output/qa/rillora-payment-recheck-20261009；原生包：output/release/rillora-payment-recheck-20261009。认证、真实provider原文和设备标识只保护存于.local-secrets/payment-recheck-20261009。沿用原完整Markdown阅读，本轮read ledger只补变化与任务文件。

## 付款修复源码检查点

异步退款失败已取得真实数据库红/绿回归：原15例中1例准确失败，修复后相关55例通过。共享Stripe解析器读取完整当期发票、付款、退款及争议状态，只有充分证据才能撤销旧退款override；保留其他已完成全额退款和未解决争议。TEST与Live复用解析器，不再复制退款逻辑。

同一问题也在隔离备份恢复对账中复现（5例中1失败），补齐明确退款逆转证据后相关31例通过。没有恢复后的完整provider证据时仍不放开权益。Web重购入口另改为按服务器是否仍可能续订判断，不让历史退款记录永久挡住新购；服务器重复订阅校验保留，前端增加同步操作锁。

原生英文目标下44通过/1既有StoreKitTest平台跳过。此前中文模拟器中的英文片段断言失败已保留，属于测试语言前提，不能写成17个付款逻辑故障；双语界面仍需本轮实际检查。Owner报告新手机包无需点击恢复已显示订阅；这不单独证明本轮Restore通过或新购发生，正在读回原订阅。

上述修复尚未部署；后续CI、线上状态和真实TEST结果单独记录。完整双语/法律同意展示尚未实施。
