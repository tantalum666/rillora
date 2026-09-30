async (page) => {
  await page.getByRole('button',{name:'Skip this question',exact:true}).click();
  await page.getByRole('heading',{name:'Your first matter',exact:true}).waitFor();
  await page.getByRole('button',{name:'Save and exit',exact:true}).click();
  await page.getByRole('button',{name:'Resume quick start guide',exact:true}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:'Resume quick start guide',exact:true}).click();
  await page.getByRole('heading',{name:'Your first matter',exact:true}).waitFor();
  await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p2-repair-20260916/behavior-20260916/guide-resumed.png'});
  await page.getByRole('button',{name:'Save and exit',exact:true}).click();
  await page.getByRole('button',{name:'Add a matter',exact:true}).last().click();
  await page.getByRole('heading',{name:'New matter',exact:true}).waitFor();
  await page.getByRole('button',{name:'Close panel',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  return {pausedResumeVisible:true,resumeSurvivesReload:true,stepTwoPreserved:true,manualAddStillAvailable:true};
}
