# Rillora 当前交接

Status: VNEXT SOURCE PUSHED / CI161 VERIFIED / ADMIN LOGINS RESTORED / REAL OAUTH BLOCKED ON NARROW CONNECTION PERMISSION
Last updated: 2026-10-16 (Asia/Hong_Kong)

## 当前任务

Owner要求先完成官网GEO／SEO，再推进MCP与各平台接入；新功能留给下一版并推GitHub，不影响App1.0(14)审核。工作目录 /Users/tantalum/Documents/电子遗嘱app，分支 codex/ai-discovery-vnext-20261015。发布工作树仍在fec1ad3b，未合并main、部署或发TestFlight。[前份交接](handoff-history-20261016-before-real-oauth.md)为HISTORICAL。

## 已完成

- [官网与MCP实现](architecture/ai-discovery-implementation-20261015.md)：20页双语公开HTML、两篇文章、两只读工具、选定范围／7天授权／即时撤销／恢复失效。两个开关默认关闭；既有560等本地结果不重跑。
- [平台接入续验](architecture/ai-integration-acceptance-20261016.md)：当前Codex兼容包已实际解析为一个服务；Codex／Gemini实际本机连接通过，原结果使用合成签名身份，不能冒充Auth0或模型选工具。archive40／41已各自独立从GitHub下载认证。
- 既有11b62244e的CI161成功；源码436af7a07的CI160及前CI158／159保留。本轮文档／脚本回执08ef68cf4已推送，远端32文件Git对象指纹匹配；CI162回读时运行中，最后回执普通Git补交。
- AWS管理登录已恢复；Owner随后完成Auth0登录，租户设置／客户端／资源三个真实GET均成功。旧验证码／会话错误已关闭，不再要求重复登录。
- 真实OAuth准备：Auth0原本已启用resource参数compatibility；新建一个目的限定公共native客户端和一个loopback测试API，900秒、RS256、两只读scope、不开refresh／M2M。现有客户端、API、连接绑定和租户设置逐项保持。
- Codex实际生成匹配resource、两scope、S256且无client secret的授权请求，准确回调已登记。独立本地加密合成库和仅loopback MCP监听已启动验证准备，随后清理到0规划者／0临时角色并停服务；未交换Auth0 token或调用模型。

## 当前阻塞与边界

Auth0第三方客户端只能用域级连接，不能逐个绑定普通连接；现有三条均未提升。为保持正式登录原状，改用独立合成数据库连接和合成账号做真实OAuth。创建请求被CLI明确拒绝：缺少 create:connections；没有新连接或新用户产生。

已准备只增加 create:connections／delete:connections 的CLI授权，后者用于清理同一测试资源。当前Chrome实际停在Auth0 CLI设备确认，工具点按未推进，已交Owner当场完成；这不是原登录过期，也不是要求重新批准项目工作。追加权限未取得，不能假设成功。待建账号密码只通过本机0600命名管道传递，不保存明文文件；本轮尚未生成该密码。

新增临时客户端和API保留在Auth0，回调已填，但没有可用域级连接或用户client grant；不能称作已接入。登记标识在 .local-secrets/ai-oauth-20261016/registration.json；所有认证URL／管理原始响应／身份资料均不发布。操作脚本与脱敏回执在 output/qa/rillora-ai-oauth-20261016；[本轮可读保存](../collaboration/verification/ai-oauth-20261016/README.md)逐文件保留安全文本，认证材料排除。

生产API／数据库／官网／App14／WebUSD88.99／AppleUSD119.99及HKD888／收费开关／FanPass保持。Google原身份只做过定向核对，没有读取真实事项或送交AI；改合成身份后不再使用其本机映射。官方目录、公开部署、搜索索引／推荐结果和消费聊天端均未完成。Owner取消的真机与暂缓的Auth0外壳不重启。

## 唯一下一步

确认本次Auth0追加连接权限完成后，创建并核对独立合成登录连接及用户委托grant，恢复本机服务，执行Codex真实OAuth／选定范围读取／撤销，再按免费名额逐个回收并验收下一客户端；最后保存本轮新证据。只清理本轮目的标记资源，不改现有正式登录配置。
