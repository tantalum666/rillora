# Rillora 1.0 正式发布准备

Role: current launch scope, remaining work and release evidence contract  
Status: RELEASE PREPARATION ACTIVE; PUBLIC INFORMATION LIVE; ORDINARY CUSTOMER ACCESS AND SALES CLOSED
Last updated: 2026-10-13 (Asia/Hong_Kong)

## October13套餐页纠正

Owner再次指出页面没有按要求精简。现已完成家庭版权益／年价／单订阅主操作，移除免费状态、折叠块和独立二次勾选；20项针对性Node及23个隔离浏览器场景通过，759c00112／CI133成功。Preview和正式Web各仅更换一个静态包，172线上文件匹配；真实浏览器现已退出，登录后的UI读回仍待Owner。详见[当前合同](plan-purchase-page-20261013.md)；API／价格／开售开关／真实数据／手机14保持。

## October12原生／跨端验收续接

Owner本轮暂后手机本人验证，独立Web检查已完成。两处实际问题已修并发布：关闭订阅提示重复、法律页返回后误停访客首页。d9825b616／CI131、新浏览器5项由4红转全绿及12项相关检查通过；正式／Preview共172文件匹配，真实账号法律页返回及中英文显示通过。原事项／价格／销售开关保持，手机14和API没有重新构建／部署。

当前Web没有生效Sandbox资格，不能把Free与旧手机Family结果直接比较或勾过实际Apple退款／到期。第2项剩余真机VoiceOver、原生法律入口、未订阅分支和当前有效订阅跨端对照仍待手机可操作；已过项目沿用。详见[本轮合同](native-cross-platform-acceptance-20261012.md)。

## October12安全部署后的当前状态

[整批安全修复](security-rollout-20261012.md)已完成两库103迁移、五个云端栈、203个Web文件核验及原机1.0(14)直装。Owner确认登录和原事项，HTTPS回调已切换，9份指定本机凭据已加密读回。API23／Preview44及隔离worker运行正常；API23仅续原3审核身份到香港October14 20:01，普通客户／收费仍关闭，价格与既有财务记录保留。没有新TestFlight或支付／退款／删除验收。

本机部署工具两处兼容问题另修于042f4e100，CI127三任务通过；archive33已在d33e0b31f独立远端解密核验；发布测试样本稳定性修正5adf61570／CI129三任务通过，当前剩余发布步骤见handoff。GitHub当前私有仓库页面明确不强制保护规则，不能把CI通过写成服务器强制检查已启用。此前付款与Apple证据继续保留原日期；下方October10技术版本是历史检查点。

## October10 current launch inventory

October10的[付款与完整双语交付](payment-recheck-20261009.md)更新了下列实际证据，不重开旧工作。Web/原生Free1与Family5、WebUSD88.99年付和Apple美国USD119.99保持。

当前API21/Preview43健康，两库schema94；官网/应用/Preview203公开文件及法律14实际中英文页面核验完成。手机13已原位安装并由Owner确认已订阅、HKD888、无混排；没有新TestFlight。新云端Stripe TEST进一步验证全额pending不撤权益、成功撤销、异步失败恢复、部分退款、重复回调，三订单各一尝试、34验签事件已应用且无错误，三条测试订阅结束，原事项保留。原Live通知/目录/受限密钥及既有Apple签名购买/恢复反馈保留；没有真钱测试。

Auth0两种同意表单已上线，旧桌面外壳3句英文仍因HTTP402未改；官方工单权限不足，社区问题草稿待明确外发授权。这是当前完整双语剩余项。

October10再次状态复核：只读Stripe Live Tax settings仍pending，missing_fields仅head_office；不等于商户未开户，也不推导必须预先取得所有税区登记。当前原生13实物包的本地发布形状/配置检查无新阻塞，但不是App Store分发产物或审核通过证明。Auth0旧外壳作为免费优先的并行收尾，不作为其他发布准备的唯一前置依赖；该项现已完成；下一步准备第2项余下原生/Apple验收。已完成结果沿用原时间，不重做交易、部署、安装或本人认证。详见[本次核对](../collaboration/verification/release-status-20261010/verification.json)。

## October10 Stripe Tax可选服务纠正

Owner要求暂后税务功能。正式账户当前可收款/提现，Stripe Checkout的automatic_tax为optional。此前“Tax Settings pending”不能解释成Stripe禁止该账户收款；自动计税启用从必做项中移出。Rillora自身正式购买配置仍需完成，实际税务义务不由是否使用Stripe Tax决定，未知事实不写成免税结论。本次只有文档/登记更新及只读证据，未开放客户或收费。

<a id="october1-remaining-work-inventory"></a>

| # | 真正剩余的工作 | 完成判据与边界 |
| --- | --- | --- |
| 1 | 正式Web开售配置与生产验收 | 按Owner最新方向暂后Stripe Tax自动计税，完成应用侧正式购买路由、明确的计费处理及生产配置/访问边界/签名通知核对。Stripe账户本身收款/提现已启用；自动计税不是必须购买或配置的前置服务。已有TEST付款/退款/权益闭环保留。Stripe禁止用真实支付资料在Live模式测试，不要求Owner自付自退或制造交易才能上线；真实客户交易发生后再核对实际资金/回调/权益。Tax Settings缺head_office只说明自动计税尚未就绪；Rillora当前not_configured策略及正式报价/Checkout开关仍关闭，不能把文档暂后决定当作实际开售；尚无真钱交易是证据边界，不是必须先制造一笔交易的门。BR办妥不再是全部技术配置的前置门，不臆造免代收结论。 |
| 2 | 原生最终汇总版及Apple剩余验收 | 手机14已原位交付并由Owner确认登录／原事项；手机13时的已订阅/港币888/中文显示及签名购买／恢复证据保留原日期。剩余未订阅真机分支、实际跨端权益及退款/到期证据独立核验。保留已成功购买和Owner恢复反馈，不要求为了这份清单再买一次。真机VoiceOver和法律链接随最终受影响路径补齐；不恢复Large text控件。 |
| 3 | **本轮已完成：当前产物、权限与恢复后计费对账** | 4处恢复缺口修复，23项聚焦回归及CI121通过；3笔真实Stripe TEST支撑的本地恢复、真实生产快照/Apple Sandbox云端对账、权限拒绝、原服务恢复和临时资源清理均有独立证据。当前代码/镜像回滚底线已记录。后续第4/5项的新产物和客户开放变更各自再验收，不重复本轮。 |
| 4 | App Store最终候选、送审与审核 | 集中修正稳定后准备新的最终构建，核对截图与真实界面、隐私/年龄/联系信息、市场/价格及审核账号访问，选入草稿并提交App Review；通过后手动发布。当前商店草稿最后确认选用9，TestFlight11与手机同号直装包不是相同产物；未提审。六张设计图和已确认的加密声明不从头重做。 |
| 5 | 正式客户与身份环境切换 | 原审核期真实到期并阻止手机验收后，仅原三身份续至香港October14 20:01；这仍是验收窗口，不是普通客户限时服务。正式开放时完成旧Preview身份能力/凭据退役、旧令牌的实际有效期加容差与拒绝检查，切换官网入口并验证普通客户注册/登录/付费。原24小时旧Management令牌寿命是身份切换条件，不是从现在起的上线倒计时。 |

