function updateCombatSummary(c){
 if(!c)return;
 $('#combatLog').innerHTML=`最近戰鬥：<b>${c.enemy.name}</b><br>${c.won?'勝利':'戰敗'} · ${c.seconds.toFixed(1)} 秒 · 施放 ${c.casts} 次`;
}
function clearBattleFx(){const fx=$('#battleFx');if(fx)fx.innerHTML='';const stage=$('#battleStage');if(stage)stage.className='battle-stage';}
function battleStageRect(){return $('#battleStage').getBoundingClientRect()}
function battlePointForElement(el,fallbackX=.5,fallbackY=.5){const s=battleStageRect();if(!el)return{x:s.width*fallbackX,y:s.height*fallbackY};const r=el.getBoundingClientRect();return{x:r.left-s.left+r.width*.5,y:r.top-s.top+r.height*.5}}
function getPlayerAnchor(){return battlePointForElement($('#battlePlayerUnit'),.23,.55)}
function getEnemyAnchor(targetIndex=0){const cards=[...document.querySelectorAll('.enemy-card')];const card=(cards[targetIndex]||cards[0]);const sprite=card?.querySelector('.battle-unit')||card;return battlePointForElement(sprite,.76,.42)}
function addBattleFx(className,styles={}){const fx=$('#battleFx');const el=document.createElement('i');el.className=className;for(const [k,v] of Object.entries(styles)){if(k.startsWith('--'))el.style.setProperty(k,v);else el.style[k]=v}fx.appendChild(el);return el}
function timedClass(el,cls,ms=240){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)}
function applyBattleTheme(w){const stage=$('#battleStage');if(!stage)return;stage.className='battle-stage';stage.classList.add(`theme-${w.id}`)}
function stageFlash(kind='physical',ms=170){const stage=$('#battleStage');if(!stage)return;const cls=`flash-${kind}`;timedClass(stage,cls,ms)}
function stageShake(level='light',ms){const stage=$('#battleStage');if(!stage)return;const cls=level==='heavy'?'shake-heavy':'shake-light';timedClass(stage,cls,ms||(level==='heavy'?340:240))}
function spawnRune(kind='physical',anchor=getPlayerAnchor()){const el=addBattleFx(`fx-rune ${kind}`,{left:`${anchor.x}px`,top:`${anchor.y+18}px`});setTimeout(()=>el.remove(),500);return el}
function spawnShockwave(anchor,kind='physical',scale=1){const el=addBattleFx(`fx-shockwave ${kind}`,{left:`${anchor.x}px`,top:`${anchor.y}px`,transform:`translate(-50%,-50%) scale(${scale})`});setTimeout(()=>el.remove(),500);return el}
function spawnImpact(anchor,kind='physical',spark='#ffd27f',count=9){const impact=addBattleFx(`fx-impact ${kind}`,{left:`${anchor.x}px`,top:`${anchor.y}px`});const burst=addBattleFx('fx-burst',{left:`${anchor.x}px`,top:`${anchor.y}px`});for(let i=0;i<count;i++){const ang=Math.PI*2*(i/count)+(Math.random()-.5)*.4;const dist=26+Math.random()*42;const sparkEl=addBattleFx('fx-spark',{left:`${anchor.x}px`,top:`${anchor.y}px`,'--dx':`${Math.cos(ang)*dist}px`,'--dy':`${Math.sin(ang)*dist}px`,'--spark':spark,'--delay':`${Math.floor(Math.random()*40)}ms`});setTimeout(()=>sparkEl.remove(),620)}setTimeout(()=>{impact.remove();burst.remove()},420)}
function spawnTrail(from,to,kind='fire'){const dx=to.x-from.x,dy=to.y-from.y;const dist=Math.hypot(dx,dy);const rot=Math.atan2(dy,dx)*180/Math.PI;const el=addBattleFx(`fx-trail ${kind}`,{left:`${from.x}px`,top:`${from.y}px`,width:`${dist}px`,transform:`rotate(${rot}deg)`,'--rot':`${rot}deg`});setTimeout(()=>el.remove(),340)}
function spawnMissile(from,to,kind='fire',opts={}){const dx=to.x-from.x,dy=to.y-from.y;const rot=Math.atan2(dy,dx)*180/Math.PI;const el=addBattleFx(`fx-missile ${kind}${opts.multi?' multi':''}`,{left:`${from.x}px`,top:`${from.y}px`,transform:`translate(-50%,-50%) rotate(${rot}deg)`,'--dx':`${dx}px`,'--dy':`${dy}px`});setTimeout(()=>el.remove(),460);if(kind==='fire'||kind==='arrow')spawnTrail(from,to,kind==='fire'?'fire':'arrow')}
function spawnBeam(from,to,kind='lightning'){const dx=to.x-from.x,dy=to.y-from.y;const dist=Math.hypot(dx,dy);const rot=Math.atan2(dy,dx)*180/Math.PI;const el=addBattleFx(`fx-beam ${kind}`,{left:`${from.x}px`,top:`${from.y}px`,width:`${dist}px`,transform:`rotate(${rot}deg)`,'--rot':`${rot}deg`});setTimeout(()=>el.remove(),260)}
function spawnSlash(targetIndex=0,heavy=false){const a=getEnemyAnchor(targetIndex);const el=addBattleFx('fx-slash upgraded',{left:`${a.x}px`,top:`${a.y}px`,'--rot':`${-26+Math.random()*12}deg`,width:`${heavy?150:125}px`});setTimeout(()=>el.remove(),360)}
function spawnEnemySwipe(from,to,color='physical'){const dx=to.x-from.x,dy=to.y-from.y;const dist=Math.hypot(dx,dy);const rot=Math.atan2(dy,dx)*180/Math.PI;const el=addBattleFx('fx-enemy-swipe',{left:`${from.x}px`,top:`${from.y}px`,width:`${Math.max(50,dist*.65)}px`,transform:`rotate(${rot}deg)`,'--rot':`${rot}deg`});if(color==='blight'){el.style.background='linear-gradient(90deg,#e8ffd5,#69d86d 40%,#69d86d00 100%)'}else if(color==='fire'){el.style.background='linear-gradient(90deg,#ffe1b7,#d66d46 40%,#d66d4600 100%)'}setTimeout(()=>el.remove(),320)}
function weaponFxKind(w){return w.id==='fireStaff'?'fire':w.id==='stormWand'?'lightning':'physical'}
function enemyFxKind(enemy){const id=(enemy&&enemy.id)||'';if(id==='shaman')return 'blight';if(id==='cultist'||id==='boss')return 'fire';return 'physical'}
function castVfx(w,b,index,total,targetIndex=0){const from=getPlayerAnchor();const to=getEnemyAnchor(targetIndex);const kind=weaponFxKind(w);const multi=b.projectiles>1||game.loadout.supports.includes('multi');if(index===0){spawnRune(kind,from);stageFlash(kind,180)}if(w.id==='fireStaff'){spawnMissile({x:from.x+6,y:from.y-20+(index-(total-1)/2)*7},{x:to.x,y:to.y-12+(index-(total-1)/2)*4},'fire',{multi});if(game.loadout.supports.includes('rapid')){const spark=addBattleFx('fx-spark',{left:`${from.x+8}px`,top:`${from.y-16}px`,'--dx':'18px','--dy':'-12px','--spark':'#ffd394'});setTimeout(()=>spark.remove(),520)}}
 else if(w.id==='longbow'){if(index===0)spawnRune('physical',from);spawnMissile({x:from.x+18,y:from.y-12+(index-(total-1)/2)*5},{x:to.x,y:to.y-10+(index-(total-1)/2)*3},'arrow');}
 else if(w.id==='greatAxe'){if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,game.loadout.supports.includes('brutal'));stageShake(game.loadout.supports.includes('brutal')?'heavy':'light')}}
 else if(w.id==='stormWand'){spawnRune('lightning',from);spawnBeam({x:from.x+14,y:from.y-18},{x:to.x-4,y:to.y-14},'lightning');if(b.chain>0){const next=(targetIndex+1)%Math.max(1,document.querySelectorAll('.enemy-card').length);if(next!==targetIndex){const nextAnchor=getEnemyAnchor(next);setTimeout(()=>spawnBeam({x:to.x,y:to.y-8},nextAnchor,'lightning'),70)}}}
}
function hitVfx(w,b,targetIndex,damage){const to=getEnemyAnchor(targetIndex);const kind=w.id==='stormWand'?'lightning':w.id==='fireStaff'?'fire':(ENEMIES[(game.lastCombat?.enemy||{}).id||'']?.id==='stalker'?'blight':'physical');const spark=kind==='fire'?'#ffbf73':kind==='lightning'?'#cce8ff':'#f3dd9e';spawnImpact(to,kind,spark,kind==='lightning'?11:9);spawnShockwave(to,kind,w.id==='greatAxe'||game.loadout.supports.includes('brutal')?1.2:1);if(w.id==='greatAxe'||game.loadout.supports.includes('brutal'))stageShake('heavy');else stageShake('light');stageFlash(kind,140);if(b.ignite>0&&w.id==='fireStaff'){for(let i=0;i<4;i++){const ember=addBattleFx('fx-spark',{left:`${to.x}px`,top:`${to.y-8}px`,'--dx':`${(Math.random()-.5)*28}px`,'--dy':`${-18-Math.random()*36}px`,'--spark':'#ff8f4a','--delay':`${i*20}ms`});setTimeout(()=>ember.remove(),620)}}
 if((b.shock>0||w.id==='stormWand')&&document.querySelectorAll('.enemy-card').length>1){const next=(targetIndex+1)%document.querySelectorAll('.enemy-card').length;if(next!==targetIndex){setTimeout(()=>spawnBeam({x:to.x,y:to.y-6},getEnemyAnchor(next),'lightning'),45)}}
}
function enemyAttackVfx(enemy){
 const id=(enemy&&enemy.id)||'';
 const from=getEnemyAnchor(0),to=getPlayerAnchor();
 const enemyCard=document.querySelector('.enemy-card[data-enemy-index="0"]');
 if(enemyCard){enemyCard.classList.add('targeted');setTimeout(()=>enemyCard.classList.remove('targeted'),260)}
 if(id==='wolf'){
  spawnEnemySwipe({x:from.x-22,y:from.y-6},to,'physical');
  setTimeout(()=>spawnEnemySwipe({x:from.x-8,y:from.y+10},{x:to.x+8,y:to.y+10},'physical'),70);
  spawnImpact({x:to.x+22,y:to.y-16},'physical','#f6e0b2',8);
  stageFlash('physical',110);stageShake('light');
 }else if(id==='cultist'){
  spawnRune('fire',{x:from.x-6,y:from.y+12});
  setTimeout(()=>spawnMissile({x:from.x-8,y:from.y-16},{x:to.x+16,y:to.y-18},'fire',{}),65);
  setTimeout(()=>{spawnImpact({x:to.x+16,y:to.y-18},'fire','#ffc27e',10);spawnShockwave({x:to.x+16,y:to.y-18},'fire',1.05)},230);
  stageFlash('fire',145);stageShake('light');
 }else if(id==='shaman'){
  spawnRune('blight',{x:from.x-6,y:from.y+14});
  setTimeout(()=>spawnBeam({x:from.x-10,y:from.y-12},{x:to.x+18,y:to.y-18},'blight'),55);
  setTimeout(()=>spawnMissile({x:from.x-10,y:from.y-6},{x:to.x+28,y:to.y-2},'blight',{}),90);
  setTimeout(()=>{spawnImpact({x:to.x+20,y:to.y-16},'blight','#caff95',10);spawnShockwave({x:to.x+20,y:to.y-16},'blight',1.15)},220);
  stageFlash('blight',140);stageShake('light');
 }else if(id==='stalker'){
  spawnRune('blight',{x:from.x-2,y:from.y+16});
  spawnEnemySwipe({x:from.x-26,y:from.y-4},to,'blight');
  setTimeout(()=>spawnEnemySwipe({x:from.x-14,y:from.y+12},{x:to.x+14,y:to.y+14},'blight'),80);
  setTimeout(()=>{spawnImpact({x:to.x+24,y:to.y-18},'blight','#bafc8d',9);spawnShockwave({x:to.x+24,y:to.y-18},'blight',1.18)},135);
  stageFlash('blight',150);stageShake('light');
 }else if(id==='boss'){
  spawnRune('fire',{x:from.x-8,y:from.y+14});
  setTimeout(()=>spawnRune('fire',{x:to.x+18,y:to.y+18}),70);
  setTimeout(()=>spawnEnemySwipe({x:from.x-30,y:from.y-8},to,'fire'),95);
  setTimeout(()=>spawnEnemySwipe({x:from.x-12,y:from.y+8},{x:to.x+18,y:to.y+12},'fire'),155);
  setTimeout(()=>{spawnImpact({x:to.x+20,y:to.y-16},'fire','#ffd08e',12);spawnShockwave({x:to.x+20,y:to.y-16},'fire',1.45)},205);
  stageFlash('fire',190);stageShake('heavy');
 }else{
  const kind=enemyFxKind(enemy);
  spawnEnemySwipe({x:from.x-20,y:from.y-6},to,kind);
  spawnImpact({x:to.x+26,y:to.y-18},kind,kind==='blight'?'#c7ff99':kind==='fire'?'#ffbf7f':'#ffd9a6',7);
  stageFlash(kind==='blight'?'blight':kind==='fire'?'fire':'physical',120);stageShake('light');
 }
}
function floatDamage(side,damage,hurt=false,targetIndex=0){const fx=$('#battleFx'),d=document.createElement('div');d.className=`damage-float ${hurt?'hurt':''}`;d.textContent=`-${Math.round(damage)}`;if(side==='enemy'){const p=getEnemyAnchor(targetIndex);d.style.left=`${p.x}px`;d.style.top=`${Math.max(85,p.y-42)}px`;}else{const p=getPlayerAnchor();d.style.left=`${p.x}px`;d.style.top=`${Math.max(85,p.y-54)}px`;}fx.appendChild(d);setTimeout(()=>d.remove(),700)}
function setPlayerBattleHp(playerHp,playerMax){$('#battlePlayerHp').style.width=`${Math.max(0,playerHp/playerMax*100)}%`}
function enemyUnitHtml(enemy){return enemy.art?`<img class="battle-unit sprite" src="${enemy.art}" alt="${enemy.name}">`:`<div class="battle-unit">${enemy.icon}</div>`}
function renderEnemyGroup(enemy,enemyHps){const root=$('#battleEnemyGroup');root.innerHTML='';enemyHps.forEach((hp,i)=>{const card=document.createElement('div');card.className='enemy-card';card.dataset.enemyIndex=i;card.innerHTML=`${enemyUnitHtml(enemy)}<div class="battle-name">${enemy.name}${enemyHps.length>1?` ${i+1}`:''}</div><div class="battle-hp"><i style="width:${Math.max(0,hp/enemy.hp*100)}%"></i></div><div class="battle-status">${hp>0?'準備交戰':'已倒下'}</div>`;root.appendChild(card)});}
function updateEnemyHp(index,hp,maxHp){const card=document.querySelector(`.enemy-card[data-enemy-index="${index}"]`);if(!card)return;const bar=card.querySelector('.battle-hp i');if(bar)bar.style.width=`${Math.max(0,hp/maxHp*100)}%`;if(hp<=0)card.classList.add('dead')}
function pulseEnemy(index){const card=document.querySelector(`.enemy-card[data-enemy-index="${index}"]`);if(!card)return;card.classList.add('hit','targeted');setTimeout(()=>card.classList.remove('hit','targeted'),220)}
function skillName(w){return w.id==='fireStaff'?'火球術':w.id==='longbow'?'穿心箭':w.id==='greatAxe'?'裂地斬':w.id==='stormWand'?'連鎖雷擊':w.name}

