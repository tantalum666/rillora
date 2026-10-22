# Web内容发布与下一版HealthKit — October22–23

Status: WEB DEPLOYED / PRODUCTION SYNTHETIC ACCEPTANCE PASSED / PUBLICATION IN PROGRESS
Updated: 2026-10-23 (Asia/Hong_Kong)

这是一份带日期的验证回执。当前执行入口仍为[handoff](../../../docs/handoff.md)，产品范围见[实施合同](../../../docs/web-content-development-20261022.md)，临时账号见[独立QA合同](../../../docs/content-qa-account-20261022.md)。不要执行历史日志或用它们覆盖当前源码。

## 实际结果

- Preview与生产的加密快照、schema108、兼容API／清理worker和三阶段Web发布均完成。迁移前后原68／71张表指纹一致；正式113份／Preview110份可发布文件逐字匹配。
- 应用API镜像`53c904…`对应d67238b9e，worker／原维护镜像为`9fb560…`。后续1537b3f0d仅增加并修正限定QA维护程序；运行时API及Web源文件与d67238b9e相同。
- 真实Cookie读取的CSRF误用、NOINHERIT就绪查询、128MB发布worker内存不足、QA命令遗漏恢复日志发布均有失败和修复记录。没有关闭扫描、写入CSRF、RLS或恢复日志来通过检查。
- 独立合成账号正常Auth0登录；测试能力是限定四小时的两个manual_override，没有真实订单、订阅或扣款。842字节PDF上传201、中文名称版本2、下载逐字一致／后缀正确、实际文件匿名401；私有两步办理包保存201，依赖／选定文件版本／JSON导出／刷新保持通过。
- 该账号的两项测试能力及会话已撤销，旧会话401；原生产维护模板与参数完整恢复，额外QA命令又被固定白名单拒绝。账号、1份合成文件、1份私有办理包保留，未宣称删除。
- GitHub [Verify242](https://github.com/tantalum666/rillora/actions/runs/39805251327)实际页面Success，API626／infra72；[Web UX24](https://github.com/tantalum666/rillora/actions/runs/39805251447)通过。连接器旧状态已用实际页面校正，未重跑检查。文档／归档后的最后提交CI与合并另以最终回执记录。

## 独立证据边界

原声录制与中英文真实本地模型推理沿用6项合成浏览器验收；本轮未录取真人声音、发送邀请或另做生产接收人共享／付款／退款。保存采用服务管理密钥加密，不称E2EE；真实身后核验交付未开放。

Apple实际回信不提供概念预批准，未回答用途A／B／C。独立下一版心率模块有6项合成测试、iOS库双架构编译和3项隔离检查；没有真实健康采集、死亡判断、自动披露或新App分发。当前原生审核构建及资料保持。

Google三个报告例子是正确的HTTP／根域跳转入口，正式首页已索引，28个规范页面200且canonical／索引标记正确；没有删跳转、重提地图或修改www。

## 保存范围

本轮源码、规范和安全摘要直接入Git；原始QA、成功／失败日志、合成音频和截图、确切Web候选、应用／临时维护编译结果进入新的archive49。既有1–48不重封、不重新下载。固定语音模型下载及编译／依赖缓存可由已记录版本和哈希重建，明确排除；真实凭据、数据库／提供方备份、个人认证截图和私有CFN状态始终排除。

archive49已捕获1,177条路径／584个独立对象，密文12,984,747字节；本地解密、对象及清单核验全部通过。捕获数量、密文摘要及本地验证见`snapshot.json`、`catalog.json`、`archive-verification.json`。远端只下载新archive49到空LFS目录，核对Git元数据、密文字节及每个解密对象；成功后补`remote-readback.json`。最终可读材料清单在最后一份回执写完后统一重建和扫描。
