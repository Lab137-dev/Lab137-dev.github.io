(function(root){
 'use strict';
 const groups={
 food:['crumb','crumbs','cookie','biscuit','bread','toast','berry','berries','apple','oat','oats','cheese','honey','cake','muffin','seed','seeds','snack','poptart'],
 nesting:['moss','twig','twigs','leaf','leaves','thread','yarn','wool','cotton','paper','feather','feathers','string','ribbon','fluff','scrap','scraps','fabric','straw'],
 scary:['boo','thunder','fire','vacuum','hawk','owl','snake','monster','bang','storm','lightning','roar','danger','spider'],
 distasteful:['soap','onion','garlic','pickle','pickles','lemon','vinegar','pepper','mustard','broccoli','bleach','bitter'],
 playful:['ball','marble','bell','bubble','bubbles','button','dice','sparkle','jingle','toy','bounce','peekaboo'],
 command:['sit','sleep','nap','wake','wake up','come','come here','dance','spin','stay','fetch','home','go home']
 };
 const labels={food:'Something to eat',nesting:'Building materials',scary:'Things to hide from',distasteful:'Absolutely not',playful:'Playthings',command:'Words it understands',unknown:'Still a mystery'};
 const aliases={nap:'sleep','wake up':'wake','come here':'come','go home':'home'};
 function normalize(text){return String(text).normalize('NFKC').toLowerCase().trim().replace(/^[\s.!?,;:]+|[\s.!?,;:]+$/g,'').replace(/\s+/g,' ');}
 const tantrum=['war','hate','hatred','violence','cruelty','bullying','bully','abuse','neglect','greed','pollution','litter','trash','garbage','smoke','smog','fireworks','loud noise','chainsaw','leaf blower','vacuum cleaner','pesticide','poison','oil spill','deforestation','destroy','destruction','chaos','mean','unkind','injustice','betrayal','lies','fighting','bomb','bombs','gunfire','process'];
 const personal={priscilla:'love',peter:'love',jonathan:'love',jessica:'love',mac:'love',mack:'love','riley-l':'fury',lippyslippers:'fury',babystein:'love',baron:'roll',danny:'loveDance',angelface:'loveDance',kiddoface:'loveDance',stasia:'loveDance',anastasia:'loveDance'};
 function classify(text){const word=normalize(text);if(tantrum.includes(word))return{kind:'personal',word,action:'fury'};if(Object.hasOwn(personal,word))return{kind:'personal',word,action:personal[word]};for(const [kind,words]of Object.entries(groups))if(words.includes(word))return{kind,word,action:aliases[word]||word};return{kind:'unknown',word,action:null};}
 root.CrumbWords={classify,normalize,labels,total:Object.values(groups).reduce((a,v)=>a+v.length,0)+Object.keys(personal).length};
})(globalThis);
