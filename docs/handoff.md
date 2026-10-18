# Rillora 当前交接

Status: GOOGLE INDEX PROCESSED / CUSTOMER MCP ROLLOUT IN PROGRESS
Last updated: 2026-10-18 (Asia/Hong_Kong)

## 当前任务

Owner要求补齐Google地图及MCP／插件剩余接入，做到普通用户真正可用，不停留在测试环境；保持当前审核，完成后推Git。这取代[营销交接](handoff-history-20261018-before-customer-mcp.md)的下一步。沿用完整阅读链和已过验证，当前合同见[正式MCP](architecture/customer-mcp-20261018.md)和[地图修复](architecture/google-sitemap-20261018.md)。

## 已完成与正在执行

AWS原会话确实过期；Owner已完成MFA，操作员和部署角色STS均有效，后续复用。三套现有栈均UPDATE_COMPLETE，原配置已受保护保存。

官网5c98e6c6b／CI181已完成三阶段独立发布：原页面和脚本不变，66文件与线上规范URL匹配，原分发／桶／上传身份保持。新索引只提交一次，Google详情实际显示“已成功处理站点地图索引”；发现数仍0，不能冒称文章收录。

正式MCP实现aa1864fbd／CI182、静态包校验修正bbde68a2e／CI183均三任务成功。API580、基础设施68、聚焦授权33、配置生成6项通过；授权界面中英文切换、默认未同意、范围变更清除同意和安装入口已用合成界面验证，额外16项交付基础设施检查通过。生产构建提供7客户端配置下载，不依赖私有Git仓库。

准备栈已部署，原API／删除worker镜像保留；加密生产快照可用。固定broker已完成原子迁移103→106及前后核验：原103校验和、68张表的数据指纹和角色设置完全保持，新增3张空AI表。强制RLS与内容加密通过。新OAuth配置直接写入精确AWS秘密，无本地明文。API启用变更集已逐项复核，Web变更集已准备；实际执行和完成状态以本轮QA回执为准。

## 边界

价格、收费、真实数据、FanPass及在审App14保持，未发TestFlight。原合成Cloudflare环境保持原样，目录、平台批准和实际模型使用分别取证。Owner已经当场确认当前条款，原Google登录已实际复用成功，仅有一条明确合成事项可供本次验收，尚未向AI授权。Auth0管理CLI另已过期、一次续期被拒；客户运行复用现有Web登录，不依赖该管理会话。

## 唯一下一步

API、Host映射及Web已完成交付：7客户端授权起点通过、MCP匿名401、非法Origin403、89静态文件及3条公开发现路由匹配。真实Codex发现OAuth端点仍动态指向内部Host／路径；当前唯一下一步是交付公开issuer上下文修正，再用已登录账号的合成事项完成真实客户端授权／调用／撤销，核对中文地图并封存推Git。英文子图已被Google成功解析14URL；中文子图也只提交一次，结果待读回。本轮QA位于output/qa/rillora-customer-mcp-20261018。不要重复迁移、备份、官网发布、已过检查或同一条款确认。
