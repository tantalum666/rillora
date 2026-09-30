import json
from pathlib import Path

BASE = Path(__file__).parent
data = json.loads((BASE / "inputs.json").read_text())

def parameters(case):
    return {row["id"]: row["values"][case - 1] for row in data["drivers"]}

def unit(price, a, months=12, annual=True):
    f = data["fees"]
    transactions = 1 if annual else months
    gross = price if annual else price * months
    pre_refund = gross * (a["webShare"] / (1 + f["webTaxRate"]) + (1-a["webShare"]) / (1+f["appleTaxRate"]))
    revenue = pre_refund * (1-a["refundRate"])
    web_rate = f["stripeCard"] + f["internationalIncrement"] * f["internationalShare"] + f["billingRate"] + f["taxToolRate"] * f["taxToolShare"] + f["webFxRate"] * f["webFxShare"]
    web_raw = gross * web_rate + transactions * (f["stripeFixed"] + f["disputeIncidence"] * f["disputeCostUSD"])
    web_fees = web_raw * a["webShare"]
    apple_fees = gross/(1+f["appleTaxRate"]) * a["appleRate"] * (1-a["webShare"]) * (1-a["refundRate"]*(1-f["appleRefundFeeRetention"]))
    payout = max(0, gross*(1-a["refundRate"])-web_raw) * f["usdPayoutRate"] * a["webShare"]
    paid_cloud = a["paidInfra"] * months/12
    onboarding = a["onboardingMinutes"] * a["laborRate"]/60
    support = a["ongoingMinutes"] * a["laborRate"]/60 * months/12
    free_unit = a["freeInfra"] + a["freeSupportMinutes"] * a["laborRate"]/60
    free_pool = free_unit*a["freeRatio"] * months/12
    archives = a["retainedRatio"]*a["retainedCost"] if annual else (free_unit+a["retainedCost"])*(12-months)/12
    variable = paid_cloud+onboarding+support+free_pool+archives
    contribution = revenue-web_fees-apple_fees-payout-variable
    renewal_commission_saving = gross/(1+f["appleTaxRate"]) * (a["appleRate"]-f["appleRenewalRate"]) * (1-a["webShare"]) * (1-a["refundRate"]*(1-f["appleRefundFeeRetention"])) if annual else 0
    renewal_contribution = contribution+onboarding+renewal_commission_saving
    three_year = contribution+renewal_contribution*a["annualRenewal"]+renewal_contribution*a["annualRenewal"]**2
    return dict(price=price,months=months,gross=gross,revenue=revenue,webFees=web_fees,appleFees=apple_fees,payout=payout,fees=web_fees+apple_fees+payout,paidCloud=paid_cloud,onboarding=onboarding,recurringSupport=support,freeUnit=free_unit,freePool=free_pool,retained=archives,variable=variable,contribution=contribution,margin=contribution/revenue,renewalContribution=renewal_contribution,afterCAC=contribution-a["cac"],threeYear=three_year,cacCeiling=max(0,min(contribution/2,three_year/3)))

