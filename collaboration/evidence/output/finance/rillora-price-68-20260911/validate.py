import json
from decimal import Decimal as D
from pathlib import Path

p=Path(__file__).parent
r=json.loads((p/'results.json').read_text())
inputs=json.loads((p/'operating-inputs.json').read_text())
checks=0
def check(condition):
    global checks
    assert condition
    checks+=1

# Independent flat-input Decimal evaluation of annual results, without importing the calculator.
for row in r['annualScenarios']:
    n=D(row['paid']); price=D('68'); fee=D(str(row['appleCommission']))
    stage=next(s for s in inputs['stages'] if s['paid']==int(n))
    gross=price*n/12; net=gross*D('.97')
    card=(price*D('.051')+D('.30')+D('.002')*22)*n/12*D('.7')
    app=gross*D('.3')*fee
    payout=max((gross*D('.97')*D('.7')-card)*D('.01'),D(5)*stage['payoutsYear']/12)
    cash_cogs=card+app+payout+n*D('.01066')+n*D('.012')+stage['productionBudget']
    shadow=(n*D('.5')*D('.1')*10/60+D(str(stage['directOpsHours'])))*24
    opex=D(stage['stagingBudget'])+D(159)/12+stage['adminExternal']+stage['growthAITools']+stage['ads']
    for key,expected in [('netRevenueMonthly',net),('channelFeesMonthly',card+app+payout),('cashDeliveryGrossMargin',1-cash_cogs/net),('shadowDirectGrossMargin',1-(cash_cogs+shadow)/net),('cashBeforeOwnerTaxAndOneOffsMonthly',net-cash_cogs-opex)]:
        check(abs(D(str(row[key]))-expected)<D('.000001'))
    check(row['payrollCashMonthly']==0)
    check(row['cashDeliveryGrossMargin']>row['shadowDirectGrossMargin'])
for option in r['monthlyOptions']:
    check(abs(option['annualDiscount']-(1-68/(option['price']*12)))<1e-12)
    for row in option['results']:
        # Monthly bills incur fixed payment charges on every payment, never annual amortization.
        gross=D(str(row['price']))*row['paid']; net=gross*D('.97')
        card=(D(str(row['price']))*D('.051')+D('.344'))*row['paid']*D('.7')
        stage=next(s for s in inputs['stages'] if s['paid']==row['paid'])
        payout=max((gross*D('.97')*D('.7')-card)*D('.01'),D(5)*stage['payoutsYear']/12)
        check(abs(D(str(row['channelFeesMonthly']))-(card+gross*D('.3')*D('.3')+payout))<D('.000001'))
        check(abs(D(str(row['netRevenueMonthly']))-net)<D('.000001'))
check(r['annualPrice']==68 and r['monthlyPrice']==7.99)
check(0.29<r['annualDiscount']<0.291)
(p/'validation.json').write_text(json.dumps({'checks':checks,'passed':True,'method':'Independent Decimal annual and per-month fee calculations; no native spreadsheet recalculation'},indent=2)+'\n')
print(f'{checks} numerical and accounting-boundary checks passed')
