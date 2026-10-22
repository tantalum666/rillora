import { test, expect } from '@playwright/test';
import { isolate, OWNER, overview } from './fixtures.mjs';

const APP='http://127.0.0.1:4185', ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PERSON='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', TOKEN='n'.repeat(43);
const preview={publicId:ID,status:'pending',purpose:'future_notice',contentAvailable:false,expiresAt:'2030-10-27T00:00:00Z'};
const reviewed={publicId:ID,ownerName:'Synthetic Planner',status:'pending',version:1,purpose:'future_notice',contentAvailable:false};
const owner={...preview,personPublicId:PERSON,emailHint:'n***@example.test',acknowledgedAt:null,version:1};
const contact={publicId:PERSON,displayName:'Synthetic Recipient',relationshipLabel:'Friend',status:'named',version:1};

for(const locale of ['en','zh-CN']) {
  test(`notice owner creates, refreshes acknowledgement and revokes without content grants ${locale}`,async({browser})=>{
    const context=await browser.newContext({locale,viewport:{width:locale==='en'?1440:390,height:1000}});
    const state=await isolate(context), changes=[];
    let notice=null;
    await context.route('**/api/v1/overview',route=>route.fulfill({json:{...overview,trustedContacts:[contact]}}));
    await context.route('**/api/v1/future-notices**',async route=>{
      const req=route.request(),path=new URL(req.url()).pathname;
      expect(req.headers()['x-rillora-planner']).toBe(OWNER);
      if(req.method()==='POST') {
        changes.push(req.postDataJSON());
        expect(changes.at(-1)).toEqual({personPublicId:PERSON,email:'notice@example.test',acknowledgedNoAccess:true});
        notice={...owner};
        return route.fulfill({status:201,json:{notice,invitationUrl:`https://app.rillora.xyz/future-invite#invitation=${TOKEN}`}});
      }
      if(req.method()==='DELETE') {
        expect(req.headers()['if-match']).toBe('2');
        changes.push('revoke');notice={...notice,status:'revoked',version:3};
      } else expect(path).toBe(`/api/v1/future-notices/people/${PERSON}`);
      return route.fulfill({json:{notice}});
    });
    const page=await context.newPage();
    await page.goto(APP+'/?view=contacts');
    await page.getByRole('button',{name:locale==='en'?'Arrange an after-death notice for Synthetic Recipient':'为Synthetic Recipient创建身后安排告知'}).click();
    const panel=page.locator('.future-notice-panel');
    await panel.getByLabel(locale==='en'?'Their sign-in email':'对方用于登录的邮箱').fill('notice@example.test');
    await panel.getByRole('button',{name:locale==='en'?'Create notice invitation':'创建告知邀请'}).click();
    await expect(panel.locator('.future-notice-link')).toBeVisible();
    await expect(panel.locator('.future-notice-status')).toHaveText(locale==='en'?'Waiting for acknowledgement':'等待对方确认知悉');
    expect(changes).toHaveLength(1);
    await page.screenshot({path:test.info().outputPath(`future-owner-${locale}.png`)});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    notice={...notice,status:'acknowledged',acknowledgedAt:'2026-10-20T00:00:00Z',version:2};
    await panel.getByRole('button',{name:locale==='en'?'Refresh connections':'刷新共享状态'}).click();
    await expect(panel.locator('.future-notice-status')).toHaveText(locale==='en'?'Acknowledged · Contents remain private':'对方已知悉 · 内容仍保密');
    await expect(panel.locator('.future-notice-link')).toHaveCount(0);
    await expect(panel).not.toContainText('Synthetic user');
    await panel.getByRole('button',{name:locale==='en'?'Revoke notice':'撤销告知'}).click();
    await expect(panel.locator('.future-notice-status')).toHaveText(locale==='en'?'Notice revoked':'告知已撤销');
    expect(changes).toHaveLength(2);
    expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);expect(state.writes).toEqual([]);
    await context.close();
  });

  test(`recipient explicitly acknowledges, sees only a notice and can leave ${locale}`,async({browser})=>{
    const context=await browser.newContext({locale,viewport:{width:locale==='en'?1440:390,height:1000}});
    const state=await isolate(context), mutations=[];
    let accepted=false;
    await context.route('**/api/**/future-notices**',async route=>{
      const req=route.request(),path=new URL(req.url()).pathname;
      if(path.endsWith('/invitations/resolve')) {
        expect(req.postDataJSON()).toEqual({invitationToken:TOKEN});return route.fulfill({json:{notice:preview}});
      }
      if(path.endsWith('/invitations/review')) {
        expect(req.postDataJSON()).toEqual({invitationPublicId:ID});return route.fulfill({json:{notice:reviewed}});
      }
      if(path.endsWith('/invitations/respond')) {
        const input=req.postDataJSON();mutations.push(input);
        expect(input).toEqual({invitationPublicId:ID,action:'acknowledge',expectedVersion:1});
        accepted=true;return route.fulfill({json:{result:{publicId:ID,status:'acknowledged',version:2,contentAvailable:false}}});
      }
      if(req.method()==='DELETE') {
        expect(req.headers()['if-match']).toBe('2');mutations.push('leave');accepted=false;
        return route.fulfill({json:{left:true,contentAvailable:false}});
      }
      if(path.endsWith('/received')) return route.fulfill({json:{notices:accepted?[{...reviewed,status:'acknowledged',version:2}]:[],contentAvailable:false}});
      throw new Error('Unexpected future route '+path);
    });
    const page=await context.newPage();
    await page.goto(`${APP}/future-invite#invitation=${TOKEN}`);
    await expect(page.getByRole('heading',{name:locale==='en'?'An after-death arrangement':'一项身后安排'})).toBeVisible();
    await expect(page.getByText(locale==='en'?'Synthetic Planner has named you for an after-death arrangement.':'Synthetic Planner已将你指定为一项身后安排的接收人。')).toBeVisible();
    expect(page.url()).not.toContain(TOKEN);
    expect(mutations).toEqual([]);
    await expect(page.getByText('Synthetic user 原文')).toHaveCount(0);
    await page.screenshot({path:test.info().outputPath(`future-recipient-${locale}.png`)});
    await page.getByRole('button',{name:locale==='en'?'I acknowledge this arrangement':'我已知悉这项安排'}).click();
    await expect(page.getByRole('status')).toContainText(locale==='en'?'No content access was granted':'没有开放任何内容');
    await page.getByRole('link',{name:locale==='en'?'Your arrangement notices':'收到的身后安排'}).click();
    const inbox=page.locator('.future-notices-inbox');
    await expect(inbox).toContainText('Synthetic Planner');
    await expect(inbox).not.toContainText('Synthetic user');
    await inbox.getByRole('button',{name:locale==='en'?'Leave this arrangement':'退出这项安排'}).click();
    await expect(inbox).toContainText(locale==='en'?'No acknowledged arrangements':'暂无已确认的身后安排');
    expect(mutations).toHaveLength(2);
    expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);expect(state.writes).toEqual([]);
    await context.close();
  });
}

