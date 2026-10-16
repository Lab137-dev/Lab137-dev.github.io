/* Local, milestone-gated tools. Existing nest/reward saves remain authoritative. */
(() => {
  'use strict';
  const key='crumb.bonus.v1', backup=key+'.backup';
  const dialog=document.getElementById('crumbGoalDialog'), content=document.getElementById('crumbBonusContent');
  const goals={workshop:{name:'Nest Workshop',at:100},playground:{name:'Playground Builder',at:350},village:{name:'Crumb Village',at:400}};
  const count=()=>window.crumbProgress?.()||0, unlocked=id=>count()>=goals[id].at;
  let cfg={version:1,shape:'pile',decoration:'none',layouts:[null,null,null],course:[],courseVisible:true,residents:[],villageVisible:true};
  let testingConfig=null;
  let editing=false,courseSelection=-1,courseDrag=null,bellRings=[],editorCreature=null;
  let selected=null,activity=null,actors=[],writeBlocked=false,saveMessage='',zoomTrail=[],zoomTick=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  for(const source of [key,backup]){
    try{
      const raw=localStorage.getItem(source);if(raw===null)continue;
      const s=JSON.parse(raw);if(!s||s.version!==1||!Array.isArray(s.layouts)||!Array.isArray(s.course)||!Array.isArray(s.residents))throw Error('Invalid tool save');
      cfg.shape=['pile','rows','rings'].includes(s.shape)?s.shape:'pile';
      cfg.decoration=['none','flowers','stones','bunting'].includes(s.decoration)?s.decoration:'none';
      cfg.layouts=s.layouts.slice(0,3).map(l=>l&&Array.isArray(l.items)?{name:String(l.name||'Nest').slice(0,24),shape:['pile','rows','rings'].includes(l.shape)?l.shape:'pile',decoration:['none','flowers','stones','bunting'].includes(l.decoration)?l.decoration:'none',items:l.items.filter(t=>typeof t.text==='string'&&t.text.length<=24).slice(0,48).map(t=>({text:t.text,angle:Number.isFinite(t.angle)?t.angle:0}))}:null);
      while(cfg.layouts.length<3)cfg.layouts.push(null);
      cfg.course=s.course.filter(p=>['tunnel','ramp','hoop','bell'].includes(p.type)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,8).map(p=>({type:p.type,x:Math.max(.12,Math.min(.88,p.x)),y:Math.max(.46,Math.min(.68,p.y))}));
      cfg.residents=s.residents.slice(0,3).map((r,i)=>({id:i+1,name:String(r.name||'Friend').slice(0,20),color:Object.hasOwn(crumbColors,r.color)?r.color:'mint',wear:typeof r.wear==='string'?r.wear:null,home:['spool','acorn','glass'].includes(r.home)?r.home:['spool','acorn','glass'][i],personality:['gardener','tinkerer','dancer'].includes(r.personality)?r.personality:['gardener','tinkerer','dancer'][i]}));
      cfg.courseVisible=s.courseVisible!==false;cfg.villageVisible=s.villageVisible!==false;
      writeBlocked=false;break;
    }catch{writeBlocked=true;}
  }
  const style=document.createElement('style');style.textContent=`
    #crumbGoalDialog{width:min(580px,94vw)}#crumbBonusContent{font:14px system-ui,sans-serif}
    .bonusGroup{border:1px solid #c9bca5;border-radius:12px;padding:12px;margin:12px 0;background:#fff9ef}
    .bonusRow{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:9px 0}
    #crumbBonusContent input,#crumbBonusContent select{font:14px system-ui,sans-serif;min-width:0;max-width:100%;padding:9px;border:1px solid #b7aa91;border-radius:7px;background:#fffdf6;color:#403e37}
    #crumbBonusContent input{width:100%}#crumbBonusContent label{display:block;margin:8px 0}
    #crumbBonusContent button{padding:9px 11px}#crumbBonusContent button:disabled{opacity:.5;cursor:default}
    .bonusStatus{color:#92543b!important;min-height:1.2em}.bonusNote{font-size:12px!important}
    .bonusResident{border-top:1px solid #d4c8b5;padding-top:10px;margin-top:12px}
    .bonusPreview{margin:12px 0 16px;padding:10px;border:1px solid #d2c2a7;border-radius:13px;background:#fff9ef}
    .bonusPreview canvas{width:100%;height:auto;aspect-ratio:12/5;border-radius:9px;display:block}
    .bonusPreview h3{font:19px Georgia,serif;margin:12px 3px 8px}
    .bonusPreview ul{margin:8px 0;padding-left:23px;font:13px system-ui,sans-serif;line-height:1.65}
    .bonusPreview p{margin:9px 3px;font-size:13px}
    .bonusExplainer{margin:12px 0}.bonusExplainer summary{cursor:pointer;color:#655b49;padding:8px 0;font:13px system-ui,sans-serif}
  `;document.head.appendChild(style);
  function saveConfig(){
    if(window.crumbGod?.testing)return true;
    if(writeBlocked){saveMessage='A saved tool file could not be read. Your original save has been kept.';return false;}
    try{const text=JSON.stringify(cfg);localStorage.setItem(key,text);if(localStorage.getItem(key)!==text)throw Error('Not retained');localStorage.setItem(backup,text);saveMessage='';return true;}
    catch{saveMessage='Changes could not be saved. Keep this page open.';return false;}
  }
  function el(tag,text,parent,attrs={}){const n=document.createElement(tag);if(text)n.textContent=text;Object.assign(n,attrs);if(parent)parent.appendChild(n);return n;}
  function action(parent,text,fn,disabled=false){const b=el('button',text,parent,{type:'button',disabled});b.onclick=fn;return b;}
  function options(parent,label,values,value){const wrap=el('label',label,parent),s=el('select','',wrap);for(const [id,name] of values)el('option',name,s,{value:id});s.value=value;return s;}
  function group(title){const box=el('section','',content,{className:'bonusGroup'});el('h3',title,box);return box;}
  function row(parent){return el('div','',parent,{className:'bonusRow'});}
  function message(text){saveMessage=text;const n=document.getElementById('bonusSaveStatus');if(n)n.textContent=text;}
  function noteSave(){const n=document.getElementById('bonusSaveStatus');if(n)n.textContent=saveMessage;}
  function refresh(){
    for(const button of document.querySelectorAll('[data-goal]')){const g=goals[button.dataset.goal];button.querySelector('small').textContent=unlocked(button.dataset.goal)?'Open · '+g.at+' words':g.at+' words · '+Math.min(count(),g.at)+'/'+g.at;button.title=g.name+(unlocked(button.dataset.goal)?' — unlocked':' — discover '+g.at+' unique words');}
    if(dialog.open&&selected)render(selected);
  }
  function open(id){if(id!=='village')window.crumbVillage?.close();if(id==='village'&&unlocked(id)&&window.crumbVillage){window.crumbVillage.open();return;}if(id==='playground'&&unlocked(id)){openEditor();return;}closeEditor();selected=id;render(id);if(!dialog.open)dialog.showModal();}
  const stories={
    workshop:{title:'A home worth growing.',items:['Make room for 48 pieces — four times the original nest.','Add familiar materials from field notes and choose a cozy pile, tidy rows, or a round nest.','Transform his corner with a living wildflower garden, a mossy stone sanctuary, or a lantern-lit celebration.','Name and save three favorite nests. Load one later, with an undo copy of the pile it replaces.']},
    playground:{title:'Build the adventure. Crumb does the running.',items:['Combine up to eight tunnels, ramps, hoops, and bells into your own course.','Drag toys directly around the room with a mouse or touch. Numbered paths show the route; reorder it whenever you like.','Press Run course: Crumb ducks through tunnels, hops over ramps and through hoops, and rings the bells.','Keep your course for another day, or put it away without losing it.']},
    village:{title:'His little world becomes a neighborhood.',items:['Visit a lantern-lit neighborhood with a spool cottage, acorn cabin, and greenhouse.','Give every friend a name, a coat color, and an outfit from your earned rewards.','Meet gardeners, tinkerers, and dancers who visit, nap, tend plants, and get little bursts of zoomies.','Share a picnic, lead a parade, put on a tiny concert, and take turns at the hoop. Names, colors, outfits, home styles, and personalities are saved.']},
    colors:{title:'Same little Crumb. A coat all his own.',items:['Unlock eight coat colors together: Soot, Rose, Sky, Mint, Honey, Lavender, Coral, and Snow.','Switch colors whenever you like. Your choice is saved, and your rewards and discoveries stay with you.']}
  };
  function preview(id,parent){
    const story=stories[id],box=el('section','',parent,{className:'bonusPreview'}),canvas=el('canvas','',box,{width:720,height:300});
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',id==='workshop'?'Crumb beside a decorated nest with saved layout frames':id==='playground'?'Crumb hopping through a toy course with a tunnel, ramp, hoop, and bell':id==='village'?'Three colorful dressed companions beside their little homes':'Eight Crumbs showing the available coat colors');
    const c=canvas.getContext('2d');c.fillStyle='#e8e0d0';c.fillRect(0,0,720,300);c.fillStyle='#d4bf9b';c.fillRect(0,110,720,190);
    for(let i=0;i<6;i++){c.strokeStyle='#b79d7522';c.beginPath();c.moveTo(0,145+i*28);c.lineTo(720,150+i*28);c.stroke();}
    function tiny(x,y,color,wear,size=1){c.save();c.translate(x,y);c.scale(size,size);c.fillStyle='#63533a22';c.beginPath();c.ellipse(0,29,43,9,0,0,7);c.fill();c.strokeStyle=color[2];c.lineWidth=4;c.lineCap='round';for(const dx of [-23,-8,8,23]){c.beginPath();c.moveTo(dx,16);c.lineTo(dx-5,31);c.stroke();}const g=c.createRadialGradient(-12,-15,2,3,3,40);g.addColorStop(0,color[0]);g.addColorStop(.5,color[1]);g.addColorStop(1,color[2]);c.fillStyle=g;c.beginPath();for(let i=0;i<=70;i++){const a=i/70*Math.PI*2,r=36+Math.sin(i*2.7)*3;c.lineTo(Math.cos(a)*r,Math.sin(a)*r*.88);}c.closePath();c.fill();for(const dx of [-12,12]){c.fillStyle='#e0c77e';c.beginPath();c.ellipse(dx,-3,6,8,0,0,7);c.fill();c.fillStyle='#26332a';c.beginPath();c.ellipse(dx-1,-2,2.5,4,0,0,7);c.fill();}c.strokeStyle=color[2];c.lineWidth=2;c.beginPath();c.arc(0,10,5,0,Math.PI);c.stroke();if(wear){c.font='31px system-ui';c.textAlign='center';c.fillText(wear,0,-31);}c.restore();}
    if(id==='workshop'){
      c.fillStyle='#9b805a33';c.beginPath();c.ellipse(425,211,170,24,0,0,7);c.fill();
      for(let i=0;i<18;i++){const x=335+(i%6)*36+Math.sin(i)*20,y=203-Math.floor(i/6)*24;c.save();c.translate(x,y);c.rotate(Math.sin(i)*.18);c.fillStyle=i%2?'#ead8ad':'#ddbf8e';c.strokeStyle='#b79b6c';c.fillRect(-40,-12,80,24);c.strokeRect(-40,-12,80,24);c.fillStyle='#6c593e';c.font='12px Georgia';c.textAlign='center';c.fillText(['moss','twig','feather'][i%3],0,4);c.restore();}
      c.font='28px Georgia';c.fillStyle='#b97988';for(let i=0;i<6;i++)c.fillText('✿',285+i*52,244);
      c.strokeStyle='#9a805a';c.beginPath();c.moveTo(280,91);c.quadraticCurveTo(420,135,580,91);c.stroke();for(let i=0;i<7;i++){c.fillStyle=['#b98393','#dfbb69','#7eab97'][i%3];c.beginPath();c.moveTo(302+i*39,100);c.lineTo(324+i*39,103);c.lineTo(312+i*39,121);c.fill();}
      tiny(166,187,crumbColors.soot.colors,null,1.3);for(let i=0;i<3;i++){c.fillStyle='#fbf4e2';c.fillRect(35+i*66,35,54,35);c.strokeStyle='#b5a380';c.strokeRect(35+i*66,35,54,35);c.fillStyle='#a5956d';c.beginPath();c.ellipse(62+i*66,58,17,5,0,0,7);c.fill();}
    }else if(id==='playground'){
      c.setLineDash([7,8]);c.strokeStyle='#a38a6180';c.lineWidth=3;c.beginPath();c.moveTo(44,236);c.bezierCurveTo(240,274,430,175,670,229);c.stroke();c.setLineDash([]);
      c.strokeStyle='#7e9b8c';c.lineWidth=13;c.beginPath();c.arc(133,217,43,Math.PI,0);c.stroke();c.fillStyle='#bfc9a3';c.beginPath();c.moveTo(225,232);c.lineTo(310,184);c.lineTo(310,232);c.closePath();c.fill();c.strokeStyle='#bd8d6b';c.lineWidth=8;c.beginPath();c.ellipse(447,171,35,53,0,0,7);c.stroke();c.fillStyle='#d2ae61';c.beginPath();c.arc(607,193,27,Math.PI,0);c.lineTo(639,220);c.lineTo(575,220);c.fill();tiny(365,142,crumbColors.soot.colors,null,1.05);
      c.strokeStyle='#faf4e6';c.lineWidth=4;for(let i=0;i<3;i++){c.beginPath();c.moveTo(301-i*12,136+i*8);c.lineTo(316-i*12,136+i*8);c.stroke();}
    }else if(id==='village'){
      const names=['Pip','Mochi','Juniper'],colors=['mint','rose','sky'],wears=['🎀','🎩','👑'];for(let i=0;i<3;i++){const x=133+i*225,color=crumbColors[colors[i]].colors;c.fillStyle='#eee0bd';c.fillRect(x-46,93,92,70);if(i===0){c.fillStyle='#d9c69b';c.beginPath();c.ellipse(x,93,55,10,0,0,7);c.fill();c.beginPath();c.ellipse(x,157,55,10,0,0,7);c.fill();for(let j=0;j<8;j++){c.strokeStyle='#b39b73';c.beginPath();c.moveTo(x-45,102+j*7);c.lineTo(x+45,102+j*7);c.stroke();}}else if(i===1){c.fillStyle='#b38958';c.beginPath();c.moveTo(x-58,95);c.quadraticCurveTo(x,20,x+58,95);c.quadraticCurveTo(x,112,x-58,95);c.fill();}else{c.fillStyle='#a4c8b3';c.beginPath();c.moveTo(x-58,95);c.lineTo(x,43);c.lineTo(x+58,95);c.fill();c.strokeStyle='#648a75';for(let j=-1;j<=1;j++){c.beginPath();c.moveTo(x+j*24,93);c.lineTo(x+j*24,160);c.stroke();}}c.fillStyle='#837052';c.fillRect(x-12,126,24,37);c.fillStyle='#a8c6cd';c.fillRect(x+21,107,16,16);tiny(x,207,color,wears[i],1.05);c.fillStyle='#655844';c.font='16px Georgia';c.textAlign='center';c.fillText(names[i],x,274);}
    }else{Object.values(crumbColors).forEach((color,i)=>{const x=98+(i%4)*174,y=i<4?92:227;tiny(x,y,color.colors,null,.85);c.fillStyle='#655844';c.font='13px system-ui';c.textAlign='center';c.fillText(color.name,x,y+44);});}
    el('h3',story.title,box);const list=el('ul','',box);for(const text of story.items)el('li',text,list);return box;
  }
  function colorPreview(){const box=document.getElementById('crumbColorReward');if(box&&!box.querySelector('.bonusPreview')){const holder=document.createElement('div');box.prepend(holder);preview('colors',holder);}}
  function render(id){
    selected=id;const g=goals[id];document.getElementById('crumbGoalTitle').textContent=g.name;
    document.getElementById('crumbGoalDescription').textContent=unlocked(id)?'Unlocked. Make this little world your own.':'Keep discovering words to open this tool.';
    const progress=document.getElementById('crumbGoalProgress');progress.max=g.at;progress.value=Math.min(count(),g.at);
    document.getElementById('crumbGoalCount').textContent=Math.min(count(),g.at)+' / '+g.at+' unique words';content.replaceChildren();
    if(!unlocked(id)){preview(id,content);el('p',(g.at-count())+' more unique discoveries to make this yours.',content);return;}
    const explainer=el('details','',content,{className:'bonusExplainer'});el('summary','See everything this tool can do',explainer);preview(id,explainer);
    if(id==='workshop')renderWorkshop();if(id==='playground')renderPlayground();if(id==='village')renderVillage();
    const status=el('p',saveMessage,content,{id:'bonusSaveStatus',className:'bonusStatus'});status.setAttribute('role','status');
  }
  function nestHome(t){
    if(!unlocked('workshop'))return null;
    const settled=treasures.filter(v=>v.settled),i=t.settled?Math.max(0,settled.indexOf(t)):settled.length,n=nest();let x,y;
    if(cfg.shape==='rows'){const cols=3,rows=Math.ceil(Math.max(settled.length,1)/cols),spacing=Math.min(29,H*.18/Math.max(1,rows-1));x=n.x+((i%cols)-1)*Math.min(90,W*.14);y=n.y-8-Math.floor(i/cols)*spacing;}
    else if(cfg.shape==='rings'){const a=i*2.399,r=Math.min(22+Math.sqrt(i)*11,W*.18);x=n.x+Math.cos(a)*r;y=n.y+Math.sin(a)*r*.4;}
    else{x=n.x+Math.sin(t.id*3.7)*Math.min(W*.11,85);y=n.y-8-Math.floor(i/6)*10;}
    return {x:Math.max(width(t.text)/2+8,Math.min(W-width(t.text)/2-8,x)),y:Math.max(H*.43,Math.min(H*.65,y))};
  }
  function arrange(){interrupt();drag=null;for(const t of treasures.filter(t=>t.settled)){Object.assign(t,nestHome(t));t.displaced=false;t.angle=cfg.shape==='rows'?0:Math.sin(t.id*7)*.24;}const saved=save();if(!saved)message('The nest could not be saved. Keep this page open; your previous save is still available.');return saved;}
  function makeUndo(){
    if(!treasures.length)return true;
    const snapshot={version:1,items:treasures.map(t=>({...t,x:t.x/W,y:t.y/H,origin:t.origin?{x:t.origin.x/W,y:t.origin.y/H}:undefined})),hunger,joy};
    try{if(!window.crumbGod?.testing){const data=JSON.stringify(snapshot);localStorage.setItem(nestUndoKey,data);if(localStorage.getItem(nestUndoKey)!==data)throw Error('Not saved');}nestUndoSnapshot=snapshot;nestUndoButton.hidden=false;return true;}
    catch{message('An undo copy could not be saved. Your current pile has been kept.');return false;}
  }
  function renderWorkshop(){
    const total=treasures.filter(t=>t.settled).length;el('p',total+' / 48 nest pieces. Changes appear immediately in your nest.',content);
    if(window.crumbGod?.testing)el('p','Godmode test: nest changes are temporary. End Godmode restores your original nest.',content,{className:'bonusNote'});
    const live=el('section','',content,{className:'bonusPreview'});el('strong','Your nest — live preview',live);
    const picture=el('canvas','',live,{id:'bonusNestPreview',width:720,height:300});picture.setAttribute('role','img');picture.setAttribute('aria-label','Your current nest, including its actual materials, shape, and decorations');
    const feedback=el('p','Choose a shape or decoration below, or add materials from your field notes.',live,{id:'bonusNestFeedback'});feedback.setAttribute('role','status');
    action(live,'Show my nest',()=>{dialog.close();say('Your nest, just the way you made it.');});
    function updatePreview(text){draw();const n=nest(),sw=Math.min(W,W*.62+80),sh=Math.min(H,H*.43+80),sx=Math.max(0,Math.min(W-sw,n.x-sw/2)),sy=Math.max(0,Math.min(H-sh,n.y-sh*.74)),scale=canvas.width/W;const c=picture.getContext('2d');c.clearRect(0,0,720,300);c.drawImage(canvas,sx*scale,sy*scale,sw*scale,sh*scale,0,0,720,300);if(text)feedback.textContent=text;}
    updatePreview();
    const box=group('Shape and decorations');
    const shape=options(box,'Nest shape',[['pile','Cozy pile'],['rows','Tidy rows'],['rings','Round nest']],cfg.shape);
    const decor=options(box,'Around the nest',[['none','Natural'],['flowers','Wildflower garden'],['stones','Mossy stone sanctuary'],['bunting','Lantern celebration']],cfg.decoration);
    const descriptions={none:'The familiar, simple nest corner.',flowers:'A lush ring of layered wildflowers, leafy stems, soft moss, and wandering fireflies.',stones:'A handcrafted border of shaded river stones, moss, balanced cairns, and little blossoms.',bunting:'Tall wooden posts, a sweeping garland of patterned flags, warm hanging lanterns, and scattered confetti.'};
    const detail=el('p',descriptions[cfg.decoration],box);detail.setAttribute('aria-live','polite');
    function apply(){if(!unlocked('workshop'))return;detail.textContent=descriptions[decor.value];cfg.shape=shape.value;cfg.decoration=decor.value;const saved=arrange()&&saveConfig();noteSave();updatePreview(saved?'Nest updated. '+(window.crumbGod?.testing?'This is a temporary Godmode preview.':'Your changes are saved.'):'Nest updated here, but could not be saved. Keep this page open.');}
    shape.onchange=apply;decor.onchange=apply;
    action(box,'Arrange nest',apply);
    const materials=Object.entries(discoveries).filter(([,kind])=>kind==='nesting').map(([word])=>[word,word]);
    const add=group('Grow the pile');
    if(materials.length){const select=options(add,'A material from field notes',materials,materials[0][0]);action(add,'Add one piece',()=>{
      if(!unlocked('workshop'))return;if(treasures.filter(t=>t.settled).length>=48){message('This nest holds 48 pieces. Save a favorite layout before starting another.');return;}
      if(treasures.length>=56){message('Let Crumb finish the loose offerings first.');return;}
      const t={text:select.value,kind:'nesting',id:nextId++,x:0,y:0,angle:0,settled:true,displaced:false,processed:true,age:0};treasures.push(t);if(!arrange()){message('The new nest piece could not be saved. Keep this page open.');return;}render('workshop');
    });}else el('p','Discover a nesting material first. Your field notes will list the materials you can add.',add);
    el('p','Your first room makeover is only the beginning. At 250 words, unlock eight coat colors for Crumb. At 350, build a playground he can actually run through.',content,{className:'bonusNote'});
    const layouts=group('Three favorite nests');
    el('p','Saved layouts keep the materials, shape, and decorations. Loading one offers an undo copy.',layouts,{className:'bonusNote'});
    cfg.layouts.forEach((layout,i)=>{
      const line=row(layouts),name=el('input','',line,{value:layout?.name||'Nest '+(i+1),maxLength:24});name.setAttribute('aria-label','Layout '+(i+1)+' name');
      action(line,'Save '+(i+1),()=>{if(!unlocked('workshop'))return;if(!treasures.some(t=>t.settled)){message('Build a nest before saving a layout.');return;}if(layout&&!confirm('Replace saved layout “'+layout.name+'”?'))return;cfg.layouts[i]={name:name.value.trim()||'Nest '+(i+1),shape:cfg.shape,decoration:cfg.decoration,items:treasures.filter(t=>t.settled).slice(0,48).map(({text,angle})=>({text,angle}))};saveConfig();render('workshop');});
      action(line,'Load '+(i+1),()=>{
        if(!unlocked('workshop')||!cfg.layouts[i])return;if(treasures.some(t=>t.settled)&&!confirm('Replace the current nest with “'+cfg.layouts[i].name+'”? An undo copy will be kept.'))return;if(!makeUndo())return;
        interrupt();drag=null;treasures=treasures.filter(t=>!t.settled);cfg.shape=cfg.layouts[i].shape;cfg.decoration=cfg.layouts[i].decoration;
        for(const saved of cfg.layouts[i].items)treasures.push({text:saved.text,kind:'nesting',id:nextId++,x:0,y:0,angle:saved.angle,settled:true,displaced:false,processed:true,age:0});
        if(arrange())saveConfig();render('workshop');
      },!layout);
    });
  }
  function renderPlayground(){action(content,'Edit in the room',openEditor);}
  const editor=el('section','',document.querySelector('main'),{id:'crumbPlaygroundEditor',hidden:true});
  editor.setAttribute('aria-label','Playground editor');
  const editorStyle=el('style','',document.head);editorStyle.textContent=`
    body.playgroundEditing > :not(main),main.playgroundEditing > :not(#room):not(#crumbPlaygroundEditor){visibility:hidden}
    #crumbPlaygroundEditor{position:absolute;z-index:70;top:16px;left:50%;transform:translateX(-50%);width:min(660px,calc(100% - 24px));padding:14px;background:#fff8eaf5;border:1px solid #bba88b;border-radius:16px;box-shadow:0 7px 24px #5d493321;font:13px system-ui,sans-serif;color:#4d493b}
    #crumbPlaygroundEditor[hidden]{display:none}#crumbPlaygroundEditor h2{font:23px Georgia,serif;margin:0 0 6px}#crumbPlaygroundEditor p{margin:6px 0;line-height:1.4}
    #crumbPlaygroundEditor .bonusRow{margin:7px 0;gap:6px}#crumbPlaygroundEditor button{min-height:40px;padding:8px 12px}#crumbPlaygroundEditor select{min-width:0;max-width:100%;font:13px system-ui;padding:8px;border-radius:7px;background:#fffdf7;color:#484638;border:1px solid #baa98a}
    #crumbPlaygroundEditor button:disabled{opacity:.45}#courseEditStatus{font-size:12px;color:#73664e}#courseInspector{padding-top:6px;border-top:1px solid #dacbad}#courseInspector .bonusRow{flex-wrap:nowrap}#courseInspector label{font-size:0;margin:0}#courseInspector select{font-size:12px;width:94px}#courseInspector button{font-size:12px;padding:7px 9px}
    @media(max-width:600px){#crumbPlaygroundEditor{padding:10px;top:10px}#crumbPlaygroundEditor h2{font-size:20px}#crumbPlaygroundEditor button{padding:8px 9px;font-size:12px}}
  `;
  function closeEditor(){if(courseDrag){try{canvas.releasePointerCapture(courseDrag.pointerId);}catch{}courseDrag=null;}editing=false;if(editorCreature){creature.x=editorCreature.x*W;creature.y=editorCreature.y*H;editorCreature=null;}editor.hidden=true;document.querySelector('main').classList.remove('playgroundEditing');document.body.classList.remove('playgroundEditing');}
  function editorStatus(text){const n=document.getElementById('courseEditStatus');if(n)n.textContent=text;}
  function renderEditor(){
    editor.replaceChildren();el('h2','Crumb’s little adventure park',editor);
    el('p','Add a toy, then drag it into place. Numbered paths show the order Crumb will play.',editor);
    const palette=row(editor);for(const type of ['tunnel','ramp','hoop','bell'])action(palette,'+ '+type[0].toUpperCase()+type.slice(1),()=>{
      if(!unlocked('playground')||cfg.course.length>=8)return;
      const i=cfg.course.length;cfg.course.push({type,x:.18+(i%4)*.21,y:.53+Math.floor(i/4)*.12});courseSelection=i;cfg.courseVisible=true;saveConfig();renderEditor();draw();
    },cfg.course.length>=8);
    const controls=row(editor);action(controls,'Run course',startCourse,!cfg.course.length);action(controls,'Done',()=>{closeEditor();canvas.focus();});
    action(controls,cfg.courseVisible?'Put course away':'Show course',()=>{cfg.courseVisible=!cfg.courseVisible;saveConfig();renderEditor();draw();},!cfg.course.length);
    if(cfg.course.length){const inspector=el('div','',editor,{id:'courseInspector'}),line=row(inspector);
      const selector=options(line,'Selected toy',cfg.course.map((p,i)=>[String(i),(i+1)+'. '+p.type]),String(Math.max(0,courseSelection)));
      selector.onchange=()=>{courseSelection=Number(selector.value);renderEditor();draw();};
      function reorder(delta){const j=courseSelection+delta;if(j<0||j>=cfg.course.length)return;[cfg.course[j],cfg.course[courseSelection]]=[cfg.course[courseSelection],cfg.course[j]];courseSelection=j;saveConfig();renderEditor();draw();}
      action(line,'Earlier',()=>reorder(-1),courseSelection<=0);action(line,'Later',()=>reorder(1),courseSelection>=cfg.course.length-1);
      action(line,'Remove toy',()=>{cfg.course.splice(courseSelection,1);courseSelection=Math.min(courseSelection,cfg.course.length-1);saveConfig();renderEditor();draw();});
    }
    const status=el('p',saveMessage||(window.crumbGod?.testing?'Godmode: this course is temporary.':cfg.course.length+' / 8 toys · Saved as you build.'),editor,{id:'courseEditStatus'});status.setAttribute('role','status');
  }
  function openEditor(){if(!unlocked('playground'))return;dialog.close();interrupt();activity=null;if(!editing)editorCreature={x:creature.x/W,y:creature.y/H};creature.x=Math.max(90,W*.18);creature.y=H*.79;editing=true;courseSelection=cfg.course.length?0:-1;editor.hidden=false;document.querySelector('main').classList.add('playgroundEditing');document.body.classList.add('playgroundEditing');renderEditor();draw();}
  const courseScale=()=>Math.max(.65,Math.min(1,W/850));
  function pickCourse(p){let best=-1,distance=Infinity;cfg.course.forEach((t,i)=>{const d=Math.hypot((p.x-t.x*W)/(72*courseScale()),(p.y-(t.y*H-30*courseScale()))/(65*courseScale()));if(d<1.3&&d<distance){distance=d;best=i;}});return best;}
  canvas.addEventListener('pointerdown',e=>{if(!editing)return;e.preventDefault();e.stopImmediatePropagation();const p=pos(e),i=cfg.courseVisible?pickCourse(p):-1;if(i<0)return;courseSelection=i;const t=cfg.course[i];courseDrag={pointerId:e.pointerId,index:i,dx:p.x-t.x*W,dy:p.y-t.y*H};canvas.setPointerCapture(e.pointerId);renderEditor();canvas.focus();draw();},true);
  canvas.addEventListener('pointermove',e=>{if(!editing)return;e.preventDefault();e.stopImmediatePropagation();if(!courseDrag||courseDrag.pointerId!==e.pointerId)return;const p=pos(e),t=cfg.course[courseDrag.index];t.x=Math.max(.12,Math.min(.88,(p.x-courseDrag.dx)/W));t.y=Math.max(.46,Math.min(.68,(p.y-courseDrag.dy)/H));draw();},true);
  function releaseCourse(e){if(!editing)return;e.preventDefault();e.stopImmediatePropagation();if(!courseDrag)return;try{canvas.releasePointerCapture(courseDrag.pointerId);}catch{}courseDrag=null;saveConfig();editorStatus(saveMessage||(window.crumbGod?.testing?'Godmode: this course is temporary.':'Position saved. Drag another toy or run your course.'));}
  canvas.addEventListener('pointerup',releaseCourse,true);canvas.addEventListener('pointercancel',releaseCourse,true);
  canvas.addEventListener('keydown',e=>{if(!editing)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();closeEditor();return;}const t=cfg.course[courseSelection];if(!t)return;const d={ArrowLeft:[-.015,0],ArrowRight:[.015,0],ArrowUp:[0,-.012],ArrowDown:[0,.012]}[e.key];if(d){e.preventDefault();t.x=Math.max(.12,Math.min(.88,t.x+d[0]));t.y=Math.max(.46,Math.min(.68,t.y+d[1]));saveConfig();draw();}},true);
  function startCourse(){
    if(!unlocked('playground')||!cfg.course.length)return false;
    closeEditor();dialog.close();interrupt();cfg.courseVisible=true;saveConfig();activity={type:'course',index:0,stage:'approach',elapsed:0,route:cfg.course.map(p=>({...p})),dir:1};phase='bonusCourse';timer=0;command=null;say('Adventure time!');return true;
  }
  function homeFor(i){return {x:W*(.18+i*.27),y:H*.445};}
  function syncActors(){
    const old=new Map(actors.map(a=>[a.id,a]));actors=cfg.residents.map((r,i)=>{const h=homeFor(i),a=old.get(r.id)||{x:h.x,y:h.y+48,walk:0,facing:1,pause:1,index:i};return Object.assign(a,{id:r.id,index:i,npc:true,name:r.name,colors:crumbColors[r.color].colors,wear:r.wear});});
  }
  function renderVillage(){
    const box=group('A little community');el('p','Three permanent friends, each with a home, a name, a coat, and an outfit from your earned wearables.',box);
    action(box,'Welcome a friend',()=>{if(!unlocked('village')||cfg.residents.length>=3)return;const i=cfg.residents.length;cfg.residents.push({id:Math.max(0,...cfg.residents.map(r=>r.id))+1,name:['Pip','Mochi','Juniper'][i],color:['mint','rose','sky'][i],wear:null});saveConfig();syncActors();render('village');},cfg.residents.length>=3);
    const wears=window.crumbWearables?.()||[];
    cfg.residents.forEach((r,i)=>{
      const section=el('section','',box,{className:'bonusResident'}),name=el('input','',section,{value:r.name,maxLength:20});name.setAttribute('aria-label','Friend '+(i+1)+' name');
      const color=options(section,'Coat color',Object.entries(crumbColors).map(([id,c])=>[id,c.name]),r.color);
      const outfit=options(section,'Outfit',[['','No outfit'],...wears.map(w=>[w.id,w.name])],r.wear||'');
      const line=row(section);action(line,'Save friend',()=>{if(!unlocked('village'))return;r.name=name.value.trim()||'Friend';r.color=color.value;r.wear=outfit.value||null;saveConfig();syncActors();noteSave();});
      action(line,'Say goodbye',()=>{if(!unlocked('village')||!confirm('Say goodbye to '+r.name+' and remove their home?'))return;cfg.residents.splice(i,1);saveConfig();syncActors();render('village');});
    });
    const controls=row(box);action(controls,'Play together',()=>{
      if(!unlocked('village')||!actors.length)return;dialog.close();interrupt();cfg.villageVisible=true;saveConfig();activity={type:'village',elapsed:0};phase='villageGame';timer=0;window.crumbAudio?.event('social');say('Everyone has joined the game.');
    },!actors.length);
    action(controls,cfg.villageVisible?'Let the village rest':'Wake the village',()=>{if(!unlocked('village'))return;cfg.villageVisible=!cfg.villageVisible;saveConfig();render('village');},!actors.length);
  }
  function finish(){window.crumbIdle?.cancel();activity=null;phase='idle';command=null;timer=0;wander=null;wanderPause=1.5;}
  function step(dt){
    if(editing){finish();return;}
    if(!activity){finish();return;}activity.elapsed+=dt;
    if(activity.type==='village'){if(Math.floor(activity.elapsed)!==Math.floor(activity.elapsed-dt))burst('♥',2);if(activity.elapsed>8){finish();say('Good company. A very good afternoon.');}return;}
    const piece=activity.route[activity.index];if(!piece){finish();burst('★',9);say('Course complete. A tiny champion!');window.crumbAudio?.event('reward');return;}
    const k=courseScale(),cx=piece.x*W,cy=piece.y*H;
    if(activity.stage==='approach'){
      if(!activity.entry){activity.dir=piece.type==='ramp'?1:creature.x>cx?-1:1;activity.entry={x:cx-activity.dir*82*k,y:cy+5};say((activity.index+1)+' / '+activity.route.length+' · '+({tunnel:'Into the tunnel!',ramp:'Up the ramp…',hoop:'Through the hoop!',bell:'Ring the bell!'}[piece.type]));}
      if(moveTo(activity.entry.x,activity.entry.y,180,dt)){activity.stage='play';activity.elapsed=0;activity.struck=false;window.crumbAudio?.event('rustle');}
    }else if(activity.stage==='play'){
      const duration=piece.type==='tunnel'?1.65:piece.type==='ramp'?1.7:piece.type==='bell'?1.1:1.05,t=Math.min(1,activity.elapsed/duration),dir=activity.dir;
      const oldX=creature.x;
      if(piece.type==='bell')creature.x=cx-dir*(82-53*Math.sin(t*Math.PI))*k;
      else creature.x=cx+dir*(-82+(piece.type==='ramp'?204:164)*t)*k;
      creature.y=cy+5;creature.facing=dir;creature.walk+=Math.abs(creature.x-oldX)*.12;
      if(piece.type==='bell'&&t>=.45&&!activity.struck){activity.struck=true;bellRings.push({x:piece.x,y:piece.y,age:0});window.crumbAudio?.event('courseBell');}
      if(t>=1){activity.stage='land';activity.elapsed=0;if(piece.type!=='tunnel')window.crumbAudio?.event('rustle');}
    }else if(activity.elapsed>.28){activity.index++;activity.stage='approach';activity.elapsed=0;activity.entry=null;}
  }
  function pose(){
    if(!activity||activity.type!=='course'||phase!=='bonusCourse')return null;
    if(activity.stage==='land')return {squash:1-Math.sin(Math.min(1,activity.elapsed/.28)*Math.PI)*.12};
    if(activity.stage!=='play')return null;
    const type=activity.route[activity.index]?.type,k=courseScale(),duration=type==='tunnel'?1.65:type==='ramp'?1.7:type==='bell'?1.1:1.05,t=Math.min(1,activity.elapsed/duration);
    if(type==='tunnel')return {squash:1-Math.sin(t*Math.PI)*.53,opacity:t>.27&&t<.73?0:1};
    if(type==='ramp'){const height=t<.1?0:t<.67?(t-.1)/.57*58:(1-(t-.67)/.33)*58+Math.sin((t-.67)/.33*Math.PI)*34;return {hop:-height*k,tilt:t<.67?-activity.dir*.2:activity.dir*.12};}
    if(type==='hoop')return {hop:-Math.sin(t*Math.PI)*48*k,tilt:Math.sin(t*Math.PI*2)*activity.dir*.16};
    return {hop:-Math.sin(t*Math.PI)*12*k,tilt:activity.dir*Math.sin(t*Math.PI)*.18};
  }
  function updateActors(dt){
    if(window.crumbVillage||!unlocked('village')||!cfg.villageVisible)return;
    for(const a of actors){const h=homeFor(a.index);a.party=phase==='villageGame';
      if(a.party){const angle=timer*1.5+a.index*Math.PI*2/Math.max(1,actors.length);a.goal={x:Math.max(40,Math.min(W-40,creature.x+Math.cos(angle)*Math.min(95,W*.22))),y:creature.y+Math.sin(angle)*25};}
      else{a.pause-=dt;if(!a.goal&&a.pause<=0)a.goal={x:Math.max(40,Math.min(W-40,h.x+(Math.random()-.5)*Math.min(110,W*.22))),y:Math.max(H*.49,Math.min(H*.68,h.y+40+Math.random()*45))};}
      if(a.goal){const dx=a.goal.x-a.x,dy=a.goal.y-a.y,d=Math.hypot(dx,dy),n=Math.min(d,(a.party?110:32)*dt);if(d<2){a.goal=null;a.pause=1+Math.random()*3;}else{a.x+=dx/d*n;a.y+=dy/d*n;a.walk+=n*.1;a.facing=Math.sign(dx)||1;}}
    }
  }
  // Paint the scenery underneath cards and creatures so a big upgrade never hides play.
  function drawNestScenery(){
    if(!unlocked('workshop')||cfg.decoration==='none')return;
    const n=nest(),r=Math.min(155,W*.225),k=r/155,still=reducedMotion.matches;
    ctx.save();ctx.translate(n.x,n.y);ctx.scale(k,k);ctx.lineCap='round';
    const ellipse=(x,y,rx,ry,color,angle=0)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fill();};
    function flower(x,y,size,color,seed){
      const sway=still?0:Math.sin(clock*.9+seed)*3;
      ctx.strokeStyle='#536f49';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-9,y-size*.7,x+sway,y-size*1.65);ctx.stroke();
      ellipse(x-7,y-size*.55,11,4,'#779153',-.5);ellipse(x+5,y-size*.95,10,4,'#597e50',.5);
      const fy=y-size*1.65;for(let j=0;j<7;j++){const a=j/7*Math.PI*2;ellipse(x+sway+Math.cos(a)*size*.62,fy+Math.sin(a)*size*.62,size*.49,size*.31,color,a);}
      ellipse(x+sway,fy,size*.32,size*.32,'#f4cd68');ellipse(x+sway-2,fy-2,size*.12,size*.12,'#fff0ad');
    }
    ellipse(0,22,163,50,'#67502b18');
    if(cfg.decoration==='flowers'){
      ellipse(0,17,156,44,'#829363');ellipse(0,13,139,33,'#a1ad78');
      for(let i=0;i<17;i++){const a=i/17*Math.PI*2,x=Math.cos(a)*145,y=Math.sin(a)*37+8;flower(x,y,12+(i%3)*3,['#eab4c3','#c5b4e4','#f6df91','#e18d9c'][i%4],i);}
      for(let i=0;i<12;i++){const a=i*2.4;ellipse(Math.cos(a)*143,Math.sin(a)*37+15,3,2,'#d8e4a3',a);}
      // Small fireflies drift slowly along the flower border, without flashing.
      if(!still)for(let i=0;i<5;i++){const a=i*1.7+clock*.13,x=Math.cos(a)*137,y=-43+Math.sin(a*1.7)*28;ellipse(x,y,3,3,'#fff3b487');ellipse(x,y,1.3,1.3,'#fff7d0');}
    }else if(cfg.decoration==='stones'){
      ellipse(0,12,155,43,'#71816a');ellipse(0,9,131,30,'#a5aa83');
      for(let i=0;i<20;i++){const a=i/20*Math.PI*2,x=Math.cos(a)*145,y=Math.sin(a)*39+8,rx=17+(i%3)*3,ry=11+(i%2)*3;
        ellipse(x+2,y+5,rx,ry,'#403d3438',Math.sin(i)*.3);
        const g=ctx.createLinearGradient(x-10,y-12,x+10,y+12);g.addColorStop(0,['#d0cbc0','#b6c2bb','#c3b7a9'][i%3]);g.addColorStop(1,'#777d75');ellipse(x,y,rx,ry,g,Math.sin(i)*.3);
        ctx.strokeStyle='#e7e7d180';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-rx*.5,y-3);ctx.quadraticCurveTo(x,y-ry*.7,x+rx*.35,y-ry*.35);ctx.stroke();
        if(i%3===0){ellipse(x-8,y+5,9,4,'#7b955c');ellipse(x-5,y+3,5,2,'#a3b578');}
      }
      // Three balanced cairns give the border a handcrafted silhouette.
      for(const side of [-1,1]){const x=side*137;ellipse(x,-22,22,11,'#8d9589');ellipse(x+3,-38,17,9,'#b5bab0');ellipse(x,-51,11,7,'#d0cec0');}
      flower(-120,29,11,'#e8d7a4',2);flower(124,30,9,'#e8d7a4',5);
    }else{
      const top=Math.min(n.y,...treasures.filter(t=>t.settled).map(t=>t.y)),lift=Math.max(0,(n.y-top+65)/k-128);
      for(const x of [-151,151]){ctx.strokeStyle='#806447';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,31);ctx.lineTo(x,-137-lift);ctx.stroke();ellipse(x,-140-lift,6,6,'#dfc17c');ellipse(x,31,14,5,'#756447');}
      ctx.translate(0,-lift);
      ctx.strokeStyle='#a38254';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-151,-128);ctx.quadraticCurveTo(0,-67,151,-128);ctx.stroke();
      const colors=['#db829e','#76bdb3','#eac76e','#ab9cdb','#efaa79'];
      for(let i=0;i<11;i++){const t=(i+.5)/11,x=-151+t*302,y=-128+122*t*(1-t),sway=still?0:Math.sin(clock*1.1+i*.6)*.045;
        ctx.save();ctx.translate(x,y);ctx.rotate(sway);ctx.fillStyle=colors[i%5];ctx.strokeStyle='#ffefd580';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.lineTo(0,29);ctx.closePath();ctx.fill();ctx.stroke();ellipse(0,9,2.5,2.5,'#fff3d4');ctx.restore();
      }
      for(const x of [-151,151]){ctx.strokeStyle='#7b6245';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,-112);ctx.lineTo(x+(x<0?22:-22),-104);ctx.lineTo(x+(x<0?22:-22),-90);ctx.stroke();const lx=x+(x<0?22:-22);ellipse(lx,-78,17,22,'#f8d68935');ellipse(lx,-78,11,15,'#eac675');ellipse(lx-3,-82,5,9,'#ffe8a1');ctx.fillStyle='#93744c';ctx.fillRect(lx-8,-94,16,4);ctx.fillRect(lx-7,-64,14,3);}
      ctx.translate(0,lift);
      for(let i=0;i<7;i++){const x=-132+i*44;ellipse(x,39+Math.sin(i)*4,7,4,colors[i%5],i*.8);}
    }
    ctx.restore();
  }
  function drawCourse(front=false){
    if(!unlocked('playground')||!cfg.courseVisible)return;
    const k=courseScale();
    if((editing||activity?.type==='course')&&!front&&cfg.course.length>1){ctx.save();ctx.strokeStyle='#7c9c9ca0';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();cfg.course.forEach((p,i)=>i?ctx.lineTo(p.x*W,p.y*H+15*k):ctx.moveTo(p.x*W,p.y*H+15*k));ctx.stroke();ctx.restore();}
    cfg.course.forEach((p,i)=>{
      ctx.save();ctx.translate(p.x*W,p.y*H);ctx.scale(k,k);ctx.lineCap='round';ctx.lineJoin='round';
      const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
      function drawBell(){
        const ring=bellRings.find(b=>b.x===p.x&&b.y===p.y),age=ring?.age||0,swing=ring&&!reducedMotion.matches?Math.sin(age*18)*.3*Math.exp(-age*2):0;
        ctx.save();ctx.translate(0,-103);ctx.rotate(swing);ctx.strokeStyle='#6e624b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,14);ctx.stroke();
        const g=ctx.createLinearGradient(-25,20,25,60);g.addColorStop(0,'#ffe3a0');g.addColorStop(.4,'#d7ad51');g.addColorStop(1,'#a87b32');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-25,63);ctx.quadraticCurveTo(-18,48,-18,32);ctx.bezierCurveTo(-18,10,18,10,18,32);ctx.quadraticCurveTo(18,48,25,63);ctx.closePath();ctx.fill();oval(0,63,26,5,'#f4d181');oval(0,69,6,6,'#8a6531');ctx.restore();
        if(ring){ctx.strokeStyle='#e4bc69';ctx.lineWidth=2;ctx.globalAlpha=Math.max(0,1-age/1.6);for(const side of [-1,1]){ctx.beginPath();ctx.arc(side*19,-65,28+age*15,side>0?-.6:Math.PI-.6,side>0?.6:Math.PI+.6);ctx.stroke();}ctx.globalAlpha=1;}
      }
      const active=activity?.type==='course'&&activity.index===i;
      if(front){
        if(p.type==='bell')drawBell();
        if(p.type==='hoop'){ctx.strokeStyle='#cf9165';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(0,-47,33,46,0,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle='#ffe0a6';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-1,-48,32,45,0,-Math.PI/2,Math.PI/2);ctx.stroke();}
        if(p.type==='tunnel'){
          ctx.fillStyle='#809e8b';ctx.beginPath();ctx.moveTo(-60,0);ctx.bezierCurveTo(-59,-95,59,-95,60,0);ctx.lineTo(48,0);ctx.bezierCurveTo(47,-71,-47,-71,-48,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#bbd1b3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-55,-5);ctx.bezierCurveTo(-51,-83,51,-83,55,-5);ctx.stroke();
          for(const x of [-61,47]){ctx.fillStyle='#ad9266';ctx.fillRect(x,0,14,7);}
        }
        if(editing){const chosen=i===courseSelection;ctx.fillStyle=chosen?'#287e9d':'#fff8e9';ctx.strokeStyle=chosen?'#15566e':'#ac9979';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,23,13,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=chosen?'#ffffff':'#5d594a';ctx.fillText(String(i+1),0,23);}
        ctx.restore();return;
      }
      oval(0,8,72,13,'#594a3422');
      if(editing&&i===courseSelection){ctx.strokeStyle='#5bb6d1';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(0,-20,78,67,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      if(p.type==='tunnel'){
        const g=ctx.createLinearGradient(0,-78,0,0);g.addColorStop(0,'#a9c4a1');g.addColorStop(1,'#668c78');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-60,0);ctx.bezierCurveTo(-59,-95,59,-95,60,0);ctx.closePath();ctx.fill();ctx.fillStyle='#38483e';ctx.beginPath();ctx.moveTo(-48,1);ctx.bezierCurveTo(-47,-71,47,-71,48,1);ctx.closePath();ctx.fill();
        oval(0,-65,18,8,'#d9cda3');ctx.fillStyle='#6b785b';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('CRAWL',0,-62);
      }else if(p.type==='ramp'){
        ctx.fillStyle='#a07751';ctx.beginPath();ctx.moveTo(-60,3);ctx.lineTo(55,-58);ctx.lineTo(55,3);ctx.closePath();ctx.fill();ctx.strokeStyle='#d1b88b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-62,0);ctx.lineTo(55,-61);ctx.stroke();
        for(let j=0;j<8;j++){const x=-48+j*13,y=-(x+60)/115*61;ctx.strokeStyle='#816849';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+4,y+3);ctx.stroke();}
        ctx.fillStyle='#c5ac7f';ctx.fillRect(45,-48,7,51);ctx.fillStyle='#f0c975';ctx.beginPath();ctx.moveTo(55,-62);ctx.lineTo(55,-88);ctx.lineTo(77,-81);ctx.lineTo(55,-73);ctx.fill();
        oval(91,4,25,7,'#a1ac7738');
      }else if(p.type==='hoop'){
        ctx.fillStyle='#a18661';ctx.fillRect(-44,0,88,7);ctx.fillStyle='#c0a77a';ctx.fillRect(-30,-12,8,16);ctx.fillRect(22,-12,8,16);
        ctx.strokeStyle='#ae764f';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(0,-47,33,46,0,0,Math.PI*2);ctx.stroke();
        for(let j=0;j<8;j++){const a=j/8*Math.PI*2;oval(Math.cos(a)*33,-47+Math.sin(a)*46,3,3,j%2?'#b9d9bc':'#ffe3a1');}
      }else{
        ctx.strokeStyle='#927650';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-40,3);ctx.lineTo(-40,-99);ctx.quadraticCurveTo(-40,-109,-27,-109);ctx.lineTo(27,-109);ctx.quadraticCurveTo(40,-109,40,-99);ctx.lineTo(40,3);ctx.stroke();
        for(const x of [-40,40])oval(x,5,13,4,'#756348');
      }
      if(active&&!editing){ctx.strokeStyle='#dfc77c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,9,75,15,0,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    });
  }
  function drawTools(){
    drawCourse(true);
    if(!window.crumbVillage&&unlocked('village')&&cfg.villageVisible){
      for(const a of actors){const h=homeFor(a.index);ctx.save();ctx.translate(h.x,h.y);ctx.fillStyle=a.colors[1];ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(0,-30);ctx.lineTo(28,0);ctx.closePath();ctx.fill();ctx.fillStyle='#e6d5b3';ctx.fillRect(-23,0,46,30);ctx.fillStyle='#796a55';ctx.fillRect(-7,12,14,18);ctx.fillStyle='#5c5548';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(a.name,0,44,100);ctx.restore();}
      const wears=window.crumbWearables?.()||[];
      for(const a of actors){drawCreature(a,.65);const outfit=wears.find(w=>w.id===a.wear);if(outfit){ctx.save();ctx.textAlign='center';ctx.font='21px system-ui';const feet=['shoes','boots','mystery-boots'].includes(outfit.id);ctx.fillText(outfit.emoji,a.x,a.y+(feet?5:-43));ctx.restore();}}
    }
  }
  function drawZoomies(){
    const zooming=phase==='idleAntic'&&command==='zoomies',powerScale=window.crumbGod?.appearance(creature)?.scale||1;
    if(!reducedMotion.matches)for(const p of zoomTrail){ctx.save();ctx.globalAlpha=Math.max(0,1-p.age/.35)*.22;ctx.filter='blur(3px)';ctx.fillStyle=crumbColors[crumbColor].colors[0];ctx.beginPath();ctx.ellipse(p.x,p.y-29*powerScale,35*powerScale,29*powerScale,0,0,7);ctx.fill();ctx.restore();}
    if(zooming){ctx.save();ctx.translate(Math.max(70,Math.min(W-70,creature.x)),Math.max(100,creature.y-89*powerScale));ctx.rotate(reducedMotion.matches?-.08:-.08+Math.sin(clock*17)*.045);ctx.textAlign='center';ctx.font='900 21px "Comic Sans MS","Trebuchet MS",cursive';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#fff8e4';ctx.strokeText('ZOOMIES!',0,0);ctx.fillStyle='#c77a3d';ctx.fillText('ZOOMIES!',0,0);ctx.restore();}
  }
  window.crumbBonus={beginTesting(){if(!testingConfig)testingConfig=JSON.parse(JSON.stringify(cfg));},endTesting(){if(testingConfig){window.crumbVillage?.close();closeEditor();cfg=testingConfig;testingConfig=null;activity=null;actors=[];syncActors();refresh();}},villageSaveStatus:()=>saveMessage,villageData:()=>JSON.parse(JSON.stringify(cfg.residents)),changeResident(id,patch){const r=cfg.residents.find(r=>r.id===id);if(!unlocked('village')||!r)return false;Object.assign(r,patch);const ok=saveConfig();syncActors();return ok;},addResident(){if(!unlocked('village')||cfg.residents.length>=3)return false;const i=cfg.residents.length;cfg.residents.push({id:Math.max(0,...cfg.residents.map(r=>r.id))+1,name:['Pip','Mochi','Juniper'][i],color:['mint','rose','sky'][i],wear:null,home:['spool','acorn','glass'][i],personality:['gardener','tinkerer','dancer'][i]});const ok=saveConfig();syncActors();return ok;},capacity:()=>unlocked('workshop')?48:12,nestHome,drawNestScenery,drawCourse,step,pose,refresh,open,startCourse,openEditor,closeEditor,colorPreview,drawZoomies,inspect:()=>JSON.parse(JSON.stringify(cfg))};
  for(const button of document.querySelectorAll('[data-goal]'))button.onclick=()=>open(button.dataset.goal);
  const priorGive=giveWord;giveWord=function(...args){if(editing)closeEditor();if(phase==='bonusCourse'||phase==='villageGame'){activity=null;interrupt();}return priorGive(...args);};
  for(const name of ['pointerdown','keydown'])document.addEventListener(name,()=>{if(phase==='bonusCourse'||phase==='villageGame'){activity=null;interrupt();}},{passive:true});
  const oldUpdate=update;update=function(dt){if(activity&&!['bonusCourse','villageGame'].includes(phase))activity=null;if(!editing)oldUpdate(dt);else clock+=dt;bellRings=bellRings.map(b=>({...b,age:b.age+dt})).filter(b=>b.age<1.6);updateActors(dt);zoomTrail=zoomTrail.map(p=>({...p,age:p.age+dt})).filter(p=>p.age<.35);zoomTick+=dt;if(phase==='idleAntic'&&command==='zoomies'&&zoomTick>=.035){zoomTick=0;zoomTrail.push({x:creature.x,y:creature.y,age:0});if(zoomTrail.length>12)zoomTrail.shift();}};
  const oldDraw=draw;draw=function(){oldDraw();drawTools();};
  window.addEventListener('resize',()=>{for(const a of actors){const h=homeFor(a.index);a.x=h.x;a.y=h.y+45;a.goal=null;}});
  syncActors();refresh();for(const t of treasures.filter(t=>t.settled)){const p=nestHome(t);if(p)Object.assign(t,p);}
})();
