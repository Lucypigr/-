(() => {openChestChoice=function(){if(!game.pendingChestChoices.length)return;uiBusy=true;const root=$('#skillChoices');root.innerHTML='';game.pendingChestChoices.forEach((reward,index)=>{const card=document.createElement('div');card.className=`choice-card kind-${reward.kind}`;const kindLabel=reward.kind==='skill'?'旅者技能':reward.kind==='support'?'SUPPORT':reward.kind==='gear'?'裝備':reward.kind==='gold'?'資源':'補給';const ik=reward.kind==='skill'?'rune':reward.kind==='support'?'support':reward.kind==='gear'?'bag':reward.kind==='gold'?'coin':'heal';const effect=reward.kind==='skill'?'學會或升級一項永久影響本次遠征的旅者能力。':reward.kind==='support'?'放入背包，可插入武器、頭部、身體或腳部的技能孔。':reward.kind==='gear'?`取得一件${reward.item?.rarityName||''}${SLOT_LABELS[reward.item?.slot]||''}裝備，裝備本身也帶有技能孔。`:reward.kind==='gold'?'立即取得資源，用於黑鐵工坊購買強化。':'立即恢復或提高生存能力。';card.innerHTML=`<div class="reward-kind">${iconSvg(ik,13)}${kindLabel}</div><div class="head"><div class="ico">${reward.kind==='gear'?(reward.icon||'▧'):iconSvg(ik,38)}</div><div><h4>${reward.name}</h4><small>${reward.meta}</small></div></div><p>${reward.desc}</p><div class="reward-effect">${effect}</div><button>選擇這項獎勵</button>`;card.querySelector('button').onclick=()=>chooseChestReward(index);root.appendChild(card)});$('#skillModal').classList.remove('hidden')};const basePoiMeta=poiMeta;poiMeta=function(type){const data=basePoiMeta(type);if(type==='support'&&data)return {...data,desc:'技能石可插入武器、頭部、身體或腳部裝備的相容技能孔。'};return data};})();

