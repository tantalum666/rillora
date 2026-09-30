async (page) => {
  await page.getByRole('button',{name:'Download my complete map',exact:true}).click();
  const confirmation=page.getByRole('alertdialog');
  await confirmation.waitFor();
  const pending=page.waitForEvent('download');
  await confirmation.getByRole('button',{name:'Download my map',exact:true}).click();
  const download=await pending;
  await download.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/web-map-backup.json');
  return {saved:true,filename:download.suggestedFilename()};
}
