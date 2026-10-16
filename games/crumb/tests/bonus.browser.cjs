const {chromium}=require(process.env.CRUMB_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const root=path.join(__dirname,'..'),dictionary=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'words.js'),'utf8').replace('root.CrumbWords={','root.testGroups=groups;root.testPersonal=personal;root.testTantrum=tantrum;root.CrumbWords={'),dictionary);
const all=[...new Set([...Object.values(dictionary.testGroups).flat(),...Object.keys(dictionary.testPersonal),...dictionary.testTantrum].map(w=>dictionary.CrumbWords.discoveryKey(w)))].filter(w=>dictionary.CrumbWords.classify(w).kind!=='unknown');
const words=['moss',...all.filter(w=>w!=='moss')];assert.ok(words.length>=400);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CRUMB_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const viewport of [{width:1100,height:850},{width:390,height:844},{width:820,height:1180}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{requestAnimationFrame=()=>{};});
  await page.goto(pathToFileURL(process.env.CRUMB_GAME_FILE||path.join(root,'index.html')).href);
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('crumb.language.v1','en');localStorage.setItem('crumb.discoveries.v1',JSON.stringify({moss:'nesting'}));});
  async function progress(n){await page.evaluate(({n,words})=>localStorage.setItem('crumb.sandbox.v1',JSON.stringify({words:words.slice(0,n),chosen:['hat'],placed:[],rewardPicks:['hat'],entries:[]})),{n,words});await page.reload();await page.waitForTimeout(100);}
  await progress(99);await page.locator('#crumbWorkshopGoal').click();assert.equal(await page.getByRole('button',{name:'Add one piece',exact:true}).count(),0);assert.equal(await page.evaluate(()=>nestCapacity()),12);
  await progress(100);assert.equal(await page.evaluate(()=>nestCapacity()),48);await page.locator('#crumbWorkshopGoal').click();
  for(let i=0;i<16;i++)await page.getByRole('button',{name:'Add one piece',exact:true}).click();
  assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),16,'expanded nest');
  const beforeShape=await page.evaluate(()=>treasures.filter(t=>t.settled).map(t=>[t.x,t.y]));
  const previewBefore=await page.locator('#bonusNestPreview').evaluate(c=>c.toDataURL());
  await page.getByLabel('Nest shape').selectOption('rows');
  assert.notDeepEqual(await page.evaluate(()=>treasures.filter(t=>t.settled).map(t=>[t.x,t.y])),beforeShape,'shape applies without an extra button');
  assert.notEqual(await page.locator('#bonusNestPreview').evaluate(c=>c.toDataURL()),previewBefore,'actual nest preview updates');
  await page.getByLabel('Around the nest').selectOption('flowers');
  assert.equal(await page.evaluate(()=>crumbBonus.inspect().decoration),'flowers','decorations apply immediately');
  const looks=[];
  for(const decor of ['flowers','stones','bunting']){
    await page.getByLabel('Around the nest').selectOption(decor);
    looks.push(await page.locator('#bonusNestPreview').evaluate(c=>c.toDataURL()));
    await page.locator('#bonusNestPreview').screenshot({path:path.join(root,'..','..','..','outputs',`crumb-nest-${decor}-${viewport.width}.png`)});
  }
  assert.equal(new Set(looks).size,3,'each decoration has a distinct rendered scene');
  await page.getByLabel('Around the nest').selectOption('flowers');

  assert.match(await page.locator('#bonusNestFeedback').innerText(),/changes are saved/);
  await page.getByRole('button',{name:'Show my nest',exact:true}).click();assert.equal(await page.locator('#crumbGoalDialog').evaluate(d=>d.open),false);
  await page.locator('#crumbWorkshopGoal').click();await page.getByRole('button',{name:'Arrange nest',exact:true}).click();
  await page.getByLabel('Layout 1 name').fill('Jen’s pile');await page.getByRole('button',{name:'Save 1',exact:true}).click();
  assert.equal(await page.evaluate(()=>crumbBonus.inspect().layouts[0].items.length),16);
  for(let i=0;i<32;i++)await page.getByRole('button',{name:'Add one piece',exact:true}).click();
  await page.getByRole('button',{name:'Add one piece',exact:true}).click();
  assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),48,'capacity is enforced');
  assert.match(await page.locator('#bonusSaveStatus').innerText(),/48 pieces/);
  await page.reload();assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),48,'all 48 pieces survive reopening');await page.locator('#crumbWorkshopGoal').click();
  await page.locator('#crumbGoalClose').click();await page.locator('#fresh').click();assert.equal(await page.evaluate(()=>treasures.length),0);
  await page.reload();await page.locator('#crumbWorkshopGoal').click();await page.getByRole('button',{name:'Load 1',exact:true}).click();
  assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),16,'saved layout restores pile');
  await page.reload();assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),16,'expanded pile persists');
  await progress(349);assert.equal(await page.evaluate(()=>crumbBonus.startCourse()),false);await page.locator('#crumbPlaygroundGoal').click();assert.equal(await page.getByRole('button',{name:'Add piece',exact:true}).count(),0);
  await progress(350);await page.locator('#crumbPlaygroundGoal').click();
  for(const type of ['tunnel','ramp','hoop','bell']){await page.getByRole('button',{name:'+ '+type[0].toUpperCase()+type.slice(1),exact:true}).click();}
  await page.getByLabel('Selected toy').selectOption('0');const firstX=await page.evaluate(()=>crumbBonus.inspect().course[0].x);await page.locator('#room').focus();await page.keyboard.press('ArrowRight');assert.ok(await page.evaluate(x=>crumbBonus.inspect().course[0].x>x,firstX));
  await page.getByRole('button',{name:'Put course away',exact:true}).click();assert.equal(await page.evaluate(()=>crumbBonus.inspect().courseVisible),false);await page.getByRole('button',{name:'Show course',exact:true}).click();
  await page.getByRole('button',{name:'Run course',exact:true}).click();assert.equal(await page.evaluate(()=>phase),'bonusCourse');
  await page.evaluate(()=>{for(let i=0;i<2000&&phase==='bonusCourse';i++)update(.02);draw();});assert.equal(await page.evaluate(()=>phase),'idle');assert.match(await page.locator('#message').innerText(),/Course complete/);
  assert.equal(await page.evaluate(()=>crumbBonus.startCourse()),true);await page.evaluate(()=>giveWord('sleep'));assert.equal(await page.evaluate(()=>command),'sleep','offerings interrupt course');
  await page.reload();assert.equal(await page.evaluate(()=>crumbBonus.inspect().course.length),4,'course persists');
  await progress(399);await page.locator('#crumbVillageGoal').click();assert.equal(await page.getByRole('button',{name:'Welcome a friend',exact:true}).count(),0);
  await progress(400);await page.locator('#crumbVillageGoal').click();
  assert.equal(await page.evaluate(()=>crumbBonus.villageData().length),3);await page.getByRole('button',{name:'Make it yours',exact:true}).click();
  const resident=page.locator('.vFriend').first();await resident.getByLabel('Friend 1 name').fill('Junebug');await resident.getByLabel('Coat color').selectOption('lavender');await resident.getByLabel('Outfit').selectOption('hat');await resident.getByRole('button',{name:'Save friend',exact:true}).click();
  await page.reload();assert.deepEqual(await page.evaluate(()=>{const r=crumbBonus.inspect().residents[0];return [r.name,r.color,r.wear];}),['Junebug','lavender','hat']);
  await page.evaluate(()=>draw());if(viewport.width===1100)await page.screenshot({path:path.join(root,'..','..','..','outputs','crumb-village-live.png')});
  await page.locator('#crumbVillageGoal').click();await page.getByRole('button',{name:'Picnic',exact:true}).click();assert.equal(await page.evaluate(()=>crumbVillage.inspect().event),'picnic');
  await page.evaluate(()=>{for(let i=0;i<1000;i++)update(.02);});assert.equal(await page.evaluate(()=>crumbVillage.inspect().event),null);await page.getByRole('button',{name:'Back to room',exact:true}).click();assert.equal(await page.evaluate(()=>crumbBonus.inspect().residents.length),3);
  assert.equal(await page.evaluate(()=>treasures.filter(t=>t.settled).length),16,'tools preserve nest');
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('crumb.sandbox.v1')).chosen.includes('hat')),'tools preserve rewards');
  const toolsBefore=await page.evaluate(()=>crumbBonus.inspect());
  await page.evaluate(()=>localStorage.setItem('crumb.bonus.v1','{damaged'));
  await page.reload();assert.deepEqual(await page.evaluate(()=>crumbBonus.inspect()),toolsBefore,'tool backup recovers damaged primary');
  await page.locator('#crumbWorkshopGoal').click();await page.getByRole('button',{name:'Arrange nest',exact:true}).click();
  await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('crumb.bonus.v1'))throw Error('Storage unavailable');return set.call(this,k,v);};});
  await page.getByLabel('Around the nest').selectOption('stones');await page.getByRole('button',{name:'Arrange nest',exact:true}).click();
  assert.match(await page.locator('#bonusSaveStatus').innerText(),/could not be saved/);
  assert.deepEqual(errors,[]);console.log(`PASS ${viewport.width}: 99/100, 349/350, 399/400 gates; 48-piece capacity; saved layout and restart; editable/runnable course; persistent named/dressed residents; group game; nest/reward preservation`);
  await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
