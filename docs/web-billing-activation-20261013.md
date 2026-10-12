# Web正式订阅收尾：明确关闭自动计税

Status: IMPLEMENTATION IN PROGRESS / LOCAL TARGETED CHECKS PASS / NOT DEPLOYED
Last updated: 2026-10-13 (Asia/Hong_Kong)

Owner在询问Stripe已配置为何不能订阅后明确“忽略掉计税策略”。计税策略、Stripe Tax设置和登记状态不再作为本次Web订阅工作的前置条件；保留USD88.99年费，不捏造reviewed_no_collection评估、登记号或免税事实。此决定取代上一只读状态说明中继续等待税价策略才能推进的下一步。

实现选择：显式tax.mode=disabled，托管Checkout发送automatic_tax.enabled=false，沿用当前商品税分类和原价格。未配置默认值仍失败关闭；已明确关闭自动计算时允许现有Stripe价格的unspecified税行为，不要求为此修改价格／创建新报价。商户、正式环境、金额币种年期、订单归属、独立条款接受、幂等、回调验签和重复续订保护保留。

IaC新增明确live模式与独立Checkout开关；默认closed／review不变。live仅现有Rillora账号，要求已准备身份服务、保留清理与正式通知；拒绝review与live并用、测试购买面、错误账号或缺失前置。现有DB、密钥、网络和真实内容不替换，Apple审核秘密保留作历史恢复，不交给live API。当前都是源码候选，尚未切换云端。

已新增并通过19项Stripe单元／合同和11项生产基础设施检查，两侧typecheck通过。仍补实际路由／目录启用边界、受限运维操作及切换证据，完成后才记录生产结果。原支付／退款生命周期、手机14与CI133仍是旧检查点，不能算新源码已部署。不发TestFlight，不为验收制造Live自付交易或删除既有测试记录。

本轮QA为output/qa/rillora-web-billing-activation-20261013；先前只读事实在[状态说明](live-configuration-20261009.md#october13-当前为什么还不能订阅)。仅复用已有完整阅读账本，继续补读将变更的当前源码／规范，不重新进行全仓审计。

## 候选补齐

目录工具只允许inspect／activate／close-new-sales，绑定现有生产库、GLOBAL_US Web路由、Family-v2／年价v4及原Stripe账号；写入前比对只读检查指纹，事务内设置单一当前目录和Free1／Family5执行开关。保留其他价格、iOS渠道、未来权益和所有用户／资金记录；关闭新购不撤销历史权益。运行器通过固定维护broker及固定镜像命令，不能传入任意SQL、主机或凭据。

19项Stripe／合同、16项生产账本路由、4项目录及11项生产IaC检查已通过，维护broker9项与原生条款模板检查也通过；最终必要CI另记。Auth0管理CLI实际过期后复用同一浏览器会话，逐项核对新旧权限相同再续期，未增加权限或要求Owner重复认证。现有生产Action还含原生条款证明逻辑，切换时将保留这部分，不能直接删除整个Action。
