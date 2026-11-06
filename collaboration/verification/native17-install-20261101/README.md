# 17真机购买／恢复与原订单核对

Last updated: 2026-11-01 (Asia/Shanghai)

[当前合同](../../../docs/apple-purchase-acceptance-20261101.md)记录17原位安装、独立Sandbox购买、一次恢复及独立账本。原同一HKD888订单completed／paid_reconciled；收据888000毫单位匹配，Apple签名验证true、事件applied、无错误，订阅在读回时active。见[付款结论](payment-acceptance-verified.json)、[原订单报价](original-order-quote.json)、[后续账本](post-purchase-ledger.json)与[Owner购买／恢复](manual-purchase-restore-result.json)。

根因是原HKG／HKD888订单与Agent提供的USA／USD119.99独立tester不匹配。只调整该tester到香港，Apple前端保存报错后完整刷新确认已保存；未再次提交、清除历史、取消重建订单或转移旧购买。实际取消续期、到期和退款尚未冒领通过。

原17-r2IPA已在archive58，不重建／重封：[包复用](candidate-reuse.json)、[设备读回](device-install-readback.json)、[成功启动](launch-corrected-result.json)。首次启动的CLI参数顺序错误在执行前被拒绝，原失败保留。手机由Owner手动操作，没有镜像输入。

新的双语购买错误说明通过9项原生检查，仍为源码改动，未为文字单独再装一个版本。受限只读诊断及配置最终20项API测试／类型检查通过；原始Fixture迁移校验和、UUID比较、可空索引和清单失败均保留，见[验证总结](validation-summary.json)。两个旧本机测试数据库原样改名保留，新空夹具运行；没有修改迁移或生产数据库。

仅维护任务镜像更新为6aade49a、随后83bb73e1。普通API45bd2d47、worker、Web、所有参数与权限模板保持；明确的Lambda／IAM任务引用和物理身份均读回一致。两个阶段执行的都是只读inspect命令，没有数据库迁移、人工权益或订单改写。

新增archive59保存728路径／412原件／953,549密文字节，并已本地认证解密。见[snapshot](snapshot.json)、[目录](catalog.json)、[本地验证](archive-verification.json)。包含失败／通过结果、两个维护镜像的精确输入、操作辅助代码及安全回执；旧1–58不重做。两处PEM头仅是与已跟踪config.ts逐字一致的校验常量，扫描副本作了精确分类，原件字节未改；实际凭据不入包，扫描规则与例外未改。捕获辅助脚本另作为[参考资料](preservation-helper.py.reference.txt)保存，不是新的执行指令。

原始身份／设备／提供方私人响应、未归因请求ID、数据库备份、VM磁盘和依赖／构建缓存不上传。一次钥匙串选区回读意外包含测试密码，已告知Owner；值不在项目或Git中，密码显示及临时引用已清理。

最终回执写完后重建全量可读清单，使用精确main base运行本机发布门；新archive只独立下载核验一次。Git保存不代表取消／到期或App Store重提已完成；无云端CI、子代理或TestFlight。

源码／archive59提交`7b6c3deb923555106e45463d5979a6fa55e5ee5f`已推到PR10，开放未合并。[独立远端验证](remote-readback.json)认证412对象／728路径，未重下旧档。[源码发布证明](source-publication-proof.json)记录精确base、diff及无新云端作业；最后只保存元数据，不重新部署或购买。
