# HISTORICAL one-off initial generator. Final reviewed content is config/provider-guides.json; do not rerun over it.
from pathlib import Path
import json,re
q=Path(__file__).resolve().parent
root=q.parents[2]
old=json.loads((q/'original-web-catalog.json').read_text())
swift=(root/'apps/ios/Rillora/Features/OfficialSetup/OfficialProviderGuideCatalog.swift').read_text()
icons=dict(re.findall(r'id: "([^"]+)".*?systemImage: "([^"]+)"',swift,re.S))
groups=[('cloud','Cloud & email'),('social','Social accounts'),('money','Money & crypto'),('work','Work & passwords'),('software','Software & subscriptions')]
groupmap={'apple':'cloud','google':'cloud','microsoft':'cloud','meta':'social','linkedin':'social','x':'social','paypal':'money','coinbase':'money','binance':'money','github':'work','password_manager':'work'}
aliases={'apple':['iCloud','苹果'],'google':['Gmail','YouTube','Google Drive','谷歌'],'microsoft':['Outlook','OneDrive','Hotmail','微软'],'meta':['Facebook','Meta','脸书'],'linkedin':['领英'],'x':['Twitter','推特'],'paypal':['贝宝'],'coinbase':[],'binance':['币安','Binance.com'],'github':['repositories'],'password_manager':['Bitwarden','1Password','password manager']}
kind={'Set up + request':'prepareAndRequest','Set up now':'prepareNow','Estate request':'estateRequest'}
def link(title,url,phase='afterDeath'):
 return {'title':title,'detail':'Official guidance','urlString':url,'phase':phase}
guides=[]
for g in old:
 links=[]
 for i,(title,url) in enumerate(g['links']):
  phase='prepare' if i==0 and g['key'] in ['apple','google','meta','github'] else 'both' if g['key']=='password_manager' else 'afterDeath'
  links.append(link(title,url,phase))
 guides.append(dict(id=g['key'],name=g['label'],systemImage=icons[g['key']],kind=kind[g['kind']],group=groupmap[g['key']],aliases=aliases[g['key']],summary=g['detail'],prepareSteps=g['doNow'],laterSteps=g['later'],usuallyRequested=g['requirements'],boundary=g['boundary'],links=links,lastReviewed='2026-08-20'))
by={g['id']:g for g in guides}
def update(id,**data):by[id].update(**data)
update('apple',summary='Legacy Contact, data access and closure',lastReviewed='2026-09-18',
 prepareSteps=['Open Settings → your name → Sign-In & Security → Legacy Contact.','Add the person, then share or print their access key.','Confirm they received the key and keep its location with your estate documents.'],
 laterSteps=['Look for the Legacy Contact access key. If available, open Apple Digital Legacy using the official link below.','Provide the key and death certificate or regional equivalent. Follow Apple’s document review.','Without an access key, use Apple’s family-member route for country-specific legal-document instructions.','Follow Apple’s approved access or deletion route. Do not erase a device before considering whether needed data would be lost.'],
 usuallyRequested=['Legacy Contact access key, if available','Death certificate or regional equivalent','Legal authority or court documents if Apple requests them'],
 boundary='Legacy Contact excludes Keychain passwords, passkeys, payment data and purchased media. Other access requests depend on local documentation; approval is not guaranteed.',
 links=[link('Set up Legacy Contact','https://support.apple.com/en-us/102631','prepare'),link('Start a Legacy Contact request','https://digital-legacy.apple.com/'),link('No access key or need account closure?','https://support.apple.com/en-us/102431')])
update('google',summary='Inactive Account Manager and family requests',lastReviewed='2026-09-18',
 prepareSteps=['Open Google Inactive Account Manager while signed in to your own account.','Choose the inactivity period, up to ten contacts and the data each may receive.','Choose whether to delete the account afterward, and keep contact details current.'],
 laterSteps=['Open Google’s deceased-user request form and choose closure, funds or account content.','If content is needed, request it first. Closing the account prevents a later content request.','Provide the identity, death and authority evidence Google requests through its form. Wait for its review.'],
 links=[link('Open Inactive Account Manager','https://myaccount.google.com/inactive','prepare'),link('How Inactive Account Manager works','https://support.google.com/accounts/answer/3036546?hl=en','prepare'),link('Start a deceased-user request','https://support.google.com/accounts/troubleshooter/6357590?hl=en')])
