import json
from pathlib import Path

BASE=Path(__file__).parent
d=json.loads((BASE/'operating-inputs.json').read_text())
a={r['id']:r['values'][0] for r in d['drivers']}
c=d['constants']
prices=[49,59,69,79,88]
stages=[s for s in d['stages'] if s['paid'] in (100,300,1000)]
steady=[dict(maintenance=2,growth=1,admin=.5),dict(maintenance=3,growth=1.5,admin=1),dict(maintenance=4,growth=2,admin=1.5)]

def costs(s):
    n=s['paid']; mau=n*(a['freeMAUperPaid']+a['paidMAUperPaid'])
    usage=mau*(a['requestsPerMAU']/1e6*c['apiPerMillion']+a['egressGBperMAU']*c['egressPerGB']+a['emailsPerMAU']/1000*c['emailPerThousand'])
    requests=n*(a['paidSupportMonthly']+a['freeMAUperPaid']*a['freeSupportMonthly'])
    ai_unit=(a['inputTokens']*c['llmInputPerMillion']+a['outputTokens']*c['llmOutputPerMillion'])/1e6*a['aiAttempts']*a['aiCostBuffer']
    ai=requests*ai_unit
    human_hours=requests*(1-a['aiResolution'])*a['humanMinutes']/60
    human=human_hours*a['humanRate']; ops=s['directOpsHours']*a['humanRate']
    noncommerce=usage+ai+human+ops+s['productionBudget']
    opex=s['stagingBudget']+c['brandAdminYear']/12+s['adminExternal']+s['growthAITools']+s['ads']
    return dict(usage=usage,requests=requests,ai=ai,humanHours=human_hours,human=human,ops=ops,noncommerce=noncommerce,opex=opex)

def evaluate(price,s,apple=.3,web=.7):
    x=costs(s);n=s['paid']; gross=price*n/12
    rev=gross/(1+c['taxIncluded'])*(1-a['refundRate'])
    web_rate=c['cardRate']+c['internationalIncrement']*c['internationalShare']+c['billingRate']+c['taxToolRate']
    webfees=(price*web_rate+c['stripeFixed']+c['disputeRate']*c['disputeCost'])*n/12*web
    applefees=gross/(1+c['taxIncluded'])*(1-web)*apple
    payout=max((gross*(1-a['refundRate'])*web-webfees)*c['usdPayoutRate'],c['usdPayoutMin']*s['payoutsYear']/12) if web>0 else 0
    fee=webfees+applefees+payout
    profit=rev-fee-x['noncommerce'];margin=profit/rev
    cash=profit+x['human']+x['ops']-x['opex']
    idx=next(i for i,z in enumerate(stages) if z['paid']==n);z=steady[idx]
    work=x['humanHours']+s['directOpsHours']+sum(z.values())
    replacement=x['human']+x['ops']+z['maintenance']*c['founderDevelopmentRate']+(z['growth']+z['admin'])*a['humanRate']
    return dict(price=price,paid=n,apple=apple,web=web,revenue=rev,fees=fee,grossProfit=profit,grossMargin=margin,cashBeforeOwner=cash,steadyOwnerHours=work,recurringReplacementCost=replacement,normalizedSurplus=cash-replacement)

def ceiling(apple,web):
    b=c['cardRate']+c['internationalIncrement']*c['internationalShare']+c['billingRate']+c['taxToolRate']
    k=web*(b+(1-a['refundRate']-b)*c['usdPayoutRate'])+(1-web)*apple/(1+c['taxIncluded'])
    return 1-k/((1-a['refundRate'])/(1+c['taxIncluded']))

def required_price(s,target,apple,web=.7):
    if ceiling(apple,web)<=target:return None
    lo,hi=.01,100000
    for _ in range(80):
        mid=(lo+hi)/2
        if evaluate(mid,s,apple,web)['grossMargin']>=target:hi=mid
        else:lo=mid
    return hi

matrix=[evaluate(p,s,fee) for fee in (.3,.15) for s in stages for p in prices]
thresholds=[dict(paid=s['paid'],apple=fee,target=t,price=required_price(s,t,fee)) for fee in (.3,.15) for s in stages for t in (.8,.85,.9)]
channel=[dict(web=web,apple=fee,ceiling=ceiling(fee,web),result88=evaluate(88,stages[-1],fee,web)) for fee in (.3,.15) for web in (.7,.9,1)]
drop=[]
for fee in (.3,.15):
    p79=evaluate(79,stages[-1],fee);p88=evaluate(88,stages[-1],fee)
    # Compare contribution under the same per-payer variable workload and fixed baseline.
    fixed=stages[-1]['productionBudget']+costs(stages[-1])['ops']
    drop.append(dict(apple=fee,maximumRelativePaidCountDrop=1-(p79['grossProfit']+fixed)/(p88['grossProfit']+fixed)))
out=dict(prices=prices,stages=[s['paid'] for s in stages],operatingCosts=[dict(paid=s['paid'],**costs(s)) for s in stages],steadyBudgets=steady,matrix=matrix,thresholds=thresholds,channels=channel,conversionIllustration=drop)
(BASE/'results.json').write_text(json.dumps(out,indent=2))
for fee in(.3,.15):
    print('Apple',fee)
    for p in prices:print(p,[round(evaluate(p,s,fee)['grossMargin']*100,2) for s in stages])
    print('Price required',[(r['paid'],r['target'],None if r['price'] is None else round(r['price'],2)) for r in thresholds if r['apple']==fee])
print('79 steady scenarios',[(s['paid'],round(evaluate(79,s)['cashBeforeOwner'],2),round(evaluate(79,s)['normalizedSurplus'],2),round(evaluate(79,s)['steadyOwnerHours'],2)) for s in stages])
print('Ceilings',[{k:v for k,v in x.items() if k!='result88'} for x in channel])
print('Conversion illustration',drop)
