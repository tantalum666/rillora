from pathlib import Path
import json,subprocess
q=Path(__file__).parent
s=json.loads((q/'staging-before.json').read_text());o={v['OutputKey']:v['OutputValue'] for v in s['Outputs']};t=json.loads((q/'migration-task.json').read_text())
code="import pg from 'pg'; import {loadDatabaseConfig} from './dist/config.js'; import {databaseConnectionOptions} from './dist/db.js'; const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig())); await c.connect(); console.log(JSON.stringify((await c.query('select name,checksum from app.schema_migrations order by name desc limit 3')).rows)); await c.end();"
net={'awsvpcConfiguration':{'subnets':o['PublicSubnetIds'].split(','),'securityGroups':[o['TaskSecurityGroupId']],'assignPublicIp':'ENABLED'}}
overrides={'containerOverrides':[{'name':'Migration','command':['node','--input-type=module','-e',code]}]}
a=['aws','ecs','run-task','--cluster',t['cluster'],'--task-definition',t['taskDefinitionArn'],'--launch-type','FARGATE','--network-configuration',json.dumps(net),'--overrides',json.dumps(overrides),'--profile','rillora-staging-operator','--output','json']
r=json.loads(subprocess.check_output(a,text=True));assert not r.get('failures');task=r['tasks'][0]
result={'cluster':t['cluster'],'taskArn':task['taskArn'],'taskDefinitionArn':task['taskDefinitionArn']};(q/'schema-read-task.json').write_text(json.dumps(result,indent=2));print('Read-only migration-checksum task started')
