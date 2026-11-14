HISTORICAL — superseded by the verified purchase/restore result in [current handoff](handoff.md).

# Rillora 当前交接

Status: API AND WEB DEPLOYED / ISOLATED17 INSTALLED AND LAUNCHED / OWNER MANUAL PURCHASE ACCEPTANCE PENDING
Last updated: 2026-11-01 (Asia/Shanghai)

## 当前任务

Owner在原生16购买／检查待处理购买时收到Apple认证，等待30–60秒后出现原Rillora账号提示，要求修复并说明测试与安全边界。[当前合同](apple-owner-latency-20261101.md)保留原交易归属，修复多余同步和付款前核对。Owner手动操作手机，Agent不做镜像输入。旧手动接续已移入[HISTORICAL记录](handoff-history-20261101-before-owner-fix.md)。最终提审／TestFlight保持暂停。

## 已完成

- October31两API／三套Web修正已实际部署：镜像45bd2d47、两服务healthy，参数／资源身份保持；48变化文件HTTP取回，241未变哈希沿用。正式审核Web及官网双语实看，Stripe原RilloraLive状态／USD8899年价／18事件回调只读核对。无新真钱交易，FanPass未动。
- 待处理检查不再强制Apple同步或查询完整订阅历史；新购前核对当前、未完成及过期历史，避免开另一账号的支付单；原nonce可恢复，账号切换迟到响应受保护。服务器签名、金额、原交易归属、finish及既有数据不改。
- 原代码3项红测保留；最终44项购买协调测试、9项语言检查通过。同轮19项StoreKit SDK／CommerceStore结果沿用，63个不同原生用例有通过证据，不冒称最终整套重跑。
- 隔离17从16复制，仅三个运行Swift文件、三个语言键及测试改变；无下一版HealthKit／Watch／Duo／内容。Owner恢复连接后，最终r2已在原iPhone16ProMax／iOS27.2原位安装，设备读回1.0(17)并启动成功；没有卸载、重建或重复测试。第一份17中间包仍未安装。两者均未上传。
- 审核Web实际读到一笔started意图和一个归属token；不是成功支付。找到既有Keychain「Rillora StoreKit Sandbox Tester 3」元数据，尚未读取密码或验证当前Apple状态。原购买不迁移、历史不删除、权益不伪造。

## 证据边界与阻塞

手机连接已恢复，17安装／启动完成。Owner实际确认当前为Rillora App Review，检查待处理购买返回“Apple暂未返回匹配结果”，没有再弹Apple密码；未给出耗时，不能勾过速度验收。实际新交易、恢复、权益和到期仍未完成。没有镜像输入。

Owner已登录既有独立Sandbox Tester3，17显示USD119.99；随后点订阅没有出现Apple确认页，Rillora显示“暂时无法完成此操作，请重试”。本次AWS会话有效，当前生产日志同时间段有409业务冲突，但原隐私日志不记路由／具体错误码，尚不能精确归因。中文错误映射缺少购买专用码，当前等待Owner临时切英文读回服务器说明，不重复付款或修改旧订单。

钥匙串密码显示已收起、详情关闭、临时文本引用清理。一次工具回读的选区块意外包含测试密码，已告知Owner；未将值写入项目文件或Git，未重置凭据／清理历史。新建审核Web验证标签当前未登录，没有把上一轮started读回冒称为本次新查询。

App Store Connect账号管理实际authResult=FAILED且只显示加载画面，没有可操作登录表单；未创建或更改tester。优先核对已有独立tester，不要求改iCloud／主商店账号。台前调度已恢复on；已知临时密码引用已清理，剪贴板已不是该密码，未覆盖用户新内容。

本轮证据：output/qa/rillora-apple-owner-latency-20261031/及原部署output/qa/rillora-release-rollout-20261031/。源码／archive58已推到PR10的b628c18051824515a806a987badfaf9463bb7765，新增归档从GitHub独立下载认证663对象／1,164路径通过；旧archives1–57不重封或重下。最终元数据普通Git保存，无子代理或云端CI；Actions总数仍314、最新October23。

## 当前修复进展

英文已确认对应旧nonce的价格／条款指纹冲突，不是去网页继续接受协议。生产近期认证门为10分钟，仍保留；此次没有再申请AWS登录，现有会话有效。新增双语购买错误映射通过9项本机测试，尚未装入17。只读Sandbox订单检查通过20项API测试／类型检查；两个旧本机测试库的0108草稿已原样改名保留，使用新空夹具，没有修改迁移或生产数据。维护任务镜像6aade49a18e3已更新，普通API45bd2d47、worker、参数与权限模板保持；只启动了一个只读检查任务，结果待收集。上述新增代码／回执尚未推Git。

## 唯一下一步

收集已启动的只读维护检查，匹配专用审核账号的原待处理订单，读回其具体金额／币种／商店／同意版本后选择保留记录的恢复方式。Owner已明确英文为“Review the current subscription terms”，不再重复询问；当前暂停手机操作。保留17安装、账号、独立Sandbox登录和无重复密码弹窗证据，不清理订单、降低归属校验或重提；最终购买／恢复／权益／到期仍待完成。
