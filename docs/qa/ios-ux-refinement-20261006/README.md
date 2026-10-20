# 原生 UX 云端检查记录

Status: SOURCE PUSHED AND CI70 PASS; XCODE/RUNTIME NOT RUN
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 准确范围

- 本轮合同：[修正、维护方式和边界](../../native-ux-refinement-20261006.md)
- 基线 e229c466；共享身份 8cc5e100；保留购买源码08afb382及最新operator证据e950078。所有改变在独立分支，不覆盖活动发布分支。
- [继续阅读记录](context-reading.json)：沿用上一完整正文阅读，当前211份项目Markdown中167份内容未变，44份变化／新增正文已完整补读，不声称重新全文读过所有历史文档。后续17文件购买更新及最新operator文档另在[billing integration](billing-integration.json)和[增量记录](latest-operator-reading.json)。
- 原始用户截图实际观察：943×2048 的 IMG_0352.PNG 中指南列表已可读，顶部仍出现无关复核状态加载文字。它是问题证据，不是修复后截图；不将用户图重复提交至仓库。
- 官方链接检查见[逐平台审计](official-links.md)及[修改记录](official-link-changes.json)。受登录／限流／动态站点限制的结果明确区分，不作永久有效承诺。

## 本次实际执行

1. `python -m unittest discover -s tools/release -p 'test_*.py' -q`：66通过，包括34项原生源码契约检查。见[命令结果](release-tests.txt)。
2. String Catalog：1,099条 English／简体中文，占位符、已使用键、复数及系统语言契约通过静态校验；不代表每一页实际排版通过。
3. 137个Swift文件语法辅助比较；本轮新增文件零解析错误，五个已有语法支持不足的文件与精确继承源码错误数相同。不是Swift编译器／Apple SDK 类型检查。
4. OpenStep解析Xcode工程，10个新增源／测试文件各在正确组与目标；Info.plist、project.yml和Debug／Release公开连接设置一致。[机器结果](source-validation.json)。
5. 固定版本gitleaks8.30.1官方包校验符合仓库已锁定SHA256。准备的稀疏源码扫描7项均为既有已审公开客户端标识／合成测试片段，0未审项。仅移动4项已有例外的行号，片段SHA256不变，没有扩展忽略规则。[扫描](repository-scan.json)与[行号移动](scanner-line-moves.json)。全仓扫描由本次远端CI另行执行。
6. `git diff --check`通过。修改文档的相对文件链接按本地文件与远端继承清单检查，见[链接结果](markdown-links.json)。
7. 独立源码复核检查Auth0 3.0.2实际API、身份代次／UUID／取消绑定、重置不污染全局会话和工程归属，没有确认阻断缺陷；补齐原先缺少的身份传输边界测试。局部复核不是“没有任何bug”的保证。

## 写入但未执行的原生测试

- AccountIdentityTests：19项，含接口解码、无邮箱状态、UUID／账号切换／退出竞态、401处理、404兼容，以及401／403／500／格式错误禁止兼容。
- PasswordResetTests：20项，含无自动发送、重复点击、取消、晚到结果、临时邮箱、合成URLProtocol的SDK请求、错误脱敏和全局会话隔离。未向Auth0发送真实邮件。
- MatterListPresentationTests：10项，含真实分类、搜索、稳定顺序、缺失查找信息及可选共享语义。
- 3个新增中英UI方法覆盖指南三个标签、七分类与恢复All、身份和二级设置往返；既有布局／草稿／许可／系统语言用例同步新入口。这些UI方法使用只读loopback fixture，不操作生产账号。
- 当前源码合计49个新增XCTest、3个新增UI方法均未运行。没有Xcode／模拟器／真机截图、无新增收费macOS CI。

## 待运行矩阵（全部 pending）

获准的Apple环境应基于最终源码SHA运行，而不是复用旧build8：