async function playBattle(c){
 uiBusy=true;closeBag();clearBattleFx();
 const modal=$('#battleModal'),w=game.loadout.weapon,b=c.build;modal.classList.remove('hidden');$('#battleContinue').classList.add('hidden');applyBattleTheme(w);
 $('#battleTurnLabel').textContent=`${c.enemy.name}${(c.enemies?.length||1)>1?` · ${(c.enemies?.length||1)} 名敵人`:''} · AUTO BATTLE`;
 const enemyCount=Math.max(1,c.enemies?.length||1);const enemyHps=Array(enemyCount).fill(c.enemy.hp);
 renderEnemyGroup(c.enemy,enemyHps);$('#battleBanner').innerHTML=`${iconSvg('sword',15)} ${w.name} <span style="opacity:.5;margin:0 8px">VS</span> ${c.enemy.name}${enemyCount>1?` ×${enemyCount}`:''}`;
 $('#battleWeaponLine').innerHTML=`<b>${skillName(w)}</b> · 傷害 ${b.damage.toFixed(1)} · ${b.projectiles} 投射物 · ${b.rate.toFixed(2)}s`;
 $('#battleSupports').innerHTML=game.loadout.supports.length?game.loadout.supports.map(id=>`<span class="support-chip">${SUPPORTS[id].icon} ${SUPPORTS[id].name}</span>`).join(''):'<span class="support-chip">沒有 Support</span>';
 $('#battleLiveLog').textContent=`戰鬥開始 · 敵人 ${enemyCount} 名`;
 $('#battlePlayerStatus').textContent=game.loadout.supports.includes('rapid')?'迅捷施法中':game.loadout.supports.includes('brutal')?'重擊架式':'已就緒';
 $('#battlePlayerUnit').className='battle-unit';
 const received=c.log.filter(x=>x.type==='hurt').reduce((a,x)=>a+x.damage,0);let replayPlayerHp=Math.min(game.loadout.maxHp,c.playerHp+received);setPlayerBattleHp(replayPlayerHp,game.loadout.maxHp);
 let targetCursor=0;
 for(const ev of c.log){
  if(ev.type==='cast'){
   const label=skillName(w);$('#battleSkill').innerHTML=`${iconSvg(w.id==='stormWand'?'rune':w.id==='fireStaff'?'fire':'sword',16)} ${label}`;$('#battleSkill').classList.add('show');$('#battlePlayerUnit').classList.add('attack');
   $('#battleLiveLog').textContent=`施放 ${label}${ev.projectiles>1?` ×${ev.projectiles}`:''}`;
   const volley=Math.min(7,ev.projectiles);
   const spacing=game.loadout.supports.includes('rapid')?28:48;
   for(let i=0;i<volley;i++)setTimeout(()=>castVfx(w,b,i,volley,targetCursor%Math.max(1,enemyCount)),i*spacing);
   await sleep(w.id==='greatAxe'?300:(w.id==='stormWand'?250:280));$('#battlePlayerUnit').classList.remove('attack');$('#battleSkill').classList.remove('show');
  }else if(ev.type==='hit'){
   const idx=Number.isInteger(ev.target)?ev.target:targetCursor%Math.max(1,enemyCount);targetCursor=idx+1;
   if(enemyHps[idx]===undefined)enemyHps[idx]=c.enemy.hp;enemyHps[idx]=Math.max(0,enemyHps[idx]-ev.damage);
   updateEnemyHp(idx,enemyHps[idx],c.enemy.hp);pulseEnemy(idx);hitVfx(w,b,idx,ev.damage);floatDamage('enemy',ev.damage,false,idx);
   const alive=enemyHps.filter(h=>h>0).length;$('#battleLiveLog').textContent=`命中 ${c.enemy.name}${enemyCount>1?` ${idx+1}`:''}，造成 ${Math.round(ev.damage)} 傷害 · 剩餘 ${alive} 名`;
   const card=document.querySelector(`.enemy-card[data-enemy-index="${idx}"] .battle-status`);if(card){if(enemyHps[idx]<=0)card.textContent='已倒下';else if(b.ignite>0&&w.id==='fireStaff')card.textContent='🔥 點燃';else if(b.shock>0||w.id==='stormWand')card.textContent='⚡ 感電';else if(game.loadout.supports.includes('pierce'))card.textContent='➶ 穿透命中';else card.textContent='受創';}
   await sleep(w.id==='greatAxe'?220:160);
  }else if(ev.type==='hurt'){
   replayPlayerHp=Math.max(0,replayPlayerHp-ev.damage);enemyAttackVfx(c.enemy);floatDamage('player',ev.damage,true);$('#battlePlayerUnit').classList.add('hit');setPlayerBattleHp(replayPlayerHp,game.loadout.maxHp);
   $('#battleLiveLog').textContent=`敵方反擊，你受到 ${Math.round(ev.damage)} 傷害`;
   await sleep(210);$('#battlePlayerUnit').classList.remove('hit');
  }
 }
 if(c.won){enemyHps.fill(0);enemyHps.forEach((hp,i)=>updateEnemyHp(i,0,c.enemy.hp));stageFlash(weaponFxKind(w),220);$('#battleBanner').textContent='勝利 · 所有敵人已清除';$('#battleLiveLog').textContent=`戰鬥勝利，擊倒 ${enemyCount} 名敵人，共施放 ${c.casts} 次攻擊。`;$('#battlePlayerStatus').textContent='戰鬥結束 · 你站到了最後';}
 else{$('#battlePlayerUnit').classList.add('dead');stageFlash('physical',220);stageShake('heavy');$('#battleBanner').textContent='敗北 · 餘燼熄滅';$('#battleLiveLog').textContent='你倒在裂界之中。';$('#battlePlayerStatus').textContent='生命之火熄滅';}
 setPlayerBattleHp(c.playerHp,game.loadout.maxHp);await sleep(220);$('#battleContinue').classList.remove('hidden');
}
