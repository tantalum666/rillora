# 下一版本 MCP 托管验收前置核对

Status: READ-ONLY PREFLIGHT / REOPENED AUTH0 DASHBOARD PASSWORD STEP PENDING / NO NEW HOSTED RUNTIME
Last updated: 2026-10-16 (Asia/Hong_Kong)

接续[官网已发布与搜索提交](public-discovery-rollout-20261016.md)后的唯一下一步：独立HTTPS环境中完成Web选择授权、实际AI连接读取与撤销。沿用[已通过的两客户端OAuth](ai-oauth-validation-20261016.md)，不把它重复安排为新工作，也不动当前App14审核环境。

## 实际核对

October16 21:06香港时间，原Auth0管理API再次只读成功；管理浏览器也进入原租户Home。9个普通应用加1个global记录，4个旧开发应用的grant_types为空，4个生产用途应用仍在，另有Default App。这里只记录必要的名称／类型／数量，未公布client ID、回调、凭据或原始管理响应。旧开发应用已停发不能成为顺手重用的验收身份；Default App没有回调也不证明可无条件删除。

[Auth0实体限制](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/entity-limit-policy)当前列明Free最多10个Applications。该文档同时区分实体上限与套餐权益，不能把价格页的营销表述当作无上限。按当前Free配置，原租户只有1个普通应用余量；全新的Web第一方登录及一个独立第三方AI客户端至少需要2个同时存在的登记。此前单客户端顺序临时测试已经完成，不能冒充托管产品的长期并存设计。

[官方多环境说明](https://auth0.com/docs/get-started/auth0-overview/create-tenants)支持以不同租户隔离开发／测试／生产。当前优先核对独立EU开发租户的实际免费条件；此为Agent的候选技术路径，尚未创建租户、升级套餐、增加管理员或改变原登录配置。独立测试租户也不自动解决以后正式用户跨平台接入的身份与容量安排。

当前AWS入口只有既有staging／production／public等栈，没有专用AI候选栈或MCP部署参数；公开www的/mcp继续404。后续须明确单独运行服务／数据库／密钥／恢复日志边界，不将全新候选直接指向审核数据库或退役Preview客户端。现有0104—0105与broker的安全切换顺序保持。

## 当前阻塞与执行边界

Auth0 Dashboard的Quota Utilization／Create Tenant入口进入独立Auth0 Teams登录。原管理CLI没有过期；Teams要求原邮箱的单独验证，页面出现空白验证框，Cloudflare Turnstile组件记录加载错误，重载后仍没有完成验证。仅填写原有登录标识，未进入新租户配置或接受新协议。已将该具体页面交Owner本人处理；不把它描述为AWS／Auth0管理权限又失效，也不通过关闭验证或改用其他身份绕过。

恢复后先核对实际免费套餐／租户数量和EU区域，再完成可复核的隔离部署方案与启用；如出现新的绑定协议、实际付费或新增安全授权，按页面的具体动作处理。不能因为正在等待验证就改动正式连接、删除旧应用或降级OAuth。

Owner随后要求“重新打开一下”。旧验证标签已经不在当前浏览器；重新从已知原Dashboard入口打开后，网站确实要求登录，已填写原邮箱，实际停在Enter Your Password并保留供本人操作。管理CLI的成功证据不受影响；这次浏览器入口验证完成后再进入Teams，不重复此前已完成的CLI设备授权。

## 证据

当轮 output/qa/rillora-ai-hosted-preflight-20261016 的只读容量与页面状态为新证据；没有新产品测试、OAuth重跑、模型调用、数据库迁移、运行部署或TestFlight。公开的精简回执随本轮Git收尾保存，原始管理响应和登录截图留在受保护目录。当前只有准备结果，不是已建候选。
