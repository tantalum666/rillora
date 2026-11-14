# Production annual commerce preparation

Role: focused ordinary Web purchase, consent and provider-isolation contract
Status: WEB LIVE SINCE OCTOBER15 / BILLING DISPLAY REPAIR LOCALLY VERIFIED / CURRENT PROVIDER READBACK AND DEPLOYMENT PENDING
Last updated: 2026-10-31 (Asia/Shanghai)

## October31当前付款入口合同

October15已完成旧令牌到期后的正式Web开放，USD88.99／年与显式关闭自动计税保持；下面October13及更早的关闭状态是历史检查点。当前[正式产品复查](release-product-audit-20261031.md)发现Apple审核账号资格曾被Web错误地当成Stripe测试环境，修复尚未部署。

`commerce/status.webBillingEnvironment`由实际挂载的Stripe执行器返回`test`、`production`或`null`。只有真实测试执行器与有效测试账号同时成立时，Web进入明确标识的测试结账；Apple审核账号的`validationOnly`不能选择Stripe环境，普通套餐名称不追加测试后缀。生产`stripe/status.checkoutAvailability`只读返回`available`、`account_unavailable`或`unavailable`，复用既有账号与测试账本限制，不创建订单、改变权益或放宽真人收费资格。前端依次核验销售开关、有效报价及该状态；真实不可用状态有双语说明和重试。

发布顺序必须先兼容API、再Web：旧客户端可忽略新增字段，新Web要求生产状态字段存在。无数据库迁移、价格、权限、税务或销售开关变更。本机合成提供方／浏览器检查与真实Stripe后台回读分别记录；这次没有制造Live付款。

## October13实际Web计费交付

Owner移除计税策略前置后，tax.mode=disabled实际安装，原商品／USD88.99／年价不变，API25live与目录／权益准备完成。当前新购因既有身份切换要求暂闭：4旧Preview客户端停止签发、两项旧服务实测403，等旧令牌至香港October14 04:21之后再开放。此门与Stripe Tax无关，未制造Live付款。[当前结果](web-billing-activation-20261013.md)。

## October13 Owner移除计税策略阻塞

Owner随后明确“忽略掉计税策略”，取代下方状态解释中继续等待税价策略的前置条件。按[当前实施](web-billing-activation-20261013.md)加入显式disabled模式，automatic_tax=false，保留现有8899USD年价与provider原始税行为；不生成assessmentReference、登记号或免税声明。此处是明确操作选择，缺省not_configured仍不被静默解释为允许收费。正式运行／销售及权益切换分别记录。

## October10 optional Stripe Tax deferral

Owner prioritizes deferring the Stripe Tax automation setup. The processor account freshly confirms charge/payout capability; automatic_tax is optional in Checkout. Stripe Tax activation is not a universal launch prerequisite. The current application still rejects not_configured for new checkout and only checks provider Tax readiness in automatic mode. Preserve the actual source/runtime boundary until an explicit valid non-automated billing policy is implemented/configured; do not fabricate a reviewed_no_collection assessment or call ordinary customer checkout open. [Current decision and evidence](live-configuration-20261009.md).

## October9 configuration checkpoint

Owner directs Live setup without waiting for BR completion; the prior blanket gate is superseded. Actual Product/Price/default and production catalog binding are configured, existing scoped key/HMAC bundle is installed, API17and the18-event Live endpoint are operating. A genuine signed Live configuration event is independently verified without a payment. [Current Live contract](live-configuration-20261009.md) is the authority; October6 sections below are dated prior checkpoints.

Notifications can be enabled separately from new checkout in the existing restricted review runtime. Tax mode not_configured expresses pending facts without inventing an assessment; quote/checkout and purchase routing stay closed, while signature processing and owned management remain separate. Ordinary customer opening, actual tax treatment and real-money lifecycle remain unverified. The full current cloud TEST lifecycle is [separately proven](stripe-cloud-acceptance-20261009.md).

October9 testing-boundary correction: Stripe's [official testing rules](https://docs.stripe.com/testing) prohibit testing live mode with real payment details. The earlier Agent requirement for a prelaunch real-money payment/refund test is withdrawn. Preserve Sandbox lifecycle proof and verify Live configuration/security/nonfinancial delivery; observe legitimate customer transactions when they occur. Do not require merchant self-payments or manufactured transactions to clear a release gate. No real-money lifecycle is retrospectively claimed passed.

## October6 Live merchant and configuration readback

Owner approved reuse of X identity/banking, personally submitted Stripe's final form and
approved scoped Live MCP access for Rillora only. Actual account retrieval confirms
charges_enabled/payouts_enabled/details_submitted true, card_payments active and no
current/past-due/pending-verification requirements. No FanPass or shared-entity website
change was made. This processor status does not independently settle business/tax facts.