test('anonymous invitation hides the owner; login return contains only the public identifier',async({browser})=>{
  const context=await browser.newContext({locale:'en'}),state=await isolate(context,{signedIn:false});
  await context.route('**/api/future-notices/**',route=>route.fulfill({json:{notice:preview}}));
  let start;
  await context.route('**/api/auth/start',route=>{
    start=route.request().postDataJSON();return route.fulfill({json:{authorizationUrl:APP+'/account'}});
  });
  const page=await context.newPage();await page.goto(`${APP}/future-invite#invitation=${TOKEN}`);
  const login=page.getByRole('button',{name:'Already have an account? Sign in',exact:true});
  await expect(login).toBeDisabled();await expect(page.getByText('Synthetic Planner')).toHaveCount(0);
  expect(page.url()).not.toContain(TOKEN);
  await page.getByRole('checkbox').check();await login.click();
  await expect.poll(()=>start?.returnTo).toContain(`/future-invite/${ID}`);
  expect(JSON.stringify(start)).not.toContain(TOKEN);
  expect(start.legalAcceptance.acceptedTerms).toBe(true);
  expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);
  await context.close();
});

test('wrong account sees no owner; an unexpected content field fails closed',async({browser})=>{
  const context=await browser.newContext({locale:'zh-CN'}),state=await isolate(context);
  await context.route('**/api/future-notices/**',route=>route.fulfill({json:{notice:preview}}));
  let leak=false;
  await context.route('**/api/v1/future-notices/invitations/review',route=> leak
    ?route.fulfill({json:{notice:{...reviewed,matters:[{title:'Private leaked title'}]}}})
    :route.fulfill({status:403,json:{error:{code:'invitation_account_mismatch'}}}));
  const page=await context.newPage();await page.goto(`${APP}/future-invite#invitation=${TOKEN}`);
  await expect(page.getByRole('alert')).toContainText('请使用受邀邮箱对应的账号');
  await expect(page.getByText('Synthetic Planner')).toHaveCount(0);
  leak=true;await page.getByRole('button',{name:'重试',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('无法安全展示');
  await expect(page.getByText('Private leaked title')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'我已知悉这项安排'})).toHaveCount(0);
  expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);
  await context.close();
});

test('default build has no future-notice entry or requests',async({browser})=>{
  const context=await browser.newContext({locale:'en'}),state=await isolate(context);
  const requests=[];context.on('request',req=>{if(req.url().includes('/api/')&&req.url().includes('future-notices'))requests.push(req.url());});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4174/?view=shared');
  await expect(page.locator('.future-notices-inbox')).toHaveCount(0);
  await page.goto('http://127.0.0.1:4174/future-invite#invitation='+TOKEN);
  await expect(page.getByText('Arrangement notices are not available in this version.')).toBeVisible();
  expect(requests).toEqual([]);expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);
  await context.close();
});

test('a stale sign-in exposes reauthentication and removes the previous private preview',async({browser})=>{
  const context=await browser.newContext({locale:'en'}),state=await isolate(context);
  await context.route('**/api/future-notices/**',route=>route.fulfill({json:{notice:preview}}));
  let stale=false;
  await context.route('**/api/v1/future-notices/invitations/review',route=>stale
    ?route.fulfill({status:403,json:{error:{code:'reauthentication_required'}}})
    :route.fulfill({json:{notice:reviewed}}));
  const page=await context.newPage();await page.goto(`${APP}/future-invite#invitation=${TOKEN}`);
  await expect(page.getByText('Synthetic Planner has named you for an after-death arrangement.')).toBeVisible();
  // Model an account/session invalidation from the shared API client, not a fake sign-in.
  await page.evaluate(()=>window.dispatchEvent(new Event('rillora:account-changed')));
  await expect(page.getByText('Synthetic Planner has named you for an after-death arrangement.')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'I acknowledge this arrangement'})).toHaveCount(0);
  stale=true;
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'I acknowledge this arrangement'})).toHaveCount(0);
  expect(state.errors).toEqual([]);expect(state.unexpected).toEqual([]);
  await context.close();
});
