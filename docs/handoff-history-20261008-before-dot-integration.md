# HISTORICAL — Before October8 Dot integration and legal cutover

Status: 事项分类已精简并直装；Owner已报告恢复后显示家庭版
Last updated: 2026-10-08 (Asia/Hong_Kong)

## 当前任务与已完成

Owner要求处理事项页分类布局；继续集中修复、直接安装到原手机，有线/无线均可，暂停零碎TestFlight。
[当前分类栏合同](matter-category-refinement-20261008.md)；源码35f37e1b2在codex/matter-category-bar-20261008。

- 仅修改事项页：两排描边标签/大底板改成单行横向分类栏，选中项用既有绿色背景。
  原类别、筛选、搜索、数据逻辑保持；其他表单控件没有全局替换。
- Debug/Release编译通过；中文深浅色完整页面已检查。中英文原类别/搜索UI回归各通过1次，
  覆盖七类和分类隔离；末项空分类返回全部实际点击通过；14项导航/本地化guards通过。
- development导出通过12项签名/配置核验，现有localNetwork连接完成同bundle原位安装，
  设备读回1.0(11)且前台启动成功。本地迭代沿用build11，以本轮源码/安装包SHA区分，
  不等于TestFlight11的旧二进制。首次启动命令参数次序错误已改正，失败回执保留。
- Owner本人已将沙盒改为原eason账号，点恢复后报告显示家庭版；这是本次本人真机反馈，
  没有在这轮重新查询provider收据或重新购买。先前QQ提示的独立沙盒原因保留为历史。

## 证据边界与保留项

本轮只改原生展示。API16/schema0093与现有Web/WWW/Preview保持；原三身份到期为
2026-10-08T20:00:00Z。价格/Free1/Family5/真实数据/FanPass保持，购买44项旧检查不当作本轮重跑。
TestFlight暂停；App Store草稿最后核对仍9/手动发布，11此前分发是旧授权下的历史事实。
外部邀请和独立删除仍暂缓，经营税务/Live真实交易/最终审核与开放仍是独立门。
本轮archive24已随efc22209a推送，GitHub独立新下载/解密核验364对象/3,251路径通过；
前23包没有重建或下载。源码、签名包和当前检查记录均已保存到当前分支。

## 唯一下一步

由Owner在当前直装版继续反馈剩余实际问题，Agent集中修复后直接安装；没有新的明确指示前
保持TestFlight暂停。新分类的本机交互检查与Owner后续使用反馈分别记录。

[上一交接](handoff-history-20261008-before-category-bar.md)为HISTORICAL。
