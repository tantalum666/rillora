# Apple 真机购买与恢复验收 — 2026-11-01

Status: SANDBOX PURCHASE AND RESTORE VERIFIED / CANCELLATION AND EXPIRY PENDING / RESUBMISSION HELD
Last updated: 2026-11-01 (Asia/Shanghai)

本轮继续[购买归属与等待修复](apple-owner-latency-20261101.md)。Owner已恢复手机连接并手动完成购买和恢复；Agent没有操作镜像、重装用户数据或降低交易归属校验。先不发TestFlight、不重新提审，价格、普通收费开关、真实数据与FanPass保持。

## 已完成的真实结果

| 项目 | 实际证据 |
| --- | --- |
| 原位安装 | 复用已签名17-r2，IPA哈希一致；原iPhone16ProMax／iOS27.2读回1.0(17)，启动成功，没有卸载。 |
| 待处理检查 | Owner确认当前Rillora App Review，点击检查返回暂未匹配结果，没有再弹Apple密码。没有给出耗时，不声称量化提速。 |
| 独立Apple身份 | Owner成功登录已有Sandbox Tester3；没有固定绑定eason，也没有更换iCloud／普通商店主账号。 |
| 原订单冲突 | 英文“Review the current subscription terms”对应已存在nonce的报价／同意指纹冲突。只读数据确认原订单是HKG／HKD888，独立tester当时为USA／USD119.99。 |
| 地区修正 | 仅把Tester3改成香港；Apple保存页面有前端removeChild错误，但完整刷新后真实列表显示香港，另一tester仍美国，因此未重复提交。没有清除历史或取消重建订单。 |
| 购买与恢复 | Owner按HKD888／Sandbox不扣款条件完成购买；随后一次恢复返回“Your Apple purchase status is up to date”。不重复已完成步骤。 |
| 独立后台核对 | 匹配原同一订单：completed／paid_reconciled；收据888000毫单位＝HKD888.00，金额／币种吻合；已有原交易绑定，事件applied、签名验证true、无事件错误，订阅active。 |

后台读回时间为香港November1 04:17；当时本期权益结束时间为05:04:08。该时间不是已取消续期或最终到期的证明；沙盒可能继续自动续订。没有宣称本次真实退款、实际到期、正式扣款或所有可能支付情形均已通过。

这次地区不匹配是Agent测试安排的疏漏：提供独立tester前没有先核对已有订单地区。其后保留原订单，以相同港币报价完成；没有修改历史金额或搬移原个人账号的购买。Rillora交易归属与Apple商店身份始终是两套校验。

## 登录与文案

生产敏感操作的近期身份验证期限为10分钟；购买准备、开始和收据提交超过期限会要求确认Rillora身份。这不是Apple沙盒密码，也不是把正常账号登出。本轮保留该安全边界，没有为减少提示而关闭验证。

已在源码为五个购买错误码提供中英一致的准确说明，避免中文版全部显示“请重试”、英文只让用户去读条款。新增四个双语资源键；英文其他错误合同、中文不回显任意服务端文字的边界保持。**这些新文案尚未安装进手机17，集中到后续修复包**；本次购买／恢复结果对应已安装的17-r2。

## 后台诊断工具与部署范围

既有受限维护命令`configure-production-apple inspect`新增只读Sandbox订单诊断，独立模块投影必要的报价、状态、收据金额、订阅期限和验签事件状态；只覆盖既有登记且活跃的测试身份、未完成尝试及最近7天更新的记录，最多500条。没有公开端点、任意SQL入口、账号token、原始签名载荷、邮件或事项内容。可变订单诊断不进入目录指纹。

仅维护任务镜像先更新为6aade49a18e3读取原报价，再更新为83bb73e118af读取完成账本。普通API45bd2d47、worker、Web、所有参数与权限模板保持；Lambda／IAM变更项是原任务引用的更新，物理身份逐项读回相同。命令在数据库只读事务中运行，没有数据库迁移、订单取消、人工权益或生产收款设置变更。

## 本机验证与原始失败

- 双语检查先8项通过，补英文购买错误分支后最终9项通过；这是文案代码检查，不重复旧44项购买协调或19项未变化SDK／CommerceStore检查。
- 只读订单检查及配置测试20项通过，类型检查通过。扩展账本字段时本机发现UUID／text比较及可空索引错误，修正后20项和类型检查再次通过；失败未部署。
- 最初两套API测试因本机0108草稿校验和不同而未执行20项。原数据库经只读确认是本地已知合成夹具后原样改名保留，创建新的空夹具；未更改迁移或线上校验记录。额外的标记检查曾拒绝，原记录未被改写成“可丢弃”。
- 首次启动17的CLI参数顺序错误在启动前被拒绝；修正顺序后启动成功。一次发布门因可读清单未更新而失败，补全后通过。原失败和修正均保留。
- 维护变更检查最初拒绝一个间接IAM引用；核对后只允许明确的同一Lambda ARN引用，并验证模板与物理身份相同，未放宽为通用资源变更。

## 凭据与会话

既有Sandbox凭据曾在本机钥匙串显示供Owner使用。一次工具选区回读意外包含测试密码，已告知Owner；未把值写入项目文件／Git，显示已隐藏、详情已关闭、临时引用已清理。未重置凭据或删除测试历史。

Apple管理登录只在实际过期后由Owner恢复。AWS首次检查有效，最后对账时实际过期；原密码复用后Owner完成一次MFA。旧CLI等待已超时，随后自动复用新的浏览器会话，CLI成功且账户／主体一致，没有要求Owner重复MFA。没有创建新权限或永久密钥。

## 剩余验收与保存

已请求Owner仅在该独立Sandbox账户的Manage页面关闭Rillora自动续期，再由Agent核对取消后本期权益及实际到期。此项是新的生命周期步骤，不重做购买／恢复，不清除购买历史。以[Apple官方取消测试步骤](https://developer.apple.com/documentation/storekit/testing-disabling-auto-renew)和[沙盒续期规则](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/manage-sandbox-apple-account-settings/)为依据；不能把未订阅或登记期限结束冒充Apple订阅到期。

证据目录：`output/qa/rillora-native17-install-20261101/`；安全入口为[本轮回执](../collaboration/verification/native17-install-20261101/README.md)。原archive58及17签名产物不重封／重下；本轮源码、测试、维护工具与新回执单独保存。私有身份／提供方原始数据、凭据和机器缓存不入Git；没有云端CI或子代理。
