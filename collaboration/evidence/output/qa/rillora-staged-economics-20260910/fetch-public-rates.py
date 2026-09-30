import json
from pathlib import Path
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor

OUT=Path(__file__).parent
def read(service):
    url=f'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/{service}/current/eu-central-1/index.json'
    data=json.load(urlopen(url,timeout=45))
    candidates=[]
    for sku,p in data['products'].items():
        a=p.get('attributes',{})
        keep=False
        if service=='AmazonRDS':
            keep=(a.get('databaseEngine')=='PostgreSQL' and a.get('instanceType')=='db.t4g.micro' and a.get('deploymentOption')=='Single-AZ') or ('GP3-Storage' in a.get('usagetype','') and a.get('deploymentOption')=='Single-AZ')
        elif service=='AmazonECS':
            keep='Fargate-ARM' in a.get('usagetype','')
        if not keep: continue
        for t in data.get('terms',{}).get('OnDemand',{}).get(sku,{}).values():
            for d in t['priceDimensions'].values():
                candidates.append({'sku':sku,'attributes':a,'unit':d['unit'],'usd':d['pricePerUnit'].get('USD'),'description':d['description']})
    return {'service':service,'url':url,'publicationDate':data.get('publicationDate'),'rates':candidates}

with ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(read,['AmazonRDS','AmazonECS']))
(OUT/'aws-public-rates.json').write_text(json.dumps(results,indent=2))
for r in results:
    print(r['service'],r['publicationDate'])
    for x in r['rates']: print(x['attributes'].get('usagetype'),x['unit'],x['usd'],x['description'])
