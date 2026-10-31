# 购买归属修复与前轮部署保存

Last updated: 2026-11-01 (Asia/Shanghai)

[当前合同](../../../docs/apple-owner-latency-20261101.md)记录Owner在16遇到的Apple认证／30–60秒等待／原Rillora账号提示，以及隔离17的修复。保留签名、金额、环境、原交易归属和服务器finish授权；不清理历史、转移旧订阅或补造权益。

当前结果：最终44项购买协调检查和9项语言检查通过；同轮未变化的19项StoreKit SDK／CommerceStore结果沿用。原始三项失败、57／1中间结果及账号切换断言修正均保留，最终通过不抹去失败。最终17-r2开发包签名有效；设备断开，尚未安装，当前真实购买／恢复／权益／到期及手机耗时仍待验收。当前审核Web有started意图，不是成功支付。

前轮October31两API和三套Web已经部署／核对：48变化文件HTTP获取，241未变哈希沿用，价格／数据／开关／资源身份保持；真实审核Web及官网双语页面已确认。Stripe原RilloraLive状态、USD88.99年价及18事件回调只读核验；没有制造新的真钱交易。当前原生修复未重复部署云端。

新增archive58保存1,164路径／663原件／45,379,030密文字节，本地认证解密通过，见[snapshot](snapshot.json)、[逐文件目录](catalog.json)及[验证](archive-verification.json)。包括本轮原始失败／通过结果包、隔离17中间与最终源码／签名包、前轮部署记录与公开／合成页面截图。凭据、原始身份／提供方私人响应、设备标识、依赖和构建缓存不入公开材料；签名profiles仅加密保存。旧archives1–57不重封、不重新下载。

可读结果见[closeout](closeout.json)、[最终测试](after-tests-payment-final-summary.json)、[签名读回](native17-r2-export-readback.json)与[后台计数](owner-diagnostic-readback.json)。已有专用Sandbox tester仅确认本机元数据存在，没有宣称当前凭据或历史可用。临时Mac设置和已知密码引用已清理，手机仍由Owner操作。

最后一份可读回执写完后重建全量可读清单，使用确切main base运行本机发布门。Git／新archive远端认证回执另记，不重跑无变化业务测试；不使用云端CI或子代理，不上传TestFlight或重新提审。
