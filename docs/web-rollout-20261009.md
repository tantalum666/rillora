# Web实际部署与Preview版本补齐

Status: DEPLOYED; PUBLIC NAVIGATION VERIFIED; AUTHENTICATED PREVIEW ACCEPTANCE PENDING OWNER LOGIN
Last updated: 2026-10-09 (Asia/Hong_Kong)

## 任务与实际缺口

Owner指出www导航仍旧，并要求检查app.staging。上一轮PR2合并不是上线证明：实际www在1280px仍折叠菜单，Preview前端与API版本也不一致。本轮沿用CI100/43浏览器证据和部署授权，完成实际部署，保留价格、数据、FanPass与暂停零碎TestFlight的决定。

## 当前部署证据

| 环境 | 本轮实际结果 | 边界 |
| --- | --- | --- |
| www.rillora.xyz | RilloraPublicWeb UPDATE_COMPLETE；31/31线上文件SHA256匹配；1280中英桌面、390手机菜单/跳转、768平板通过 | 仅静态资源键变化，12资源与安全配置保持 |
| app.rillora.xyz | RilloraProductionWeb UPDATE_COMPLETE；86/86文件匹配 | 正式API16/schema0093保持；未续期原审核窗口或开启Live |
| app.staging.rillora.xyz前端 | RilloraStaging资源更新完成；86/86文件匹配 | 原会话实际看到重复My plan/语言控件消失、Family权益/USD88.99年价与中文指南 |
| Preview后端 | API38→39→40，当前1/1 HEALTHY、rollout COMPLETED；模板/运行参数除镜像外一致 | API40为后续Stripe修复；正式API未改变 |
| Preview数据库 | 原75迁移指纹一致，仅应用0076–0093共18项；最终93项指纹/TLS通过 | 未轮换运行凭据；原1天备份/PITR可用不是本轮恢复演练 |

前端来源为f82179e44所含已合并产品代码；API39来源6219c8296，API40来源8b1f91798。
当前镜像digest为`sha256:5761e248a42dbce9a5c8128e23bdd3533f9e81f4b8402954ce8c950a46fd4f6f`。
详细Stripe结果见[回调修复与购买验收](stripe-webhook-20261009.md)。

## 构建可靠性修正

AWS远程CA包从108增加到111根，导致原固定digest的构建下载失败。没有盲目改变信任：从保留Rillora镜像提取原批准108根，确认仍全部包含于官方当前包且Frankfurt三根不变，将原PEM固定到apps/api/certificates/rds。原SHA256与verify-full保持，镜像可重复构建。6219c8296的[CI37821282939](https://github.com/tantalum666/rillora/actions/runs/37821282939)三任务通过。

Agent初始资产辅助脚本误选AMD64，两次失败候选从未部署；活动基础设施本来已正确指定ARM64，不能把此操作错误算作Dot代码缺陷。官方Homebrew buildx仅通过本轮CDK_DOCKER包装器使用，未重设全局Docker配置或清理其他项目。

## 尚未证明

Preview旧API实测account/identity404，更新后代码/镜像已对齐；但原浏览器会话长时间空闲后真实401，数据库无可用浏览器会话。已让Owner在原账号页亲自确认并登录，不能代造本人同意、借用别的账号或把身份邮箱显示写成已通过。原账号active且1条事项保留；新登录后邮箱、套餐按钮与托管结账仍待本人登录。

原三正式审核身份期限仍2026-10-08T20:00:00Z（香港October9 04:00），本轮未延长，当前时间已过此门。Preview测试资格独立，不扩展正式访问。手机仍为源码35f37e1b2的本地1.0(11)，未重复安装或分发TestFlight。

## QA与接续

output/qa/rillora-web-rollout-20261009保存模板差异、逐文件核对、实际网页截图、迁移/构建成功及失败记录；output/release/rillora-web-rollout-20261009保存三套部署字节。原始认证/云端配置仅在受保护的.local-secrets/web-rollout-20261009，不随Git发布。既有完整Markdown阅读按reading.json续接，不重启全库扫描。下一步以[当前交接](handoff.md)为准。
