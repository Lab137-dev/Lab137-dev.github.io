const {chromium}=require(process.env.CRUMB_PLAYWRIGHT || 'playwright');
const path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CRUMB_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  for(const viewport of [{width:1100,height:850},{width:390,height:844},{width:820,height:1180}]){
   const page=await browser.newPage({viewport,hasTouch:viewport.width<1000});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{requestAnimationFrame=()=>{};});
   await page.goto(pathToFileURL(path.join(__dirname,'..','index.html')).href);
   await page.evaluate(()=>{localStorage.clear();localStorage.setItem('crumb.language.v1','en');localStorage.setItem('crumb.sandbox.v1',JSON.stringify({words:[],chosen:['bear','gift','trophy-en-5'],placed:['bear','gift','trophy-en-5'],rewardPicks:['bear','gift'],entries:[]}));});
   await page.reload();await page.waitForTimeout(100);
   const ownership=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('crumb.sandbox.v1'));return {chosen:s.chosen,placed:s.placed};});
   for(const kind of ['wave','dance','zoomies','tidy']){
    assert.ok(await page.evaluate(kind=>{interrupt();return crumbIdle.start(kind);},kind));
    assert.equal(await page.evaluate(()=>phase),'idleAntic');
    const start=await page.evaluate(()=>({x:creature.x,y:creature.y}));
    await page.evaluate(()=>{for(let i=0;i<35;i++)update(.02);draw();});
    if(kind==='zoomies')assert.ok(await page.evaluate(p=>Math.hypot(creature.x-p.x,creature.y-p.y)>50,start),'zoomies move quickly');
    if(viewport.width===1100&&kind==='wave')await page.screenshot({path:path.join(__dirname,'..','..','..','..','outputs','crumb-idle-wave.png')});
    await page.evaluate(()=>{for(let i=0;i<750&&phase==='idleAntic';i++)update(.02);});
    assert.equal(await page.evaluate(()=>phase),'idle','idle behavior finishes');
    assert.ok(await page.evaluate(()=>creature.x>=0&&creature.x<=W&&creature.y>=H*.4&&creature.y<=H*.85),'stays in room');
   }
   assert.ok(await page.evaluate(()=>crumbIdle.start('dance')));
   await page.evaluate(()=>giveWord('cookie'));
   assert.notEqual(await page.evaluate(()=>phase),'idleAntic','offering interrupts antics');
   await page.evaluate(()=>{for(let i=0;i<800;i++)update(.02);interrupt();crumbIdle.start('zoomies');});
   await page.locator('#room').dispatchEvent('pointerdown',{clientX:10,clientY:10,pointerId:1});
   assert.notEqual(await page.evaluate(()=>phase),'idleAntic','pointer input interrupts');
   await page.evaluate(()=>giveWord('sleep'));
   await page.evaluate(()=>{for(let i=0;i<3500;i++)update(.02);});
   assert.equal(await page.evaluate(()=>command),'sleep','sleep is never interrupted by idle scheduler');
   await page.evaluate(()=>giveWord('wake'));
   await page.evaluate(()=>{for(let i=0;i<7000;i++)update(.02);});
   assert.match(await page.locator('#message').innerText(),/wave|amusement|appointment|orderly|teddy|treasure|trophy|kitchen/);
   assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('crumb.sandbox.v1'));return {chosen:s.chosen,placed:s.placed};}),ownership,'no ownership or placement losses');
   await page.locator('#journalToggle').click();
   assert.equal(await page.evaluate(()=>{interrupt();return crumbIdle.start('dance');}),false,'no antics under dialogs');
   assert.deepEqual(errors,[]);
   console.log(`PASS ${viewport.width}x${viewport.height}: all four idle behaviors, room bounds, completion, input interrupts, sleep, scheduler, rewards, dialogs`);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
