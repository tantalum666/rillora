# 正式MCP、Google地图及Registry交付

Status: LIVE ACCEPTANCE AND LOCAL ARCHIVE VERIFIED / REMOTE READBACK PENDING
Last updated: 2026-10-18 (Asia/Hong_Kong)

Owner要求普通用户真正可用，保持当前审核并推Git。本目录保存当次新增工作，完整阅读链见[reading](receipts/reading.json)；更早的1—47归档不重复封存。当前合同见[正式MCP](../../../docs/architecture/customer-mcp-20261018.md)与[Google地图](../../../docs/architecture/google-sitemap-20261018.md)。

| 实际结果 | 可读回执 |
| --- | --- |
| 官网66文件交付、旧页面保持 | [逐文件HTTP](receipts/public-live-http.json)、[部署验证](receipts/public-live-verified.json) |
| Google中英文各14URL成功处理 | [真实GSC读回](receipts/google-readback.json) |
| 103→106迁移、68旧表指纹及权限保持 | [前后比较](receipts/production-migration-comparison.json) |
| 独立OAuth秘密受保护保存 | [秘密安装边界](receipts/oauth-secret-installed.json) |
| 精确Host修正与公开issuer交付 | [Host结果](receipts/hostfix-verified.json)、[API部署](receipts/canonical-deployment-verified.json)、[公开发现](receipts/canonical-live-endpoints.json) |
| 正式Web及单语言标签最终89文件 | [精确交付](receipts/web-language-deployment-verified.json)、[逐字HTTP](receipts/web-language-live-http.json)、[浏览器标签](receipts/web-language-browser.json) |
| 真实Codex模型调用、选择范围及立即撤销 | [综合验收](receipts/codex-production-acceptance.json)、[模型回执](receipts/codex-consumer-model.json)、[撤销后客户端](receipts/codex-after-revoke.json)、[凭据清理](receipts/codex-credential-cleanup.json) |
| 当前Codex从正式下载包解析插件 | [实际解析器](receipts/customer-plugin-parser.json) |
| 官方Registry发布及公开active | [独立验证](receipts/registry-verification.json)、[公开读回](receipts/registry-public-readback-v0.json)、[DNS保持](receipts/registry-dns-applied.json) |
| 源码CI186三任务通过 | [CI](receipts/language-source-ci.json) |
| 新归档本地认证及完整目录 | [本地验证](archive-verification.json)、[逐文件目录](catalog.json)、[快照](snapshot.json) |

Archive48保存439条新路径、318个唯一对象、5,390,797密文字节，包括最终与初次Web产物、独立官网、最小部署模板、失败／修正记录、受限模型结果与安全截图。实际密钥、令牌、Cookie、能力URL、个人账号截图和数据库备份没有进入Git；生成的依赖／资产缓存及第三方源码副本按清单排除。

![正式Web撤销后状态](images/codex-revoked-ui.png)

公开登记不等于OpenAI／Claude商店批准；Codex实际任务不代表所有消费端通过；Google发现28URL不代表全部收录、排名或推荐。生产令牌到期刷新未在这次真实客户端会话单独触发，HTTP协议／先前候选刷新结果保留原证据范围。当前App14、TestFlight暂停、原事项、价格、收费及FanPass均保持。

远端独立下载／解密核验及最终CI在本次推送后追加，不能由本地归档通过推导。晚于加密捕获的回执作为普通Git增补，不重封archive48。
