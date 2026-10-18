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

价格、收费、真实数据、FanPass及在审App14保持，未发TestFlight。原合成Cloudflare环境保持原样，目录、平台批准和实际模型使用分别取证。正式浏览器确实未登录，已询问当前条款及原Google登录确认，尚未选择真实事项给AI。Auth0管理CLI另已过期、一次续期被拒；客户运行复用现有Web登录，不依赖该管理会话。

## 唯一下一步

完成API切换读回，再发布并核验正式Web与公开安装包；Owner完成必要登录确认后，用合成事项补正式客户端授权／工具调用／撤销，同时核对Google子地图结果，最后封存本轮新增证据并推Git。当前QA在output/qa/rillora-customer-mcp-20261018，正在执行的云端操作先查已有回执，禁止重复提交。
