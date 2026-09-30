async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 async function invite(name,email,replace=false){
   await page.getByRole('button',{name:'Invite someone Share by link or QR'}).click();
   await page.getByRole('textbox',{name:'Name · Required',exact:true}).fill(name);
   await page.getByRole('button',{name:'Continue to invitation',exact:true}).click();
   await page.getByRole('textbox',{name:"Recipient's sign-in email · Required",exact:true}).fill(email);
   const action=replace?'Replace included person':'Create link & QR';
   await page.getByRole('button',{name:action,exact:true}).click();
   if(replace){
     await page.getByRole('button',{name:'Keep editing',exact:true}).click();
     if(await page.getByRole('textbox',{name:"Recipient's sign-in email · Required",exact:true}).inputValue()!==email)throw Error('Replacement cancel lost draft');
     await page.getByRole('button',{name:action,exact:true}).click();
     await page.getByRole('button',{name:'Replace and create invitation',exact:true}).click();
   }
   await page.getByRole('heading',{name:'Ready to share',exact:true}).waitFor();
   await page.getByRole('button',{name:'Sharing settings',exact:true}).click();
 }
 await invite('Quota UI one','quota-one@example.test');
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await invite('Quota UI two','quota-two@example.test',true);
 await page.getByText('1 of 1 sharing place used',{exact:true}).waitFor();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-launch-completion-20260916/replacement-mobile.png'});
 await page.getByRole('button',{name:'Pause current updates',exact:true}).click();
 await page.getByRole('button',{name:'Pause updates',exact:true}).click();
 await page.getByText('0 of 1 sharing place used',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Use included place',exact:true}).click();
 await page.locator('dialog.task-confirmation').getByRole('button',{name:'Use included place',exact:true}).click();
 await page.getByText('1 of 1 sharing place used',{exact:true}).waitFor();
 if(errors.length)throw Error(JSON.stringify(errors));
 return {mobileReplacement:true,cancelKeepsDraft:true,pauseFreesSlot:true,resumeExplicit:true,consoleErrors:errors};
}