/* v0.26 combat taxonomy: magic/physical + projectile/beam */
(() => {
 const addTag=(w,t)=>{if(w&&!w.tags.includes(t))w.tags.push(t)};
 const removeTag=(w,t)=>{if(w)w.tags=w.tags.filter(x=>x!==t)};
 addTag(WEAPONS.fireStaff,'magic');
 addTag(WEAPONS.longbow,'physical');
 addTag(WEAPONS.greatAxe,'physical');
 addTag(WEAPONS.stormWand,'magic');
 removeTag(WEAPONS.stormWand,'projectile');
 addTag(WEAPONS.stormWand,'beam');
 WEAPONS.stormWand.pattern='beam';
 WEAPONS.frostRay={id:'frostRay',name:'寒霜射線杖',icon:'❄',tags:['spell','magic','ice','beam'],baseDamage:17,rate:1.08,sockets:3,pattern:'beam'};

 if(SUPPORTS.chain){delete SUPPORTS.chain.requires;SUPPORTS.chain.requiresAny=['projectile','beam'];SUPPORTS.chain.desc='投射物或射線命中後，連向另一名敵人';}
 SUPPORTS.magicAmp={id:'magicAmp',name:'魔法增幅',icon:'✧',requires:['magic'],desc:'魔法武器傷害 +30%',mods:{damage:1.30}};
 SUPPORTS.physicalAmp={id:'physicalAmp',name:'物理增幅',icon:'◆',requires:['physical'],desc:'物理武器傷害 +30%',mods:{damage:1.30}};

 window.weaponDamageClass=w=>w?.tags?.includes('magic')?'魔法':w?.tags?.includes('physical')?'物理':'其他';
 window.weaponAttackForm=w=>w?.tags?.includes('beam')?'射線物':w?.tags?.includes('projectile')?'投射物':w?.tags?.includes('melee')?'近戰':'特殊';

 const oldFxKind=weaponFxKind;
 weaponFxKind=function(w){const tags=w?.tags||[];if(tags.includes('ice'))return 'ice';if(tags.includes('lightning'))return 'lightning';if(tags.includes('fire'))return 'fire';return oldFxKind(w)};
 const oldSkillName=skillName;
 skillName=function(w){if(w?.id==='frostRay')return '寒霜射線';if(w?.id==='thunderOath')return '雷誓射線';if(w?.id==='starfireStaff')return '星火術';return oldSkillName(w)};

 const oldCastVfx=castVfx;
 castVfx=function(w,b,index,total,targetIndex=0){
  const tags=new Set(w?.tags||[]),from=getPlayerAnchor(),to=getEnemyAnchor(targetIndex),kind=weaponFxKind(w);
  const ids=(window.GRIMSKILL?.supportIds?window.GRIMSKILL.supportIds(game.loadout):(game.loadout.supports||[]));
  const multi=b.projectiles>1||ids.includes('multi');
  if(tags.has('beam')){
   if(index===0){spawnRune(kind,from);stageFlash(kind,180)}
   spawnBeam({x:from.x+14,y:from.y-18},{x:to.x-4,y:to.y-14},kind);
   if(b.chain>0){const count=Math.max(1,document.querySelectorAll('.enemy-card').length),next=(targetIndex+1)%count;if(next!==targetIndex){const a=getEnemyAnchor(next);setTimeout(()=>spawnBeam({x:to.x,y:to.y-8},a,kind),70)}}
   return;
  }
  if(tags.has('projectile')&&tags.has('fire')){
   if(index===0){spawnRune('fire',from);stageFlash('fire',180)}
   spawnMissile({x:from.x+6,y:from.y-20+(index-(total-1)/2)*7},{x:to.x,y:to.y-12+(index-(total-1)/2)*4},'fire',{multi});return;
  }
  if(tags.has('projectile')&&tags.has('physical')){
   if(index===0){spawnRune('physical',from);stageFlash('physical',180)}
   spawnMissile({x:from.x+18,y:from.y-12+(index-(total-1)/2)*5},{x:to.x,y:to.y-10+(index-(total-1)/2)*3},'arrow');return;
  }
  if(tags.has('melee')){
   if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,ids.includes('brutal'));stageShake(ids.includes('brutal')?'heavy':'light')}
   return;
  }
  return oldCastVfx(w,b,index,total,targetIndex);
 };

 const style=document.createElement('style');
 style.textContent=`
 .fx-beam.ice{background:linear-gradient(90deg,#f9ffff,#d9f7ff 28%,#8cdcff 58%,#64aeee00);box-shadow:0 0 10px #e5fbff,0 0 28px #77ceff}
 .fx-rune.ice{border-color:#bdefffaa;box-shadow:0 0 0 3px #0003 inset,0 0 34px #78d8ff66}.fx-rune.ice:before,.fx-rune.ice:after{border-color:#eaffffaa}
 .fx-impact.ice{background:radial-gradient(circle,#fff 0 12%,#dffbff 13%,#8edfff 42%,#4a99d8 65%,#0000 72%)}
 .fx-shockwave.ice{border-color:#aeeaffaa}
 .battle-stage.flash-ice{box-shadow:inset 0 0 0 999px #b9efff24,inset 0 -60px 100px #0007,0 0 48px #75d2ff55}
 .battle-stage.theme-frostRay{background:radial-gradient(circle at 52% 42%,#284354 0,#172b36 34%,#10191d 68%,#09100d 100%)}
 `;
 document.head.appendChild(style);

 const normalizeBattleLine=()=>{const el=document.querySelector('#battleWeaponLine'),w=game?.loadout?.weapon;if(!el||!w)return;const form=weaponAttackForm(w),cls=weaponDamageClass(w);const html=el.innerHTML;const next=html.replace(/·\s*\d+\s*投射物\s*·/,`· ${cls} · ${form}${form==='投射物'?` ×${compileBuild(w,window.GRIMSKILL?.supportIds?window.GRIMSKILL.supportIds(game.loadout):(game.loadout.supports||[]),game.loadout.passives||{}).projectiles}`:''} ·`);if(next!==html)el.innerHTML=next};
 const line=document.querySelector('#battleWeaponLine');if(line)new MutationObserver(normalizeBattleLine).observe(line,{childList:true,subtree:true,characterData:true});
})();