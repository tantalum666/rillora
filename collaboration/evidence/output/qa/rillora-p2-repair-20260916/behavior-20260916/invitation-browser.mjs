async (page) => {
  const links = [{"person": "720d07b8-ac8b-4e8a-b2b1-b7a40ec641a3", "connection": "44f6c84f-511d-4dd0-8656-f3500e1f2eac", "url": "http://127.0.0.1:4261/invite#invitation=[REDACTED_CAPABILITY]"}, {"person": "67ed5706-5045-4a86-a2be-edc27fb2a4e9", "connection": "6262c9b5-5819-4bd1-bab1-30b2d02edd45", "url": "http://127.0.0.1:4261/invite#invitation=[REDACTED_CAPABILITY]"}];
  const checks = {};
  await page.goto('http://127.0.0.1:4262/');
  await page.getByRole('heading',{name:'Your map',exact:true}).waitFor();
  for (let index=0;index<links.length;index++) {
    await page.goto(links[index].url.replace('http://127.0.0.1:4261','http://127.0.0.1:4262'));
    await page.getByRole('button',{name:'Accept invitation',exact:true}).waitFor();
    let attempted=0;
    if(index===1) await page.route('**/v1/sharing/invitations/accept',async route=>{attempted++;await route.fetch();await route.abort('failed');},{times:1});
    await page.getByRole('button',{name:'Accept invitation',exact:true}).click();
    await page.waitForURL('**/?view=shared');
    await page.getByRole('heading',{name:'Shared with me',exact:true}).waitFor();
    checks[index===0?'normalAcceptance':'lostResponseRecovered'] = true;
    if(index===1 && attempted!==1) throw Error('Lost-response injection was not exercised');
    await page.goBack();
    if(page.url().includes('/invite')) throw Error('Accepted invitation remained in history');
    checks['oldInvitationReplaced'+index]=true;
  }
  return checks;
}
