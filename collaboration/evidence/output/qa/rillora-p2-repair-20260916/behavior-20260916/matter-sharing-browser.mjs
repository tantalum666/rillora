async (page) => {
  await page.getByRole('button',{name:'Manage who can see this',exact:true}).click();
  await page.getByRole('button',{name:/^Normal browser QA/}).click();
  await page.getByText('Visible details',{exact:true}).click();
  const preview=page.locator('details[open]');
  await preview.getByText('Visible only before scope changes',{exact:true}).waitFor();
  if(await preview.getByText('Navigation QA document',{exact:true}).count()) throw Error('Unselected matter leaked into preview');
  await page.getByRole('button',{name:'Name',exact:true}).click();
  await preview.getByText('Only the name and category are shared with you.',{exact:true}).waitFor();
  if((await preview.innerText()).includes('0x0000') || (await preview.innerText()).includes('Visible only before scope changes')) throw Error('Name preview retained details');
  await page.getByRole('button',{name:'Close panel',exact:true}).click();
  await page.getByRole('button',{name:'Keep editing',exact:true}).click();
  await page.waitForURL(/task=contact-sharing/);
  const focusWithinDrawer=await page.evaluate(()=>document.querySelector('dialog.drawer')?.contains(document.activeElement));
  if(!focusWithinDrawer) throw Error('Focus did not return to the editor');
  await page.getByRole('button',{name:'Details',exact:true}).click();
  await preview.getByText('Visible only before scope changes',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close panel',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Back to Foreground QA wallet',exact:true}).click();
  await page.getByRole('heading',{name:'Edit matter',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector("dialog.drawer")?.scrollTop>=600);
  const panelScroll=await page.locator('dialog.drawer').evaluate(el=>el.scrollTop);
  if(panelScroll<600) throw Error('Matter panel scroll not restored: '+panelScroll);
  await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p2-repair-20260916/behavior-20260916/matter-return-mobile.png'});
  await page.getByRole('button',{name:'Close panel',exact:true}).click();
  if(await page.getByRole('searchbox',{name:'Search matters'}).inputValue()!=='Foreground') throw Error('Search lost after sharing return');
  return {existingSharingRoute:true,exactSelectedPreview:true,namePreviewExcludesDetails:true,dirtyCancelFocus:true,dialogScroll:panelScroll,searchPreserved:true};
}