独立删除验收仍按Owner“保留，暂不删除”执行，不能勾为通过，也不能擅自启动删除。
这项缺口在最终发布判断中须明确保留/解决，不通过更改登记状态隐藏。外部两个TestFlight邀请仍暂缓。
SES不再是Resend路线的前置，SBP只有既有申请回执、无15%生效证明；既定Apple价格不因此重新待定，
也不把等待优惠批准新增为发布硬门。没有全新功能或大范围UI重做列入此清单。

证据入口：[实际Web发布](web-rollout-20261009.md)、[云端TEST](stripe-cloud-acceptance-20261009.md)、
[Live配置](live-configuration-20261009.md)、[当前手机与退款/双语结果](payment-recheck-20261009.md)、
[后续Dot增量](dot-integration-20261008.md)。[机器登记](../config/release-gates.json)同步事实与来源，
不把多个聚合门都标成verified来生成完成百分比。唯一执行顺序继续以[handoff](handoff.md)为准。

October9退款问题后的纠正：上一条把“受控真钱付款/退款”列为上线前必做验收不当，按
[Stripe官方测试规则](https://docs.stripe.com/testing)撤回。真正的客户付款可以按实际退款需求原路退回，
不会自动退款，原交易处理费不退；参见[退款说明](https://docs.stripe.com/refunds)。不把真钱观察冒充已经完成，也不因此要求人为交易。

## HISTORICAL checkpoints — all following observations retain their original dates

以下完整保留过去工作及当时未完成项；上方October10清单与当前handoff取代其中被后续结果解决的待办。

## October8 current native delivery

Owner pauses incremental TestFlight distribution and chooses direct phone installation.
Current sourcec0cec8680/retained Release11was development-signed and installed wirelessly
over the same Rillora app; version1.0(11)and foreground launch are read back. No new
TestFlight upload/distribution or cloud deployment was performed today. Previous provider
checkpoints below retain their dates; physical UI/restore acceptance is separate.
[Current direct workflow](direct-device-iteration-20261008.md).

## October7 Dot rollout — current delivery

Merged source58fadf357(application tree5a547339a) is deployed: API16/schema0093,
production Web86/WWW31/Preview86live files match. Runtime has one healthy task;
only image and the existing review expiry changed. The same three identities and
existing Owner planner Sandbox enrollment now expire2026-10-08T20:00:00Z.
No ordinary customer or live billing activation follows. Native1.0(9) passed14signed
artifact checks and uploaded once; actual Apple detail login expired, so processing/
distribution/draft selection await its recovery. Build8 remains the last verified
distributed/draft version. Existing272native/174Web/17API/66guards/CI73/20browser checks
are retained, not rerun. [Exact deployment](dot-rollout-20261007.md).

## October7 真机与配置 — 保留的独立结果

Owner已安装构建6并完成首笔Apple Sandbox购买。真实签名收据为HKG/HKD888.00，订阅active，
初始通知与客户端回传applied；先前AUD199.99报价订单已取消关闭，未改写收据。购后恢复、跨端
权益及VoiceOver仍分别验收。外部两个邮箱邀请和独立删除账号按Owner指示暂缓。

Owner要求简化购买页。构建8直接展示家庭版实际权益、明确币种的完整年费和一个购买按钮，
移除额外勾选及展示里的测试控件；购买前刷新核对报价。39聚焦回归/11静态检查/中英文渲染/
13分发包检查通过，1个既有StoreKitTest平台跳过。源码08afb3821/CI63成功。8已上传处理、
分给原内部组1人，App Store草稿已保存并重新读回8/手动发布；7未分发，未提交审核。

Apple美国US119.99/年、WebUS88.99保留；年付草稿为原8地区加AUS限期Sandbox测试，
USA/HKG/AUS报价与验签配置已载入同一API14/schema0093，普通市场/销售仍关闭。
Stripe实际处理器收款/提现启用；8899商品/年价inactive、门户配置、回调disabled、受限RAK
已创建并保护保存/核验。AWS准备secret不可作为运行配置加载，API无ARN/权限/收费开关。
经营/税务事实、完整Live接入和真实交易、最终商店申报/审核与客户开放仍未完成。
[当前合同](device-config-20261006.md)与[唯一交接](handoff.md)保留精确下一步。

## October6 selected packages1/2 and Stripe Web — retained earlier checkpoint

The narrow remaining Dot fixes and bilingual Web/WWW are now deployed with API14,
unchanged schema0093 and the original three expiring reviewer identities. Local source,
actual cloud hash/health checks and bilingual rendered checks pass. Native compact/large/
iPad English/Chinese landscape, AX5, sharing/export and actual system-language persistence
checks pass. Native1.0(5) uploaded successfully; Apple reports Ready to Submit; exact notes persist after reload, groups/testers0.
[Current exact results](release-12-stripe-20261005.md).

Current88.99StripeWeb hosted TEST purchase/cancel/decline/return, Portal cancellation/
resume, full refund, permission downgrade and signed-event duplicate handling pass using
shipping cookie/CSRF middleware. The isolated identity and consent are synthetic; live
merchant facts, human live consent/charge and cloud live billing remain separate gates.
Spoken VoiceOver and physical purchase/restore remain unverified; the later same-day device work is recorded above.

## HISTORICAL — October5 after Dot integration and Chinese copy

The current integrated source747c98874hasCI56success and final receipts throughaf34fd1be.
Dot's four branches and the latest account-choice/export fixes are preserved together.
Chinese wording has been reviewed across both clients. Actual local Web/native builds,
focused language/UI tests and browser repair checks pass; the broader bilingual matrix
and affected flows still require acceptance. These changes are **not deployed or uploaded**.
[Integration evidence](qa/dot-followup-20261005/README.md),[Chinese copy](chinese-copy-guidelines-20261005.md).

This October5status reconciliation uses current source and dated project/provider receipts.
It does not reopen Apple/AWS/Stripe portals,repeat authentication,deployments or transactions,
or imply a new SBP approval/current provider rate. Previously confirmed mail/login/recovery,
sharing/revocation,backup import and store imagery remain completed evidence. Resend means
SES approval is no longer a sending prerequisite. No AI/MCP implementation is added to launch.

## October5 core closeout and retained-account decision — retained result

Actual isolated-account login, native-backup import into an empty Web map and
naturally aged Web authentication/retry are verified. Import restores no sharing;
new identifiers/draft states and private fields were checked. A Web account-choice
issue discovered during this test was repaired with the existing API option,
verified by29focused checks/CI54and deployed with86matching live files.

At the final irreversible account-deletion dialog, Owner chose保留，暂不删除.
The dialog was cancelled, the account/data remain, and no deletion request/provider
purge was submitted. Actual deletion is Owner-deferred and not claimed passed.
The test session ended and Auth0/runtime13were restored to the original3review
identities/expiry with1healthy task; application image/roles/network/secrets remain.
Native4, store images and previous provider checks are retained without re-upload.
[Current acceptance](real-core-acceptance-20261004.md).

## HISTORICAL — October4 core acceptance before the October5 closeout

[Actual native/Web acceptance](real-core-acceptance-20261004.md) now verifies
Name/Details restriction/expansion, native recent-auth cancellation/retry, saved
plaintext/full-map/encrypted cross-client reading, open-detail revocation clearing,
and current-device logout. Native restart stays signed out. The isolated disposable
Web account is awaiting current terms confirmation before import, successful Web
fresh-auth retry and final confirmed/provider-backed deletion.

The actual export journey exposed one additional native competing-alert defect.
Focused red/green and the real fixed flow pass; CI48passes. Signed1.0(4)contains
the fix, passed9artifact checks, uploaded/processed to Ready to Submit and saved
its test notes. Groups0; no physical install, invitations or review submission.
Approved encryption metadata is retained; no repeated build3upload/declaration.

Temporary fourth-identity access uses API12with the same application image/schema93,
roles/network/secrets and original expiry; restore the original3identities after the
current disposable test. Neither Owner account nor real source data was deleted.

## October3 selected packages1/2 — retained completed rollout

Owner selected deployment and the new native candidate. [The actual rollout](review-rollout-20261003.md)
is now complete for API11/schema0093 and restricted Web/WWW, with data/role/TLS checks,
new successful retention heartbeats and116matching live files. The previous strict-review
undeployed statements below are the pre-rollout checkpoint.

Signed1.0(3) is uploaded/processed with normal distribution eligibility, test notes saved
and0testers/groups. Its specific OS-only encryption declaration was confirmed by Owner, saved and read
back asReady to Submit; Missing Compliance is cleared. No purchase, device install, review or
public customer/live-billing opening is implied. Packages3–6remain at their existing gates.

## HISTORICAL — October3 post-review inventory before rollout

The whole-project review and28repairs are complete in source, locally verified and
covered by CI47; source and evidence are pushed through4d061c49. The new fixes and
migrations0092/0093are **not deployed**. The deployment row below now refers to this
new batch; the earlier13Dot fixes/API10/schema0091 rollout stays complete and must
not be repeated as if it had never happened. [Review](code-review-20261002.md).

The next executable package is coordinated restricted API/Web/WWW rollout, additive
migrations and post-deployment validation, plus a new native candidate incorporating
reviewed changes. Keep ordinary customers and live billing closed. Then finish the
remaining real core journeys and Apple lifecycle, final declarations/market/price,
merchant readiness where applicable, submission/review and controlled customer cutover.

This status reconciliation reads current source/receipts; it does not refresh private
provider portals. Apple Internal/Missing Compliance build1.0(2), six saved screenshots,
QQ recovery/login and API10 are the last retained October2 observations. The recorded
review allowlist expires2026-10-07at01:08:57Asia/Shanghai; recheck operative reviewer
access before acceptance/submission without automatically extending authority.

Owner participation is limited to actual personal authentication/consent when needed,
resuming explicitly deferred physical-device testing, truthful operator/merchant facts
and final personal declarations/decisions. The existing authorization remains in force.
SES reply is no longer required for Resend. The isolated CDK advisory and optional
scanner startup failure remain their recorded bounded risks, not new paid certification
or feature work. No additional UI redesign or screenshot production is required.

Apple still requires an encryption determination for apps using encryption, and a
submission needs required metadata and an eligible chosen build. TestFlight purchases
run in sandbox; an upload is separate from a purchase/restore result.
[Encryption](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/),
[submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/),
[TestFlight testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight/).

## October2 release delta — retained evidence


Owner now asks to finish all work that does not require their participation. The
[latest independent preparation](independent-release-closeout-20261002.md) records
an uploaded/processed internal TestFlight1.0(2), six saved designed store images,
read-back beta metadata and the remaining actual dependencies. Apple currently
reports Missing Compliance; no device installation, purchase or review submission.

Resend is configured and the existing QQ mailbox actually received the assisted
invitation. Password reset has Owner/provider success evidence; subsequent QQ Web
login and the exact Directions field boundary are verified. Native Google login
and cross-platform read passed earlier; the later native session expired and its
new genuine Account terms step remains parked. QQ external-image rendering has
healthy sender/preview evidence but no verified client-side repair.

The13Dot fixes, API10/restricted Web/router/WWW rollout, schema0091 and bounded
retention/recovery/monitoring preparation are retained. CI44 and earlier full/scoped
tests keep their original dates. This continuation builds and inspects a new
artifact and reads actual Apple results; it repeats no unchanged product suite,
cloud deployment, Apple TEST notification or SES application. SES is no longer a
required approval for the Owner-selected sender.



## HISTORICAL — October6 remaining-work inventory

The12register gates are grouped into seven current work packages below. Two register gates
are verified; the remaining states are deliberately unchanged. This is not a completion
percentage. Packages1/2 now have the completed results below; existing personal deferrals remain.

| # | 工作包 | 还需要完成 | 依赖 |
| --- | --- | --- | --- |
| 1 | 新版双语与剩余体验验收 | 本轮独立工作已完成：小屏/大屏/iPad、中英文横屏、最大辅助字号、共享/文件、系统语言重启持久化，以及计划下一步和恢复历史修复均有通过证据。真机 VoiceOver 朗读/手势仍未验证。 | 剩余真实辅助技术检查随本轮已恢复的真机步骤。 |
| 2 | 最新版本的受限部署与发行候选 | API14、Web86/WWW31文件已部署并核验；1.0(5)已上传，Apple已处理为准备提交，说明回读一致，测试群组/独立测试员0；源码与全部新增合格产物已推送，CI58/59通过，新归档已从GitHub下载解密核验。 | 已完成；后续只按新变化/最终提交需要继续。 |
| 3 | 支付生命周期与真机 | 当前88.99StripeWeb TEST闭环已通过。Apple实际安装/登录/购买/恢复及生命周期仍未完成；Web live收款单列第5项。 | Owner已恢复真机并亲自在手机操作；TEST不是实际收费或完整会计账本。 |
| 4 | 账号删除真实验收 | 实际不可撤销删除与身份/数据清理尚未执行。Owner明确保留原独立测试账号；不以导入/恢复成功代替删除成功。 | Owner暂缓；未经新的明确指令不重启删除。 |
| 5 | 经营、市场、最终价格与正式收款 | 核对本轮配置所需的真实经营/登记/税务事实，核对正式收款与真实支付退款，确认首发市场和Apple最终渠道价；SBP只有申请回执，批准/生效证据需核对。WebUS$88.99/年保持。 | Owner事实/决定、provider结果，随后Agent执行。 |
| 6 | 最终商店申报、审核与发布 | 基于最终候选核对隐私/年龄/联系信息/市场/价格及可用审核访问；提交App Review并处理反馈，审核后手动发布。新构建5、六张设计图和已确认加密声明保留，不重复上传/确认旧项。 | Agent准备；必要本人声明与Apple审核独立。 |
| 7 | 公开客户切换 | 上游验收完成后退役Preview/旧凭据，按已测24小时旧令牌有效期加时钟容差执行切换和负面检查，再开放普通客户与已验收收费渠道。 | 前述发布条件完成后Agent受控执行。 |

The earlier API13/Web5714ec158 and store1.0(4) remain dated artifacts; currentAPI14,
localized Web/WWW and the uploaded1.0(5) are separately verified above. The six designed English
store images and approved OS-only encryption metadata are retained. Actual device use,
purchase/restore,submission,approval and public availability remain separate outcomes.

The original three-identity review access was recorded to expire at2026-10-06T17:08:57Z
(October7 01:08:57Hong Kong). Verify that reviewer access is operative before further
acceptance/submission; no extension or permission change occurs in this status review.
The already-measured24hour old-token lifetime is a cutover planning input,not a new
24hour expiry imposed on normal customers or an overall launch time estimate.

Use[handoff](handoff.md)for one next step and[the register](../config/release-gates.json)
for exact evidence. No reliable public-launch date is asserted while owner-deferred
facts/device work and provider/submission outcomes remain unresolved.

## HISTORICAL — September30 independent engineering before review repairs

Owner now asks to finish all work outside their participation/confirmation and the
existing AWS reply wait. Restricted production API7/schema0091, independent identity
services, bounded retention/holds/manual-snapshot retirement and recent authentication
are implemented and deployed. Current-provider restore reconciliation is implemented
and locally tested. Current checks are API341,Web107,infra47 and native41targeted
passes, with exact evidence boundaries in[the current contract](release-engineering-20260930.md).

A final closed-entry signed IPA, closed Web candidate, six upload-format JPEGs and
listing/privacy/age/encryption/reviewer worksheets are prepared. These are not an
enabled TestFlight app, actual login/purchase, submitted declarations or release.
[Prepared package](../output/release/rillora-20260930/README.md).

The register's remaining gates now describe real Owner/provider/transaction acceptance,
not a request to repeat completed engineering. Preserve old test capabilities until
controlled customer cutover, then retire them and wait their real86400second tokenTTL
plus skew. Actual review login/terms/enrollment, Apple transaction/device evidence,
SES approval/delivery, merchant facts and final price/declarations remain separate.


## HISTORICAL — September29–30 Apple execution checkpoint

Owner prioritizes Apple release work. The enrolled TestFlight/review Sandbox path
now has local implementation and314API test passes, native regression/transport
checks, and a signed Release archive/App Store distribution export. The exported
artifact remainsclosed to accounts and was not uploaded. This supersedes the
implementation-only Sandbox rejection and missing-local-artifact gaps in the
22:44inventory below; cloud review activation and actual transactions remainopen.

Small Business Program enrollment is actually submitted after Owner's facts and
attestation; Apple acknowledges receipt but has not yet confirmed approval/15%.
Annual provider prices are unchanged; public website/support URLs are saved in
the App Store draft. PurchaseIntent is implemented, but Apple still requires an
approved binary before allowing Streamlined Purchasing to be disabled. TestFlight
has no builds; final screenshots, reviewer credentials/contact and final privacy/
age/encryption package remain. [Current Apple contract](apple-review-validation-20260929.md).

No release-gate status is waived by these results. Next make the production review
account/runtime/catalog operational, then verify actual Sandbox purchase/restore
before producing and uploading a usable candidate. Price finalization follows
actual fee evidence; Owner-deferred business/device facts remain separate.

## HISTORICAL — September29 22:44 launch-gap review

Owner asks what remains before formal publication. Fresh local preflight at22:44+08
still reports seven unfinished engineering/release gates and two Owner-deferred
gates. The final native distribution artifact was not supplied to this check; its
absence from acceptance is not filled by the installed Debug Simulator app. All
five native production connection values and the primary App icon are configured.
These counts are an inventory, not a completion percentage.

The current UI/UX repair is complete for its recorded scope: ten findings repaired,
app-wide Web/native appearance, Preview/WWW/LegalSites publication, current local
and synthetic journey checks and engineeringCI29. Core matter/sharing/guidance,
backup/export and the separate production data/TLS/restore/monitoring foundation
retain their completed evidence. No new feature, logo or decorative-motion work
is needed to close the release gates.

| Required work | Already prepared | Still required to close |
| --- | --- | --- |
| Apple actual transactions | Ordinary native purchase/restore, ownership/signature/ledger and retry source tested | Safe final-app TestFlight/review Sandbox path; effective fees and differential annual price; exact provider SKU/keys/notifications; real purchase, restore, renewal/refund/expiry and cross-channel acceptance |
| Production identity/mail | Production clients/audience, Google project/client and SES domain controls prepared | SES production approval or a separately adopted legitimate delivery alternative; Auth0 sender/templates and real verification/reset/invitation continuation; Google/Apple production login; retire test capabilities and let old tokens expire before customers |
| Web annual billing | US$88.99annual catalog and ordinary production adapter/consent/lifecycle source tested | Actual merchant/tax facts, live product/price/key/webhook/portal, runtime rollout, real payment/cancel/refund/expiry and correct shared entitlements |
| Final production runtime/journeys | Independent data/KMS/TLS and same-origin closed Web delivery; native5/5connection values | Deploy reviewed current API/migrations/configuration and final clients; verify actual production identity create/edit/invite/accept/restrict/revoke/export/delete across Web/iOS before activation |
| Recurring data operations | Seven-day backup and actual scoped restore/deletion/revocation/session replay | Bounded recurring retention and old-snapshot retirement; reconcile provider transactions after restoration so later refunds/expiry/access changes do not revert |
| Final security/artifact acceptance | Content encryption, source/secret checks and CI checkpoints | Review exact final production permissions, dependencies/artifacts, sensitive-action authentication, negative access, logs, rollback and unresolved high-impact defects |
| Submission package | App record, initial listing drafts and approved03assets | Signed Release archive, TestFlight, final screenshots/privacy/age/encryption/store markets, reviewer access, actual submission/review and manual release |

At the historical22:44checkpoint the Apple integration gap was: production verification rejected
Sandbox. Apple documents that TestFlight apps automatically use Sandbox, so the
final candidate needs a correctly separated review/test path, not merely an upload
or a relaxed production verifier. [Apple TestFlight testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight/).
Submission separately requires metadata and a chosen build; a draft is not a submitted
version. [Apple submission requirements](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/).

SES's September29 refusal and22:31:40+08clarification are verified in the immediately
preceding work. The case is Reopened but SES production remainsfalse/DENIED. This
status review sends no further message and does not wait idly for the provider.
Apple/Stripe administration, credentials, fee status and merchant facts are not
re-logged or newly reverified in this status-only pass; each retains its dated record.

Business/merchant-market verification and physical-device acceptance remain
Owner-deferred. They are not silently marked complete, nor newly demanded here.
Existing joint Web/iOS and Free/Family release scope remains. No public Free-only
launch, service migration, price change or new feature is adopted by this review.

Execution priority remains Apple/TestFlight transaction validation, alongside
retention/reconciliation and final artifact/store preparation; complete Web live
configuration as merchant facts permit, then integrate identity/mail and run final
production journeys. Provider approval/business facts and actual review timing
prevent a reliable calendar release promise now. The next inspectable milestone
is a signed TestFlight candidate with real Apple Sandbox purchase/restore evidence.
[This review/preflight](../output/qa/rillora-release-status-20260929/README.md).

## HISTORICAL — September28 public landing and Preview entry

Owner explicitly authorizes the public-site redesign and a Preview-labelled link
to the existing staging account. The generated-artwork landing, working example
sharing/details, FAQ and guide entry are implemented and published on WWW. The
full03favicon replaces the old micro variant across Web/legal/Auth0.98Web/7legal
checks and Chrome interaction/responsive/reduced-motion evidence are recorded in
[the landing contract](landing-page-20260928.md). This closes the requested public
presentation/entry correction only; private App UI and production activation gates
remain unchanged. No pending API migration or billing activation is bundled with
these static releases.

## HISTORICAL — September28 mail-provider priority, superseded October1

Owner asks to reduce service sprawl and reconsider AWS. Retain AWS plus Auth0;
prepare evidence-based SES reconsideration, with Resend only as a fallback and no
pending signup requirement. Auth0's built-in sender is unsupported for production;
replacing Auth0 with Cognito does not remove SES approval for higher-volume mail.
Owner later explicitly authorizes submission: the original case is reopened with
operator correspondence at September28 12:40:19+08. Browser MFA/access and the
current SES sandbox200/day,1/sec are verified; CLI refresh remains separate.
No approval, provider/identity switch or price change occurred. The Cognito
assessment remains planning only. [Current mail contract](production-identity-mail-20260924.md).

## September27 current engineering increment

Ordinary native Apple quote/consent/preparation, server-gated purchase/restore and
unfinished replay now have local implementation and300API/170native test passes
(1existing native skip). Both checkout channels check unfinished and resumable
foreign purchases; actual policy/capability readiness is required before payment.
Normal/large-text form checks use a clearly isolated non-purchasing Preview app.
This does not pass the Apple transaction gate: final App Store review/TestFlight
needs a safe enrolled-account Sandbox validation path, then real provider lifecycle,
exact pricing and cloud rollout. Retention/recovery operations, identity/mail,
merchant facts and signed submission retain their distinct remaining requirements.
[Current Apple evidence](production-apple-20260926.md).

## September26 final-launch goal — current execution contract

Owner explicitly requests a long task through launch readiness, autonomous task
breakdown and careful maintainability review. The active goal continues across
compactions and provider waits. Preserve the existing scope/UI, Web88.99annual,
Apple channel differentiation, history and FanPass. Do not mark the goal achieved
from a build, portal setting or a checklist with unresolved required evidence.

The refreshed full read covers147project-owned Markdown files/25,917lines.
[Reading ledger and work state](../output/qa/rillora-launch-goal-20260926/).
AWS login is now verified, superseding the expired-session observation below.
SES's actual September26 refusal is confirmed in both Support and Gmail; specific
criteria remain undisclosed. September28 prioritizes reconsideration with existing
SES at that dated checkpoint; Owner selected and configured Resend on October1. Continue independent engineering.
[Current mail facts](production-identity-mail-20260924.md).

Execution packages are: Apple authoritative transaction/status/intake and native
purchase/restore; bounded retention and post-restore commerce reconciliation;
production identity/transaction mail; ordinary Web billing/provider configuration;
complete authenticated Web/iOS journeys; final security/maintainability review and
signed TestFlight/submission materials. Independent work continues while a provider
or本人step is pending. Business/device deferrals remain recorded honestly.

Maintain the modular API and shared PostgreSQL entitlement/finance model. Keep
HTTP parsing/authentication, provider verification, domain reconciliation,
persistence and workers separate; reuse mature SDKs and existing contracts.
Append migrations, preserve historical receipts and use bounded idempotent retries.
Test actual ownership, time, failure and recovery boundaries. Review each patch and
bind source/CI/image/schema/deployment evidence before claiming a release result.
No new microservice estate, production test bypass or extra product scope is needed.

Latest local increment: production Apple intake/durable notifications, immutable
receipts and fresh-state restore reconciliation, per-subscription worker leases,
bounded retries and opt-in aggregate alarms pass285API/40infrastructure tests.
The older local pg_restore collision found by full regression is fixed. This closes
an implementation slice, not the Apple release gate: native purchase preflight/
consent/account reservation, actual provider configuration, cloud deployment,
real transactions and signed distribution still require their own evidence.
[Current Apple contract](production-apple-20260926.md).

## HISTORICAL — September26 17:08+08 launch-gap review

The current read-only preflight still lists seven unfinished engineering/release
gates plus two Owner-deferred gates. They group into six workstreams: Apple
purchase/restore, production identity/mail, real Web annual billing, complete
production Web/iOS workflows, final security/retention operations, and signed
TestFlight/App Store submission. This is a work inventory, not a completion ratio.

Web88.99 is implemented/staged, closed production Web updated andCI14 successful.
Independent production data/TLS/recovery, core sharing, public information, monitoring
and native connection preparation retain their completed evidence. Do not put
client setup or price revision back into the active development backlog.

The17:08+08 mail refresh failed at AWS authentication; the session is expired.
No new SES review decision was retrieved. Keep the last successful00:43+08 check
(production accessfalse,14other checks passing) and the already-submitted support
reply as dated evidence. No repeated login or message is needed just to answer
this status question. Auth0 production cutover/real mail and login acceptance are
still separate from the sender's DNS/configuration proof.

Resume the Apple production lifecycle and differential price work while independent
security/retention/submission preparation proceeds. Merchant/business facts and
physical-device acceptance remain Owner-deferred, not completed. No new pricing,
features, release scope, provider mutation, deployment or full-suite rerun follows
from this review. [Review evidence](../output/qa/rillora-release-status-20260926/review.json).

## September26 Web88.99 revision

Owner sets Web annual88.99. Price-v4, fresh purchase consent, retained historical
receipts and the exact new Stripe TEST Price are implemented. Current validation
and cloud rollout are separate in[the price contract](pricing-88-99-20260926.md).
Apple differential pricing and actual live-sales gates remain separate.

## September26 Apple continuation

Owner restored Apple administration. Strict production verification and versioned
signed-price mapping are locally tested foundations, not a complete intake/runtime.
Owner reaffirmed channel differentiation; the later near-parity question is
withdrawn. Verify effective fees and the conditional99.99/119.99Apple candidates. Unsupported default multiseat purchase was disabled for both unsubmitted
products, while monthly remains zero territories. [Apple contract](production-apple-20260926.md).

## September26 commerce engineering checkpoint

Production Stripe source, independent purchase consent/UI, versioned vault loading,
ledger and bounded verified-event retry pass local acceptance. Only the closed Web
artifact/return paths are deployed. Live provider objects/credentials, API rollout,
ordinary real transactions, cross-channel and restore reconciliation remain open.
The existing test adapter retains live rejection. [Commerce contract](production-commerce-20260926.md).
Fresh SES check at00:43+08 onSeptember26 still has productionAccessEnabledfalse;
14other configuration checks pass. Owner completed the subsequently expired Apple
management login; actual Rillora distribution access is restored. No deferred business/device gate is changed.

## September25 later client-delivery checkpoint

The earlier zero-of-five native-field observation below is superseded: all five
values now compile correctly, strict production validation and isolated session
storage are tested, and the build deliberately keeps customer accessNO. The
independent app.rillora.xyz delivery/HTTPS/same-origin API is deployed and verified.
This closes client delivery preparation, not authenticated production workflows.
The account/email, ordinary purchase and final artifact gates remain open.
[Current client evidence](production-clients-20260925.md).

## HISTORICAL — September25 release gap review

Fresh preflight/source review still reports seven engineering/release gates and
two Owner-deferred gates. This is not an overall completion percentage. Core
features, production data/recovery, public website, monitoring and source/CI
retain their completed evidence; customer accounts and sales remain closed.

| Workstream | Current remaining work | Completion evidence |
| --- | --- | --- |
| Identity and email | SES approval, restricted sender/Auth0 setup, Google production publication, controlled retirement of old test identity capabilities | Actual email/Google/Apple login, verification preserving invitations, password recovery and old-session behavior |
| Final Web/iOS connections | Closed same-origin Web delivery and all five native Release values are verified; authenticated production workflows and final signed artifacts remain | Both production clients complete create/share/accept/revoke/delete against the independent production data |
| Web annual purchase | Production source and local lifecycle pass; install live provider/vault/IAM/catalog configuration, deploy API/migrations and verify real purchase plus failure recovery | Current annual offer, payment/entitlement, cancellation/expiry/refund/restore and reconciliation |
| Apple subscription | Production verification/price-binding foundation passes locally; annual choice, production snapshots/intake/native wiring and actual purchase remain open. Existing Sandbox/v1 mapping is preserved | Versioned production handling plus real Sandbox/TestFlight purchase/restore/renewal/notifications, preserving historical receipts |
| Final security and data operations | Retention cleanup/old manual snapshots, post-restore commerce reconciliation and final production security acceptance | Exact permissions, negative access, sensitive-action reauthentication, source/artifact/dependency checks and rollback evidence |
| Submission and activation | Signed Release/TestFlight, final screenshots, privacy/age/encryption declarations and reviewer access | Complete submission package and actual review result, followed by the existing manual-release process |

Business/registration verification and physical-device acceptance remain
Owner-deferred, not completed. Keep the existing joint Web/iOS and Free/Family
launch scope; do not silently substitute a public Free-only launch.

SES waiting does not block closed-client preparation, payment implementation or
submission materials. At that checkpoint the priority was closed client
preparation, which is now complete; the September26 review above supersedes that
old next step. Merge email/identity checks when external approval is available. The existing Management JWT lifetime is 86,400 seconds: the actual
cutover must stop old issuance and allow expiry/clock tolerance before customers,
while independent engineering can continue.

At the September25 15:44+08 status check, AWS STS failed with an expired session.
No new SES approval state was obtained. The last successful mail check remains
01:15+08 that day; do not present its DENIED flag as a fresh response. No login,
deployment, transaction or new test was performed in this status review. Existing
CI9 evidence keeps its date. [Review QA](../output/qa/rillora-release-status-20260925/review.json).

## September24 mail, public site and Free identity preparation

Free25,000MAU is confirmed by both current Auth0 account and official pricing.
Owner prefers testing now and a prelaunch cleanup/cutover; retain Free and prepare
separate inactive production clients/audience. No existing test account or identity
binding is deleted. Retiring staging's live identity credentials/access remains a
required cutover step, not solved by deleting a few database rows.

SES domain/TLS/DKIM/MAIL-FROM and simulator delivery/failure counters/alert actions
are verified. The API marks production access DENIED, while the actual Support
case requests more information for continued review. The approved follow-up was
submitted and read back at2026-09-25 01:12:39+08:00; sending is still disabled for production.
Real verification/recovery mail and Auth0 provider configuration remain open. WWW public product,
guides/support are deployed and tested; no public accounts or sales are enabled.
Root HTTP302, browser HTTPS redirect and the modern monitor client pass; earlier client-specific failures remain documented. Google
production project brand/policy/logo/links, the approved protected hosted client and
minimal identity scopes are saved. Verification/publication, Auth0 replacement and
ordinary user login remain separate. See[identity/mail](production-identity-mail-20260924.md)
and[public website](public-product-website-20260924.md).

## September24 current production checkpoint

Private GitHub/CI and the independent7-day production data foundation, real
synthetic encrypted restore/revocation/deletion/session replay and cleanup are now
verified. The optional API transport is now deployed with internalTLS, actual health/ready
acceptance and closed account routes. Production health/closed checks are included
in the existing active monitor.
The original Auth0 administrator identity/CLI has been recovered; production
clients/email and final Web/iOS connections remain open. [Current execution](production-runtime-20260924.md),[completed data result](production-recovery-20260923.md).
The September23 review below describes its earlier observation point; statements
that production data/recovery did not yet exist are superseded by this checkpoint.

## 当前判断与范围

Owner要求后续工作按正式上线推进。现状是已有可运行核心产品和较充分的测试站验收，尚不是可直接提交并收费的生产版本。September19曾完整读取92份项目Markdown、20,554行并核对代码、AWS与Apple后台；September23沿用该工作流阅读基线，补读变化文件、重跑发布预检并核对已有验收记录。各次证据保持自己的日期，不能用旧“下一步”重复已经完成的工作。

首发冻结为现有Web与原生iOS：事项地图、按人按事项共享、邀请接受／撤销、官方指导、备份／导出／删除，以及有界共同复核。Free一位实时接收人，Family五位及一位建议贡献者；September21 Owner取消新月付，当前Web新购价按September26决定为US$88.99/年，Apple分渠道另定。历史已购权利保留，Apple年价仍单独待定。保留既有UI，不继续为上线扩充Logo数量、装饰动效、附件/OCR、法律代办、死亡自动释放、中国大陆平面或完整AI客服平台。

## September23 发布差距复核

Owner询问距离正式发布还缺什么。本次重新运行[发布预检](../output/qa/rillora-release-status-20260923/preflight.json)，核对当前源码和当天加密验收记录。仍有8项工程／发布门未完成，另有经营市场与实机2项Owner暂缓；这不是按门数量计算的总体完成百分比。

该次复核时只有staging／Operations基础设施；后来已完成独立生产数据基础和恢复。原生Release五个正式连接字段仍为空；Stripe适配器拒绝live对象；Apple验证器仍限定Sandbox，服务端价格映射仍指向历史v1。正式购买还需要实现和验收，不能描述成只剩后台开关或等待审核。

工作合并为六组：隔离生产／Release连接；生产登录／恢复／邮件；Web真实年付；Apple生产交易处理与真实Sandbox/TestFlight验收；备份恢复／删除重放／最终安全回归；官网支持入口与签名构建／提审资料。核心事项／分层共享、18份指南、03品牌、年付停售处理、内容加密与已送达告警均保留已有证据，不重新当作待开发事项。

完整E2EE按Owner延后；SOC2认证本身不新增为项目自设的首发门。最终生产安全检查仍必须做。额外动效、Logo、附件/OCR、企业功能及完整AI客服平台不挤入首发。Auth0自定义模板Logo402与生产认证邮件的可靠性是不同问题，不能因换Logo的付费限制而混淆后者。

本次没有重登Apple／Stripe／Google管理后台，也没有新的部署、交易或全业务测试；后台状态沿用各自日期的记录。Apple提交仍需指定构建与完整元数据，Google生产OAuth仍需独立项目与真实公开首页，官方规则已在本次重新读取。详见[复核QA](../output/qa/rillora-release-status-20260923/README.md)。

## September23 内容保护增量

独立KMS、应用层AES-256-GCM、分层授权解析、既有数据迁移及DB写入拦截已落实到staging；这不等于隔离生产已经创建。当前应用加密、旧快照边界、真实KMS及恢复限制见[实施与操作合同](security-hardening-20260921/implementation/operations.md)和[QA](../output/qa/rillora-content-encryption-20260922/README.md)。前移的内容层工作没有关闭生产TLS、至少7日备份／隔离恢复／删除重放、身份邮件或独立检查门。

## September21 当前增量

年付-only已部署至原staging（API33／0063），Stripe三代TEST月付归档，
Apple月付可售地区0；没有开启正式销售。主App与Preview图标、现有Web／法律站
资源一致。Auth0基本品牌已应用，但真实custom-domain旧Liquid模板仍显示文字，
模板管理被Free计划402阻止；Stripe和Google的Logo上传限制后来已解除并完成保存。
AppStore尚无提交构建，不能把模拟器图标当作商店页图标。

100个隔离账号／2,000事项的私有API检查已执行；现有CPU余量较大，但同源IP会受
300请求／15分钟限制。Auth0真实Free额度2/25,000MAU，无自定义邮件provider；
内建邮件仅开发用途、10封／分钟。正式生产邮箱、生产隔离和恢复仍是上线门，
并非因100用户就需要更大型服务器。[完整证据与限制](annual-brand-capacity-20260921.md)。

同日的[信息保护研究](security-positioning-20260921.md)进一步区分RDS透明加密、
在线内容加密和客户端E2EE。Owner随后在September22采用信封加密，September23已在现有staging实现；
受保护正文先加密再入库，应用仍可在授权后解密。生产前的认证、内部TLS、日志、
恢复及独立检查必须有对应证据，不能用“银行级”替代验收。

Owner对香港经营／商业登记回复“先忽略”：本项暂缓，不再追问或要求证件，也不能被记录为已核验。技术、运维、上架准备继续；实际收款与市场开放仍需真实商户和适用市场事实。实体设备沿用此前排除，仍如实保留发布验收缺口。当前不引入招聘或外包前提。

## 已有证据，避免重做

| 工作 | 已完成的范围 | 不能由此推出 |
| --- | --- | --- |
| 核心两端与共享 | Matter分类字段、草稿恢复、A/B/C字段隔离、Free1/Family5及截止副本；Owner实际A/B接受与撤销 | 生产部署、真实第三方家属交付、修复后的新一轮真人注册 |
| Stripe | 独立Rillora测试账户68/7.99付款、限定测试权益、取消／恢复、退款与去重 | live收款资格、普通用户生产购买 |
| 自助退出 | 范围化导出、完整备份／本地读取／导入、归档恢复、供应商账户删除测试 | 生产备份恢复、所有保留期限自动清理 |
| Apple商务基础 | September19后台回读免费／付费协议有效、银行可用、两项税表使用中 | 新市场经营资格、App审核或实际交易 |
| 指南与法律页 | 18份上下文指导；正式英文法律站Sites6已发布（品牌／字体声明更新；正文版本不变）；角色邮箱曾完成独立往返 | provider继承批准、法律审查通过或持续支持表现 |

原始证据分别见[真实邀请](../output/qa/rillora-real-invitation-20260917/README.md)、[Stripe验收](../output/qa/rillora-stripe-acceptance-20260917/README.md)、[数据退出](p1-reliability-repair-20260915.md)和[当前QA](../output/qa/rillora-release-readiness-20260919/README.md)。本轮新测试与旧检查点必须分开记。

## HISTORICAL — September23 release gap baseline; current list above supersedes

| 主线 | September23当前缺口（后台沿用最近记录日期） | 完成判据 |
| --- | --- | --- |
| 生产环境 | 独立数据基础与恢复已验证；关闭状态的API/TLS已部署并有实际健康／就绪／关闭响应及权限配置验收；原生Release五个连接字段仍为空 | 核验实际生产API/TLS及身份，再接最终Web/iOS产物；保留独立staging |
| 生产身份与恢复 | Google仍是Testing的已记录基线；Apple本人callback及真实密码恢复缺完整证据 | 生产客户配置、Google生产项目与首页、Apple／邮箱／Google端到端、邮箱验证保留邀请、恢复后的旧会话处置 |
| 正式购买 | Stripe适配器明确只接收rk_test与非live对象，普通购买UI及独立购买同意未闭环 | 生产适配器、账本／回调／后台补偿对账、价格／税处理、购买同意、取消／恢复与跨渠道防重订阅；不通过放宽测试分支来开门 |
| Apple交易 | 新月付已停售；Apple可用年价尚需落定。当前验证器仍限定Sandbox、服务端价格映射仍为v1，正式交易路径与实际购买验收未完成 | 版本化目录映射与各地区实际价格对齐、真实Sandbox购买／恢复／通知、持久化后finish，再制作提交构建 |
| 运维与数据 | 公开监控已完成送达与缺心跳验收；生产7日备份和隔离恢复／删除重放已通过；生产目标已接入并通过云端调用；持续保留清理及恢复后计费对账仍待完成 | 接入实际生产监控；验证持续清理与旧快照退役；保留既有演练的观察RPO/RTO及边界 |
| 上架与公开入口 | Owner已选03；主App图标已配置且普通Debug模拟器实际显示，Web品牌已发布；最终生产Release及提交构建／截图仍缺，年龄／隐私／加密、审核账号及最终市场范围待定 | 按最终产物完成申报和TestFlight／设备验收；资料齐全后送审；审核后手动发布。公共首页不能继续Coming Soon |
| 安全与持续维护 | 依赖公告已检查并完成本地升级及回归；还需最终生产范围安全复核、源码／产物记录和发布回滚 | 可复现构建、秘密检查、必要权限与负向访问验收、恢复演练；不把依赖零公告称为独立全面安全审计 |

Apple要求提交前具备必需元数据和指定构建；App Privacy要覆盖应用及集成第三方的实际处理行为。分别见[提交规则](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)与[隐私说明](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)。Google要求生产与测试项目分离，并提供真实公开产品首页；基本身份scope与敏感／受限scope审核不能混为一谈。[Google生产要求](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)。

## 已开始落实

- 独立Operations主题已订阅Owner选定邮箱。确认邮件最初落入SPAM，已移回Inbox并确认；确切地址只在受保护本地配置。实测发现SNS政策只有TLS拒绝条款而没有CloudWatch允许发布，历史记录明确报SNS:Publish拒绝。已添加仅本账户、四个精确告警的发布许可并部署，保留TLS要求；测试告警与自动恢复两封邮件已实际进入Inbox。真实缺心跳ALARM及恢复OK已送达Inbox，15分钟日程已启用；实测缺心跳首次告警约75.4分钟，不能宣称45分钟最大延迟。
- 新建[发布门登记](../config/release-gates.json)与[只读预检](../tools/release/preflight.py)。它会列明未完成／Owner暂缓项，检查最终原生artifact的配置、开发身份、正式域名、App图标及测试StoreKit文件。报告不具有发布批准效力，不能通过删掉必需门或无证据填verified让它通过。
- App Store副标题、效率分类、英文版本描述／关键词／推广短文、现有法律联系页的支持URL已保存为未提交草稿；发布方式从默认审核后自动改为手动。未提供虚构的审核账号、银行／税务字段或未上线的营销URL。原始内容在[英文上架文案](../config/app-store-listing.en-US.json)。
- 本轮中途Owner将新购报价改为88.80/9.99。Stripe TEST新价格及服务端v3目录独立于旧68/7.99记录；Apple月价已改9.99，年价的平台例外待Owner选择。实际Apple交易及服务器版本化绑定尚未完成，不能把目录配置当作购买通过。

## 工程排期与顺序

September19曾记录5–10个工程日的初步预算；随后Owner先行安排了品牌、年付与内容加密工作，该数字不作为September23起重新承诺的倒计时。当前生产接入、真实购买和最终构建尚未验收，先按明确的完成判据推进；平台审核、商户事实与Owner暂缓项另计。完成生产／恢复和双端交易验证后，再基于实际剩余项确定可提交窗口。

连续顺序：隔离生产配置／部署与恢复 → 生产身份／邮件（公开首页可并行）→ Web与Apple生产购买及实际验收 → 最终两端／设备／隐私申报与提交。现有监控与补丁验收不再作为重复起点。这里只定义顺序；唯一活动执行项以[handoff](handoff.md)为准。经营登记暂缓不阻断独立工程，但实际收费日期暂时不能确定。

## 运行预检

仓库根执行 `python3 tools/release/preflight.py --report-only --output output/qa/release-preflight.json` 可保存当前缺口。移除report-only时，存在任何缺口返回2；最终原生包用 `--ios-app /absolute/path/Rillora.app` 明确传入。没有提供artifact不会被当作检查通过。

正式市场只打开实际ready的行，USA/HKG是候选而不是默认全部开放。永久Free与可用Family同批提供；不因正式购买未完成而擅自改成公开Free-only首发。测试站、测试交易、原生Simulator与App Store草稿各保留自己的证据身份。


## HISTORICAL — Selected brand checkpoint — September19

The Owner-selected Legacy Imprint03 closes the Logo-choice and missing-source-icon work. The main target now configuresAppIcon; the inspected Debug bundle declares it and the Simulator home screen renders the selected image. Existing app/Web brand slots, font licences and legal Sites6 are updated. [Brand QA](../output/qa/rillora-brand-adoption-20260919/README.md) distinguishes this from a production Release artifact: readonly preflight still reports missing production fields, test endpoints/StoreKit fixture and the existing release gates. Do not count a Debug icon or legally published Terms as product/App Store release approval. Resume isolated production configuration and backup/restore work; keep the existing Appleannual-price question and Owner-deferred registration/device work separate.

## October2 release-register drift correction

The register had12required gates while the checker still recognized11. A regression
against the actual register reproduced the false incomplete-set error before the fix.
The checker now explicitly includes review-remediation and still fails if it is removed.
Seven focused preflight tests pass. The13Dot fixes are now correctly recorded as
verified/deployed; other10unverified gates remain blockers. No approval or missing
user/provider result is invented. Existing deployment/identity/Apple/public-surface
next descriptions now match the current receipts.
