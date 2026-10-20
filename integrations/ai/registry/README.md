# Rillora 官方MCP Registry登记

Status: PUBLISHED / PUBLIC READBACK ACTIVE
Last updated: 2026-10-18 (Asia/Hong_Kong)

[server.json](server.json)已作为`xyz.rillora/rillora`版本`0.1.0`发布；[官方公开记录](https://registry.modelcontextprotocol.io/v0/servers/xyz.rillora%2Frillora/versions/latest)读回为active。

这里发布服务元数据和普通用户的安装入口，不发布私有应用源码。服务仍要求对应的已登记OAuth客户端、登录和逐事项同意；未开放任意动态注册。用户从[正式账号设置](https://app.rillora.xyz/account?next=ai-connect)或[双语接入包](https://app.rillora.xyz/integrations/rillora-ai-v1.zip)选择自己使用的平台。

使用[官方DNS认证](https://modelcontextprotocol.io/registry/authentication)：仅新增一条`rillora.xyz`根TXT公钥证明，原36条DNS记录保持。独立登记签名key经Owner既有age身份加密保存于被Git排除的本机秘密目录；短期Registry令牌只在内存使用。后续版本先更新本文件、验证新metadata，再按官方协议签名发布；不要把私钥放在命令行、环境、源码、聊天或仓库中，不重复发布同一版本。

本次按官方publisher源码使用`/v0/auth/dns`、`/v0/publish`及`/v0/servers/.../versions/latest`；文档示例中的v0.1搜索请求本机超时，独立v0公开读取成功。完整回执保存在本轮QA及其Git证据追加包。

官方Registry目前仍标preview。此登记帮助技术目录发现服务，不代表ChatGPT／Claude商店审核、所有客户端兼容或AI自动推荐。实际Codex模型／撤销证据与其他平台限制见[正式接入合同](../../../docs/architecture/customer-mcp-20261018.md)。