Live product `prod_rillora_family_v2_live` and annual USD8899 Price
`price_1UNXyZCxTlowhyiGJB6HlBR5` are inactive. Tax behavior remains unspecified until the
required assessment; active Stripe registrations are empty. Setting an inactive Price
as default was rejected without mutation; do not silently enable it to bypass that gate.
Portal `bpc_1UNXzpCxTlowhyiGj6xNlx2w` permits invoice/payment-detail management and
period-end cancellation, no plan change or public login link. Webhook
`we_1UNY1yCxTlowhyiGTpwy62qY` has18supported events, pinned API2026-08-26.dahlia and
is disabled until its runtime is ready. MCP redacted the signing secret, so its actual
value was read through the provider UI, saved directly to protected local storage and
hidden again. No secret belongs in Git, model output or a plaintext task environment.

Owner separately approved the dedicated runtime key's3write/9read permissions and
protected storage, then completed Stripe's required email identity check. The key now
exists; actual SDK reads confirm the correct Live account/product/8899price. Local and
AWS Secrets Manager payloads match. AWS labels the first version AWSCURRENT as well as
PREPARED; this is deliberately a preparationOnly bundle that the production parser
rejects. The running API has no billing ARN/read grant/enablement. Complete runtime
configuration, tax/market facts, real payment and lifecycle/reconciliation remain open.
[Current execution](device-config-20261006.md).

## October6 current-price browser TEST acceptance

The existing Rillora account's USD88.99 annual TEST Price has now completed hosted
Checkout cancellation/return, declined and successful test cards, signed-in Family
return, Portal scheduled cancellation/resumption, full succeeded8899 TEST refund and
subscription termination. Free access returns after the refund. The official CLI's
original signed webhook replay returns duplicate; all10observed inbox events finish
applied after controlled retries of transient concurrency503responses.

The loopback fixture uses shipping cookie/CSRF middleware and a synthetic identity/
consent record. This is real Stripe TEST transport and browser UI, not upstream OIDC,
human purchase consent, cloud live-webhook or real-money acceptance. The refund amount
is verified against Stripe; the adapter stores event/object linkage and the entitlement
override, while the scaffold commerce_refunds table remains unpopulated. Do not claim
a complete accounting ledger. Live merchant/tax/market facts, actual production secret
installation, final reconciliation/alert operation and controlled sales activation keep
their separate gates. [Full evidence](release-12-stripe-20261005.md).

Owner asks to complete release engineering. Keep Free plus WebUS$88.99 annual Family,
current UI/brand, historical receipts, test identities and FanPass. This increment
prepares an ordinary production path; it does not open sales or complete the
Owner-deferred merchant/business facts. Apple remains a separate workstream.

## September26 Web price revision

The later Owner decision changes the current Web offer to88.99, price-v4 with
8899cents and a new purchase-consent version. Earlier implementation/CI evidence
below retains its original price/checkpoint date. Current rollout and preserved
v3 receipts are tracked in[the88.99contract](pricing-88-99-20260926.md).

## Provider and configuration boundary