update('meta',name='Facebook',summary='Legacy Contact, memorialization or removal',
 prepareSteps=['In Facebook Accounts Centre, open Personal details → Account ownership and control → Memorialisation.','Choose a Legacy Contact or Delete after death. Decide whether permitted content downloads should be allowed.'],
 laterSteps=['Use Facebook’s deceased-account help to request memorialization or removal.','For removal, follow the proof-of-death and family or estate-authority requirements. Do not sign in as the deceased person.'],
 boundary='A Legacy Contact cannot log in or read private messages. Memorialization and removal do not transfer account ownership.',links=by['meta']['links'][:2])
update('password_manager',name='Bitwarden & 1Password',summary='Emergency access and family recovery')
update('binance',summary='Legacy Inheritance / Inheritance Appeal',lastReviewed='2026-09-18',
 prepareSteps=['Record the exact Binance entity and the account’s email, phone or Binance ID.','Keep custody and estate documents identifiable. Do not record passwords, 2FA secrets or wallet seeds.'],
 laterSteps=['Use your own Binance account. Open Customer Support → Self Service → View All → Account → Legacy Inheritance.','Identify the deceased person using their email, phone number or Binance ID. Submit the legally valid inheritance documents requested by the form.','Wait for Binance’s review and follow the approved beneficiary or trustee transfer process. If the account is Binance.US, use its separate guide.'],
 usuallyRequested=['Your own Binance account','Deceased user email, phone or Binance ID','Legally valid inheritance documents requested for that entity'],
 boundary='This is an after-death claim reviewed by Binance, not a preselected Legacy Contact or permission to use another person’s login. Entity and local-law requirements vary.',
 links=[link('Open Inheritance Appeal','https://www.binance.com/en/my/risk/appeal?templateId=T192d41590'),link('Read the official inheritance steps','https://www.binance.com/en/support/faq/detail/89413ec723d94a1d8fb038e3e1130e0a','both')])

def add(id,name,group,icon,summary,prepare,later,documents,boundary,links,aliases=[],reviewed='2026-09-18'):
 guides.append(dict(id=id,name=name,group=group,systemImage=icon,kind='estateRequest',aliases=aliases,summary=summary,prepareSteps=prepare,laterSteps=later,usuallyRequested=documents,boundary=boundary,links=links,lastReviewed=reviewed))
add('instagram','Instagram','social','photo.on.rectangle','Memorialization or account removal',
 ['Record the profile URL and whether you prefer memorialization or removal.'],
 ['Open Instagram’s deceased-account guidance and select memorialization or removal.','Submit the proof of death requested; removal additionally requires an authorized family member or representative.'],
 ['Profile URL','Proof of death','Family relationship or estate authority for removal'],
 'Instagram does not provide another person’s login or a Facebook-style Legacy Contact setting.',
 [link('Instagram memorialization and removal','https://www.facebook.com/help/264154560391256/')],['IG','ins'],reviewed='2026-08-20')
add('binance_us','Binance.US','money','bitcoinsign.circle','U.S. custodial-asset inheritance request',
 ['Record that this is Binance.US, with a safe account locator and estate-document location.'],
 ['Open Binance.US’s deceased-user instructions and contact its support team.','Provide its required selfie video, death certificate, claimant ID and will or probate documents through official support.','Follow the team’s reviewed transfer instructions. Do not use the Binance.com form for this account.'],
 ['Selfie video stating preferred asset transfer','Death certificate','Claimant government ID or passport','Will and/or probate or estate appointment'],
 'This document list is specific to Binance.US. It does not recover self-custody wallets or establish inheritance rights by itself.',
 [link('Binance.US required documents','https://support.binance.us/en/articles/10395308-collecting-funds-from-a-deceased-user-s-account')],['币安美国','Binance US'])
add('dropbox','Dropbox','cloud','externaldrive.badge.icloud','Request access to a deceased person’s files',
 ['Record the account email and the location of any locally synced Dropbox folder.'],
 ['If legally permitted, check the local Dropbox folder for existing copies. Otherwise request access from Dropbox.','Create a support ticket with the deceased person’s name/email, your contact details, relationship, government ID and the court order specified by Dropbox.','Wait for Dropbox’s review before assuming access is available.'],
 ['Deceased person’s name and account email','Requestor contact, relationship and government ID','Court order meeting Dropbox’s stated requirements'],
 'Dropbox requires proof of death and lawful access. Providing documents does not guarantee access.',
 [link('Dropbox deceased-account instructions','https://help.dropbox.com/account-settings/access-account-of-someone-who-passed-away')],['files','cloud storage'])
