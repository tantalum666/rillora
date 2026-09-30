from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[3]
def edit(file,changes):
    p=ROOT/file
    text=p.read_text()
    for old,new in changes:
        if old not in text: raise RuntimeError(f'Missing expected text in {file}: {old[:70]}')
        text=text.replace(old,new)
    p.write_text(text)
def para(file,start,new):
    p=ROOT/file; t=p.read_text()
    pattern=re.escape(start)+r'[^\n]*'
    t,n=re.subn(pattern,lambda _:new,t,count=1)
    if n!=1: raise RuntimeError(file+start)
    p.write_text(t)

para('docs/monetization.md','The launch catalog is deliberately simple:',
'The launch catalog remains permanent `Free` plus one `Rillora Family` entitlement with two billing periods. The current prospective validation price is **US$6.99/month or US$49/year**, after the Owner rejected shared reviews as sufficient US$99 value. Annual is US$4.08/month equivalent and 41.6% below twelve monthly payments. This is a reversible Agent-selected hypothesis under the current repricing instruction, not validated willingness to pay. US$39/59 are comparisons, US$89 is historical, and US$99 is a conditional expanded-product scenario. No second paid tier, founder promotion or introductory-price expiry is active. See [rebuilt economics](unit-economics.md).')
edit('docs/monetization.md',[
('## How The Research Rounds Fit Together','**Runtime boundary, September 10:** existing US$9.99/99 Stripe, Xcode and App Store Sandbox objects and `family_usd_*_v1` records retain their original test amounts. They are not the current proposed offer. This reset changes the product decision and economic model, not provider catalog, API or deployed price UI. Before customer exposure, use distinct prospective price codes bound to the actual capability version. Do not relabel receipts or mix old/new offers. Ordinary billing remains closed. Necessary work follows AGENTS default authorization; missing personal interaction, merchant facts and production evidence remain separate.\n\n## How The Research Rounds Fit Together'),
('## 2026-09-10 Packaging Resolution — Current','## 2026-09-10 Packaging Resolution — Current\n\n**Latest correction:** shared review is a supporting capability, not sufficient US$99 core value. The main route is a smaller self-service offer at US$49/year or US$6.99/month for controlled validation. Do not expand review dashboards or contacts merely to defend99. The assisted-capture, substantive-change and action-workspace extension is unbuilt, conditional and separately costed in [unit-economics.md](unit-economics.md).'),
('Keep US$9.99/month or US$99/year as the existing price hypothesis; show the full annual charge, not just US$8.25/month equivalent.','Use the prospective US$6.99/month or US$49/year hypothesis and show the complete annual charge, with an optional US$4.08 monthly equivalent. Old US$99 test objects are historical; they do not define the current offer.'),
('| Rillora Family monthly | Visible when billing opens | Paid-launch hypothesis US$9.99/month; bounded founder cell US$6.99/month | Same Family entitlements with lower commitment |','| Rillora Family monthly | Visible when billing opens | Prospective US$6.99/month | Same verified entitlements; no minimum term |'),
('| Rillora Family annual | Visible and recommended, not preselected deceptively | Paid-launch hypothesis US$99/year; bounded founder cell US$59/year | Same Family entitlements; standard annual is US$8.25/month equivalent and 17.4% below twelve standard monthly payments |','| Rillora Family annual | Visible when billing opens; full annual amount | Prospective US$49/year | Same verified entitlements; US$4.08 monthly equivalent, 41.6% below twelve monthly payments |'),
('| Personal | Hidden/dormant | Future hypothesis US$39–49/year | Lower-cost individual maintenance; do not launch until data shows Family is too broad |','| Personal | Hidden/dormant | No active price | No additional launch tier; US$39/59 are comparisons for the same Family scope |'),
('- exact launch price approval after a real pricing screen is ready;','- distinct prospective US$49/US$6.99 price versions and truthful screens, followed by real purchase and cost evidence;'),
('- exact founder-offer cohort/closing date, duration and renewal-price promise;','- no active founder offer; any future promotion needs its own cohort, term and renewal promise;')])
para('docs/monetization.md','The US$99 standard annual hypothesis',
'The US$49 annual / US$6.99 monthly hypothesis reflects a smaller self-service scope and nearby lower-price alternatives. Monthly has an initial support burden: the base model leaves only US$0.48 contribution from a one-month purchase before CAC and fixed costs. One-month use remains legitimate. Do not buy such customers through expensive acquisition, restrict basic export or add an undisclosed minimum term. If US$49 does not convert, revisit the job and audience before further cuts or feature expansion. Full assumptions are in [unit-economics.md](unit-economics.md).')
edit('docs/product.md',[
('## Current Evidence Boundary','## Current Evidence Boundary\n\n2026-09-10最新重定价：Owner否定共同复核足以支撑US$99。主路线改为按较小自助产品验证 **US$49/年、US$6.99/月**；永久Free与单一Family保留，39/59作敏感性，99退为有实际成果门槛的扩展方案。新版可编辑模型计入Free／留存、人工支持、渠道／美元出款、短月付、获客和固定成本；基准49年付新客贡献26.72美元，1,000年付户毛利率48.2%，均为假设而非真实利润。旧89模型已归档；支付平台和运行中的99测试对象未改，不是当前报价。见[当前经济合同](unit-economics.md)。'),
('US$9.99／US$99仍只是收费发布主假设','US$9.99／US$99是该历史检查点的测试金额，已由2026-09-10的US$6.99／US$49前瞻验证假设取代')])
para('docs/mvp.md','- 价格梯度：',
'- 最新价格：US$6.99/月或US$49/年的前瞻验证价，复核为辅助能力；39/59仅作敏感性，99为另需开发／成果证据的扩展方案，不增加第二付费层或Founder促销。大陆旧¥68/698是历史假设，不能由USD价自动换算上线。全部未获真实付款验证；旧Stripe／StoreKit测试商品未改。见[重算模型](unit-economics.md)。')
edit('docs/mvp.md',[
('多人邀请已在合成staging实现，但人数收费限制、共同编辑、自动复核与历史尚未完成，不可写成已交付的付费套餐。','多人邀请和有界复核已在合成staging实现；provider/location建议审批、修正历史和产品内日期已完成。人数收费限制、完整共同编辑、外部通知与全计划历史仍未完成，不能描述成已交付完整套餐。')])
edit('docs/family-maintenance.md',[
('Authority: Owner requests planning and implementation of tangible US$99 value.','Authority: implemented under the earlier Owner request for Family value. The later\nsame-day correction rejects this slice as sufficient US$99 value. It remains a\nsupporting capability in the prospective US$49/year self-service offer, not\npremium-price validation. [Current economics](unit-economics.md).')])
edit('docs/free-paid-ui-audit.md',[
('## Current commercial surface and implementation gap — 2026-09-10','## Current commercial surface and implementation gap — 2026-09-10\n\nLatest economics reset selects prospective US$49/year or US$6.99/month. Review is\na supporting capability. Existing 99/9.99 test previews are historical, not the\ncurrent proposal; no catalog migration or UI deployment occurred in this reset.\nBoth clients need distinct prospective price versions and truthful contributor\ncopy before customer exposure. Do not sell the unbuilt99 expansion.\n[Economics and rollout order](unit-economics.md).'),
('Family\'s co-planner allowance as 1; multiple trusted people remains `planned`\nwith a null allowance. Null in that dormant row is not a published unlimited\npromise.','Family\'s co-planner allowance as 1; the later planned v2 sets multiple\nrecipients to5. The earlier v1 null was never a published unlimited promise.')])
edit('docs/global-mainland-commerce-plan.md',[
('## 一句话决定','## 当前价格覆盖 — 2026-09-10\n\n主路线改为US$49/年、US$6.99/月的自助Family验证价。下文99与¥698渠道算例均为历史研究，非当前报价。[新版经济合同](unit-economics.md)加入美元出款、Free／留存人群和劳动成本。旧逐项确认字样服从AGENTS最新默认授权；真实本人交互、实际商户与生产证据仍独立。\n\n## 一句话决定'),
('### 对 US$99 年付的直观影响','### 历史US$99佣金算例 — 非当前报价'),
('### 全球 Web 渠道的 US$99 年付演示','### 历史US$99渠道算例 — 未计美元出款，非当前完整成本'),
('`单户净收入 = 标价 - 消费税/平台代扣税 - 渠道费 - 退款/拒付准备 - 单户云与支持变量成本`','`单户净收入 = 排除消费税的服务收入 - 退款/收入冲回`\n\n`贡献 = 单户净收入 - 渠道费 - 变动服务成本 - Free/留存人群分摊`'),
('`贡献毛利率 = 单户净收入 ÷ 标价`','`贡献率 = 贡献 ÷ 单户净收入`'),
('- Global：`US$9.99/月` 或 `US$99/年`；年付比 12 个月月付低约 17.4%。','- Global：当前前瞻验证价`US$6.99/月`或`US$49/年`；年付比12个月月付低41.6%。'),
('- 中国大陆：`¥68/月` 或 `¥698/年` 作为验证假设；最终必须映射到 Apple 可用价格点，并在本地用户研究、服务商费率和合规成本报价后确认。','- 中国大陆：旧`¥68/月`／`¥698/年`只保留为历史假设；当地成本、需求和价格点单独重算，不自动沿用USD。'),
('Free／Family权益、US$9.99／99建模价','Free／Family权益与当前49／6.99验证价'),
('2. 将 US$9.99／99 写成 disabled price version，不创建真实商品；','2. 为US$49年付／6.99月付准备新的disabled price version；保留旧测试映射与历史账单，再完成两端实际报价验证；')])
para('docs/global-mainland-commerce-plan.md','为什么不继续以 US$8.99／US$89 作为基准：',
'最新选择是先以较小自助产品验证49／6.99，依据实际可交付范围、较近竞品与成本预算。更高毛利不能证明用户愿付99；较低价格也不自动证明可规模经营。现有支付商品和地区开关未改。')
edit('docs/global-mainland-commerce-plan.md',[
('首发经营目标：','历史扩张目标（非当前结果）：\n\n新版49基准贡献率56.2%，1,000年付户毛利率48.2%；低服务成本情形较好，高成本情形亏损。下列旧目标不能作为已满足事实或用来倒推必须收99。')])
edit('docs/ios-external-payment-research.md',[
('Last reviewed: 2026-08-21','Last reviewed: 2026-09-10 (pricing cross-reference only; legal/platform research remains dated August 21)'),
('## US$99 年付单位经济比较','## 历史US$99渠道算例 — 已非当前价格\n\n当前Family验证价为US$49/年、6.99/月。下表保留旧渠道组件比较，未计美元出款，不是当前完整成本或利润。新模型见[unit-economics.md](unit-economics.md)。')])
edit('docs/storekit.md',[
('Last updated: 2026-08-24','Last updated: 2026-09-10 (prospective-price note; Sandbox evidence remains dated August 24)'),
('## Current Result','## Prospective price and retained test objects\n\nThe latest prospective validation price is US$49/year or US$6.99/month. Existing\n99/9.99 Xcode and App Store Sandbox products below retain their original amounts\nand recorded evidence. They are not current commercial recommendations. No new\nprovider price, test purchase or deployment occurred in the economics reset.\nA new offer must use versioned mappings and actual localized provider prices.\n[Current economic contract](unit-economics.md).\n\n## Current Result')])
print('Commercial product, MVP and channel documents updated.')
