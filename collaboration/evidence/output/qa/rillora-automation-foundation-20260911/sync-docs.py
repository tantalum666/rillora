from pathlib import Path
import re
ROOT=Path.cwd()
def edit(name,old,new,count=1):
 p=ROOT/name;s=p.read_text(); assert s.count(old)==count,(name,old[:75],s.count(old));p.write_text(s.replace(old,new))
def top(name,text):
 p=ROOT/name;s=p.read_text(); marker='\n## ';i=s.index(marker);p.write_text(s[:i]+'\n'+text+'\n'+s[i:])
edit('docs/monetization.md','PRICES PROVISIONAL;','ANNUAL68 OWNER-LOCKED / MONTHLY7.99 SELECTED;')
p=ROOT/'docs/monetization.md';s=p.read_text();start=s.index('The launch catalog remains');end=s.index('\n\nThe product and data model',start)
s=s[:start]+'''The launch catalog remains permanent `Free` plus one `Rillora Family` with two periods. On September11 the Owner locked **US$68/year** and delegated the monthly choice; the Agent selected **US$7.99/month**, a29.1% annual saving against twelve monthly payments. The operating model is no hiring, self-service and bounded automation.79/88,49/6.99 and99 are historical research/test checkpoints, not simultaneous offers. Demand and actual margins remain unverified. [Current price](pricing-68-20260911.md) and [operating/portability contract](solo-operations-and-portability.md).'''+s[end:]
s=s.replace('future `Personal`, `Family`, human-service add-ons and a separate professional catalog','future `Personal`, `Family` and separately gated professional capabilities; historical human-service add-ons are dormant and have no build/hiring commitment')
a=s.index('**Runtime boundary, September 10:**');b=s.index('\n\n##',a)
s=s[:a]+'''**Runtime boundary, September11:** existing US$9.99/99 Stripe, Xcode and App Store Sandbox objects retain original test amounts. Migration0040 adds separate disabled68/7.99 USD price records bound to Family capability version2; local API130 tests pass, including preserved old mappings and future/expired price exclusion. Catalog price/capability versions now agree, and a closed market cannot sell even an active price. These changes have not been deployed; provider products, Web/iOS runtime display and ordinary billing are unchanged. Deployment and customer-facing localized amounts need independent evidence.'''+s[b:]
s=s.replace('the prior stage reference; the later79/88 comparison now guides the next test.','the prior stage reference; the historical79/88 comparison has now been superseded by the Owner-selected68 annual price.')
s=s.replace('Use the prospective US$8.99/month or US$79/year main-test hypothesis, with88/year reserved as an explicit comparison cohort. Show the complete annual charge, with an optional79/12 monthly equivalent.','Use the Owner-selected US$68/year and Agent-selected US$7.99/month. Show the complete annual charge, with an optional68/12 monthly equivalent.')
s=s.replace('Proposed US$8.99/month','Selected US$7.99/month')
s=s.replace('Proposed main test US$79/year;88 upper comparison | Same verified entitlements;79 is26.8% below twelve8.99 payments','Owner-selected US$68/year | Same verified entitlements;68 is29.1% below twelve7.99 payments')
s=s.replace('Preliminary US$199–299 research range only after time-and-motion evidence','No active price; historical research only under no-hiring scope')
s=s.replace('Bounded setup or review with a separate services P&L, excluding legal advice and real claim handling','No launch commitment, hiring or hidden human service inside Family')
a=s.index('The latest US$79 annual');b=s.index('\n\n##',a)
s=s[:a]+'''The selected68 annual /7.99 monthly pairing keeps a single self-service scope. Monthly cancellation is normal use; preserve the paid term and apply the safe cutoff contract at actual expiry. The annual saving is arithmetic, not monthly retention or willingness-to-pay evidence. [Current price and assumptions](pricing-68-20260911.md).'''+s[b:]
s=s.replace('- if Family converts but human setup demand is strong, price `care_addon` from measured labor and risk rather than hiding it inside Family;','- if users need recurring help, first improve self-service and automation; human-service add-ons remain dormant under the no-hiring decision;')
s=s.replace('- distinct proposed79/8.99 price versions and any explicit88 comparison cohort, truthful capability screens, then real purchase/cost evidence;','- new68/7.99 local catalog records are implemented; deploy and validate both client displays and actual provider/localized purchase amounts before exposure;')
s=s.replace('- real-event human support scope, insurance and jurisdiction coverage;','- real-event operations remain closed; no automated death/authority determination substitutes for verified jurisdiction and operating coverage;')
p.write_text(s)
edit('docs/unit-economics.md','Status: STAGED COST FOUNDATION; CURRENT49–88 BAND /79 MAIN TEST IN FOCUSED CONTRACT; SALES CLOSED','Status: STAGED COST FOUNDATION; CURRENT OWNER68 / MONTHLY7.99 AND NO-HIRING SCENARIOS IN FOCUSED CONTRACT; SALES CLOSED')
p=ROOT/'docs/unit-economics.md';s=p.read_text();a=s.index('**更晚的Owner目标');b=s.index('\n\nRillora按',a)
s=s[:a]+'''**2026-09-11 Owner锁定68美元年费，明确不招人；Agent受托选择7.99美元月费。** 当前[68价格与无雇员现金模型](pricing-68-20260911.md)分别列现金交付毛利与本人直接劳动影子成本；不把假设工资写成实际现金，也不把本人工作藏起来。100／300／1,000户现金交付毛利基准77.4%／81.1%／83.4%，获批Apple15%条件下82.1%／85.7%／88.1%。这些是未验证预算，不是实际毛利或盈利。以下49阶段表继续作为成本基础，79/88见[历史区间检查点](pricing-band-20260910.md)。自动化、扩容与服务迁移见[当前经营合同](solo-operations-and-portability.md)。'''+s[b:]
s=s.replace('最新79/8.99和88上限见上述区间合同，均未验证。','最新68/7.99见上述当前价格合同，需求仍未验证。')
s=s.replace('阶段目标：新增用户的边际贡献率约80%；逐步形成**75–85%的完整软件毛利率**。','历史阶段目标：新增用户的边际贡献率约80%；逐步形成**75–85%的完整软件毛利率**。Owner较晚希望80–90%，以当前68合同的口径和条件判断。')
s=s.replace('当前可编辑模型：','阶段成本基础可编辑模型：',1);p.write_text(s)
p=ROOT/'docs/pricing-band-20260910.md';s=p.read_text();s=s.replace('Role: current price-band decision and low-maintenance launch contract','Role: historical price-band research and low-maintenance checkpoint');s=s.replace('Status: RESEARCH / PROVISIONAL79 MAIN OFFER,88 UPPER COMPARISON; NO LIVE REPRICING','Status: HISTORICAL / SUPERSEDED BY OWNER68 ANNUAL AND SELECTED7.99 MONTHLY ON2026-09-11');s=s.replace('## Owner目标和当前主张','## 当时的Owner目标和Agent主张 — HISTORICAL',1);s=s.replace('Agent当前推荐：','该检查点Agent推荐：',1)
s=s.replace('## 相同成本下的毛利比较','> 本文保留当时输入、结果和判断；所有“当前／下一步”均指该历史检查点。新有效报价与无人团队经营方向见[68合同](pricing-68-20260911.md)及[自动化路线](solo-operations-and-portability.md)。\n\n## 相同成本下的毛利比较',1);p.write_text(s)
edit('docs/mvp.md','- 最新价格和商业目标：Owner希望尽快上线的小项目、少维护个人收入或未来收购，在49–88年价内争取80–90%毛利。当前Agent推荐79年付／8.99月付主测、88年付上限对照；49/59/69为较低比较，均未验证或上线。冻结新增功能，不为毛利堆功能，完整AI客服平台退出上线前置项。具体成本和范围见[价格区间合同](pricing-band-20260910.md)。','- 最新价格和经营目标：Owner锁定US$68/年并明确不招人，Agent受托选US$7.99/月；同一Family能力集，需求仍未验证。先完成自助购买／名额／准确截止版本／取消恢复、最小监控和生产门；未来功能、营销、安全和服务扩容／迁移完整规划但按证据分期，不把完整自建AI平台当首发条件。见[当前价格](pricing-68-20260911.md)和[单人经营合同](solo-operations-and-portability.md)。')
edit('docs/family-maintenance.md','supporting capability in the proposed79/88 self-service price band, not\npremium-price validation. Scope does not expand merely because the candidate\nprice rises. [Current band](pricing-band-20260910.md).','supporting capability in the Owner-selected68/year self-service product with\nAgent-selected7.99/month. Scope does not expand merely because pricing changes.\nNo hired service is included. [Current price](pricing-68-20260911.md).')
p=ROOT/'docs/free-paid-ui-audit.md';s=p.read_text();a=s.index('Latest price-band work');b=s.index('\n\nLater implementation',a);s=s[:a]+'''Owner now selects68/year; Agent chooses7.99/month within the delegated scope.
Migration0040 and API catalog selection are locally tested, retaining old99/9.99
provider test objects. No Web/iOS visual rerun, provider repricing or deployment
occurred. Both clients still need actual new-price display and complete cutoff/
allowance/cancellation verification before sales. Review is a supporting feature.
[Current economics](pricing-68-20260911.md) and [self-service/automation](solo-operations-and-portability.md).'''+s[b:];s=s.replace('## Current commercial surface and implementation gap — 2026-09-10','## Current commercial surface and implementation gap — 2026-09-11',1);p.write_text(s)
p=ROOT/'docs/global-mainland-commerce-plan.md';s=p.read_text();a=s.index('当前主测报价建议');b=s.index('\n',a);s=s[:a]+'''当前Owner锁定US$68/年，Agent受托选择US$7.99/月；无雇员、自助／自动化优先。[当前价格](pricing-68-20260911.md)和[运营／迁移合同](solo-operations-and-portability.md)取代79/88候选。迁移0040与API本地测试完成，外部支付商品和云端未改价；下文99／¥698仍是历史研究。旧逐项确认服从AGENTS默认授权，本人认证、真实商户和生产证据仍独立。'''+s[b:]
s=s.replace('Global：当前主测建议`US$8.99/月`或`US$79/年`；79年付比12个月月付低26.8%。88为年价上限比较，不增加付费层。','Global：Owner选`US$68/年`，Agent选`US$7.99/月`；年付比12次月付低29.1%，不增加付费层。')
s=s.replace('最新选择是先在79主测／88上限下验证较小自助产品，目标80–90%毛利，当前可实现窗口约80–85%，不默认90%。Owner优先尽快上线和低维护；价格、使用量、渠道与AI结果均需实证。没有改动现有支付商品或地区开关。','最新选择是68年费的无雇员自助产品，争取80–90%现金交付毛利并单列本人劳动；人数与Apple费率情景见当前价格合同。使用量、渠道与AI结果均需实证，外部支付商品和地区开关未改。')
s=s.replace('冻结首发地区、运营者、Free／Family权益与当前79／8.99主测及88年价比较','冻结首发地区、运营者、Free／Family权益与68年／7.99月报价')
s=s.replace('为79年付／8.99月付主测及明确需要的88年价队列准备新disabled price version；保留旧测试映射与历史账单，完成两端实际报价验证；','68年付／7.99月付disabled price version已在迁移0040本地测试；部署并完成两端与实际支付渠道报价验证，保留旧映射与账单；');p.write_text(s)
p=ROOT/'docs/storekit.md';s=p.read_text();a=s.index('The current main-test proposal');b=s.index('\n\n## Current Result',a);s=s[:a]+'''The Owner selected US$68/year; the Agent selected US$7.99/month within delegated
scope. API migration0040 creates new disabled USD quotes and passes local tests.
Existing99/9.99 Xcode and App Store Sandbox products retain their original amounts
and evidence. No Apple repricing, native UI run, purchase or cloud deployment
occurred. New mappings must use actual available localized Apple price points;
if an exact68 storefront point is unavailable, resolve an explicit channel quote
before showing or selling it. Do not silently display68 and charge67.99/68.99.
[Current price contract](pricing-68-20260911.md).'''+s[b:];s=s.replace('At49/year,1,000 annual buyers generate49,000 gross sales even if all use Apple;\nat99/year they generate99,000.','At68/year,1,000 annual buyers generate68,000 gross sales even if all use Apple.');p.write_text(s)
# Product gateway: latest evidence ahead of historical checkpoints.
edit('docs/product.md','| 49–88年费、80–90%毛利、快速小项目／少维护收入或潜在收购取舍 | `docs/pricing-band-20260910.md` | 当前价格区间与低维护上线合同；不是实际利润／估值或报价上线证明 |','| 68年费／7.99月费、无雇员成本、80–90%毛利或潜在收购取舍 | `docs/pricing-68-20260911.md` | 当前价格与成本合同；不是需求／利润或报价上线证明 |\n| 自助、运营／安全／支持／营销自动化、全部功能分期或供应商迁移 | `docs/solo-operations-and-portability.md` | 当前单人经营与迁移合同；planned不等于持续运行 |\n| 历史49–88价格敏感性 | `docs/pricing-band-20260910.md` | HISTORICAL研究；由68价格决定取代 |')
edit('docs/product.md','- 产品本身必须支持可导出、迁移和退出计划，避免用户被一家公司的寿命永久绑定。','- 产品本身必须支持可导出、迁移和退出计划，避免用户被一家公司的寿命永久绑定。\n- Owner于2026-09-11锁定US$68年费，并委托Agent选择月费，本轮选US$7.99；仅Free与一个Family，月年同能力。Owner明确不招人，功能优先自助、运营优先有界自动化；未来功能和服务迁移完整规划、按证据分期，不默认无限AI或人工代办。收费可用性、市场需求及持续自动化必须分别验证。')
edit('docs/product.md','## Current Evidence Boundary\n\n2026-09-10最新小项目目标：','## Current Evidence Boundary\n\n2026-09-11当前决定与实现：Owner选68年费、明确不招人，Agent选7.99月费。完整自助／功能／支持／营销／运维／安全／迁移合同和服务／任务登记已建立；迁移0040及API目录本地130项测试通过，保留旧测试交易。现金交付毛利与本人劳动分列，模型87项独立数值检查通过。公开监控本地6项、infra14项与独立CDK合成通过；7个公开URL仅HTTP状态复核符合预期。AWS会话过期、告警接收未验证、Mac代理DNS拦截使云端持续探针仍未启用。未改外部支付商品、未部署、未发布社媒、未上线AI客服或宣称无人值守安全。工程主线仍是准确截止版本／名额／取消恢复的最小可售闭环，见[当前经营合同](solo-operations-and-portability.md)、[当前价格](pricing-68-20260911.md)和[交接](handoff.md)。\n\n2026-09-10历史小项目检查点（报价已被68取代）：')
print('Updated commercial and product documents')