def scale(n,a,u):
    f=data["fees"]
    mau=n*(a["freeRatio"]+a["paidMAU"])
    auth=data["auth0IncrementMonthly"]*12 if mau>data["auth0FreeMAU"] else 0
    hosting_steps=max(0, (n-1)//data["hostingStepPaid"])*data["hostingStepMonthly"]*12
    fixed_prod=a["fixedCloudMonthly"]*12+a["prodOpsHoursMonthly"]*a["laborRate"]*12+auth+hosting_steps
    payout_topup=max(0,f["usdPayoutMinimum"]*f["payoutsPerYear"]-n*u["payout"]) if a["webShare"]>0 and f["usdPayoutRate"]>0 else 0
    opex=sum(r["amount"] for r in data["fixedOpex"])
    founder=data["maintenanceHoursMonthly"]*data["developerRate"]*12+data["adminHoursMonthly"]*a["laborRate"]*12
    gross_profit=n*u["contribution"]-fixed_prod-payout_topup
    before_acquisition=gross_profit-opex-founder
    all_new=before_acquisition-n*a["cac"]
    steady=n*(u["contribution"]* (1-a["annualRenewal"])+u["renewalContribution"]*a["annualRenewal"])-fixed_prod-payout_topup-opex-founder-n*(1-a["annualRenewal"])*a["cac"]
    full_time=steady+founder-data["fullTimeCompAnnual"]
    return dict(paid=n,activeFree=n*a["freeRatio"],MAU=mau,authReserve=auth,fixedProduction=fixed_prod,payoutTopup=payout_topup,netRevenue=n*u["revenue"],grossProfit=gross_profit,grossMargin=gross_profit/(n*u["revenue"]),cashBeforeFounder=before_acquisition+founder,ownerMaintenance=founder,beforeAcquisition=before_acquisition,allNewAfterCAC=all_new,steadyAfterReplacementCAC=steady,fullTimeAfterReplacementCAC=full_time)

results=[]
for c in (1,2,3):
    a=parameters(c)
    annual=[unit(p,a) for p in data["annualPrices"]]
    selected=unit(data["annualCandidate"],a)
    expected_months=sum(a["monthlySurvival"]**m for m in range(12))
    monthly=[unit(data["monthlyCandidate"],a,t,False) for t in (1,3,6,12,expected_months)]
    scales=[scale(n,a,selected) for n in (100,500,1000,2500,10000)]
    grid=[scale(n,a,selected) for n in range(50,10001,50)]
    breakeven={}
    for metric in ("beforeAcquisition","allNewAfterCAC","steadyAfterReplacementCAC","fullTimeAfterReplacementCAC"):
        last_negative=max([r["paid"] for r in grid if r[metric]<0], default=0)
        breakeven[metric]=last_negative+50 if last_negative<10000 else None
    extra=sum(r["perHH"] for r in data["additional99"])+data["extra99SupportMinutes"]*a["laborRate"]/60
    extra_fixed=sum(r["annualFixed"] for r in data["additional99"])
    premium=unit(99,a)
    premium_cp=premium["contribution"]-extra
    premium_dev_low=sum(r["lowHours"] for r in data["additional99"])*data["developerRate"]
    premium_dev_high=sum(r["highHours"] for r in data["additional99"])*data["developerRate"]
    premium_extra_profit=(premium_cp-selected["contribution"])*1000-extra_fixed
    allowed_human_minutes=max(0,premium["revenue"]*(1-data["premiumTargetCM"])-premium["fees"]-premium["variable"]-extra)*60/a["laborRate"]
    mix=data["annualAcquisitionShare"]
    blended=dict(revenue=mix*selected["revenue"]+(1-mix)*monthly[-1]["revenue"],contribution=mix*selected["contribution"]+(1-mix)*monthly[-1]["contribution"])
    blended["afterCAC"]=blended["contribution"]-a["cac"]
    results.append(dict(case=c,name=data["cases"][c-1],annual=annual,monthly=monthly,blended=blended,scales=scales,breakeven=breakeven,premium=dict(contribution=premium_cp,margin=premium_cp/premium["revenue"],extraVariable=extra,extraFixed=extra_fixed,developmentLow=premium_dev_low,developmentHigh=premium_dev_high,incrementalProfitAt1000=premium_extra_profit,allowedConciergeMinutesAtTargetCM=allowed_human_minutes)))
(BASE / "results.json").write_text(json.dumps(results,indent=2))
for r in results:
    print(r["name"],"annual price/CP/CM",[(x["price"],round(x["contribution"],2),round(x["margin"]*100,1)) for x in r["annual"]])
    print("monthly: months/CP",[(round(x["months"],2),round(x["contribution"],2)) for x in r["monthly"]])
    print("break-even:",r["breakeven"])
    print("1000 payers:",r["scales"][2])
    print("99 software extension:",r["premium"])