add('adobe','Adobe','software','paintbrush.pointed','Cancel subscriptions or close an account',
 ['Record the Adobe ID email and active subscriptions; keep needed files in an authorized location.'],
 ['Open Adobe’s official instructions, then its privacy inquiry form. Verify your own contact email.','Choose the request for another person’s death, enter their Adobe ID, and provide the requested legal documentation.','Submit the request as the authorized representative and retain Adobe’s response.'],
 ['Account holder’s Adobe ID email','Requestor name, country and email','Death certificate and authority documentation as requested'],
 'This route concerns closure or cancellation. It does not promise transfer of an Adobe account, software license or cloud files.',
 [link('Adobe closure and cancellation instructions','https://helpx.adobe.com/account/individual/subscriptions-and-plans/renewals-and-cancellations/close-account-behalf-someone-else.html')],['Creative Cloud','Photoshop','Acrobat'])
add('yahoo','Yahoo','cloud','envelope','Regional closure, billing and content options',
 ['Record the Yahoo ID and account region. Save important material while you are authorized to do so.'],
 ['Choose the official Yahoo page for the account’s region before submitting anything.','For U.S. accounts, choose closure, billing cancellation or a content request; each has its own form and requirements.','Outside the U.S., follow regional guidance. The global page requests a closure letter, executor/representative appointment and death certificate.'],
 ['Yahoo ID and account region','Death certificate','Executor appointment; U.S. content requests additionally need ID and a qualifying U.S. court order'],
 'Accounts and passwords are not transferred. U.S. and global content-request rules differ; the U.S. forms reject non-U.S. accounts.',
 [link('Yahoo U.S. options','https://help.yahoo.com/kb/SLN2021.html'),link('Yahoo global guidance','https://en-global.help.yahoo.com/kb/SLN2021.html')],['Yahoo Mail','雅虎'])
add('netflix','Netflix','software','play.rectangle','Cancel a deceased member’s subscription',
 ['Record the account email or phone and where its subscription is billed.'],
 ['Open Netflix’s deceased-member page and use the no-account-access support route.','Contact Netflix with the account email or phone. Provide any required billing information only through Netflix’s official support channel.','Request cancellation and keep its confirmation. Do not obtain or use the deceased person’s password.'],
 ['Account email or phone','Billing information requested directly by Netflix'],
 'This is subscription cancellation, not account inheritance. Never store payment credentials in Rillora.',
 [link('Netflix deceased-member cancellation','https://help.netflix.com/en/node/110165')],['奈飞','subscriptions'])
add('steam','Steam','software','gamecontroller','Account and game-transfer limits',
 ['Record the Steam profile or account locator. Do not treat the game library as an automatically transferable account.'],
 ['Read the Steam Subscriber Agreement’s account-transfer restrictions.','Ask Steam Support what lawful options and documents apply to the estate; do not share the deceased person’s login.'],
 ['Steam account or profile locator','Requestor contact and only documents Steam asks for'],
 'Steam accounts and subscriptions are personal and generally non-transferable unless Valve permits otherwise. No dedicated estate-transfer workflow is claimed here.',
 [link('Steam account-transfer terms','https://store.steampowered.com/subscriber_agreement/','both'),link('Ask Steam Support','https://help.steampowered.com/')],['Valve','games'])
order=['apple','google','microsoft','dropbox','yahoo','meta','instagram','linkedin','x','paypal','coinbase','binance','binance_us','github','password_manager','adobe','netflix','steam']
guides.sort(key=lambda x:order.index(x['id']))
assert len(guides)==18 and len({g['id'] for g in guides})==18
payload={'schemaVersion':1,'selfReportedProviderKeys':['apple','google','meta','github','password_manager'],'groups':[{'id':i,'title':t} for i,t in groups],'guides':guides}
(root/'config/provider-guides.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print('Wrote',len(guides),'guides to one shared catalog.')
