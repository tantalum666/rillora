#!/usr/bin/env python3
"""Isolated synthetic browser checks. Requires Playwright + an existing Chromium.
Start apps/web with `npm run dev -- --host 127.0.0.1 --port 4174`.
Build public with `npm run build:public`, then `node scripts/preview-public.mjs`.
No remote host is visited. API calls are fulfilled locally. No real user data.
Run: python docs/qa/chinese-web-20261005/browser-qa.py
This script was authored but could not execute in the Oct 5 constrained executor;
its initial launch was blocked by Chromium socket EPERM. Do not count as passed.
"""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import argparse, hashlib, json, re, traceback
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
REPORT = {'evidence':'synthetic local browser only', 'checks':[], 'runtimeErrors':[], 'externalAttempts':[], 'unexpectedApi':[], 'mutations':[]}
APP='http://127.0.0.1:4174'; PUBLIC='http://127.0.0.1:4197'
MID='11111111-1111-4111-8111-111111111111'; PID='22222222-2222-4222-8222-222222222222'; CID='33333333-3333-4333-8333-333333333333'
MATTER={'publicId':MID,'title':'Synthetic User 原文','category':'account','institutionName':'Synthetic Provider','locationHint':'Original shelf 甲','accountHint':'test-only-42','notes':'Keep original 用户输入','desiredOutcome':'notify','status':'ready','importance':'important','valueBand':'unknown','currencyCode':'USD','details':{},'version':1}
SESSION={'plannerPublicId':PID,'displayName':'Synthetic Owner 林','authenticationMode':'session'}
PLAN={'publicId':PID,'version':1,'firstUseState':'completed','firstUseStep':2}
CONTACT={'publicId':CID,'displayName':'Synthetic Person 王','relationshipLabel':'Friend','status':'active','version':1}
CONNECTION={'publicId':CID,'personPublicId':CID,'personName':CONTACT['displayName'],'ownerName':SESSION['displayName'],'status':'accepted','readOnly':True,'version':1,'emailHint':'s***@example.com','grants':[{'matterPublicId':MID,'detailLevel':'name'}],'access':{'mode':'live'}}
OVERVIEW={'session':SESSION,'plan':PLAN,'matters':[MATTER],'trustedContacts':[CONTACT],'nextCursor':None}
SHARED={'readOnly':True,'purpose':'planner_directed','connections':[CONNECTION],'items':[{'connectionPublicId':CID,'matterPublicId':MID,'ownerName':SESSION['displayName'],'detailLevel':'details','fields':{k:MATTER[k] for k in ['title','category','institutionName','locationHint','desiredOutcome','accountHint','notes']}}]}


def check(name, condition, details=None):
    REPORT['checks'].append({'name':name,'passed':bool(condition),'details':details})
    if not condition: print('FAIL',name,details,flush=True)


def fixture(route, signed_in):
    req=route.request; u=urlparse(req.url)
    if u.hostname not in ['127.0.0.1','localhost']:
        REPORT['externalAttempts'].append(req.url); route.abort(); return
    if not u.path.startswith('/api/'):
        route.continue_(); return
    p=u.path
    if req.method not in ['GET','HEAD','OPTIONS']:
        REPORT['mutations'].append({'path':p,'method':req.method})
        route.fulfill(status=409,json={'error':{'code':'qa_mutation_blocked','message':'Synthetic QA never sends writes'}}); return
    if p.endswith('/overview'):
        if signed_in: route.fulfill(json=OVERVIEW)
        else: route.fulfill(status=401,json={'error':{'code':'authentication_required','message':'Synthetic signed out'}})
    elif p.endswith('/auth/session-status'): route.fulfill(json={'authenticated':signed_in})
    elif p.endswith('/session'): route.fulfill(json=SESSION)
    elif p.endswith('/sharing/connections'): route.fulfill(json={'connections':[CONNECTION]})
    elif p.endswith('/sharing/access'): route.fulfill(json={'access':None})
    elif p.endswith('/sharing/shared-with-me'): route.fulfill(json=SHARED)
    elif p.endswith('/official-setup-checks'): route.fulfill(json={'officialSetupChecks':[]})
    elif p.endswith('/audit-events'): route.fulfill(json={'auditEvents':[]})
    elif p.endswith('/account/profile'): route.fulfill(json={'account':SESSION,'billing':{'hasSubscription':False,'hasPendingPurchase':False}})
    elif p.endswith('/account/archived-matters'): route.fulfill(json={'matters':[]})
    elif '/commerce/status' in p: route.fulfill(status=503,json={'error':{'code':'service_unavailable'}})
    elif '/sharing/invitations/' in p: route.fulfill(json={'invitation':{**CONNECTION,'status':'pending'}})
    else:
        REPORT['unexpectedApi'].append(p);route.fulfill(status=404,json={'error':{'code':'not_found'}})


