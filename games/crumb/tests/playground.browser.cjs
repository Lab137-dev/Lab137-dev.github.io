const {chromium}=require(process.env.CRUMB_PLAYWRIGHT||'playwright');
const path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.join(__dirname,'..'),out=path.join(root,'..','..','..','outputs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const viewport of [{width:1100,height:850},{width:390,height:844},{width:820,height:1180}]){
const page=await browser.newPage({viewport,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>requestAnimationFrame=()=>{});
await page.goto(pathToFileURL(process.env.CRUMB_GAME_FILE||path.join(root,'index.html')).href);await page.evaluate(()=>{localStorage.clear();localStorage.setItem('crumb.language.v1','en');});await page.reload();
const baseline=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
await page.locator('#word').fill('GODMODE');await page.locator('#word').press('Enter');await page.evaluate(()=>{for(let i=0;i<2000&&crumbGod.stage!=='password';i++)update(.02);draw();});
await page.locator('#word').fill('Flipflopsodapop');await page.locator('#word').press('Enter');await page.evaluate(()=>{for(let i=0;i<2500&&(!crumbGod.enabled||crumbGod.stage!=='none');i++)update(.02);draw();});assert.equal(await page.evaluate(()=>crumbGod.enabled),true);
await page.locator('#crumbPlaygroundGoal').click();assert.equal(await page.locator('#crumbGoalDialog').evaluate(d=>d.open),false,'no blocking modal');
for(const type of ['Tunnel','Ramp','Hoop','Bell'])await page.getByRole('button',{name:'+ '+type,exact:true}).click();
const first=await page.evaluate(()=>({p:crumbBonus.inspect().course[0],w:W,h:H,k:Math.max(.65,Math.min(1,W/850))}));
const bounds=await page.locator('#room').boundingBox(),x=bounds.x+first.p.x*bounds.width,y=bounds.y+(first.p.y-20*first.k/first.h)*bounds.height,dx=viewport.width*.06,dy=30;
if(viewport.width<1000){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:8});await page.mouse.up();}
const moved=await page.evaluate(()=>crumbBonus.inspect().course[0]);assert.ok(moved.x>first.p.x+.03,'drag changes actual toy position');assert.ok(moved.y>first.p.y+.015,'drag changes depth');
await page.getByLabel('Selected toy').selectOption('0');await page.getByRole('button',{name:'Later',exact:true}).click();assert.equal(await page.evaluate(()=>crumbBonus.inspect().course[1].type),'tunnel');await page.getByRole('button',{name:'Earlier',exact:true}).click();
await page.locator('#room').focus();const old=await page.evaluate(()=>crumbBonus.inspect().course[0].x);await page.keyboard.press('ArrowRight');assert.ok(await page.evaluate(x=>crumbBonus.inspect().course[0].x>x,old),'keyboard alternative');
await page.screenshot({path:path.join(out,`crumb-playground-editor-${viewport.width}.png`)});
const panel=await page.locator('#crumbPlaygroundEditor').boundingBox();assert.ok(panel.y+panel.height<bounds.y+first.p.y*bounds.height-20,'editor leaves floor visible');
await page.getByRole('button',{name:'Run course',exact:true}).click();assert.ok(await page.locator('#crumbPlaygroundEditor').isHidden());
await page.evaluate(()=>{window.courseEvents=[];const event=crumbAudio.event;crumbAudio.event=function(k){courseEvents.push(k);return event(k);};});
const samples=await page.evaluate(()=>{const s={tunnel:[],ramp:[],hoop:[],bell:[]};for(let i=0;i<2000&&phase==='bonusCourse';i++){update(.02);const pose=crumbBonus.pose();if(pose){const name=document.getElementById('message').textContent;const type=Object.keys(s).find(t=>name.toLowerCase().includes(t));if(type)s[type].push({x:creature.x,hop:pose.hop||0,squash:pose.squash||1,opacity:pose.opacity??1});}}draw();return s;});
for(const type of Object.keys(samples)){assert.ok(samples[type].length>10,type+' animation executes');const xs=samples[type].map(v=>v.x);assert.ok(Math.max(...xs)-Math.min(...xs)>25,type+' traverses obstacle');}
assert.ok(samples.tunnel.some(p=>p.squash<.6&&p.opacity<.2),'tunnel crawl disappears inside');assert.ok(samples.ramp.some(p=>p.hop<-30),'ramp climb and launch');assert.ok(samples.hoop.some(p=>p.hop<-25),'hoop leap');assert.ok((await page.evaluate(()=>courseEvents)).includes('courseBell'),'bell rings on contact');assert.equal(await page.evaluate(()=>phase),'idle');assert.match(await page.locator('#message').innerText(),/tiny champion/);
await page.locator('#crumbPlaygroundGoal').click();await page.getByRole('button',{name:'Run course',exact:true}).click();await page.evaluate(()=>{for(let i=0;i<2000;i++){update(.02);const p=crumbBonus.pose();if(p?.opacity<.2){draw();break;}}});await page.screenshot({path:path.join(out,`crumb-playground-tunnel-${viewport.width}.png`)});
for(const type of ['ramp','hoop','bell']){
 await page.evaluate(type=>{for(let i=0;i<2000&&phase==='bonusCourse';i++){update(.02);const p=crumbBonus.pose(),name=document.getElementById('message').textContent.toLowerCase();if(name.includes(type)&&p?.hop<(type==='bell'?-6:type==='hoop'?-25:-35)){draw();return;}}throw Error('Animation frame missing: '+type);},type);
 if(viewport.width===1100)await page.screenshot({path:path.join(out,`crumb-playground-${type}.png`)});
}
await page.evaluate(()=>giveWord('sleep'));assert.equal(await page.evaluate(()=>command),'sleep','course interrupts cleanly');
await page.locator('#crumbPlaygroundGoal').click();await page.getByRole('button',{name:'Done',exact:true}).click();await page.locator('#godmodeEnd').click();assert.equal(await page.evaluate(()=>crumbBonus.inspect().course.length),0,'temporary course restored');assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))),baseline,'Godmode leaves stored progress untouched');
assert.deepEqual(errors,[]);console.log('PASS '+viewport.width+': Godmode, visible room editing, '+(viewport.width<1000?'native touch':'mouse')+' drag, reorder, keyboard, four traversal animations, bell cue, interruption, original saves');await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
