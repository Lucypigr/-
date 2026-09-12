(() => {
  const G=window.GRIMSKILL, X=window.GRIMWEAPON, A=window.GRIMAFFIX;
  if(!G||!X) return;
  const previousPlay=playBattle;
  let current=null;

  const alive=rt=>rt.enemies.map((e,i)=>e.hp>0?i:-1).filter(i=>i>=0);
  const fxColor=k=>k==='lightning'?'#cce8ff':k==='fire'?'#ffbf73':k==='ice'?'#d8f7ff':k==='blight'?'#caff95':k==='void'?'#d8b7ff':'#f3dd9e';
  function rawHit(rt,i,dmg,kind='physical',label=''){
    const e=rt.enemies[i];if(!e||e.hp<=0)return 0;
    e.hp=Math.max(0,e.hp-dmg);updateEnemyHp(i,e.hp,e.maxHp);pulseEnemy(i);floatDamage('enemy',dmg,false,i);spawnImpact(getEnemyAnchor(i),kind,fxColor(kind),kind==='lightning'||kind==='void'?11:9);
    if(label){const st=document.querySelector(`.enemy-card[data-enemy-index="${i}"] .battle-status`);if(st&&e.hp>0)st.textContent=label;}
    if(e.hp<=0){const st=document.querySelector(`.enemy-card[data-enemy-index="${i}"] .battle-status`);if(st)st.textContent='已倒下';}
    return dmg;
  }
  function dotTick(rt,dt){
    for(let i=0;i<rt.enemies.length;i++){
      const e=rt.enemies[i];if(e.hp<=0)continue;let dot=0;
      if(e.burn>0){dot+=rt.build.damage*.10*dt;e.burn-=dt;}
      e.bleeds=(e.bleeds||[]).filter(x=>x.until>rt.time);for(const x of e.bleeds)dot+=x.dps*dt;
      e.poisons=(e.poisons||[]).filter(x=>x.until>rt.time);for(const x of e.poisons)dot+=x.dps*dt;
      if(dot>0){e.hp=Math.max(0,e.hp-dot);updateEnemyHp(i,e.hp,e.maxHp);if(e.hp<=0){const st=document.querySelector(`.enemy-card[data-enemy-index="${i}"] .battle-status`);if(st)st.textContent='已倒下';}}
      if(e.shock>0)e.shock-=dt;
    }
  }
  function guardBurst(rt){if(!rt.guardActive)return;rt.guardActive=false;alive(rt).forEach((i,n)=>setTimeout(()=>rawHit(rt,i,rt.build.damage*.8,'fire'),n*45));spawnRune('fire',getPlayerAnchor());stageFlash('fire',160);$('#battlePlayerStatus').textContent='熔火壁障爆裂';}
  function targetModifier(rt,i,w){const e=rt.enemies[i];let mult=1;if(e.shock>0)mult*=1+(rt.build.shock||0);if(w.tags?.includes('physical')&&e.armorBreak)mult*=1+e.armorBreak*.06;return mult;}
  function applyTrait(rt,i,w,baseDamage){
    const e=rt.enemies[i],tr=w.trait||{},kind=weaponFxKind(w),labels=[];let dmg=baseDamage*targetModifier(rt,i,w);
    const critBonus=rt.build.critDamageBonus||0,critChance=Math.min(.75,(rt.build.critChance||0)+(tr.id==='iaiCrit'?(tr.critChance||0):0));
    const critMult=(tr.id==='iaiCrit'?(tr.critMult||2):1.5)+critBonus;
    if(critChance>0&&game.rng()<critChance){dmg*=critMult;labels.push(`暴擊 ×${critMult.toFixed(2)}`);}
    if(tr.id==='precision'){
      if(rt.precisionTarget===i)rt.precisionStacks=Math.min(tr.maxStacks,(rt.precisionStacks||0)+1);else{rt.precisionTarget=i;rt.precisionStacks=0;}
      dmg*=1+(rt.precisionStacks||0)*tr.stackDamage;labels.push(`精準 ${rt.precisionStacks||0}/${tr.maxStacks}`);
    }
    if(tr.id==='focus'){
      if(rt.focusTarget===i)rt.focusStacks=Math.min(tr.maxStacks,(rt.focusStacks||0)+1);else{rt.focusTarget=i;rt.focusStacks=0;}
      dmg*=1+(rt.focusStacks||0)*tr.stackDamage;labels.push(`聚焦 ${rt.focusStacks||0}/${tr.maxStacks}`);
    }
    rawHit(rt,i,dmg,kind,labels.join(' · '));
    if(tr.id==='stun'&&e.hp>0&&game.rng()<tr.chance){const d=rt.enemyId==='boss'?tr.bossDuration:tr.duration;e.stunnedUntil=Math.max(e.stunnedUntil||0,rt.time+d);labels.push(`暈眩 ${d.toFixed(1)}s`);}
    if(tr.id==='armorBreak'&&e.hp>0){e.armorBreak=Math.min(tr.maxStacks,(e.armorBreak||0)+1);labels.push(`碎甲 ${e.armorBreak}/${tr.maxStacks}`);}
    if(tr.id==='bleed'&&e.hp>0&&game.rng()<tr.chance){e.bleeds ||= [];if(e.bleeds.length>=tr.maxStacks)e.bleeds.shift();e.bleeds.push({until:rt.time+tr.duration,dps:rt.build.damage*tr.dpsFactor});labels.push(`流血 ${e.bleeds.length}/${tr.maxStacks}`);}
    if(tr.id==='corrosion'&&e.hp>0){e.poisons ||= [];if(e.poisons.length>=tr.maxStacks)e.poisons.shift();e.poisons.push({until:rt.time+tr.duration,dps:rt.build.damage*tr.dpsFactor});labels.push(`毒素 ${e.poisons.length}/${tr.maxStacks}`);}
    if(tr.id==='frost'&&e.hp>0){e.frost=(e.frost||0)+tr.buildup;if(e.frost>=100){e.frost=0;const d=rt.enemyId==='boss'?tr.bossFreeze:tr.freeze;e.stunnedUntil=Math.max(e.stunnedUntil||0,rt.time+d);labels.push(`冰凍 ${d.toFixed(1)}s`);}else labels.push(`寒霜 ${Math.round(e.frost)}%`);}
    if((tr.id==='emberBurst'||rt.build.ignite>0)&&e.hp>0){const chance=Math.min(.85,(tr.igniteChance||0)+(rt.build.ignite||0));if(game.rng()<chance)e.burn=2.5;}
    if(rt.build.shock>0&&e.hp>0)e.shock=2.2;
    if(labels.length&&e.hp>0){const st=document.querySelector(`.enemy-card[data-enemy-index="${i}"] .battle-status`);if(st)st.textContent=labels.join(' · ');}
    return dmg;
  }
  function attackOnce(rt,w,castIndex){
    const fury=rt.time<rt.furyUntil,aliveNow=alive(rt);if(!aliveNow.length)return;
    const charged=w.trait?.id==='chargedBolt'&&castIndex%w.trait.every===0;
    const rolled=typeof rollBuildDamage==='function'?rollBuildDamage(rt.build,game.rng):rt.build.damage;
    const base=rolled*(fury?1.15:1)*(charged?w.trait.mult:1);
    if(charged){$('#battlePlayerStatus').textContent='蓄力射擊 · 220%';stageShake('heavy');}
    const form=X.attackForm(w),volley=form==='投射物'?Math.min(7,rt.build.projectiles):1;
    for(let v=0;v<volley;v++)setTimeout(()=>castVfx(w,rt.build,v,volley,aliveNow[v%aliveNow.length]||0),v*40);
    if(w.trait?.id==='spearPierce'){aliveNow.slice(0,1+w.trait.extraTargets).forEach((i,n)=>{if(n>0)setTimeout(()=>spawnSlash(i,false),n*55);applyTrait(rt,i,w,base);});return;}
    const shots=form==='投射物'?rt.build.projectiles:1;
    for(let p=0;p<shots;p++){
      let list=alive(rt);if(!list.length)break;let target=list[p%list.length],hops=1+(rt.build.chain||0),pierce=rt.build.pierce||0;
      while(target!==undefined&&hops-->0){applyTrait(rt,target,w,base);list=alive(rt).filter(i=>i!==target);if(pierce>0){pierce--;target=list[0]}else if(hops>0)target=list[0];else target=undefined;}
    }
  }

  async function liveBattleV28(c){
    uiBusy=true;closeBag();clearBattleFx();G.addBattleUI();const modal=$('#battleModal'),w=game.loadout.weapon,e=c.enemy;modal.classList.remove('hidden');$('#battleContinue').classList.add('hidden');applyBattleTheme(w);
    const b=compileBuild(w,G.supportIds(game.loadout),game.loadout.passives||{}),count=e.count[0]+Math.floor(game.rng()*(e.count[1]-e.count[0]+1));
    const enemies=Array.from({length:count},()=>({hp:e.hp,maxHp:e.hp,shock:0,burn:0,bleeds:[],poisons:[],stunnedUntil:0,armorBreak:0,frost:0}));
    const rt=current={time:0,playerHp:game.loadout.hp,enemies,build:b,cooldowns:{},guardActive:false,guardUntil:0,guardCharges:0,furyUntil:0,dodgeNext:false,finished:false,casts:0,enemyId:c.enemyId};
    renderEnemyGroup(e,enemies.map(x=>x.hp));G.renderBattleUI(rt);G.updateButtons(rt);
    $('#battleTurnLabel').textContent=`${e.name}${count>1?` · ${count} 名敵人`:''} · LIVE BATTLE`;
    $('#battleBanner').innerHTML=`${iconSvg('sword',15)} ${w.name} <span style="opacity:.5;margin:0 8px">VS</span> ${e.name}${count>1?` ×${count}`:''}`;
    const cls=X.damageClass(w),form=X.attackForm(w),tr=w.trait,dmgText=b.damageMin!=null?`${Math.round(b.damageMin)}–${Math.round(b.damageMax)}`:b.damage.toFixed(1);
    $('#battleWeaponLine').innerHTML=`<b>${skillName(w)}</b> · 傷害 ${dmgText} · ${cls} · ${form}${form==='投射物'?` ×${b.projectiles}`:''} · ${b.rate.toFixed(2)}s${w.itemLevel?` · Lv.${w.itemLevel}`:''}${tr?`<br><span class="weapon-trait-battle">${tr.name}：${tr.desc}</span>`:''}`;
    const sups=G.supportIds(game.loadout);$('#battleSupports').innerHTML=sups.length?sups.map(id=>`<span class="support-chip">${SUPPORTS[id].icon} ${SUPPORTS[id].name}</span>`).join(''):'<span class="support-chip">沒有 Support</span>';
    $('#battleLiveLog').textContent='';$('#battlePlayerStatus').textContent='LIVE · 1/2/3 可施放主動技能';setPlayerBattleHp(rt.playerHp,game.loadout.maxHp);
    let nextP=0,nextE=e.rate,last=performance.now();
    while(rt.playerHp>0&&alive(rt).length&&rt.time<45){
      const now=performance.now(),dt=Math.min(.12,(now-last)/1000);last=now;rt.time+=dt;dotTick(rt,dt);
      if(rt.guardActive&&rt.time>=rt.guardUntil)guardBurst(rt);
      if(rt.time>=nextP&&alive(rt).length){const fury=rt.time<rt.furyUntil;nextP=rt.time+b.rate*(fury?.72:1);rt.casts++;attackOnce(rt,w,rt.casts);}
      if(rt.time>=nextE&&alive(rt).length){
        nextE=rt.time+e.rate;const attackers=alive(rt).filter(i=>(rt.enemies[i].stunnedUntil||0)<=rt.time);
        if(attackers.length){let dmg=e.damage*Math.min(3,attackers.length);dmg*=b.equipmentBonuses?.damageTakenMult||1;dmg*=b.auraDamageTakenMult||1;dmg*=b.weaponDamageTakenMult||1;
          if(rt.dodgeNext){rt.dodgeNext=false;dmg=0;$('#battlePlayerStatus').textContent='裂界閃步 · 完全閃避'}
          else if(rt.guardActive){dmg*=.5;rt.guardCharges--;$('#battlePlayerStatus').textContent=`熔火壁障 · 剩 ${Math.max(0,rt.guardCharges)} 次`;if(rt.guardCharges<=0)guardBurst(rt)}
          enemyAttackVfx(e);if(dmg>0){rt.playerHp=Math.max(0,rt.playerHp-dmg);floatDamage('player',dmg,true);setPlayerBattleHp(rt.playerHp,game.loadout.maxHp)}
        }else $('#battlePlayerStatus').textContent='敵人遭到控制，無法攻擊';
      }
      G.updateButtons(rt);await sleep(50);
    }
    rt.finished=true;current=null;const won=alive(rt).length===0;game.loadout.hp=Math.max(0,rt.playerHp);Object.assign(c,{won,seconds:rt.time,casts:rt.casts,build:b,enemies,playerHp:game.loadout.hp,log:[]});game.lastCombat=c;
    if(won){
      c.tile.cleared=true;const boss=c.enemyId==='boss';game.gold+=(boss?50:6)+(boss?0:(game.loadout.passives.goldOnKill||0));G.grantXp(game,boss?80:10+Math.floor(game.rng()*5));
      if(boss){game.won=true;game.message='裂界守門者倒下了。'}else game.message=`擊敗 ${e.name}，獲得經驗與金幣。`;
      if(A){let stones=boss?2:0;if(!boss)for(let i=0;i<enemies.length;i++)if(game.rng()<.18)stones++;if(stones)A.grantIdentifyStone(game,stones,boss?'Boss 掉落':'怪物掉落');}
      $('#battleBanner').textContent='勝利 · 所有敵人已清除';$('#battlePlayerStatus').textContent='戰鬥結束';
    }else{game.dead=true;game.message='你倒在裂界之中。';$('#battleBanner').textContent='敗北 · 餘燼熄滅';$('#battlePlayerStatus').textContent='生命之火熄滅';stageShake('heavy');}
    updateCombatSummary(c);G.updateButtons(rt);await sleep(180);$('#battleContinue').classList.remove('hidden');
  }

  playBattle=async c=>c?.interactive?liveBattleV28(c):previousPlay(c);
  window.addEventListener('keydown',e=>{if(!current||current.finished)return;const n=Number(e.key),g=G.activeGems()[n-1];if(g){e.preventDefault();G.activate(g.id,current)}});
  const st=document.createElement('style');st.textContent=`.weapon-trait-battle{display:inline-block;margin-top:5px;color:#d6bd8f;font-size:11px;line-height:1.4}`;document.head.appendChild(st);
})();