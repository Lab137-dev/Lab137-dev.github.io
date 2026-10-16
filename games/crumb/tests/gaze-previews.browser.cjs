const {chromium}=require(process.env.CRUMB_PLAYWRIGHT||'playwright');
const path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.join(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CRUMB_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const viewport of [{width:1100,height:850},{width:390,height:844},{width:820,height:1180}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.width<1000}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>{};window.trailProbe={blur:0,text:[]};const fill=CanvasRenderingContext2D.prototype.fillText,ellipse=CanvasRenderingContext2D.prototype.ellipse;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.id==='room')trailProbe.text.push(text);return fill.call(this,text,...args);};CanvasRenderingContext2D.prototype.ellipse=function(...args){if(this.canvas.id==='room'&&this.filter.includes('blur'))trailProbe.blur++;return ellipse.apply(this,args);};});
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.evaluate(()=>{localStorage.clear();localStorage.setItem('crumb.language.v1','en');});await page.reload();await page.waitForTimeout(100);
  const gaze=await page.evaluate(()=>{interrupt();idleWalking=false;target=null;pointer={x:W,y:creature.y};clock=20;pointerSeen=20;const tracking=gazeFor(creature).x;clock=24;const expired=gazeFor(creature).x;pointerSeen=-Infinity;const values=[0,3,6,9].map(t=>{clock=t;return gazeFor(creature).x;});return {tracking,expired,values};});
  assert.ok(gaze.tracking>0);assert.notEqual(gaze.expired,gaze.tracking,'stale cursor no longer fixes gaze');assert.ok(Math.min(...gaze.values)<0&&Math.max(...gaze.values)>0,'idle gaze looks both ways');
  for(const [id,phrase] of [['Workshop','48 pieces'],['Playground','eight tunnels'],['Village','lantern-lit neighborhood']]){
   await page.locator('#crumb'+id+'Goal').click();assert.ok(await page.locator('.bonusPreview canvas').isVisible());assert.match(await page.locator('#crumbBonusContent').innerText(),new RegExp(phrase));
   const image=await page.locator('.bonusPreview canvas').evaluate(c=>({label:c.getAttribute('aria-label'),pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(x=>x>0)}));assert.ok(image.label&&image.pixels);
   if(viewport.width===390)await page.screenshot({path:path.join(root,'..','..','..','outputs','crumb-preview-'+id.toLowerCase()+'.png')});await page.locator('#crumbGoalClose').click();
  }
  await page.locator('#crumbColorToggle').click();assert.ok(await page.locator('#crumbColorReward .bonusPreview canvas').isVisible());await page.locator('#crumbColorClose').click();
  await page.evaluate(()=>{interrupt();crumbIdle.start('zoomies');for(let i=0;i<12;i++)update(.02);trailProbe.blur=0;trailProbe.text=[];draw();});
  assert.ok(await page.evaluate(()=>trailProbe.blur>0),'blurred afterimages drawn');assert.ok(await page.evaluate(()=>trailProbe.text.includes('ZOOMIES!')));
  if(viewport.width===1100)await page.screenshot({path:path.join(root,'..','..','..','outputs','crumb-zoomies-trail.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{trailProbe.blur=0;draw();});assert.equal(await page.evaluate(()=>trailProbe.blur),0,'reduced motion omits trails');
  await page.evaluate(()=>{interrupt();for(let i=0;i<25;i++)update(.02);trailProbe.text=[];draw();});assert.ok(await page.evaluate(()=>!trailProbe.text.includes('ZOOMIES!')),'zoomies label clears');
  assert.deepEqual(errors,[]);console.log(`PASS ${viewport.width}: pointer gaze expiry, idle eye motion, four illustrated previews, detailed descriptions, zoomies blur/label, reduced motion, cleanup`);await page.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
