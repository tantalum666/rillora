async (page) => {
  await page.goto('http://127.0.0.1:4261/?view=matters&q=Foreground');
  await page.getByRole('button',{name:/Open Foreground QA wallet/}).click();
  await page.getByRole('button',{name:'Manage who can see this',exact:true}).click();
  await page.getByRole('button',{name:/^Invite someone/}).click();
  await page.getByRole('textbox',{name:'Name',exact:true}).fill('New web recipient QA');
  return await page.getByRole('dialog').innerText();
}
