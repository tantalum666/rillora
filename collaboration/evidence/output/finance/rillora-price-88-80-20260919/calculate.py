"""Reproducible USD operating scenarios, not accounts or demand forecasts."""
import csv
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
d = json.loads((BASE / 'operating-inputs.json').read_text())
a = {r['id']: r['values'][0] for r in d['drivers']}
c = d['constants']
catalog = json.loads((ROOT / 'config/product-catalog.json').read_text())
ANNUAL = catalog['annual']['amountMinor'] / 100
MONTHLY = catalog['monthly']['amountMinor'] / 100

def evaluate(stage, amount, interval, apple=.30, web=.70):
    n = stage['paid']
    transactions_month = n / 12 if interval == 'annual' else n
    gross = amount * transactions_month
    revenue = gross * (1-a['refundRate'])
    rate = c['cardRate'] + c['internationalIncrement'] * c['internationalShare'] + c['billingRate'] + c['taxToolRate']
    web_fees = (amount*rate + c['stripeFixed'] + c['disputeRate']*c['disputeCost']) * transactions_month * web
    apple_fees = gross * (1-web) * apple
    payout = max((gross*(1-a['refundRate'])*web-web_fees)*c['usdPayoutRate'], c['usdPayoutMin']*stage['payoutsYear']/12) if web else 0
    mau = n * (a['freeMAUperPaid'] + a['paidMAUperPaid'])
    usage = mau*(a['requestsPerMAU']/1e6*c['apiPerMillion'] + a['egressGBperMAU']*c['egressPerGB'] + a['emailsPerMAU']/1000*c['emailPerThousand'])
    conversations = n*(a['paidSupportMonthly'] + a['freeMAUperPaid']*a['freeSupportMonthly'])
    ai_unit = (a['inputTokens']*c['llmInputPerMillion'] + a['outputTokens']*c['llmOutputPerMillion'])/1e6*a['aiAttempts']*a['aiCostBuffer']
    ai = conversations*ai_unit
    hours = conversations*(1-a['aiResolution'])*a['humanMinutes']/60
    shadow_direct = (hours+stage['directOpsHours'])*a['humanRate']
    fees = web_fees + apple_fees + payout
    cash_delivery = fees + usage + ai + stage['productionBudget']
    opex = stage['stagingBudget'] + c['brandAdminYear']/12 + stage['adminExternal'] + stage['growthAITools'] + stage['ads']
    return dict(paid=n, interval=interval, price=amount, appleCommission=apple,
      webShare=web, grossBillingsMonthly=gross, netRevenueMonthly=revenue,
      channelFeesMonthly=fees, usageMonthly=usage, aiSupportMonthly=ai,
      productionBudgetMonthly=stage['productionBudget'], payrollCashMonthly=0,
      cashDeliveryGrossMargin=(revenue-cash_delivery)/revenue,
      ownerDirectHoursMonthly=hours+stage['directOpsHours'],
      shadowDirectCostMonthly=shadow_direct,
      shadowDirectGrossMargin=(revenue-cash_delivery-shadow_direct)/revenue,
      otherCashOpexMonthly=opex,
      cashBeforeOwnerTaxAndOneOffsMonthly=revenue-cash_delivery-opex)

stages = [s for s in d['stages'] if s['paid'] > 0]
annual = [evaluate(s, ANNUAL, 'annual', fee) for fee in (.30, .15) for s in stages]
monthly_options = [dict(price=p, twelvePayments=p*12, annualDiscount=1-ANNUAL/(p*12),
  results=[evaluate(s, p, 'monthly') for s in stages if s['paid'] in (100,1000)]) for p in (MONTHLY,)]
out = dict(date='2026-09-19', currency='USD', annualPrice=ANNUAL, monthlyPrice=MONTHLY,
  annualEquivalentMonthly=ANNUAL/12, annualDiscount=1-ANNUAL/(MONTHLY*12),
  scope='Steady active cohorts; no assumption that monthly subscribers retain for 12 months',
  annualScenarios=annual, monthlyOptions=monthly_options,
  assumptions='No hired payroll. Refunds 3%; Web 70%; support containment 90% unmeasured. Cash contribution uses real-expense budgets; owner shadow labor remains separate. No actual invoices, conversion, renewal, tax assessment, or live sales.',
  excluded='Initial development and launch costs, income tax, owner draws, unknown Auth0 paid quote; add actual vendor charges when incurred')
(BASE/'results.json').write_text(json.dumps(out, indent=2)+'\n')
with (BASE/'annual-scenarios.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f, fieldnames=list(annual[0])); writer.writeheader(); writer.writerows(annual)
print(json.dumps({'annual':ANNUAL,'monthly':MONTHLY,'discount':out['annualDiscount'],
 'stages':[dict(paid=r['paid'],apple=r['appleCommission'],cashGM=round(r['cashDeliveryGrossMargin']*100,2),shadowGM=round(r['shadowDirectGrossMargin']*100,2),cash=round(r['cashBeforeOwnerTaxAndOneOffsMonthly'],2)) for r in annual]},indent=2))
