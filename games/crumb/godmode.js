/* A theatrical, session-only testing entrance. Nothing here grants real progress. */
(() => {
  'use strict';
  let stage='none',enabled=false,elapsed=0,pulse=0,snapshot=null,denied=0,controls=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const door=new Image();let doorLoaded=false;
  door.onload=()=>{doorLoaded=true;};door.onerror=()=>say('The Lab-137 door image could not load. Keep the assets folder beside index.html.');
  const main=document.querySelector('main'),end=document.createElement('button');
  end.id='godmodeEnd';end.type='button';end.hidden=true;end.textContent='End Godmode';main.appendChild(end);
  const style=document.createElement('style');style.textContent=`
    #godmodeEnd{position:absolute;left:5%;top:165px;z-index:8;background:#153b56;color:#dff7ff;border:1px solid #54c9ff;box-shadow:0 0 10px #31baff77;padding:10px 13px}
    #godmodeEnd[hidden]{display:none}
    body.godChamber header,body.godChamber #lab137Brand,body.godChamber #vitals,body.godChamber #journalToggle,body.godChamber #sandboxToggle,body.godChamber #crumbGoalDock,body.godChamber footer,body.godChamber #nestUndo,body.godChamber #crumbSettingsButton,body.godChamber #feed,body.godChamber #message{visibility:hidden}
    @media(max-width:600px){#godmodeEnd{top:146px;font-size:11px;padding:8px}}
  `;document.head.appendChild(style);
  const clone=x=>JSON.parse(JSON.stringify(x));
  function geometry(){const h=Math.min(420,H*.49,W*1.35),w=h*2/3;const floor=Math.min(H*.70,H-(W<=600?274:235));return {x:Math.min(W-w,W*.68-w/2),y:Math.max(35,floor-h),w,h:Math.min(h,floor-35)};}
  function freezeControls(on){
    if(on){controls=[...document.querySelectorAll('#journalToggle,#sandboxToggle,#fresh,#scatter,#crumbGoalDock button,#nestUndo,#crumbSettingsButton')].map(b=>({b,disabled:b.disabled}));for(const {b} of controls)b.disabled=true;canvas.inert=true;}
    else{for(const {b,disabled} of controls)b.disabled=disabled;controls=[];canvas.inert=false;}
  }
  function restoreInput(){if(!snapshot)return;input.disabled=false;if(snapshot.inputType===null)input.removeAttribute('type');else input.type=snapshot.inputType;input.placeholder=window.crumbTranslate(snapshot.placeholder);}
  function restoreRoom(){
    if(!snapshot)return;
    treasures=clone(snapshot.treasures).map(t=>({...t,x:t.x*W/snapshot.W,y:t.y*H/snapshot.H,origin:t.origin?{x:t.origin.x*W/snapshot.W,y:t.origin.y*H/snapshot.H}:undefined}));
    discoveries=clone(snapshot.discoveries);nextId=snapshot.nextId;hunger=snapshot.hunger;joy=snapshot.joy;
    Object.assign(creature,snapshot.creature,{x:snapshot.creature.x*W/snapshot.W,y:snapshot.creature.y*H/snapshot.H});
    twin=snapshot.twin?clone(snapshot.twin):null;if(twin){twin.x*=W/snapshot.W;twin.y*=H/snapshot.H;twin.goal=null;}
    splitProgress=snapshot.splitProgress;visitors=[];effects=[];drag=carry=target=null;phase='idle';command=null;timer=0;wander=null;wanderPause=2;idleWalking=false;
    nestUndoSnapshot=snapshot.undo?clone(snapshot.undo):null;nestUndoButton.hidden=!nestUndoSnapshot;
    window.crumbIdle?.cancel();refreshJournal();
  }
  function begin(){
    if(enabled){say('Godmode is already enabled.');return true;}if(stage!=='none')return true;
    window.crumbVillage?.close();window.crumbBonus?.closeEditor();
    for(const d of document.querySelectorAll('dialog[open]'))d.close();
    snapshot={W,H,treasures:clone(treasures),discoveries:clone(discoveries),nextId,hunger,joy,creature:clone(creature),twin:twin?clone(twin):null,splitProgress,undo:nestUndoSnapshot?clone(nestUndoSnapshot):null,placeholder:input.placeholder,inputType:input.getAttribute('type')};
    interrupt();drag=null;visitors=[];document.getElementById('sandboxPanel').hidden=true;
    stage='approach';elapsed=0;phase='godDoor';command=null;timer=0;denied=0;
    door.src='assets/godmode-door.png';freezeControls(true);input.disabled=true;end.hidden=false;end.textContent='Cancel entrance';
    say('A secure entrance. Crumb appears to know the procedure.');window.crumbAudio?.event('godDoor');return true;
  }
  function activate(){enabled=true;window.crumbBonus?.beginTesting();window.crumbTesting.enable();end.textContent='End Godmode';window.crumbAudio?.event('reward');}
  function endMode(){
    if(stage==='none'&&!enabled)return;
    stage='none';enabled=false;elapsed=0;document.body.classList.remove('godChamber');
    for(const d of document.querySelectorAll('dialog[open]'))d.close();
    document.getElementById('sandboxPanel').hidden=true;window.crumbTesting.disable();window.crumbBonus?.endTesting();restoreRoom();restoreInput();freezeControls(false);
    end.hidden=true;window.crumbAudio?.cancel();snapshot=null;say('Godmode ended. Crumb’s earned progress is back.');
  }
  function accept(text){
    if(text==='GODMODE')return begin();
    if(stage==='password'){
      if(text==='Flipflopsodapop'){stage='opening';elapsed=0;input.disabled=true;input.value='';say('Access granted.');window.crumbAudio?.event('godDoor');}
      else{denied=1.4;say('Access denied. Try again, or cancel the entrance.');window.crumbAudio?.event('offended');}
      return true;
    }
    if(stage!=='none'){say('One moment. Crumb is being dramatic.');return true;}
    return null;
  }
  function change(next){stage=next;elapsed=0;}
  function step(dt){
    if(document.hidden)return;
    elapsed+=dt;pulse+=dt;clock+=dt;if(denied>0)denied=Math.max(0,denied-dt);
    const d=geometry();
    if(stage==='approach'){
      if(moveTo(d.x+d.w*.21,d.y+d.h+6,150,dt)){change('password');phase='idle';input.disabled=false;input.type='password';input.placeholder='Enter the password…';input.focus();say('Crumb asks: Password?');window.crumbAudio?.event('curious');}
    }else if(stage==='opening'&&elapsed>1.1){change('walkIn');phase='godDoor';}
    else if(stage==='walkIn'){
      moveTo(d.x+d.w*.5,d.y+d.h-22,80,dt);
      if(elapsed>1.3){change('chamber');phase='idle';document.body.classList.add('godChamber');creature.x=W*.5;creature.y=H*.70;}
    }else if(stage==='chamber'&&elapsed>1.2){change('beam');window.crumbAudio?.event('godCharge');}
    else if(stage==='beam'&&elapsed>3.2){change('flex');activate();}
    else if(stage==='flex'&&elapsed>2.5)change('return');
    else if(stage==='return'&&elapsed>.8){change('none');document.body.classList.remove('godChamber');restoreRoom();restoreInput();freezeControls(false);window.crumbBonus.refresh();say('Lab-137 authorization complete. Everything is unlocked for this session.');}
  }
  function drawDoor(){
    if(!['approach','password','opening','walkIn'].includes(stage))return;
    const d=geometry(),open=stage==='walkIn'?1:stage==='opening'?Math.min(1,elapsed/1.1):0;
    ctx.save();ctx.fillStyle='#251f1933';ctx.beginPath();ctx.ellipse(d.x+d.w*.5,d.y+d.h+6,d.w*.5,13,0,0,7);ctx.fill();
    if(doorLoaded){
      ctx.drawImage(door,d.x,d.y,d.w,d.h);
      if(open>0){const x=d.x+d.w*.20,y=d.y+d.h*.05,w=d.w*.61,h=d.h*.90;ctx.fillStyle='#060d13';ctx.fillRect(x,y,w,h);ctx.save();ctx.translate(x,y);ctx.transform(Math.max(.12,1-open*.88),open*.035,0,1,0,0);ctx.drawImage(door,door.width*.20,door.height*.05,door.width*.61,door.height*.90,0,0,w,h);ctx.restore();}
    }else{
      const steel=ctx.createLinearGradient(d.x,0,d.x+d.w,0);steel.addColorStop(0,'#59616b');steel.addColorStop(.5,'#a0a7ae');steel.addColorStop(1,'#424a54');ctx.fillStyle=steel;ctx.fillRect(d.x+d.w*.15,d.y,d.w*.72,d.h);ctx.strokeStyle='#202936';ctx.lineWidth=7;ctx.strokeRect(d.x+d.w*.15,d.y,d.w*.72,d.h);ctx.fillStyle='#86a8b7';ctx.fillRect(d.x+d.w*.26,d.y+d.h*.12,d.w*.48,d.h*.30);ctx.fillStyle='#172431';ctx.font=Math.max(9,d.w*.04)+'px system-ui';ctx.textAlign='center';ctx.fillText('Lab-137 secure entrance',d.x+d.w*.51,d.y+d.h*.62,d.w*.64);
    }
    if(stage==='password'){
      const text=denied>0?'Access denied.':'Password?',bw=denied>0?132:112,x=Math.max(8,Math.min(W-bw-8,creature.x-55)),y=creature.y-119;
      ctx.fillStyle='#fffbef';ctx.strokeStyle=denied>0?'#b55c54':'#77694f';ctx.lineWidth=2;rounded(x,y,bw,39,12);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x+44,y+39);ctx.lineTo(x+54,y+50);ctx.lineTo(x+64,y+39);ctx.fill();ctx.fillStyle=denied>0?'#a64b43':'#3e463b';ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.fillText(text,x+bw/2,y+25);
    }
    ctx.restore();
  }
  function appearance(body){
    if(body!==creature||(!enabled&&stage!=='beam'))return null;
    const power=stage==='beam'?Math.min(1,elapsed/3.2):1;
    return {scale:1+.7*power,glow:power*(reduced.matches?22:25+Math.sin(pulse*5)*12)};
  }
  function alpha(body){return body===creature&&stage==='walkIn'?Math.max(0,1-elapsed/1.3):1;}
  function chamber(){
    ctx.save();const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#030811');bg.addColorStop(.7,'#101c2a');bg.addColorStop(1,'#02060c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#43637933';ctx.lineWidth=1;for(let i=-5;i<=5;i++){ctx.beginPath();ctx.moveTo(W*.5,H*.54);ctx.lineTo(W*.5+i*W*.3,H);ctx.stroke();}for(const k of [.7,.81,.94]){ctx.beginPath();ctx.moveTo(0,H*k);ctx.lineTo(W,H*k);ctx.stroke();}
    const cone=ctx.createLinearGradient(0,H*.05,0,H*.73);cone.addColorStop(0,'#e8f6ff08');cone.addColorStop(1,'#dcf3ff35');ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(W*.49,H*.06);ctx.lineTo(W*.51,H*.06);ctx.lineTo(W*.75,H*.73);ctx.lineTo(W*.25,H*.73);ctx.closePath();ctx.fill();
    const spot=ctx.createRadialGradient(W*.5,H*.71,0,W*.5,H*.71,W*.24);spot.addColorStop(0,'#d2eeff99');spot.addColorStop(1,'#a9dfff00');ctx.fillStyle=spot;ctx.beginPath();ctx.ellipse(W*.5,H*.71,W*.25,H*.055,0,0,7);ctx.fill();
    creature.x=W*.5;creature.y=H*.70;
    if(stage==='beam'||stage==='flex'){
      const strength=stage==='beam'?Math.min(1,elapsed/.7):Math.max(0,1-elapsed/2.5);
      ctx.save();ctx.globalAlpha=strength;ctx.shadowColor='#21b9ff';ctx.shadowBlur=25;const glow=ctx.createLinearGradient(W*.5-24,0,W*.5+24,0);glow.addColorStop(0,'#009dff00');glow.addColorStop(.5,'#a3edffcc');glow.addColorStop(1,'#009dff00');ctx.fillStyle=glow;ctx.fillRect(W*.5-24,0,48,H*.67);
      for(let strand=0;strand<3;strand++){ctx.beginPath();ctx.strokeStyle=strand?'#33aaff':'#d5f7ff';ctx.lineWidth=strand?2:3;for(let i=0;i<=16;i++){const jitter=reduced.matches?Math.sin(i*2+strand)*7:Math.sin(i*2.8+clock*24+strand*3)*13;const x=W*.5+jitter,y=i/16*H*.65;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();
    }
    drawCreature(creature,1);ctx.fillStyle='#b9dded';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(stage==='beam'?'LAB-137 · ENERGIZING':stage==='flex'?'AUTHORIZATION: UNLIMITED':'LAB-137 · TEST CHAMBER',W*.5,H*.87);
    if(stage==='return'){ctx.fillStyle='rgba(1,5,10,'+Math.min(1,elapsed/.8)+')';ctx.fillRect(0,0,W,H);}ctx.restore();
  }
  window.crumbGod={get stage(){return stage;},get enabled(){return enabled;},get testing(){return enabled||stage!=='none';},drawDoor,appearance,alpha,end:endMode};
  end.onclick=endMode;
  const oldGive=giveWord;giveWord=function(word,...rest){const result=accept(String(word).trim());return result===null?oldGive(word,...rest):result;};
  const oldUpdate=update;update=function(dt){if(stage!=='none')step(dt);else{oldUpdate(dt);pulse+=dt;}};
  const oldDraw=draw;draw=function(){if(['chamber','beam','flex','return'].includes(stage))chamber();else oldDraw();};
})();