The production adapter accepts only restricted live credentials for the exact
Rillora Stripe account. The existing test adapter still rejects live objects.
Shared SDK transport and pure normalization are reused, while configuration,
provider objects, inbox, subscriptions and routes retain explicit environments.
Stripe SDK22.6.2 pins API2026-08-26.dahlia; this version was checked against the
[official versioning page](https://docs.stripe.com/api/versioning).

A strict versioned secret schema loads AWSCURRENT from only the named Rillora
production billing secret in Frankfurt. Secret bytes are not returned in parser
errors, committed or supplied as plaintext runtime environment variables. The
October9notification configuration and exact production task read grant are installed. The
ordinary runtime flag requires the reviewed production origin, encrypted content,
recovery journal and internalTLS; development/test/closed-runtime flags cannot be
combined with it. A closed production build and server stay independently closed.

Before a new checkout, check market/operator/storefront/route/plan/product status,
effective dates, production entitlement enablement, exact account and merchant
charges/payouts readiness. The Web route is web_direct; stripe_web_external is the
separate iOS route. The provider must confirm an active live Product and its
recorded tax code, exact annualUSD Price of8899cents, licensed/per-unit, explicit tax
behavior, one item and quantity one. No new monthly purchase, trial, promotion
code, adaptive pricing or client-supplied price/provider identity is accepted.

New checkout requires an explicit valid tax mode and the confirmed product code.
The current Owner-approved mode is disabled, with automatic_tax=false. Automatic
mode separately checks registrations; reviewed_no_collection requires its recorded
assessment. Missing configuration never means exemption. The not_configured mode
permits signed notifications and owned management but closes new checkout. No new
tax registration, filing or assessment is implied by this technical configuration.

## Customer flow and durable purchase proof

Plan & access follows the [October13 single-action contract](plan-purchase-page-20261013.md):
Family benefits, explicit-currency annual price and one subscribe/manage action.
Renewal, cancellation and current Subscription Terms/Refund Policy sit beside the
button. Clicking subscribe submits that purchase's acceptance after refreshing the
quote; there is no extra checkbox or confirmation page. Account-registration
consent cannot substitute. Version, legal-bundle digest, amount/currency and the
required acknowledgements are checked by the server; an immutable per-order receipt
is saved transactionally. Status reads and management do not submit acceptance.

An owned durable order/attempt and stable provider idempotency key precede the
provider call. Ambiguous response retries retain the same reservation and original
pre-existing-Customer choice. A finished idempotency key cannot reopen a checkout;
a fast verified webhook cannot be overwritten back to pending by a late POST result.
Expired-read-only subscriptions are checked against the provider before another
purchase, since paused collection can still resume renewal. Provider Customer
bindings cannot be silently replaced by an incoming event.

Only exact provider-host HTTPS URLs can be navigated to. Return paths resolve to
Plan & access, survive authentication and discard session/payment query values.
The return URL never grants access. A separate status response exposes only the
user's state/period and management/pending flags, not provider/customer identifiers.
Closing new sales does not remove the existing customer's management route.

## Notifications, retry and access

Raw-body signature verification and environment/account binding precede inbox
processing. A fresh authoritative Subscription plus settled invoice and exact
customer/catalog binding is required for active access. Existing object ownership
wins over metadata; conflicting mappings fail. A fast unlinked event must prove
an owned order/attempt and its durable purchase consent. Subscription cancellation
retains paid-period access; expiry ends live extra access through existing sharing
rules. Refund/dispute effects apply to their matching invoice, so a late old refund
cannot revoke a newly paid period. No automatic provider refund/cancel is inferred.

The same-origin proxy removes /api. Both prefixed and unprefixed webhook aliases
therefore resolve to the same signature-checked handler; this also repairs the
existing Apple Sandbox notification alias without claiming Apple production support.
Unmapped production events return503 for provider retry. A production-only worker
can retry stored verified routing references every five minutes, up to20 per pass
and12 internal retries; it never stores/replays raw webhook bodies. Per-process
runs do not overlap, duplicate ledger application is suppressed, and generic
counts/errors omit customer content. Exhausted/unmapped items require operational
review; final alert wiring and post-restore provider-wide reconciliation remain
release work. The bounded retry timer is now deployed with the October9notification runtime; real failed-payment/recovery behavior is not established by the non-financial Live probe.

## HISTORICAL — September26 evidence and initial remaining gates

Local:233API tests, typecheck/build;89Web source tests plus7legal fixture tests;
39infra tests and21release guards. The initial all-Web invocation used the product
artifact for legal-only packaging tests; rerunning the intended legal fixture
passed without weakening assertions. Earlier failures exposed missing commerce
read permission and a wrong route assumption; migrations0071–0073 and code fix them.
Those migrations ran only in disposable local databases, not cloud production.

Actual local Chrome fixture checks cover unchecked/checked consent, valid proof,
recoverable failure, cancellation/management, pending-checkout exit, desktop and
390px width. Price emphasis, link color, disabled appearance and stale confirmation
copy were corrected. No real consent, payment or provider navigation was performed.

Only RilloraProductionWeb was updated: two billing-return paths and the matching
closed artifact. Seven actual HTTPS/HTML/API/negative-route checks pass, and Chrome
shows Accounts are not open yet at the return page. Production API task1/schema0070,
provider credentials, Auth0 bindings and sales flags remain unchanged. Earlier
native client/monitor/recovery evidence is retained with its original date.

Before enabling customers: complete merchant/market and tax facts; create and
read back the exact live Product/Price, restricted key, signed endpoint and Portal
configuration (cancel/resume/payment-method management; no unapproved price switch);
install the named vault/IAM configuration, apply the reviewed append-only migrations,
deploy the configured API, verify ordinary provider transactions and failure/retry
alarms, then complete cross-channel/restore/retention checks. Code rollback preserves
added tables/receipts; do not drop data or revert to a pre-encryption runtime.
Identity/email, Apple price/production verification, signed artifacts, submission
and Owner-deferred device/business checks remain governed by
[release readiness](release-readiness.md).

[Local QA and exact evidence boundary](../output/qa/rillora-production-commerce-20260925/work-state.json).

Source checkpoint e38cd05e7278443bd05a223c09849d1f3411d4d9 is pushed to the private
Rillora repository; [CI11 succeeds](https://github.com/tantalum666/rillora/actions/runs/36163894825).
The final evidence-only documentation follow-up does not rerun or redeploy that
engineering. Prepared source scan:906files,23reviewed non-secret spans,0unknown;
141project Markdown files/1348local links have0missing targets.

A final Web follow-up keeps current Family benefits visible after catalog activation
and distinguishes closed new sales from existing paid access. Its focused10tests
pass; the complete source-Web suite now has89checks. This follow-up does not alter
pricing or provider behavior and has a separate commit/CI receipt in the QA record.

The final follow-up7cf75bb4ad4b3403a9932a2095edf2ad891ecdff passes
[CI12](https://github.com/tantalum666/rillora/actions/runs/36164574920).
Its closed Web artifact is deployed/UPDATE_COMPLETE, exact HTML and seven final
HTTP checks pass, and actual Chrome still presents the intended closed-account
page. The API deployment/merchant/identity boundaries above remain unchanged.