- XcodeGen生成差异、Debug／Release编译、全部新增及相关旧XCTest
- English／简体中文，小屏iPhone／iPad，常规／最大辅助字号，横竖屏
- 指南初次加载／失败重试／返回／三个标签，无无关加载行、重复源链接或勾选
- 账号有邮箱／无邮箱／provider失败／401／切换／退出，不能显示前账号文字
- 二级语言外观、原生系统语言持久化、表单未保存返回、不意外重置偏好
- 套餐“包含的功能”连续展开收起，观察前后及过渡时标题位置，Reduce Motion开关均无额外位移；含最新购买页报价／续订披露
- 分类与搜索、空结果恢复、首页定位到正确事项、无共享事项也可正常完成整理
- 许可位置、44pt点击／Dynamic Type／VoiceOver真实朗读，保留共享／导出安全确认
- 重置仅用受控模拟传输，确认打开不发送和失败反馈；真实邮件收取需要单独受控验收

## 远端证据

共享后端基础[CI62](https://github.com/tantalum666/rillora/actions/runs/37495149572)已通过，含数据库集成。本轮原生独立分支的源提交、最终文档头和完整CI结果将在发布回执记录；未写回前不视为远端交付完成。现有CI为Linux源码／API／Web验证，不运行Xcode。

## 首次精确分支 CI 与继承清单修正

源码0e452bc5的API、Web/infrastructure通过；source中66+10+5+8项测试及全量源码扫描29项已审／0未审均通过，随后继承e950078的可读归档清单失败。远端树中缺少清单列出的25个被既有Git规则忽略的.xcresult/.dSYM副本；对应原始路径／对象仍在archive20目录。修正仅移除错误的“可读副本存在”声明，保留全部原始记录／密文／验证器和扫描规则。详见[准确元数据差异](inherited-publication-correction.json)。后续完整CI结果另记，不把此次部分通过写成全通过。

## 最终源码／CI 回执

独立分支 `codex/ios-ux-refinement-20261006` 已推送、读回。产品源码 `0e452bc569e2d16862314794bc70182c895523ee`；6项继承元数据修正后精确提交 `8492822ff651f3db137182d9a4b0c0a710d33b30` 的 [CI70](https://github.com/tantalum666/rillora/actions/runs/37503920129) 全部通过：source、API、Web/infrastructure。全量源码扫描29项已审／0未审，可读证据10,458份完整校验／扫描通过。修正没有改变App源码或任何原始归档对象。[机器回执](publication-receipt.json)区分测试提交与最终文档头。

并行 Web 产品源码 `f95a1c23ba702bffe1955a66386d50d582fe579a` 的[全量源码CI](https://github.com/tantalum666/rillora/actions/runs/37501697399)和[20/20 Chromium场景](https://github.com/tantalum666/rillora/actions/runs/37501697429)通过；[Web合同](https://github.com/tantalum666/rillora/blob/codex/web-ux-refinement-20261006/docs/web-ux-refinement-20261006.md)单独给出覆盖，不能作为原生运行证明。

维护收尾：product／platform contract／DESIGN／原生本地化／指南规范已同步；decision-log记录Owner新方向，后续CI修正不新增产品决定；当前handoff与journey保留operator和共享后端工作。此次最终回执不触发部署，也不以文档更新重复原生／生产测试。

### 获准 Apple 环境中的准确运行入口（本轮未执行）

先使用完整仓库、独立可丢弃模拟器和已有只含合成数据的loopback服务。运行 `xcodegen generate --spec apps/ios/project.yml` 后检查工程差异，分别编译Rillora Debug／Release，再以 `Rillora` scheme运行49个新增及相关旧单元测试。UI使用 `RilloraLayoutMatrix` scheme、`RilloraLayoutMatrixTests/RilloraLocalizationUITests` 测试类，在 `TEST_RUNNER_RILLORA_UI_QA_LANGUAGE=en` 和 `zh-Hans` 下各运行；合成API为 `http://127.0.0.1:4395/v1`，fixture由既有 `apps/api npm run qa:native-ui` 启动。系统设置语言变更用例只在明确选择的可丢弃模拟器并设置其opt-in时运行。现有shell矩阵不会自动覆盖新增测试类，不把运行旧shell集合当作3个新UI方法已验。