def ctx(browser, locale='zh-CN', width=390, signed_in=False, dark=False, reduced=True):
    c=browser.new_context(locale=locale,viewport={'width':width,'height':900 if width>500 else 844},color_scheme='dark' if dark else 'light',reduced_motion='reduce' if reduced else 'no-preference')
    c.set_default_timeout(8000)
    c.route('**/*',lambda route:fixture(route,signed_in))
    c.on('page',lambda p:p.on('pageerror',lambda e:REPORT['runtimeErrors'].append(str(e))))
    return c


def language(page, locale):
    page.locator('.language-control select').first.select_option(locale)
    page.wait_for_function('(locale)=>document.documentElement.lang===locale',arg=locale)


def inspect(page, name, locale, screenshot=True):
    page.locator('.language-control select').first.wait_for()
    page.wait_for_timeout(180)
    text=page.locator('body').inner_text()
    check(name+'/nonblank',len(text)>80)
    check(name+'/html-lang',page.locator('html').get_attribute('lang')==locale)
    check(name+'/no-overlay',page.locator('vite-error-overlay').count()==0)
    labels=page.locator('[aria-label],[title],[placeholder]').evaluate_all('(es)=>es.flatMap(e=>[e.getAttribute("aria-label"),e.getAttribute("title"),e.getAttribute("placeholder")]).filter(Boolean)')
    leaks=re.findall(r'\b(?:common|workspace|public|forms|sharing)\.[A-Za-z][A-Za-z0-9_.]*',text+' '+ ' '.join(labels))
    check(name+'/no-raw-message-keys',not leaks,leaks)
    dimensions=page.evaluate('({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth})')
    check(name+'/no-horizontal-overflow',max(dimensions['doc'],dimensions['body'])<=dimensions['viewport']+1,dimensions)
    if screenshot: page.screenshot(path=str(ROOT/(name.replace('/','-')+'.png')),full_page=False)
    (ROOT/(name.replace('/','-')+'.txt')).write_text(text,encoding='utf-8')


def public_suite(browser):
    for locale in ['zh-CN','en']:
      for width in [1440,390,320]:
        for dark in [False,True]:
          c=ctx(browser,locale,width,dark=dark);p=c.new_page()
          for path in ['/','/product','/security','/pricing','/support','/legal','/legal/licenses']:
            res=p.goto(PUBLIC+path);p.locator('main').wait_for();
            name=f'public-{locale}-{width}-{"dark" if dark else "light"}-{path.strip("/").replace("/","-") or "home"}'
            check(name+'/status',res.status==200,res.status)
            inspect(p,name,locale,screenshot=path in ['/','/pricing','/legal'])
          p.goto(PUBLIC+'/');language(p,'en' if locale=='zh-CN' else 'zh-CN');language(p,locale)
          check('public-explicit-language-storage',p.evaluate('localStorage.getItem("rillora.locale.v1")')==locale)
          p.reload();check('public-reload-language',p.locator('html').get_attribute('lang')==locale)
          p.locator('.lp-appearance-trigger').click();p.locator('.lp-appearance-options input[value="dark"]').check()
          href=p.locator('.lp-sign-in').get_attribute('href');params=parse_qs(urlparse(href).query)
          check('public-app-link-language',params.get('lang')==[locale],href)
          check('public-app-link-appearance',params.get('appearance')==['dark'],href)
          c.close()


def signed_out_suite(browser):
    for width in [1440,390,320]:
      c=ctx(browser,width=width);p=c.new_page();p.goto(APP+'/account?lang=zh-CN&appearance=dark&next=guides&service=apple')
      consent=p.locator('.account-consent input[type=checkbox]');consent.wait_for()
      actions=p.locator('.account-action-form > button');check('account-unchecked-default',not consent.is_checked())
      check('account-actions-disabled',all(x.is_disabled() for x in actions.all()))
      inspect(p,f'account-zh-CN-{width}','zh-CN')
      consent.check();language(p,'en');check('account-consent-preserved',consent.is_checked())
      check('account-actions-enabled',all(x.is_enabled() for x in actions.all()))
      language(p,'zh-CN');consent.uncheck();check('account-withdraw-disabled',all(x.is_disabled() for x in actions.all()))
      check('incoming-preference-consumed',all(x not in p.url for x in ['lang=','appearance=']) and 'next=guides' in p.url and 'service=apple' in p.url,p.url)
      for invite in ['/invite?from=shared',f'/invite/{CID}?from=shared']:
        p.goto(APP+invite);p.wait_for_timeout(250);inspect(p,f'invite-{width}-{bool(CID in invite)}','zh-CN')
        check('invitation-safe-back',p.locator('.invitation-back').get_attribute('href')=='/?view=shared')
        cb=p.locator('.account-consent input[type=checkbox]')
        if cb.count():
          check('invitation-unchecked-default',not cb.is_checked());cb.check();language(p,'en');check('invitation-consent-preserved',cb.is_checked());language(p,'zh-CN')
        else:
          p.locator('input[type=text]').fill('invalid synthetic invitation');p.locator('form button').click();
          check('invitation-error-chinese',bool(re.search('[\u4e00-\u9fff]',p.locator('[role=alert]').inner_text())))
      c.close()


