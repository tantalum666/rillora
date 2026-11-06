本文件保留当时检查点，已由 [当前交接](handoff.md) 和 [购买归属修复](apple-owner-latency-20261101.md) 取代。

# HISTORICAL — 手动购买前交接（2026-10-31）

Status: API AND WEB DEPLOYED / REAL WEB AND STRIPE VERIFIED / OWNER MANUAL NATIVE ACCEPTANCE / RESUBMISSION HELD
Last updated: 2026-10-31 (Asia/Shanghai)

## 当前任务

Owner恢复AWS／Stripe／Mac验证后授权继续部署和真实购买验收，最终提审／TestFlight仍暂停。随后因镜像操作太慢，Owner明确改为自己手动操作；Agent停止镜像点击和输入，仅准备系统剪贴板与清晰步骤。当前合同见[正式产品复查](release-product-audit-20261031.md)，部署过程交接已移入[HISTORICAL记录](handoff-history-20261031-before-manual-purchase.md)。

## 已完成

- 复用源码26b68e066、冻结API镜像45bd2d47和三套Web，没有重新构建、重跑业务套件或重装原生16。PreviewAPI／Web、正式API／Web及官网全部部署／读回；两服务1/1healthy，所有参数保持，资源身份一致。生产维护Lambda与IAM条目只是相同模板的动态引用，无权限正文修改。
- 三套289个候选文件：48变化文件实际HTTP取回，241未变文件沿用原有哈希证据；发布记录匹配，不冒称289项全量重下载。正式审核Web的中英文套餐页已实际显示USD88.99／年、正确的审核账号新购限制，旧测试订阅提示已消失；官网中英文旧iOS测试阶段文案实际移除。MCP保护／发现和内容notice正常。
- Stripe原Rillora账户浏览器恢复；官方Live只读查询确认charges_enabled／payouts_enabled／details_submitted为true，年价active、USD8899／year；正式回调启用、18事件、API2026-08-26.dahlia。本周0事件／0失败不当作新投递测试。没有新密钥、商品修改或真钱交易，FanPass未动。
- Owner完成SecureEnclave本人验证，原审核密码两次在真实Web登录成功；未重置或创建通行密钥。当前原生16已进入login.rillora.xyz的正确专用审核邮箱密码页，尚未提交新的原生密码或购买。原16安装与旧真实支付证据继续保留原日期。

## 边界与手动状态

通用剪贴板没有成功；镜像台前调度缩略图和恢复旧剪贴板的问题已经观察到。Owner明确批准改用系统pbcopy，将已读凭据写入本机剪贴板用于Rillora登录后清理，随后接管手动操作。Agent不再调用镜像粘贴／点击。Owner随后明确要求直接提供账号密码；仅这组专用审核凭据按本次要求回给Owner，密码不写入项目文件、QA回执或Git。

台前调度本轮原值on，临时改为off以恢复镜像完整窗口；手动验收后恢复on。临时密码引用和剪贴板在使用完或暂停后清理。当前不能把Web密码成功、原生密码页或已部署状态记成原生登录、Sandbox购买、恢复或实际过期通过。

本轮新增证据：output/qa/rillora-release-rollout-20261031/。部署／输入诊断和手动接续已保存本机；Git新增证据收尾尚未完成。原源码26b68e066与元数据1a54ed906已在PR10，archive57已独立远端认证；不重封／重下载旧档，不用子代理或云端CI。

## 唯一下一步

Owner在当前正确审核密码页手动登录，核对Apple渠道年价和系统Sandbox环境，完成购买及一次恢复后报告结果；Agent随后核对服务器真实交易／权益与跨端状态，清理临时凭据并恢复台前调度，再补实际到期场景及本轮Git收尾。最终提审／TestFlight仍暂停。
