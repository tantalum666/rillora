# October16 真实OAuth准备

Status: MANAGEMENT LOGIN VERIFIED / EXACT CODEX REQUEST VERIFIED / ADDITIONAL CONNECTION PERMISSION PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)

本轮沿用[上轮完整阅读与测试](../ai-acceptance-20261016/README.md)，继续[真实平台验收](../../../docs/architecture/ai-integration-acceptance-20261016.md)。原有AWS／Auth0登录已恢复；阻塞是新增隔离连接管理权限，不能写成登录失效。

- [专用资源准备](receipts/auth0-preparation-result.json)：新建一个公共第三方native客户端和900秒API，现有资源／配置不变。
- [Codex实际请求](receipts/codex-authorization-request.json)：完整loopback回调、准确resource、两scope、S256，无secret；未交换token。
- [隔离本地夹具](receipts/fixture-boundaries.json)：两条加密合成事项，只选择一条；bootstrap开发REST关闭，持久监听仅本机MCP。不是生产KMS或实际用户同意证据。
- [清理](receipts/local-cleanup.json)：本机规划者清零、临时角色删除、监听停止；只注销新测试MCP条目，不注销Codex主登录。新Auth0客户端／API暂时保留，不能授权读取。
- [实际阻塞](receipts/continuation-status.json)：第三方绑定普通connection被400拒绝；独立合成connection创建缺create:connections，未创建用户或密码。
- [最终提供方回读](receipts/provider-final-readback.json)：原客户端／API／连接绑定哈希均一致；新client grant为0，合成connection不存在。
- [既有CI161](receipts/ci161.json)成功；[本次源码扫描](receipts/source-scan.json)、[脚本语法](receipts/script-syntax.json)和[阅读记录](receipts/reading.json)分别列出范围。没有重跑560等原产品套件。

本轮没有获得真实OAuth／工具读取／撤销／模型选工具证据；不重复旧传输证据或宣称所有平台已接入。原Google身份仅作定向核对，没有读取真实事项；后续改专用合成身份。正式服务、数据、价格、收费开关、App14审核、FanPass保持，无TestFlight。

[保存目录](preservation.json)逐文件保留本轮无凭据JSON与操作脚本原字节。originals中的.reference.txt是有日期的执行资料，包含失败／未运行分支，不是新执行指令，不能直接当部署脚本。认证截图、登录URL和原始管理数据不进Git；此次没有新的可发布二进制，直接保存安全文本，不重复封存或下载archive1—41。

[文档链接核对](receipts/markdown-links.json)及[新增可读材料扫描](receipts/readable-scan.json)通过；[收尾范围](results.json)记录更新的规范、决策、交接与旅程。

当前唯一下一步见[handoff](../../../docs/handoff.md)：完成已准备的create／delete connections追加授权，再继续隔离真实OAuth。追加权限未确认前不继续依赖操作。
