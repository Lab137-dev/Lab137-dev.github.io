const {chromium}=require(process.env.CRUMB_PLAYWRIGHT || 'playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'crumb-reward-test-'));
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
const options={headless:true,executablePath:process.env.CRUMB_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe'};
(async()=>{
 let context;
 try{
  context=await chromium.launchPersistentContext(profile,options);
  let page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('crumb.language.v1','en'));
  await page.goto(url);
  await page.evaluate(()=>{
   localStorage.setItem('crumb.sandbox.v1',JSON.stringify({words:['cookie','apple','bread','cheese','rice','milk','cake','oatmeal','toast','banana','pear','peach','grape','carrot','honey'],chosen:[],placed:[],rewardPicks:[],entries:[]}));
   localStorage.removeItem('crumb.sandbox.v1.backup');
  });
  await page.reload();
  await page.locator('#sandboxToggle').click();
  for(const name of ['Teddy bear','Dollhouse']){
   await page.locator('#sandboxItems button').filter({hasText:name}).click();
   await page.locator('#sandboxConfirmChoice').click();
  }
  await page.locator('#sandboxItems button').filter({hasText:'Pocket tent'}).click();
  await page.locator('#sandboxTrophies button').first().click();
  const saved=await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1.backup')),saved);
  await context.close();
  context=await chromium.launchPersistentContext(profile,options);
  page=await context.newPage();await page.goto(url);
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1')),saved,'choices survive full Chrome restart at the same extracted file');
  await page.locator('#sandboxToggle').click();
  assert.match(await page.locator('#sandboxItems button').filter({hasText:'Teddy bear'}).innerText(),/In use/);
  assert.match(await page.locator('#sandboxItems button').filter({hasText:'Dollhouse'}).innerText(),/In use/);
  console.log('PASS extracted file: selected rewards and table placement survive full Chrome restart');
  await page.evaluate(()=>localStorage.setItem('crumb.sandbox.v1','{damaged'));
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1')),saved,'recover corrupt primary from backup');
  await page.evaluate(()=>localStorage.removeItem('crumb.sandbox.v1'));
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1')),saved,'recover missing primary from backup');
  console.log('PASS recovery: corrupt or missing reward save restores choices and placement from backup');
  await page.addInitScript(()=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key.startsWith('crumb.sandbox.v1'))throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};
  });
  await page.reload();await page.locator('#sandboxToggle').click();
  assert.ok(await page.locator('#sandboxSaveWarning').isVisible(),'failed saves are visible');
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1')),saved,'failed writes retain prior save');
  console.log('PASS save failures: warning visible and prior save retained');
  // Drop the write-failure injection before exercising damaged saves.
  await page.close();page=await context.newPage();await page.goto(url);
  await page.evaluate(()=>{localStorage.setItem('crumb.sandbox.v1','{broken-primary');localStorage.setItem('crumb.sandbox.v1.backup','{broken-backup');});
  await page.reload();await page.locator('#sandboxToggle').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('crumb.sandbox.v1')),'{broken-primary','do not overwrite unreadable saves');
  assert.ok(await page.locator('#sandboxSaveWarning').isVisible());
  console.log('PASS damaged saves: preserve original data and warn instead of silently resetting');
 }finally{if(context)await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
