from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[3]
def change(file,old,new):
    p=ROOT/file;t=p.read_text()
    if old not in t:raise RuntimeError(f'Missing {file}: {old[:65]}')
    p.write_text(t.replace(old,new))
def paragraph(file,prefix,new):
    p=ROOT/file;t=p.read_text();t,n=re.subn(re.escape(prefix)+r'[^\n]*',lambda _:new,t,count=1)
    if n!=1:raise RuntimeError(file+prefix)
    p.write_text(t)

paragraph('docs/monetization.md','The launch catalog remains permanent',
'The launch catalog remains permanent `Free` plus one `Rillora Family` entitlement with two periods. The Owner now targets a fast-launch, low-maintenance personal business or potential acquisition and asks for US$49–88 annual pricing with80–90% gross margin. The Agent recommends **US$79/year as the main price-test candidate and US$88/year as the upper comparison**, paired with a proposed **US$8.99/month**. US$49/59/69 are lower comparison cells, not additional public tiers. The former49/6.99 is a historical candidate; none is validated or live.79 saves26.8% versus twelve8.99 payments;88 saves18.4%. [Current band and scope contract](pricing-band-20260910.md).')
change('docs/monetization.md','The current sector target is75–85% gross margin at repeatable scale; initial','The earlier stage target was75–85%; the Owner now requests80–90%, with80–85%\nas the current practical target and90% a conditional optimization goal. Initial')
change('docs/monetization.md','full-time case is historical, not a launch threshold. Price itself is unchanged.','full-time case is historical, not a launch threshold. These49-price results are\nthe prior stage reference; the later79/88 comparison now guides the next test.')
change('docs/monetization.md','The main route is a smaller self-service offer at US$49/year or US$6.99/month for controlled validation.','The latest smaller self-service offer uses79/year with8.99/month as a main test candidate and88/year as an upper comparison;49 remains a lower reference. The price-band contract is authoritative for this later same-day decision.')
change('docs/monetization.md','Use the prospective US$6.99/month or US$49/year hypothesis and show the complete annual charge, with an optional US$4.08 monthly equivalent.','Use the prospective US$8.99/month or US$79/year main-test hypothesis, with88/year reserved as an explicit comparison cohort. Show the complete annual charge, with an optional79/12 monthly equivalent.')
change('docs/monetization.md','| Rillora Family monthly | Visible when billing opens | Prospective US$6.99/month | Same verified entitlements; no minimum term |','| Rillora Family monthly | Visible when billing opens | Proposed US$8.99/month | Same verified entitlements; no minimum term |')
change('docs/monetization.md','| Rillora Family annual | Visible when billing opens; full annual amount | Prospective US$49/year | Same verified entitlements; US$4.08 monthly equivalent, 41.6% below twelve monthly payments |','| Rillora Family annual | Visible when billing opens; full annual amount | Proposed main test US$79/year;88 upper comparison | Same verified entitlements;79 is26.8% below twelve8.99 payments; no hidden introductory renewal |')
change('docs/monetization.md','US$39/59 are comparisons for the same Family scope','US$49/59/69 are comparisons for the same Family scope')
paragraph('docs/monetization.md','The US$49 annual / US$6.99 monthly hypothesis',
'The latest US$79 annual / US$8.99 monthly main-test proposal keeps a single self-service scope.88/year is an upper comparison; it must not be paired with the older6.99 monthly amount, because twelve such monthly payments are less than88. The annual sensitivity does not establish monthly lifetime value, retention or willingness to pay. Full ongoing costs, free-data/export rights and safe cancellation remain; use [the focused band contract](pricing-band-20260910.md) before actual merchandising.')
change('docs/monetization.md','- distinct prospective US$49/US$6.99 price versions and truthful screens, followed by real purchase and cost evidence;','- distinct proposed79/8.99 price versions and any explicit88 comparison cohort, truthful capability screens, then real purchase/cost evidence;')
change('docs/monetization.md','Owner has paused external testing. Therefore:','The current task is price/scope analysis, with no external testing in this turn; execution follows the latest quick-launch objective and AGENTS authorization. Therefore:')

paragraph('docs/mvp.md','- 最新价格：',
'- 最新价格和商业目标：Owner希望尽快上线的小项目、少维护个人收入或未来收购，在49–88年价内争取80–90%毛利。当前Agent推荐79年付／8.99月付主测、88年付上限对照；49/59/69为较低比较，均未验证或上线。冻结新增功能，不为毛利堆功能，完整AI客服平台退出上线前置项。具体成本和范围见[价格区间合同](pricing-band-20260910.md)。')
change('docs/family-maintenance.md','supporting capability in the prospective US$49/year self-service offer, not\npremium-price validation. [Current economics](unit-economics.md).','supporting capability in the proposed79/88 self-service price band, not\npremium-price validation. Scope does not expand merely because the candidate\nprice rises. [Current band](pricing-band-20260910.md).')
change('docs/free-paid-ui-audit.md','Latest economics reset selects prospective US$49/year or US$6.99/month. Review is','Latest price-band work recommends79/year with8.99/month as main-test candidates\nand88/year as an upper comparison. These are not live or validated. Review is')
change('docs/global-mainland-commerce-plan.md','主路线改为US$49/年、US$6.99/月的自助Family验证价。','当前主测报价建议为US$79/年配US$8.99/月，88/年作上限比较；49/59/69仍为较低敏感性，未实际改价。[区间与低维护合同](pricing-band-20260910.md)为最新方向。')
change('docs/global-mainland-commerce-plan.md','- Global：当前前瞻验证价`US$6.99/月`或`US$49/年`；年付比12个月月付低41.6%。','- Global：当前主测建议`US$8.99/月`或`US$79/年`；79年付比12个月月付低26.8%。88为年价上限比较，不增加付费层。')
paragraph('docs/global-mainland-commerce-plan.md','最新选择是先以较小自助产品验证49／6.99，',
'最新选择是先在79主测／88上限下验证较小自助产品，目标80–90%毛利，当前可实现窗口约80–85%，不默认90%。Owner优先尽快上线和低维护；价格、使用量、渠道与AI结果均需实证。没有改动现有支付商品或地区开关。')
change('docs/global-mainland-commerce-plan.md','Free／Family权益与当前49／6.99验证价','Free／Family权益与当前79／8.99主测及88年价比较')
change('docs/global-mainland-commerce-plan.md','2. 为US$49年付／6.99月付准备新的disabled price version；保留旧测试映射与历史账单，再完成两端实际报价验证；','2. 为79年付／8.99月付主测及明确需要的88年价队列准备新disabled price version；保留旧测试映射与历史账单，完成两端实际报价验证；')
change('docs/storekit.md','The latest prospective validation price is US$49/year or US$6.99/month. Existing','The current main-test proposal is US$79/year or US$8.99/month, with88/year as an\nupper comparison. This is unvalidated and not a provider price change. Existing')
change('docs/pricing-band-20260910.md','当前没有交易估值、买家名单或外联，也不把这个敏感信息产品描述为无责任的永久被动收益。','当前没有交易估值、买家名单或外联。持续安全维护和用户支持的负担仍需计入经营记录。')
print('Current price and low-maintenance scope references synchronized.')
