(() => {
  const BUILD='0.23';
  const CHEST_TIERS={
    common:{id:'common',name:'普通',className:'common',foodMult:1,gearWeights:[.72,.25,.03]},
    fine:{id:'fine',name:'精良',className:'fine',foodMult:1.3,gearWeights:[.18,.62,.20]},
    epic:{id:'epic',name:'史詩',className:'epic',foodMult:1.7,gearWeights:[0,.18,.82]}
  };
  const CHEST_TYPES={equipment:{name:'裝備寶箱',icon:'▣'},food:{name:'食物寶箱',icon:'◆'},skill:{name:'技能寶箱',icon:'✦'},mixed:{name:'混合型寶箱',icon:'◈'}};
  const SLOT_LABELS_P={weapon:'武器',head:'頭部',body:'身體',feet:'腳部'};
  const GEAR_BASES_P={
    head:[
      {id:'ashHood',name:'灰燼兜帽',icon:'◉',sockets:2,desc:'夜色中的視野更清晰。',mods:{nightSight:1}},
      {id:'runicCirclet',name:'符文環冠',icon:'✧',sockets:2,desc:'強化法術的共鳴。',mods:{spellMult:1.06}},
      {id:'hunterMask',name:'獵痕面具',icon:'◇',sockets:2,desc:'提高投射物的殺傷力。',mods:{projectileMult:1.06}}
    ],
    body:[
      {id:'wandererCoat',name:'荒途長衣',icon:'▧',sockets:3,desc:'減輕受到的傷害。',mods:{damageTakenMult:.93}},
      {id:'ironbarkArmor',name:'鐵木胸甲',icon:'⬡',sockets:2,desc:'厚重護甲，防禦更高但略慢。',mods:{damageTakenMult:.88,rateMult:1.04}},
      {id:'emberRobe',name:'餘燼法袍',icon:'♨',sockets:3,desc:'放大火焰技能傷害。',mods:{fireMult:1.08}}
    ],
    feet:[
      {id:'trailBoots',name:'逐路短靴',icon:'⌁',sockets:2,desc:'讓攻擊節奏更加俐落。',mods:{rateMult:.93}},
      {id:'ashGreaves',name:'灰鐵脛甲',icon:'◫',sockets:2,desc:'提供穩定的傷害減免。',mods:{damageTakenMult:.96}},
      {id:'windstepBoots',name:'風行靴',icon:'»',sockets:2,desc:'兼顧攻速與投射物威力。',mods:{rateMult:.96,projectileMult:1.04}}
    ]
  };
  const LEGENDARIES=[
    {kind:'gear',slot:'head',id:'crownOfAshes',name:'★ 灰燼王冠',icon:'♛',sockets:3,desc:'傳說頭冠，讓法術與火焰同時增幅。',mods:{spellMult:1.16,fireMult:1.18,nightSight:1}},
    {kind:'gear',slot:'body',id:'wardenPlate',name:'★ 守門者殘甲',icon:'⬢',sockets:4,desc:'守門者碎甲重鑄而成，具有極高減傷。',mods:{damageTakenMult:.76,damageMult:1.10}},
    {kind:'gear',slot:'feet',id:'riftwalkers',name:'★ 裂界行者',icon:'»',sockets:3,desc:'踏過裂界仍不減速的傳說戰靴。',mods:{rateMult:.82,projectileMult:1.12}},
    {kind:'weapon',id:'starfireStaff',base:'fireStaff',name:'★ 星火權杖',icon:'☄',desc:'燃燒著不會熄滅的裂界星火。'},
    {kind:'weapon',id:'thunderOath',base:'stormWand',name:'★ 雷誓法杖',icon:'ϟ',desc:'每一道雷光都像誓言般追逐下一個敵人。'}
  ];
  const FOOD=[
    {id:'redStew',name:'赤紅燉湯',icon:'●',desc:'恢復生命。',apply:(g,m)=>{const n=Math.round(35*m);g.loadout.hp=Math.min(g.loadout.maxHp,g.loadout.hp+n);return `恢復 ${n} 生命`}},
    {id:'giantRoot',name:'巨根炙燒',icon:'◆',desc:'提高最大生命並恢復生命。',apply:(g,m)=>{const n=Math.round(8*m);g.loadout.maxHp+=n;g.loadout.hp=Math.min(g.loadout.maxHp,g.loadout.hp+n);return `最大生命 +${n}`}},
    {id:'hunterRation',name:'獵人乾糧',icon:'▲',desc:'本次遠征永久提高傷害。',apply:(g,m)=>{const p=.04*m;g.loadout.passives.damageMult*=1+p;return `全域傷害 +${Math.round(p*100)}%`}},
    {id:'swiftTea',name:'風行茶',icon:'≈',desc:'本次遠征永久加快攻擊節奏。',apply:(g,m)=>{const p=.035*m;g.loadout.passives.rateMult*=1-p;return `攻擊間隔 -${Math.round(p*100)}%`}}
  ];

  const clone=v=>JSON.parse(JSON.stringify(v));
  const weighted=(rng,items)=>{let r=rng(),sum=0;for(const [v,w] of items){sum+=w;if(r<sum)return v}return items[items.length-1][0]};
  function rarityFromTier(tier,rng){const w=CHEST_TIERS[tier].gearWeights;return weighted(rng,[['common',w[0]],['magic',w[1]],['rare',w[2]]])}
  function rarityName(r){return {common:'普通',magic:'精良',rare:'史詩',legendary:'傳說'}[r]||r}
  function tierRoll(rng){const r=rng();return r<.10?'epic':r<.40?'fine':'common'}
  function typeRoll(rng){const r=rng();return r<.28?'equipment':r<.48?'food':r<.73?'skill':'mixed'}
  function ensureProgress(g){
    g.progression ||= {level:1,xp:0,nextXp:40,tickets:0};
    if(!Number.isFinite(g.progression.level))g.progression.level=1;
    if(!Number.isFinite(g.progression.xp))g.progression.xp=0;
    if(!Number.isFinite(g.progression.nextXp))g.progression.nextXp=40;
    if(!Number.isFinite(g.progression.tickets))g.progression.tickets=0;
  }
  function rollArmor(slot,rarity,rng){
    const base=clone(GEAR_BASES_P[slot][Math.floor(rng()*GEAR_BASES_P[slot].length)]),mods={...(base.mods||{})};
    let sockets=base.sockets,maxSockets=slot==='body'?4:3;
    if(rarity==='magic'){sockets=Math.min(maxSockets,sockets+(rng()<.7?1:0));mods.damageMult=(mods.damageMult||1)*1.04}
    if(rarity==='rare'){sockets=Math.min(maxSockets,sockets+1);mods.damageMult=(mods.damageMult||1)*1.09;mods.damageTakenMult=(mods.damageTakenMult||1)*.95}
    return {...base,uid:`loot-${slot}-${Date.now()}-${Math.floor(rng()*1e7)}`,slot,rarity,rarityName:rarityName(rarity),name:`${rarity==='magic'?'✦ ':rarity==='rare'?'◆ ':''}${base.name}`,sockets,mods,socketed:[]};
  }
  function rollWeapon(rarity,rng){
    const base=clone(Object.values(WEAPONS)[Math.floor(rng()*Object.values(WEAPONS).length)]);
    const mult=rarity==='rare'?1.18:rarity==='magic'?1.09:1;
    base.baseDamage*=mult;
    if(rarity==='magic'&&rng()<.55)base.sockets+=1;
    if(rarity==='rare')base.sockets+=1;
    base.rarity=rarity;base.rarityName=rarityName(rarity);base.name=`${rarity==='magic'?'✦ ':rarity==='rare'?'◆ ':''}${base.name}`;
    return base;
  }
  function equipmentReward(tier,rng){
    const rarity=rarityFromTier(tier,rng),slot=weighted(rng,[['weapon',.25],['head',.25],['body',.25],['feet',.25]]);
    if(slot==='weapon'){
      const item=rollWeapon(rarity,rng);return {kind:'weaponReward',item,name:item.name,icon:item.icon,meta:`${rarityName(rarity)} · 武器`,desc:`${item.sockets} 孔 · 基礎傷害 ${item.baseDamage.toFixed(0)}`};
    }
    const item=rollArmor(slot,rarity,rng);return {kind:'gear',item,name:item.name,icon:item.icon,meta:`${rarityName(rarity)} · ${SLOT_LABELS_P[slot]}`,desc:`${item.sockets} 孔 · ${item.desc}`};
  }
  function foodReward(tier,rng){
    const f=FOOD[Math.floor(rng()*FOOD.length)],mult=CHEST_TIERS[tier].foodMult;
    return {kind:'food',id:f.id,name:f.name,icon:f.icon,meta:`${CHEST_TIERS[tier].name}食物`,desc:f.desc,mult};
  }
  function skillReward(tier,rng){
    const skillPool=Object.values(SKILLS).filter(s=>(game.loadout.skills[s.id]||0)<s.max);
    const preferSkill=tier==='epic'?.72:tier==='fine'?.58:.48;
    if(skillPool.length&&rng()<preferSkill){const s=skillPool[Math.floor(rng()*skillPool.length)];return {kind:'skill',id:s.id,name:s.name,icon:s.icon,meta:`旅者技能 · Lv.${(game.loadout.skills[s.id]||0)+1}`,desc:s.desc}}
    const s=Object.values(SUPPORTS)[Math.floor(rng()*Object.values(SUPPORTS).length)];return {kind:'support',id:s.id,name:s.name,icon:s.icon,meta:'Support 技能石',desc:s.desc}
  }
  function makeChestRewards(meta,g){
    const rng=g.rng,tier=meta.tier,type=meta.type,out=[];
    if(type==='equipment'){for(let i=0;i<3;i++)out.push(equipmentReward(tier,rng))}
    else if(type==='food'){for(let i=0;i<3;i++)out.push(foodReward(tier,rng))}
    else if(type==='skill'){for(let i=0;i<3;i++)out.push(skillReward(tier,rng))}
    else out.push(equipmentReward(tier,rng),foodReward(tier,rng),skillReward(tier,rng));
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out.slice(0,3);
  }
  function assignChestMeta(g){
    for(const row of g.world.tiles)for(const t of row)if(t.type===TILE.CHEST&&!t.chestMeta)t.chestMeta={tier:tierRoll(g.rng),type:typeRoll(g.rng)};
  }

  function showLoot(name,sub='',rarity='common',icon='✦'){
    const host=document.querySelector('#lootNotices');if(!host)return;
    const el=document.createElement('div'),label=rarity==='xp'?'獲得經驗':name.startsWith('LEVEL')?'等級提升':'獲得物品';el.className=`loot-notice loot-${rarity}`;el.innerHTML=`<div class="loot-icon">${icon}</div><div><small>${label}</small><strong>${name}</strong><span>${sub}</span></div>`;host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>el.classList.remove('show'),2100);setTimeout(()=>el.remove(),2500);
  }
  function showLevelUp(level){showLoot(`LEVEL ${level}`,`獲得裂界券 ×1`,'legendary','✦')}
  function addXp(g,amount){
    ensureProgress(g);g.progression.xp+=amount;showLoot(`+${amount} EXP`,`距離下一級 ${Math.max(0,g.progression.nextXp-g.progression.xp)} EXP`,'xp','◆');
    while(g.progression.xp>=g.progression.nextExp){g.progression.xp-=g.progression.nextExp;g.progression.level++;g.progression.tickets++;g.progression.nextExp=Math.round(40+Math.pow(g.progression.level-1,1.25)*26);showLevelUp(g.progression.level)}
  }

  function rollLegendary(rng){
    const def=clone(LEGENDARIES[Math.floor(rng()*LEGENDARIES.length)]);
    if(def.kind==='weapon'){
      const base=clone(WEAPONS[def.base]);base.id=def.id;base.name=def.name;base.icon=def.icon;base.baseDamage*=1.42;base.sockets=Math.max(4,base.sockets+2);base.rarity='legendary';base.rarityName='傳說';return {kind:'weapon',item:base,rarity:'legendary'};
    }
    return {kind:'gear',item:{...def,uid:`legend-${Date.now()}-${Math.floor(rng()*1e7)}`,rarity:'legendary',rarityName:'傳說',socketed:[]},rarity:'legendary'};
  }
  function lotteryRoll(g){
    const r=g.rng();
    if(r<.03)return rollLegendary(g.rng);
    const rarity=r<.20?'rare':r<.52?'magic':'common';
    const slot=weighted(g.rng,[['weapon',.25],['head',.25],['body',.25],['feet',.25]]);
    return slot==='weapon'?{kind:'weapon',item:rollWeapon(rarity,g.rng),rarity}:{kind:'gear',item:rollArmor(slot,rarity,g.rng),rarity};
  }

  function injectUI(){
    if(!document.querySelector('#lootNotices')){const h=document.createElement('div');h.id='lootNotices';document.body.appendChild(h)}
    const status=document.querySelector('.section-title-row');
    if(status&&!document.querySelector('#progressCard')){
      const box=document.createElement('div');box.id='progressCard';box.className='progress-card';box.innerHTML=`<div class="progress-top"><b id="levelText">LV.1</b><button id="ticketButton">裂界券 <strong id="ticketCount">0</strong></button></div><div class="xp-track"><i id="xpFill"></i></div><small id="xpText">0 / 40 EXP</small>`;status.parentElement.insertBefore(box,status.nextSibling);
    }
    if(!document.querySelector('#lotteryModal')){
      const m=document.createElement('div');m.id='lotteryModal';m.className='modal-backdrop hidden';m.innerHTML=`<div class="modal-card lottery-card"><div class="modal-head"><div><div class="modal-kicker">RIFT LOTTERY</div><h2>裂界祈願</h2></div><button id="closeLottery" class="close-btn">關閉</button></div><div class="lottery-orb">✦</div><p>消耗 1 張裂界券抽取裝備。<b>傳說裝備機率 3%</b></p><div class="lottery-rates"><span>普通 48%</span><span>精良 32%</span><span>史詩 17%</span><span class="legendary">傳說 3%</span></div><div id="lotteryResult" class="lottery-result">尚未進行祈願</div><button id="drawLottery" class="action">使用裂界券 ×1</button></div>`;document.body.appendChild(m);
      document.querySelector('#closeLottery').onclick=()=>document.querySelector('#lotteryModal').classList.add('hidden');
      document.querySelector('#drawLottery').onclick=()=>{
        ensureProgress(game);if(game.progression.tickets<1)return;game.progression.tickets--;
        const result=lotteryRoll(game);game.inventory.push({kind:result.kind,item:result.item});
        const item=result.item,rare=result.rarity||item.rarity||'common';
        document.querySelector('#lotteryResult').innerHTML=`<div class="lottery-item rarity-${rare}"><span>${item.icon||'◆'}</span><strong>${item.name}</strong><small>${item.rarityName||rarityName(rare)} · ${item.slot?SLOT_LABELS_P[item.slot]:'武器'} · ${item.sockets||0} 孔</small></div>`;
        showLoot(item.name,`${item.rarityName||rarityName(rare)}裝備` ,rare,item.icon||'◆');renderAll();updateProgressionUI();
      };
    }
    document.querySelector('#ticketButton')?.addEventListener('click',()=>{document.querySelector('#lotteryModal').classList.remove('hidden');updateProgressionUI()});
  }
  function updateProgressionUI(){
    ensureProgress(game);const p=game.progression,fill=Math.min(100,p.xp/p.nextExp*100);
    if($('#levelText'))$('#levelText').textContent=`LV.${p.level}`;if($('#xpFill'))$('#xpFill').style.width=`${fill}%`;if($('#xpText'))$('#xpText').textContent=`${Math.floor(p.xp)} / ${p.nextExp} EXP`;if($('#ticketCount'))$('#ticketCount').textContent=p.tickets;
    const b=$('#drawLottery');if(b){b.disabled=p.tickets<1;b.textContent=p.tickets?`使用裂界券 ×1（持有 ${p.tickets}）`:'沒有裂界券'}
  }
  function updateChestPreview(){
    let best=null,bestD=99;
    for(const row of game.world.tiles)for(const t of row){if(t.type!==TILE.CHEST||t.cleared||!t.revealed||!t.chestMeta)continue;const d=Math.abs(t.x-game.pos.x)+Math.abs(t.y-game.pos.y);if(d<bestD){best=t;bestD=d}}
    if(best&&bestD<=4){const strong=document.querySelector('#poiPreview .poi-info strong'),span=document.querySelector('#poiPreview .poi-info span');if(!strong||strong.textContent!=='隱藏寶箱')return;const tier=CHEST_TIERS[best.chestMeta.tier],type=CHEST_TYPES[best.chestMeta.type];strong.textContent=`${tier.name} · ${type.name}`;if(span)span.textContent=`${type.icon} 固定三選一；${tier.name}階級會影響獎勵品質。`}
  }

  const oldReset=Game.prototype.reset;
  Game.prototype.reset=function(seed){oldReset.call(this,seed);this.progression={level:1,xp:0,nextExp:40,tickets:0};assignChestMeta(this)};
  const oldOffer=Game.prototype.offerChestRewards;
  Game.prototype.offerChestRewards=function(){if(this.activeChestMeta)return makeChestRewards(this.activeChestMeta,this);return oldOffer.call(this)};
  const oldApply=Game.prototype.applyChestReward;
  Game.prototype.applyChestReward=function(reward){
    if(!reward)return false;
    if(reward.kind==='weaponReward'){this.inventory.push({kind:'weapon',item:reward.item});this.pendingChestChoices=[];showLoot(reward.item.name,reward.meta,reward.item.rarity||'common',reward.item.icon);this.activeChestMeta=null;return true}
    if(reward.kind==='food'){
      const f=FOOD.find(x=>x.id===reward.id),effect=f?f.apply(this,reward.mult||1):'';this.pendingChestChoices=[];this.message=`食用 ${reward.name}：${effect}`;showLoot(reward.name,effect,this.activeChestMeta?.tier||'common',reward.icon);this.activeChestMeta=null;return true;
    }
    const ok=oldApply.call(this,reward);
    if(ok){const rarity=reward.item?.rarity||this.activeChestMeta?.tier||'common';showLoot(reward.name,reward.meta||'',rarity,reward.icon||'✦');this.activeChestMeta=null}
    return ok;
  };
  const oldResolve=Game.prototype.resolveTile;
  Game.prototype.resolveTile=function(t){
    const wasChest=t&&!t.cleared&&t.type===TILE.CHEST,wasEnemy=t&&!t.cleared&&(t.type===TILE.ENEMY||t.type===TILE.BOSS),invBefore=this.inventory.length;
    if(wasChest)this.activeChestMeta=t.chestMeta||{tier:'common',type:'mixed'};
    oldResolve.call(this,t);
    if(wasEnemy&&t.cleared&&!this.dead){addXp(this,t.type===TILE.BOSS?80:10+Math.floor(this.rng()*5))}
    if(!wasChest&&this.inventory.length>invBefore){for(const slot of this.inventory.slice(invBefore)){const item=slot.item;if(item)showLoot(item.name,slot.kind==='gear'?`${item.rarityName||'普通'} · ${SLOT_LABELS_P[item.slot]}`:slot.kind==='weapon'?`武器 · ${item.sockets} 孔`:'技能石',item.rarity||'common',item.icon||'✦')}}
  };

  openChestChoice=function(){
    if(!game.pendingChestChoices.length)return;
    uiBusy=true;const meta=game.activeChestMeta||{tier:'common',type:'mixed'},tier=CHEST_TIERS[meta.tier],type=CHEST_TYPES[meta.type];
    const modal=$('#skillModal'),ey=modal.querySelector('.chest-eyebrow'),h=modal.querySelector('h2'),p=modal.querySelector('.chest-stage-head p');if(ey)ey.textContent=`${tier.name} · ${type.name}`;if(h)h.textContent=`${tier.name} ${type.name}`;if(p)p.textContent='固定三選一，只能帶走其中一項。';
    const root=$('#skillChoices');root.innerHTML='';
    game.pendingChestChoices.forEach((reward,index)=>{
      const card=document.createElement('div');card.className=`choice-card kind-${reward.kind} chest-tier-${meta.tier}`;
      const label=reward.kind==='gear'||reward.kind==='weaponReward'?'裝備':reward.kind==='food'?'食物':reward.kind==='skill'?'旅者技能':'技能石';
      card.innerHTML=`<div class="reward-kind"><span>${reward.icon||'✦'}</span>${label}</div><div class="head"><div class="ico">${reward.icon||'✦'}</div><div><h4>${reward.name}</h4><small>${reward.meta||''}</small></div></div><p>${reward.desc}</p><button>選擇這項獎勵</button>`;
      card.querySelector('button').onclick=()=>chooseChestReward(index);root.appendChild(card);
    });modal.classList.remove('hidden');
  };

  const oldRenderAll=renderAll;
  renderAll=function(){oldRenderAll();updateProgressionUI();updateChestPreview()};

  injectUI();ensureProgress(game);assignChestMeta(game);document.title='GRIMPATH v0.23';const sub=document.querySelector('.brand small');if(sub)sub.textContent='荒暮森林 · Loot & Progression v0.23';renderAll();
})();