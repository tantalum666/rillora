async (page) => {
  await page.goto('http://127.0.0.1:4264/?view=matters');
  await page.getByText('No matters yet. Add an account, document or other important item.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Add a matter',exact:true}).click();
  await page.getByRole('heading',{name:'New matter',exact:true}).waitFor();
  await page.keyboard.press('Tab');
  await page.keyboard.type('Keyboard QA draft');
  await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');
  const before=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
  if(before!=='Close panel') throw Error('Keyboard sequence did not reach Close: '+before);
  await page.keyboard.press('Space');
  await page.getByRole('button',{name:'Keep editing',exact:true}).waitFor();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Keep editing',exact:true}).waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Close panel');
  if(await page.getByRole('textbox',{name:'Name',exact:true}).inputValue()!=='Keyboard QA draft') throw Error('Keyboard cancel lost draft');
  const ring=await page.getByRole('button',{name:'Close panel',exact:true}).evaluate(el=>({color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth}));
  await page.keyboard.press('Space');
  await page.getByRole('button',{name:'Keep editing',exact:true}).waitFor();
  await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.goto('http://127.0.0.1:4261/?view=matters&q=does-not-exist');
  await page.getByRole('status').filter({hasText:'No matters match'}).waitFor();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.getByRole('button',{name:/Open Foreground QA wallet/}).waitFor();
  return {firstEmpty:true,noResults:true,clearFilterRestores:true,keyboardCancelPreserves:true,keyboardDiscard:true,focusRing:ring};
}
