/* Crumb's small, woolly voice. No downloads, perpetual oscillators, or timers. */
(() => {
  'use strict';
  const button = document.getElementById('crumbSound'), key = 'crumb.audio.v1';
  let enabled = false, ac, master, buses, noise, wave, lastVoice = -Infinity, voiceUntil = 0, lastKind = '';
  let lastState = '', distance = 0, foot = 0, idleTime = 0, repeatTime = 0;
  const active = new Set();
  const random = (a, b) => a + Math.random() * (b - a);
  try { enabled = localStorage.getItem(key) === 'on'; } catch {}
  function label() {
    const text = enabled ? '🔊 Sound on' : '🔇 Sound off';
    for (const el of [button, document.getElementById('crumbSoundSetting')]) if (el) {
      el.textContent = window.crumbTranslate ? window.crumbTranslate(text) : text;
      el.setAttribute('aria-pressed', String(enabled));
    }
  }
  function context() {
    if (!enabled || document.hidden) return null;
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        master = ac.createGain(); master.gain.value = .68;
        const limiter = ac.createDynamicsCompressor();
        limiter.threshold.value = -18; limiter.knee.value = 12;
        limiter.ratio.value = 5; limiter.attack.value = .004; limiter.release.value = .18;
        master.connect(limiter); limiter.connect(ac.destination);
        buses = {};
        for (const [name, level] of [['voice', .8], ['action', .38], ['reward', .5]]) {
          buses[name] = ac.createGain(); buses[name].gain.value = level; buses[name].connect(master);
        }
        const real = new Float32Array(9), imag = new Float32Array([0, 1, .38, .2, .09, .045, .02, .01, .005]);
        wave = ac.createPeriodicWave(real, imag);
        noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noise.getChannelData(0); let brown = 0;
        for (let i = 0; i < data.length; i++) { brown = (brown + random(-.035, .035)) / 1.025; data[i] = brown * 3; }
      }
      // Resume is requested only from a user gesture, never from the animation loop.
      return ac.state === 'running' ? ac : null;
    } catch { return null; }
  }
  function unlock() {
    context();
    if (enabled && ac && (ac.state === 'suspended' || ac.state === 'interrupted')) return ac.resume().catch(() => {});
    return Promise.resolve();
  }
  function stop() {
    if (!ac) return;
    master.gain.cancelScheduledValues(ac.currentTime); master.gain.value = 0;
    for (const source of active) { try { source.stop(); } catch {} }
    active.clear();
    voiceUntil = 0; lastVoice = -Infinity;
  }
  function source(node, nodes, start, end) {
    active.add(node);
    node.onended = () => { active.delete(node); for (const n of [node, ...nodes]) n.disconnect(); };
    node.start(start); node.stop(end);
  }
  function tone(pitch, endPitch, duration, delay = 0, level = .13, rough = 0, bus = 'voice', mouth = false) {
    const c = context(); if (!c || active.size >= 36) return;
    const t = c.currentTime + .008 + delay, osc = c.createOscillator(), filter = c.createBiquadFilter(), amp = c.createGain();
    if (bus === 'voice') osc.setPeriodicWave(wave); else osc.type = 'sine';
    const drift = random(.96, 1.04);
    osc.frequency.setValueAtTime(pitch * drift, t);
    if (bus === 'voice') {
      // A held vowel bends and quivers rather than sliding like a notification tone.
      const wobble = random(0, Math.PI * 2);
      for (let i = 1; i <= 18; i++) {
        const u = i / 18, base = pitch * Math.pow(endPitch / pitch, u);
        const bend = 1 + Math.sin(u * Math.PI) * .07 + Math.sin(u * duration * (rough ? 70 : 32) + wobble) * (rough ? .045 : .018);
        osc.frequency.exponentialRampToValueAtTime(Math.max(45, base * drift * bend), t + duration * u);
      }
    } else osc.frequency.exponentialRampToValueAtTime(Math.max(45, endPitch * drift), t + duration);
    filter.type = 'lowpass'; filter.Q.value = .65;
    filter.frequency.setValueAtTime(rough ? 750 : 1550, t);
    if (bus === 'voice') filter.frequency.exponentialRampToValueAtTime(rough ? 1050 : 1900, t + duration * .4);
    filter.frequency.exponentialRampToValueAtTime(rough ? 430 : 950, t + duration);
    if (mouth) {
      // Open from a rounded "wuh" into an "ah" vowel, still in Crumb's timbre.
      filter.frequency.cancelScheduledValues(t);
      filter.Q.value = mouth === 'num' ? 1.4 : 2.2;
      filter.frequency.setValueAtTime(mouth === 'num' ? 650 : 450, t);
      filter.frequency.exponentialRampToValueAtTime(mouth === 'num' ? 1150 : 1500, t + duration * .32);
      filter.frequency.exponentialRampToValueAtTime(mouth === 'num' ? 430 : 1100, t + duration);
    }
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(level, t + Math.min(bus === 'voice' ? .07 : .025, duration / 4));
    // Maintain breath through the vowel, with a gentle chest pulse and soft tail.
    for (let i = 1; i <= 8; i++) amp.gain.linearRampToValueAtTime(level * (rough ? random(.45, .85) : random(.73, .95)), t + duration * (.1 + i * .085));
    amp.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(filter); filter.connect(amp); amp.connect(buses[bus]);
    source(osc, [filter, amp], t, t + duration + .01);
    if (bus === 'voice') texture(duration, delay, level * .14, 1300, 'voice');
  }
  function texture(duration, delay = 0, level = .04, frequency = 750, bus = 'action') {
    const c = context(); if (!c || active.size >= 36) return;
    const t = c.currentTime + .008 + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; s.playbackRate.value = random(.85, 1.15);
    s.loop = true; // Sustained breaths may outlast the one-second reusable buffer.
    f.type = 'bandpass'; f.frequency.value = frequency; f.Q.value = .7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .009); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    s.connect(f); f.connect(g); g.connect(buses[bus]); source(s, [f, g], t, t + duration);
  }
  function footstep(speed) {
    // Tiny alternating nail taps: a short contact and a faint inharmonic ring.
    const pitch = [1420, 1590, 1370, 1510][foot++ % 4] * random(.96, 1.04);
    const level = .045 + Math.min(1, speed / 235) * .025;
    tone(pitch, pitch * .97, .055, 0, level, 0, 'action');
    tone(pitch * 2.71, pitch * 2.68, .038, .003, level * .24, 0, 'action');
    texture(.035, 0, .025, 1100);
  }
  const phrases = {
    eat: Array.from({length:6}, (_,i) => [260 + (i % 2) * 28, 230 + (i === 5 ? 70 : 0), .23, i * .29, .115]),
    baffled: [[275, 355, .36, 0, .14], [320, 305, .23, .46, .12], [315, 510, .65, .78, .14]],
    happy: [[350, 460, .44], [440, 370, .65, .49]],
    celebrate: [[350, 460, .4], [440, 540, .46, .46], [510, 650, .72, .99]],
    love: [[285, 350, .72, 0, .11], [345, 290, .95, .77, .1]],
    curious: [[290, 310, .42], [325, 460, .72, .5]],
    scared: [[470, 650, .22], [560, 340, .75, .27]],
    angry: [[205, 145, .62, 0, .13, 1], [170, 120, .83, .69, .11, 1]],
    sad: [[325, 225, .78, 0, .11], [270, 180, .98, .86, .095]],
    idle: [[245, 280, .7, 0, .055]],
    sleep: [[155, 125, 1.15, 0, .045]],
    dance: [[350, 440, .32], [440, 390, .38, .39], [350, 470, .52, .84]],
    offended: [[420, 270, .35], [230, 170, .73, .43, .09, .7]]
  };
  function voice(kind, force = false) {
    const c = context(); if (!c || (!force && c.currentTime - lastVoice < .32) || (kind === lastKind && c.currentTime < voiceUntil)) return;
    lastVoice = c.currentTime; lastKind = kind;
    const speed = random(.94, 1.07), pitch = random(.96, 1.04);
    const phrase = phrases[kind] || phrases.curious;
    voiceUntil = c.currentTime + Math.max(...phrase.map(([a,b,d,delay=0]) => (d + delay) * speed)) + .12;
    for (const [a, b, d, delay = 0, level = .13, rough = 0] of phrase)
      tone(a * pitch, b * pitch, d * speed, delay * speed, level, rough, 'voice', kind === 'eat' ? 'num' : kind === 'baffled');
  }
  function event(kind) {
    if (!context()) return;
    if (kind === 'kick') { tone(145, 60, .12, 0, .2, 0, 'action'); texture(.09, 0, .16, 1700); }
    else if (kind === 'villageWelcome') { [261.63,329.63,392,523.25,659.25].forEach((p,i)=>{tone(p,p,.65,i*.22,.07,0,'reward');tone(p/2,p/2,.8,i*.22,.025,0,'reward');});voice('happy'); }
    else if (kind === 'villageConcert') { [392,493.88,587.33,493.88].forEach((p,i)=>tone(p,p,.24,i*.24,.055,0,'reward'));texture(.08,.05,.035,650);texture(.08,.53,.035,650); }
    else if (kind === 'villageMunch') voice('eat');
    else if (kind === 'courseBell') { tone(880, 880, .3, 0, .14, 0, 'action'); tone(1760, 1760, .18, .01, .035, 0, 'action'); }
    else if (kind === 'godDoor') { tone(75, 42, .45, 0, .13, 0, 'action'); texture(.35, 0, .09, 900); }
    else if (kind === 'godCharge') { tone(85, 310, 2.8, 0, .075, 0, 'action'); tone(170, 620, 2.8, 0, .025, 0, 'action'); texture(3.1, 0, .1, 2200); }
    else if (kind === 'reward' || kind === 'achievement') {
      const t = ac.currentTime;
      buses.action.gain.cancelScheduledValues(t); buses.action.gain.setValueAtTime(.13, t); buses.action.gain.linearRampToValueAtTime(.38, t + 1.1);
      (kind === 'achievement' ? [392, 523.25, 659.25, 1046.5] : [392, 523.25, 587.33, 783.99]).forEach((p, i) => {
        tone(p, p, i === 3 ? .5 : .23, i * .16, .12, 0, 'reward');
        tone(p * 2, p * 2, .18, i * .16, .025, 0, 'reward');
      });
    } else if (kind === 'mess') { voice('baffled', true); texture(.12, .42, .06, 1600, 'voice'); }
    else if (kind === 'scatter') voice('angry');
    else if (kind === 'cuddle') { voice('love'); texture(.3, 0, .06, 600); }
    else if (kind === 'social') voice('dance');
    else if (kind === 'idleDance') voice('dance');
    else if (kind === 'idleWave') voice('happy');
    else if (kind === 'zoomies') voice('happy');
    else if (kind === 'curious') voice('curious');
    else if (kind === 'offended') voice('offended');
    else texture(.16, 0, .07, 900);
  }
  window.crumbAudio = { event, cancel: stop };
  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch {}
    if (!enabled) stop();
    else {
      unlock().then(() => {
        if (!enabled || document.hidden || !ac || ac.state !== 'running') return;
        master.gain.setTargetAtTime(.68, ac.currentTime, .015);
        voice('curious', true);
      });
    }
    label();
  });
  for (const name of ['pointerdown', 'keydown']) document.addEventListener(name, unlock, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); if (ac) ac.suspend().catch(() => {}); } });
  // On return, require a fresh gesture; never replay reactions missed in the background.
  const oldUpdate = update;
  update = function(dt) {
    const x = creature.x, y = creature.y;
    oldUpdate(dt);
    const state = phase + ':' + (command || '');
    const changed = state !== lastState; lastState = state;
    if (!context()) { distance = idleTime = repeatTime = 0; return; }
    if (master.gain.value === 0) master.gain.setTargetAtTime(.68, ac.currentTime, .015);
    if (changed) {
      repeatTime = 0;
      if (phase === 'special') voice(({comeback:'sad',fury:'angry',nervous:'scared',disco:'dance',celebrate:'celebrate',rain:'offended'})[command] || 'curious');
      else if (phase === 'personal') voice(command === 'fury' ? 'angry' : command === 'roll' ? 'happy' : 'love');
      else if (phase === 'fright') { voice('scared'); texture(.35, .18, .08, 1100); }
      else if (phase === 'sneeze') { voice('offended'); texture(.12, .08, .12, 2300); }
      else if (phase === 'puzzle' || phase === 'sniff') voice('curious');
      else if (phase === 'eat') voice('eat');
      else if (['play', 'proud', 'toyPlay'].includes(phase)) voice('happy');
      else if (phase === 'haul' || phase === 'fetchCarry') event('rustle');
      else if (phase === 'command') voice(command === 'sleep' ? 'sleep' : ['dance','spin'].includes(command) ? 'dance' : 'idle');
    }
    repeatTime += dt;
    if (repeatTime > 1.3 && phase === 'personal' && command === 'fury') { repeatTime = 0; voice('angry'); }
    if (repeatTime > 1 && phase === 'special' && command === 'comeback' && timer < 1.8) { repeatTime = 0; voice('sad'); }
    const traveled = Math.hypot(creature.x - x, creature.y - y);
    // Ignore relocations; cadence follows actual walking rather than frame rate.
    if (traveled > 24) distance = 0;
    else if (traveled > .1 && dt > 0) {
      distance += traveled;
      if (distance >= 18) { distance %= 18; footstep(traveled / dt); }
    } else distance = 0;
    if (phase === 'idle' && !target && !drag && !carry) { idleTime += dt; if (idleTime > 18) { idleTime = random(-12, 0); voice('idle'); } } else idleTime = 0;
  };
  label();
})();
