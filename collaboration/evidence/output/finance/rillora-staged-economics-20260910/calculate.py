import json
from pathlib import Path
BASE=Path(__file__).parent
d=json.loads((BASE/'inputs.json').read_text())
c=d['constants']
def drivers(case):return {r['id']:r['values'][case-1] for r in d['drivers']}
def calculate(stage,a):
    n=stage['paid']; p=d['price']; free=n*a['freeMAUperPaid']; mau=free+n*a['paidMAUperPaid']
    gross=n*p/12; revenue=gross/(1+c['taxIncluded'])*(1-a['refundRate'])
    web_rate=c['cardRate']+c['internationalIncrement']*c['internationalShare']+c['billingRate']+c['taxToolRate']
    web_fees=n/12*(p*web_rate+c['stripeFixed']+c['disputeRate']*c['disputeCost'])*a['webShare']
    apple=gross/(1+c['taxIncluded'])*(1-a['webShare'])*a['appleCommission']
    usd_payout=max((gross*(1-a['refundRate'])*a['webShare']-web_fees)*c['usdPayoutRate'],c['usdPayoutMin']*stage['payoutsYear']/12) if n and a['webShare']>0 else 0
    fees=web_fees+apple+usd_payout
    usage=mau*a['requestsPerMAU']/1e6*c['apiPerMillion']+mau*a['egressGBperMAU']*c['egressPerGB']+mau*a['emailsPerMAU']/1000*c['emailPerThousand']
    support=n*a['paidSupportMonthly']+free*a['freeSupportMonthly']
    ai_unit=(a['inputTokens']*c['llmInputPerMillion']+a['outputTokens']*c['llmOutputPerMillion'])/1e6*a['aiAttempts']*a['aiCostBuffer']
    ai_cost=ai_unit*support
    human_hours=support*(1-a['aiResolution'])*a['humanMinutes']/60
    human_cost=human_hours*a['humanRate']
    production=stage['productionBudget']
    ops_cost=stage['directOpsHours']*a['humanRate']
    identity=0 if mau<=c['auth0FreeMAU'] else c['auth0QuoteMonthly']
    cogs=fees+usage+ai_cost+human_cost+production+ops_cost+identity if identity is not None else None
    gp=revenue-cogs if cogs is not None else None
    gm=gp/revenue if gp is not None and revenue else None
    cp=revenue-fees-usage-ai_cost-human_cost
    cm=cp/revenue if revenue else None
    gm15=(gp+gross/(1+c['taxIncluded'])*(1-a['webShare'])*(a['appleCommission']-.15))/revenue if gp is not None and revenue else None
    cash_direct=fees+usage+ai_cost+production+(identity or 0)
    opex=stage['stagingBudget']+c['brandAdminYear']/12+stage['adminExternal']+stage['growthAITools']+stage['ads']
    cash_cost=cash_direct+opex
    cash_surplus=revenue-cash_cost if identity is not None else None
    rd=stage['productHours']*c['founderDevelopmentRate']
    growth_admin=(stage['growthHours']+stage['generalAdminHours'])*a['humanRate']
    shadow=(cash_surplus-human_cost-ops_cost-rd-growth_admin) if cash_surplus is not None else None
    hours=human_hours+stage['directOpsHours']+stage['productHours']+stage['growthHours']+stage['generalAdminHours']
    return dict(paid=n,freeMAU=free,MAU=mau,gross=gross,revenue=revenue,webFees=web_fees,appleFees=apple,payout=usd_payout,fees=fees,usage=usage,supportConversations=support,aiUnit=ai_unit,aiCost=ai_cost,humanHours=human_hours,humanCost=human_cost,production=production,opsCost=ops_cost,identity=identity,cogs=cogs,grossProfit=gp,grossMargin=gm,contribution=cp,contributionMargin=cm,approved15GrossMargin=gm15,cashDirect=cash_direct,opex=opex,cashCost=cash_cost,cashSurplus=cash_surplus,after3000Draw=(cash_surplus-c['fullTimeIncomeMonthly']) if cash_surplus is not None else None,ownerHours=hours,rd=rd,growthAdmin=growth_admin,economicSurplus=shadow)

all_results=[]
for case in (1,2):
    a=drivers(case);results=[calculate(s,a) for s in d['stages']]
    # Find recurring cash break-even only within the small-cohort operating configuration.
    anchor=d['stages'][2]
    candidates=[calculate(dict(anchor,paid=n),a) for n in range(1,101)]
    breakeven=next((r['paid'] for r in candidates if r['cashSurplus']>=0),None)
    all_results.append(dict(case=case,name=d['cases'][case-1],stages=results,smallCohortCashBreakeven=breakeven))
    print(d['cases'][case-1], 'small-cohort recurring cash break-even',breakeven)
    for r in results:print(r['paid'], 'monthly revenue/cash costs/surplus',round(r['revenue'],2),round(r['cashCost'],2),round(r['cashSurplus'],2),'GM',None if r['grossMargin'] is None else round(r['grossMargin']*100,1),'conditional15%',None if r['approved15GrossMargin'] is None else round(r['approved15GrossMargin']*100,1),'hours',round(r['ownerHours'],2),'economic surplus',round(r['economicSurplus'],2))
b=d['bom'];bom=b['hours']*(b['vcpus']*b['fargateVcpuHour']+b['memoryGB']*b['fargateGBHour']+b['rdsMicroHour']+b['publicIPv4Hour'])+b['rdsStorageGB']*b['rdsStoragePrice']+b['secretsKMSLogsBackupBudget']+b['edgeProtectionBudget']
(BASE/'results.json').write_text(json.dumps({'cases':all_results,'bom':bom},indent=2))
print('Small-production BOM reference',round(bom,2))
