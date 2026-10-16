# October16 真实OAuth与撤销验收

Status: TWO CLIENTS VALIDATED / TEMPORARY RESOURCES CLEANED / SOURCE DELIVERY IN PROGRESS
Last updated: 2026-10-16 (Asia/Hong_Kong)

[验收合同](../../../docs/architecture/ai-oauth-validation-20261016.md)记录实际范围。Owner完成追加连接权限后，Codex与Gemini使用独立合成账号和不同客户端完成真实Auth0授权；既有正式连接未变。

- [汇总](receipts/completion-results.json)：签名／issuer／audience／client／scope、选定事项读取、未选项／备注隔离和同一未过期token撤销。
- Codex由实际app-server执行OAuth并发现两工具；Gemini由该版本原版导出的OAuth函数执行真实流程，随后实际CLI读取临时加密缓存并返回Connected。工具读取／撤销由官方MCP SDK驱动，不冒称模型选工具、交互/mcp auth或消费聊天产品已验证。
- [实际修复](receipts/codex-duplicate-resource.json)：重复resource被Auth0拒绝；生成器删掉冗余覆盖，修正后实际请求只含一个规范resource。服务器校验保持。
- [清理回读](receipts/provider-cleanup.json)：本轮两个客户端及grants、合成用户／连接／API全部删除；原应用／资源／绑定与完整租户配置一致。两轮本机数据／角色／监听和临时凭据清理另见目录。
- [AWS续期](receipts/aws-candidate-restored.json)：复用原有效控制台会话，无需Owner再做MFA，部署角色STS成功。只有只读准备，没有云端变更。
- [失败与纠正](receipts/attempts.json)保留驱动问题及CI163证据清单漏同步；应用测试已通过，不以旧CI代替新提交结果。
- [阅读链](receipts/completion-reading.json)沿用原完整阅读；不重跑原560等产品套件或已过的购买／手机／部署检查。

[源码配置检查](receipts/client-package-regression.log)2项通过。此轮原件只新增或更新此前未保存的材料；旧archive1—41和上一轮普通Git原件保持。登录URL、code、token、密码、原始管理对象和认证页面截图排除；完成回调截图已人工核对，仅含完成文字。新的原件归档／本地及独立远端校验另附回执。

当前仍未完成：公网HTTPS候选、托管Web选择授权到AI、模型自动选工具、消费端／目录、官网部署及搜索索引。当前App14、正式服务／数据／价格／收费／FanPass保持，无TestFlight。

本轮新增[archive42](snapshot.json)保存44路径／38对象／119,709密文字节，[本地完整认证](archive-verification.json)通过；[目录](catalog.json)可定位原件。旧1—41及上一轮已保存文本不重封、不重下。最终Git／CI／远端回执在冻结之后普通补交。

完整可读清单已补齐：[发布检查](receipts/completion-publication-check.json)覆盖12,513文件，扫描0未知；[Markdown检查](receipts/completion-markdown-links.json)621链接通过。此回执加入后再次刷新清单，既有规则及例外不变。
