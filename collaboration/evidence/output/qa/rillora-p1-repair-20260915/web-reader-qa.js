async (page) => {
  await page.getByRole('button',{name:'Open a saved copy',exact:true}).click();
  await page.getByLabel('Saved copy file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/native-map-backup.json');
  await page.getByText('Private letter',{exact:true}).click();
  await page.getByText('Do not put in any recipient guide',{exact:true}).waitFor();
  await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-reads-native-backup.png'});
  return {privateBackupOpens:true,text:await page.locator('main').innerText()};
}
