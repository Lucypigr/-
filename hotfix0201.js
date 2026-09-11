(async()=>{
  const BUILD='0.20.1';
  const loadArt=async(name)=>{
    const r=await fetch(`./assets/monsters/${name}.b64?build=0201`,{cache:'no-store'});
    if(!r.ok)throw new Error(`monster art ${name}: ${r.status}`);
    return 'data:image/webp;base64,'+(await r.text()).trim();
  };
  const [cultistArt,shamanArt,stalkerArt,bossArt]=await Promise.all([
    loadArt('cultist'),loadArt('shaman'),loadArt('stalker'),loadArt('boss')
  ]);

  ENEMIES.cultist={...ENEMIES.cultist,id:'cultist',name:'灰燼信徒',art:cultistArt,hp:48,damage:9,rate:1.25,count:[1,2]};
  ENEMIES.shaman={id:'shaman',name:'瘟疫渡鴉薩滿',icon:'☠',art:shamanArt,hp:56,damage:10,rate:1.18,count:[1,1]};
  ENEMIES.stalker={id:'stalker',name:'沼林苔木獵魂者',icon:'✦',art:stalkerArt,hp:82,damage:13,rate:1.35,count:[1,1]};
  ENEMIES.boss={...ENEMIES.boss,id:'boss',name:'灰燼骨甲亡騎',art:bossArt,hp:330,damage:18,rate:1.15,count:[1,1]};
  const MONSTER_IDS=['wolf','cultist','shaman','stalker'];

  function tagEncounters(world,seed){
    const rng=seeded(((seed||1)^0x20a1f00d)>>>0);
    for(const row of world.tiles)for(const t of row){
      if(t.type===TILE.ENEMY)t.enemyId=MONSTER_IDS[Math.floor(rng()*MONSTER_IDS.length)];
      else if(t.type===TILE.BOSS)t.enemyId='boss';
    }
    return world;
  }
  const roadCreateWorld=createWorld;
  createWorld=function(seed=1){return tagEncounters(roadCreateWorld(seed),seed)};
  if(window.game?.world)tagEncounters(game.world,game.seed||1);

  const oldResolve=Game.prototype.resolveTile;
  Game.prototype.resolveTile=function(t){
    if(!t||t.cleared)return;
    if(t.type!==TILE.ENEMY&&t.type!==TILE.BOSS)return oldResolve.call(this,t);
    if(t.type===TILE.BOSS&&this.turn<BOSS_TURN){this.message=`守門者仍在沉睡。${BOSS_TURN-this.turn} 步後甦醒。`;return}
    const id=t.type===TILE.BOSS?'boss':(t.enemyId||MONSTER_IDS[Math.floor(this.rng()*MONSTER_IDS.length)]);
    t.enemyId=id;
    const enemy=ENEMIES[id]||ENEMIES.wolf;
    const result=simulateCombat(this.loadout,enemy,this.rng);
    this.loadout.hp=result.playerHp;
    this.lastCombat={enemy,...result};
    if(result.won){
      t.cleared=true;
      this.gold+=(id==='boss'?50:6)+(id==='boss'?0:(this.loadout.passives.goldOnKill||0));
      if(id==='boss'){this.won=true;this.message='灰燼骨甲亡騎倒下了。'}
      else this.message=`擊敗 ${enemy.name}，獲得金幣並清除道路威脅。`;
    }else{this.dead=true;this.message='你倒在裂界之中。'}
  };

  const style=document.createElement('style');
  style.id='monster-vfx-0201';
  style.textContent=`
  .enemy-card .battle-unit.sprite{width:126px;height:126px;object-fit:contain;margin:-18px auto -2px;display:block;filter:drop-shadow(0 12px 14px #000a)}
  .enemy-card.targeted{transform:translateY(-3px) scale(1.025)}
  .enemy-card.hit{filter:brightness(1.35)}
  .mfx{position:absolute;pointer-events:none;z-index:8}
  .mfx-rune{width:92px;height:92px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid var(--c,#f1bd76);box-shadow:0 0 26px var(--c,#f1bd76),inset 0 0 20px #0008;animation:mRune .46s ease-out forwards}
  .mfx-rune:before,.mfx-rune:after{content:"";position:absolute;inset:12px;border:1px dashed var(--c,#f1bd76);border-radius:50%}.mfx-rune:after{inset:28px;border-style:solid}
  .mfx-shot{width:17px;height:17px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 12%,var(--c,#ff9450) 25%,#3b1c18 75%);box-shadow:0 0 10px var(--c,#ff9450),0 0 28px var(--c,#ff9450);animation:mShot .34s ease-out forwards}
  .mfx-beam{height:5px;border-radius:999px;transform-origin:left center;background:linear-gradient(90deg,#fff,var(--c,#8fe08b) 40%,transparent);box-shadow:0 0 12px var(--c,#8fe08b);animation:mBeam .22s ease-out forwards}
  .mfx-swipe{height:10px;border-radius:999px;transform-origin:left center;background:linear-gradient(90deg,#fff2d0,var(--c,#d76b55) 42%,transparent);box-shadow:0 0 10px var(--c,#d76b55);animation:mSwipe .28s ease-out forwards}
  .mfx-impact{width:86px;height:86px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 10%,var(--c,#ffd08a) 18%,transparent 68%);animation:mImpact .35s ease-out forwards}
  .mfx-wave{width:30px;height:30px;border:2px solid var(--c,#ffd08a);border-radius:50%;transform:translate(-50%,-50%);animation:mWave .42s ease-out forwards}
  .mfx-spark{width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);background:var(--c,#ffd08a);box-shadow:0 0 9px var(--c,#ffd08a);animation:mSpark .5s ease-out forwards}
  #battleStage.mfx-shake{animation:mShake .28s linear}
  #battleStage.mfx-heavy{animation:mHeavy .36s linear}
  #battleStage.mfx-fire{box-shadow:inset 0 0 0 999px #ff9d5422,inset 0 -60px 100px #0007}
  #battleStage.mfx-green{box-shadow:inset 0 0 0 999px #78d97a22,inset 0 -60px 100px #0007}
  #battleStage.mfx-white{box-shadow:inset 0 0 0 999px #fff2,inset 0 -60px 100px #0007}
  @keyframes mRune{0%{opacity:0;transform:translate(-50%,-40%) scale(.45)}35%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.12)}}
  @keyframes mShot{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.15)}}
  @keyframes mBeam{0%{opacity:0;transform:rotate(var(--rot)) scaleX(.08)}25%{opacity:1}100%{opacity:0;transform:rotate(var(--rot)) scaleX(1)}}
  @keyframes mSwipe{0%{opacity:0;transform:rotate(var(--rot)) scaleX(.15)}30%{opacity:1}100%{opacity:0;transform:rotate(var(--rot)) scaleX(1)}}
  @keyframes mImpact{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}35%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.45)}}
  @keyframes mWave{0%{opacity:.9;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(4)}}
  @keyframes mSpark{0%{opacity:0}20%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.1)}}
  @keyframes mShake{0%,100%{transform:none}25%{transform:translate(-3px,1px)}50%{transform:translate(3px,-1px)}75%{transform:translate(-2px,-1px)}}
  @keyframes mHeavy{0%,100%{transform:none}15%{transform:translate(-7px,3px)}35%{transform:translate(8px,-4px)}55%{transform:translate(-6px,-2px)}75%{transform:translate(5px,3px)}}
  @media(max-width:760px){.enemy-card .battle-unit.sprite{width:96px;height:96px;margin:-8px auto 0}}
  `;
  document.head.appendChild(style);

  const fx=()=>$('#battleFx');
  const stage=()=>$('#battleStage');
  function point(el,fx=.5,fy=.5){const s=stage().getBoundingClientRect();if(!el)return{x:s.width*fx,y:s.height*fy};const r=el.getBoundingClientRect();return{x:r.left-s.left+r.width*.5,y:r.top-s.top+r.height*.5}}
  const playerPt=()=>point($('#battlePlayerUnit'),.2,.55);
  function enemyPt(i=0){const card=document.querySelector(`.enemy-card[data-enemy-index="${i}"]`)||document.querySelector('.enemy-card');return point(card?.querySelector('.battle-unit')||card,.78,.45)}
  function add(cls,x,y,vars={}){const e=document.createElement('i');e.className='mfx '+cls;e.style.left=x+'px';e.style.top=y+'px';for(const[k,v]of Object.entries(vars))e.style.setProperty(k,v);fx().appendChild(e);setTimeout(()=>e.remove(),650);return e}
  function flash(kind='white',heavy=false){const s=stage(),c='mfx-'+kind,sh=heavy?'mfx-heavy':'mfx-shake';s.classList.remove(c,sh);void s.offsetWidth;s.classList.add(c,sh);setTimeout(()=>s.classList.remove(c,sh),heavy?360:220)}
  function rune(p,c){add('mfx-rune',p.x,p.y+14,{'--c':c})}
  function impact(p,c,n=8){add('mfx-impact',p.x,p.y,{'--c':c});add('mfx-wave',p.x,p.y,{'--c':c});for(let i=0;i<n;i++){const a=Math.PI*2*i/n,rr=28+Math.random()*30;add('mfx-spark',p.x,p.y,{'--c':c,'--dx':Math.cos(a)*rr+'px','--dy':Math.sin(a)*rr+'px'})}}
  function shot(a,b,c){add('mfx-shot',a.x,a.y,{'--c':c,'--dx':(b.x-a.x)+'px','--dy':(b.y-a.y)+'px'})}
  function line(cls,a,b,c){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),rot=Math.atan2(dy,dx)*180/Math.PI;const e=add(cls,a.x,a.y,{'--c':c,'--rot':rot+'deg'});e.style.width=d+'px'}
  function monsterAttack(enemy){
    const a=enemyPt(0),p=playerPt(),id=enemy.id;
    if(id==='wolf'){
      line('mfx-swipe',{x:a.x-18,y:a.y-8},p,'#e1c08c');setTimeout(()=>line('mfx-swipe',{x:a.x-6,y:a.y+10},{x:p.x+10,y:p.y+10},'#cfa36f'),65);setTimeout(()=>impact({x:p.x+18,y:p.y-15},'#f3d6a2',7),115);flash('white');
    }else if(id==='cultist'){
      rune(a,'#f08a4d');setTimeout(()=>shot({x:a.x-8,y:a.y-20},{x:p.x+18,y:p.y-18},'#ff8b48'),70);setTimeout(()=>impact({x:p.x+18,y:p.y-18},'#ff9b58',10),230);flash('fire');
    }else if(id==='shaman'){
      rune(a,'#78dc76');setTimeout(()=>line('mfx-beam',{x:a.x-10,y:a.y-14},{x:p.x+18,y:p.y-18},'#7ce683'),60);setTimeout(()=>shot({x:a.x,y:a.y-6},{x:p.x+25,y:p.y},'#84e679'),100);setTimeout(()=>impact({x:p.x+20,y:p.y-16},'#8ce783',10),225);flash('green');
    }else if(id==='stalker'){
      rune(a,'#75c96c');line('mfx-swipe',{x:a.x-24,y:a.y-4},p,'#79ce70');setTimeout(()=>line('mfx-swipe',{x:a.x-10,y:a.y+12},{x:p.x+14,y:p.y+12},'#9ade78'),75);setTimeout(()=>impact({x:p.x+20,y:p.y-14},'#91dc75',9),135);flash('green');
    }else if(id==='boss'){
      rune(a,'#e56645');setTimeout(()=>rune({x:p.x+16,y:p.y+12},'#ff8a4c'),70);setTimeout(()=>line('mfx-swipe',{x:a.x-28,y:a.y-8},p,'#f08352'),100);setTimeout(()=>line('mfx-swipe',{x:a.x-12,y:a.y+10},{x:p.x+20,y:p.y+12},'#ffd083'),155);setTimeout(()=>impact({x:p.x+20,y:p.y-16},'#ff9a55',13),205);flash('fire',true);
    }else{line('mfx-swipe',a,p,'#d8bc8a');setTimeout(()=>impact(p,'#ead19b',7),100);flash('white')}
  }

  playBattle=async function(c){
    const oldLog=c.log;
    const patched=[];
    for(const ev of oldLog){patched.push(ev);if(ev.type==='hurt')patched.push({type:'monsterFxOnly'})}
    c.log=patched;
    const originalSleep=sleep;
    let fxPending=false;
    uiBusy=true;closeBag();
    const modal=$('#battleModal'),w=game.loadout.weapon,b=c.build;modal.classList.remove('hidden');$('#battleContinue').classList.add('hidden');
    $('#battleTurnLabel').textContent=`${c.enemy.name}${(c.enemies?.length||1)>1?` · ${(c.enemies?.length||1)} 名敵人`:''} · AUTO BATTLE`;
    const enemyCount=Math.max(1,c.enemies?.length||1),enemyHps=Array(enemyCount).fill(c.enemy.hp);
    renderEnemyGroup(c.enemy,enemyHps);$('#battleBanner').innerHTML=`${iconSvg('sword',15)} ${w.name} <span style="opacity:.5;margin:0 8px">VS</span> ${c.enemy.name}${enemyCount>1?` ×${enemyCount}`:''}`;
    $('#battleWeaponLine').innerHTML=`<b>${skillName(w)}</b> · 傷害 ${b.damage.toFixed(1)} · ${b.projectiles} 投射物 · ${b.rate.toFixed(2)}s`;
    $('#battleSupports').innerHTML=game.loadout.supports.length?game.loadout.supports.map(id=>`<span class="support-chip">${SUPPORTS[id].icon} ${SUPPORTS[id].name}</span>`).join(''):'<span class="support-chip">沒有 Support</span>';
    $('#battleLiveLog').textContent=`戰鬥開始 · 敵人 ${enemyCount} 名`;$('#battlePlayerStatus').textContent='怪物專屬特效 v0.20.1';$('#battlePlayerUnit').className='battle-unit';
    const received=oldLog.filter(x=>x.type==='hurt').reduce((a,x)=>a+x.damage,0);let replayPlayerHp=Math.min(game.loadout.maxHp,c.playerHp+received);setPlayerBattleHp(replayPlayerHp,game.loadout.maxHp);
    for(const ev of patched){
      if(ev.type==='cast'){
        const label=skillName(w);$('#battleSkill').innerHTML=`${iconSvg(w.id==='fireStaff'?'fire':'sword',16)} ${label}`;$('#battleSkill').classList.add('show');$('#battlePlayerUnit').classList.add('attack');$('#battleLiveLog').textContent=`施放 ${label}${ev.projectiles>1?` ×${ev.projectiles}`:''}`;
        for(let i=0;i<Math.min(7,ev.projectiles);i++)setTimeout(()=>fxProjectile(w.id==='stormWand'?'chain':w.id==='greatAxe'?'melee':w.id==='longbow'?'arrow':'projectile',i,Math.min(7,ev.projectiles)),i*45);
        await originalSleep(260);$('#battlePlayerUnit').classList.remove('attack');$('#battleSkill').classList.remove('show');
      }else if(ev.type==='hit'){
        const idx=Number.isInteger(ev.target)?ev.target:0;if(enemyHps[idx]===undefined)enemyHps[idx]=c.enemy.hp;enemyHps[idx]=Math.max(0,enemyHps[idx]-ev.damage);updateEnemyHp(idx,enemyHps[idx],c.enemy.hp);pulseEnemy(idx);floatDamage('enemy',ev.damage,false,idx);const alive=enemyHps.filter(h=>h>0).length;$('#battleLiveLog').textContent=`命中 ${c.enemy.name}${enemyCount>1?` ${idx+1}`:''}，造成 ${Math.round(ev.damage)} 傷害 · 剩餘 ${alive} 名`;await originalSleep(145);
      }else if(ev.type==='monsterFxOnly'){
        monsterAttack(c.enemy);await originalSleep(c.enemy.id==='boss'?210:155);fxPending=true;
      }else if(ev.type==='hurt'){
        if(!fxPending)monsterAttack(c.enemy);fxPending=false;replayPlayerHp=Math.max(0,replayPlayerHp-ev.damage);floatDamage('player',ev.damage,true);$('#battlePlayerUnit').classList.add('hit');setPlayerBattleHp(replayPlayerHp,game.loadout.maxHp);$('#battleLiveLog').textContent=`${c.enemy.name} 反擊，你受到 ${Math.round(ev.damage)} 傷害`;await originalSleep(180);$('#battlePlayerUnit').classList.remove('hit');
      }
    }
    c.log=oldLog;
    if(c.won){enemyHps.fill(0);enemyHps.forEach((hp,i)=>updateEnemyHp(i,0,c.enemy.hp));$('#battleBanner').textContent='勝利 · 所有敵人已清除';$('#battleLiveLog').textContent=`戰鬥勝利，擊倒 ${enemyCount} 名敵人。`}
    else{$('#battlePlayerUnit').classList.add('dead');$('#battleBanner').textContent='敗北 · 餘燼熄滅';$('#battleLiveLog').textContent='你倒在裂界之中。'}
    setPlayerBattleHp(c.playerHp,game.loadout.maxHp);await originalSleep(220);$('#battleContinue').classList.remove('hidden');
  };

  const oldPoiMeta=poiMeta;
  renderPoiPreview=function(){
    const root=$('#poiPreview');let best=null,bestD=99;
    for(const row of game.world.tiles)for(const t of row){if(!t.revealed||t.cleared)continue;const meta=oldPoiMeta(t.type);if(!meta)continue;const d=Math.abs(t.x-game.pos.x)+Math.abs(t.y-game.pos.y);if(d<bestD){bestD=d;best={t,meta}}}
    if(!best||bestD>4){root.innerHTML='<div class="poi-info"><strong>道路向未知延伸</strong><span>靠近地標後，這裡會顯示事件插畫與用途。</span></div>';return}
    const encounter=best.t.type===TILE.ENEMY?ENEMIES[best.t.enemyId||'wolf']:best.t.type===TILE.BOSS?ENEMIES.boss:null;
    let art='';const cls=best.meta.art;
    if(cls==='forge')art='<div class="forge-house"></div><div class="anvil"></div>';
    else if(cls==='camp')art=`<div class="tent"></div><div class="campfire"></div><img class="poi-creature" src="${encounter?.art||ENEMIES.wolf.art}" alt="${encounter?.name||'敵人'}">`;
    else if(cls==='altar')art='<div class="altar"></div>';else if(cls==='chest')art='<div class="chest-art"></div>';else if(cls==='boss')art=`<div class="boss-gate"></div><img class="poi-creature" src="${ENEMIES.boss.art}" alt="${ENEMIES.boss.name}">`;
    root.innerHTML=`<div class="poi-art">${game.isNight()?'<div class="moon"></div>':''}${art}</div><div class="poi-info"><strong>${encounter?.name||best.meta.name}</strong><span>${encounter?best.meta.desc+' 目前偵測到：'+encounter.name+'。':best.meta.desc}</span><span class="poi-distance">距離 ${bestD} 格</span></div>`;
  };

  document.title='GRIMPATH v'+BUILD;
  const sub=document.querySelector('.brand small');if(sub)sub.textContent='荒暮森林 · 怪物專屬特效 v'+BUILD;
  if(typeof renderAll==='function')renderAll();
})();