def workspace_suite(browser):
    for width in [1440,390,320]:
      c=ctx(browser,width=width,signed_in=True);p=c.new_page();p.goto(APP+'/?view=matters');p.locator('.matter-search input').wait_for()
      p.locator('.matter-search input').fill('Synthetic');p.locator('.panel-tabs button').last.click()
      language(p,'en');check('search-preserved',p.locator('.matter-search input').input_value()=='Synthetic')
      check('filter-preserved',p.locator('.panel-tabs button').last.get_attribute('aria-pressed')=='true')
      check('user-content-preserved',MATTER['title'] in p.locator('body').inner_text())
      inspect(p,f'workspace-matters-en-{width}','en')
      p.locator('.matter-list-tools button').click();p.locator('.matter-form').wait_for()
      p.get_by_label('Name',exact=True).fill('Unsaved 原文');p.get_by_label('Notes',exact=True).fill('Draft stays 原样')
      check('invalid-draft-save-disabled',p.locator('.matter-form button[type=submit]').is_disabled())
      english_validation=p.locator('.matter-form-validation').inner_text()
      # Genuine browser storage event from a second same-origin tab. No React internals.
      switcher=c.new_page();switcher.goto(APP+'/?view=matters');language(switcher,'zh-CN');p.bring_to_front()
      p.wait_for_function('document.documentElement.lang==="zh-CN"')
      check('dirty-name-preserved',p.get_by_label('名称',exact=True).input_value()=='Unsaved 原文')
      check('dirty-notes-preserved',p.get_by_label('备注',exact=True).input_value()=='Draft stays 原样')
      check('invalid-draft-still-disabled',p.locator('.matter-form button[type=submit]').is_disabled())
      check('validation-relocalized',p.locator('.matter-form-validation').inner_text()!=english_validation)
      inspect(p,f'workspace-dirty-zh-CN-{width}','zh-CN')
      p.locator('.drawer-close').click();p.locator('.task-confirmation').wait_for();p.locator('.task-confirmation [data-keep]').click()
      check('keep-editing-preserves-draft',p.get_by_label('名称',exact=True).input_value()=='Unsaved 原文')
      p.go_back();p.locator('.task-confirmation').wait_for();p.locator('.task-confirmation [data-keep]').click()
      check('back-cancel-preserves-draft',p.get_by_label('名称',exact=True).input_value()=='Unsaved 原文')
      p.locator('.drawer-close').click();p.locator('.task-confirmation .secondary-button').click();p.locator('.matter-form').wait_for(state='detached')
      check('discard-restores-filter',p.locator('.matter-search input').input_value()=='Synthetic')
      for view in ['overview','contacts','shared','settings','activity','guides','access','plan']:
        p.goto(APP+'/?view='+view);p.wait_for_timeout(250);inspect(p,f'workspace-{view}-zh-CN-{width}','zh-CN')
        if view=='shared':
          p.locator('.shared-item-row').first.click();p.locator('.shared-item-detail').wait_for();check('shared-usertext-preserved',MATTER['notes'] in p.locator('body').inner_text());inspect(p,f'workspace-shared-detail-{width}','zh-CN')
        if view=='contacts':
          p.locator('.person-main').first.click();p.locator('.sharing-levels').wait_for();buttons=p.locator('.sharing-levels button');check('sharing-three-levels',buttons.count()==3);check('sharing-levels-chinese',all(re.search('[\u4e00-\u9fff]',v) for v in buttons.all_text_contents()));inspect(p,f'workspace-sharing-levels-{width}','zh-CN');p.locator('.drawer-close').click()
        if view=='settings':
          p.locator('[aria-controls="saved-copy-tools"]').click();p.locator('.saved-copy-reader').wait_for();inspect(p,f'workspace-copy-reader-{width}','zh-CN')
      c.close()


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--suite',choices=['all','app','public'],default='all');args=parser.parse_args()
    REPORT['scriptSha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
        REPORT['browserVersion']=browser.version
        if args.suite in ['all','public']:public_suite(browser)
        if args.suite in ['all','app']:signed_out_suite(browser);workspace_suite(browser)
        check('no-network-mutations',not REPORT['mutations'],REPORT['mutations'])
        check('no-remote-access',not REPORT['externalAttempts'],REPORT['externalAttempts'])
        check('no-runtime-errors',not REPORT['runtimeErrors'],REPORT['runtimeErrors'])
        browser.close()
      REPORT['status']='passed' if all(r['passed'] for r in REPORT['checks']) else 'failed'
    except Exception as e:
      REPORT['status']='blocked' if not REPORT['checks'] else 'incomplete'
      REPORT['exception']=str(e);REPORT['traceback']=traceback.format_exc()
    (ROOT/'browser-results.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'status':REPORT['status'],'checks':len(REPORT['checks']),'failed':sum(not x['passed'] for x in REPORT['checks'])},ensure_ascii=False))
    raise SystemExit(0 if REPORT['status']=='passed' else 1)
if __name__=='__main__':main()
