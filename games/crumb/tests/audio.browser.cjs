// Run with CRUMB_PLAYWRIGHT pointing to Playwright if it is not installed locally.
const {chromium} = require(process.env.CRUMB_PLAYWRIGHT || 'playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0].slice(1);
  if (!['index.html','words.js','audio.js','bonus.js','village.js','share.js','godmode.js'].includes(name)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html');
  res.end(fs.readFileSync(path.join(root, name)));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless: true, executablePath: process.env.CRUMB_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const viewport of [{width:1280,height:800},{width:390,height:844},{width:820,height:1180}]) {
      const context = await browser.newContext({viewport, hasTouch: viewport.width < 1000});
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      page.on('dialog', d => d.accept());
      await page.addInitScript(() => {
        localStorage.setItem('crumb.language.v1', 'en');
        window.audioProbe = {contexts: [], sources: []};
        const Native = window.AudioContext;
        window.AudioContext = class extends Native {
          constructor(...args) { super(...args); audioProbe.contexts.push(this); }
          createOscillator() { const n = super.createOscillator(); audioProbe.sources.push(n); return n; }
          createBufferSource() { const n = super.createBufferSource(); audioProbe.sources.push(n); return n; }
        };
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.equal(await page.evaluate(() => audioProbe.contexts.length), 0, 'silent startup');
      const gate = page.locator('#crumbLocaleGate'); if (await gate.evaluate(e=>e.open)) await page.getByRole('button',{name:/English/}).click();
      await page.locator('#crumbSound').click();
      await page.waitForFunction(() => audioProbe.contexts[0]?.state === 'running');
      // Exercise actual game updates and each emotion without exposing hidden input words.
      for (const [p,c] of [['personal','love'],['puzzle',null],['fright',null],['personal','fury'],['special','celebrate'],['special','comeback'],['idle',null],['command','sleep']]) {
        await page.evaluate(([p,c]) => { interrupt(); phase=p; command=c; timer=0; update(.02); }, [p,c]);
        await page.waitForTimeout(350);
      }
      await page.evaluate(() => { crumbAudio.event('kick'); crumbAudio.event('reward'); crumbAudio.event('achievement');crumbAudio.event('villageWelcome');crumbAudio.event('villageConcert');crumbAudio.event('villageMunch'); });
      assert.ok(await page.evaluate(() => audioProbe.sources.length > 30));
      await page.locator('#crumbSound').click();
      assert.equal(await page.evaluate(() => localStorage.getItem('crumb.audio.v1')), 'off');
      const count = await page.evaluate(() => audioProbe.sources.length);
      await page.evaluate(() => { crumbAudio.event('reward');crumbAudio.event('villageWelcome');crumbAudio.event('villageConcert');crumbAudio.event('villageMunch'); update(.02); });
      assert.equal(await page.evaluate(() => audioProbe.sources.length), count, 'mute suppresses new sources');
      await page.locator('#crumbSettingsButton').click();
      await page.locator('#crumbSoundSetting').click();
      assert.equal(await page.locator('#crumbSoundSetting').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#crumbSound').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => audioProbe.contexts.length), 1, 'single reusable context');
      await page.evaluate(async () => { await audioProbe.contexts[0].suspend(); });
      await page.locator('#crumbSettingsButton').press('Tab');
      await page.waitForFunction(() => audioProbe.contexts[0].state === 'running');
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {configurable:true,get:()=>true});
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => audioProbe.contexts[0].state === 'suspended');
      await page.evaluate(() => { delete document.hidden; });
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => audioProbe.contexts[0].state === 'running');
      await page.reload();
      assert.equal(await page.locator('#crumbSound').getAttribute('aria-pressed'), 'true', 'saved preference restored');
      // Rewards use a separate save from the nest and journal. Exercise real UI
      // choices and placement, then reload and reopen within the same origin.
      await page.evaluate(() => localStorage.setItem('crumb.sandbox.v1', JSON.stringify({
        words:['cookie','apple','bread','cheese','rice','milk','cake','oatmeal','toast','banana','pear','peach','grape','carrot','honey'],
        chosen:[], placed:[], rewardPicks:[], entries:[]
      })));
      await page.reload();
      await page.locator('#sandboxToggle').click();
      await page.locator('#sandboxItems button').filter({hasText:'Teddy bear'}).click();
      await page.locator('#sandboxConfirmChoice').click();
      await page.locator('#sandboxItems button').filter({hasText:'Dollhouse'}).click();
      await page.locator('#sandboxConfirmChoice').click();
      await page.locator('#sandboxItems button').filter({hasText:'Pocket tent'}).click();
      await page.locator('#sandboxTrophies button').first().click();
      const rewardSave = await page.evaluate(() => JSON.parse(localStorage.getItem('crumb.sandbox.v1')));
      assert.ok(rewardSave.placed.includes('bear') && rewardSave.placed.includes('gift') && rewardSave.placed.includes('mystery-tent'));
      assert.ok(rewardSave.placed.some(id=>id.startsWith('trophy-')));
      await page.reload();
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('crumb.sandbox.v1'))), rewardSave, 'reward save survives reload');
      const reopened = await page.context().newPage();
      await reopened.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.deepEqual(await reopened.evaluate(() => JSON.parse(localStorage.getItem('crumb.sandbox.v1'))), rewardSave, 'reward save survives reopening');
      await reopened.locator('#sandboxToggle').click();
      assert.match(await reopened.locator('#sandboxItems button').filter({hasText:'Teddy bear'}).innerText(), /In use/);
      assert.match(await reopened.locator('#sandboxItems button').filter({hasText:'Dollhouse'}).innerText(), /In use/);
      assert.match(await reopened.locator('#sandboxItems button').filter({hasText:'Pocket tent'}).innerText(), /In use/);
      assert.ok(await reopened.locator('#sandboxTrophies button.active').count() > 0);
      await reopened.close();
      await page.locator('#sandboxToggle').click();
      await page.evaluate(() => {
        document.getElementById('fresh').click();
        giveWord('moss');
        for(let i=0;i<1500;i++)update(.02);
        if(!treasures.some(t=>t.settled))throw Error('Test nest not built');
      });
      await page.locator('#scatter').click();
      const reaction=await page.evaluate(() => {
        const start={x:creature.x,y:creature.y};update(.5);draw();
        return {phase,still:creature.x===start.x&&creature.y===start.y,message:document.getElementById('message').textContent};
      });
      assert.equal(reaction.phase,'nestShock');assert.ok(reaction.still);assert.equal(reaction.message,'Wha Habba??');
      await page.evaluate(() => {for(let i=0;i<2000;i++)update(.02);});
      assert.ok(await page.evaluate(() => treasures.some(t=>t.settled)&&treasures.every(t=>!t.displaced)), 'repairs resume after the arms-up reaction');
      assert.deepEqual(errors, []);
      console.log(`PASS browser ${viewport.width}x${viewport.height}: startup, emotions, effects, mute, settings, context reuse`);
      await context.close();
    }
    // Render the real synthesizer with native OfflineAudioContext to detect silence,
    // non-finite samples, clipping, and identical repeated performances.
    const page = await browser.newPage();
    const source = fs.readFileSync(path.join(root, 'audio.js'), 'utf8');
    const renders = [];
    for (let pass=0; pass<3; pass++) {
      await page.goto('about:blank');
      await page.setContent('<button id="crumbSound"></button><button id="crumbSoundSetting"></button>');
      await page.evaluate(() => {
        window.renderContext = new OfflineAudioContext(1, 48000 * 3, 48000);
        Object.defineProperty(renderContext, 'state', {get:()=> 'running'});
        window.AudioContext = function() { return renderContext; };
        window.phase='personal'; window.command='love'; window.creature={x:0,y:0}; window.timer=0;
        window.target=window.drag=window.carry=null; window.update=()=>{};
      });
      await page.addScriptTag({content:source});
      renders.push(await page.evaluate(async muted => {
        document.getElementById('crumbSound').click(); update(.02); crumbAudio.event('reward');
        if (muted) document.getElementById('crumbSound').click();
        const b = await renderContext.startRendering(), a=b.getChannelData(0);
        let peak=0, energy=0, hash=0;
        for(let i=0;i<a.length;i++){ if(!Number.isFinite(a[i])) throw Error('non-finite output'); peak=Math.max(peak,Math.abs(a[i])); energy+=a[i]*a[i]; hash+=a[i]*(i%997); }
        return {peak,rms:Math.sqrt(energy/a.length),hash};
      }, pass === 2));
    }
    assert.ok(renders.slice(0,2).every(r=>r.peak > .01 && r.peak < .95 && r.rms > .001));
    assert.notEqual(renders[0].hash, renders[1].hash);
    assert.equal(renders[2].peak, 0, 'muting cancels every scheduled sound');
    console.log('PASS native offline render: audible, finite, unclipped, varied', JSON.stringify(renders));
    await page.close();
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode=1; });
