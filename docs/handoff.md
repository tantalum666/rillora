# Rillora 当前交接

Status: CUSTOMER MCP LIVE / CODEX MODEL AND REVOCATION PASSED / GOOGLE 28 URLS / REGISTRY ACTIVE
Last updated: 2026-10-18 (Asia/Hong_Kong)

## 当前任务

Owner要求补齐Google地图及MCP／插件剩余接入，做到普通用户真正可用，不停留在测试环境；保持当前审核，完成后推Git。这取代[营销交接](handoff-history-20261018-before-customer-mcp.md)的下一步。沿用完整阅读链和已过验证，当前合同见[正式MCP](architecture/customer-mcp-20261018.md)和[地图修复](architecture/google-sitemap-20261018.md)。

## 已完成

AWS已复用Owner完成的MFA；没有再次要求登录。正式API、Web与独立官网切换完成，原配置及加密生产备份已保留。

官网5c98e6c6b／CI181完成独立发布：66文件与线上规范URL匹配，原28语言页面及脚本不变。Google新索引及中英文子图各只提交一次，均实际成功处理，两个子图各发现14URL；合计28，不等于文章收录或AI推荐。Bing原Success／28URL沿用。

正式MCP实现aa1864fbd／CI182、交付修正bbde68a2e／CI183、Host映射1b96a114f／CI184、公开issuer修正c6beccfde／CI185均通过并交付。API580、infra68、聚焦授权33、配置生成6、界面20及针对性代理27项按各自原检查点保留。Web89文件及3条发现路由核验；7客户端配置和双语安装说明可公开下载，不需要私有Git或管理员发令牌。

固定broker完成原子迁移103→106；原103校验和、68张表指纹／计数和角色设置保持，新增3张AI表，强制RLS／内容加密通过。OAuth秘密直接写入专用AWS秘密，无本地明文。后续只替换API镜像，未重复迁移或变动维护／身份worker。

Owner当场批准只授权合成事项Release acceptance 2026-10-01给Codex。真实客户端完成OAuth及模型两工具调用，返回选定摘要和通用缺项；不含邮箱／备注／其他事项。随后立即在Web撤销，同一已存凭据的连接被拒绝，工具列表为空；测试alias已登出。当前Codex解析器也从正式下载包识别插件，但不冒称公开商店安装。

官方MCP Registry已发布xyz.rillora/rillora@0.1.0，独立公开GET为active。仅增加一条公开TXT证明，36条原DNS记录保持，四个解析器读回；签名key经Owner既有age身份加密验证，未在命令或文件中留下明文。语言标签修正46d745bf4／CI186已单独发布，实际89文件匹配，Chrome中文标签不再并排英文。构建与4项聚焦检查通过；原API、路由、桶、价格／收费不变。

## 边界

价格、收费、原事项、FanPass及在审App14保持，未发TestFlight；Owner此前取消的真机验收不恢复。合成Cloudflare环境未升级为客户环境。ChatGPT／Claude消费端及其余模型会话、各平台商店批准、搜索排名／获客未由Codex或Registry结果证明。Owner没有Claude官网账号，不要求注册／付费。Auth0管理CLI另已过期，不影响复用现有Web登录的客户运行。不得复用Apple审核密码给新AI平台，也不得扩大本轮无邮箱的Codex授权。

## 唯一下一步

完成本轮新增证据包的GitHub独立下载／解密核验后，转入OpenAI消费端目录材料／演示与平台提交；不重做已过OAuth、Google、迁移、付款、原生或本人确认。本轮QA：output/qa/rillora-customer-mcp-20261018。其他平台按现有矩阵推进，不为覆盖率新增付费账号或假称商店批准。
