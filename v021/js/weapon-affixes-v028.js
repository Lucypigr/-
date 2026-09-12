(() => {
  const A = window.GRIMAFFIX = window.GRIMAFFIX || {};
  const VERSION = 28;
  const RARITY_NAME={common:'普通',magic:'精良',rare:'史詩',legendary:'傳說'};
  const RARITY_COUNT={common:[0,0],magic:[1,2],rare:[3,4],legendary:[4,4]};
  const LEGEND_BASE={starfireStaff:'fireStaff',thunderOath:'stormWand'};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const rand=(rng,a,b)=>a+(b-a)*rng();
  const irand=(rng,a,b)=>Math.floor(rand(rng,a,b+1));
  const cleanName=n=>String(n||'未知武器').replace(/^[✦◆]\s*/,'');
  const levelOf=g=>Math.max(1,Number(g?.progression?.level)||1);
  const state=g=>g.affixState ||= {identifyStones:0,appliedWeaponHpBonus:0};

  const secondaryDefs=[
    {id:'vitality',name:'活力',weight:1.15,roll:(lv,rng)=>{const v=irand(rng,6+Math.floor(lv*1.1),10+Math.floor(lv*2.1));return {value:v,text:`最大生命 +${v}`,mods:{maxHp:v}}}},
    {id:'haste',name:'迅捷',weight:1.0,roll:(lv,rng)=>{const lo=.025+Math.min(.025,lv*.0015),hi=.05+Math.min(.04,lv*.0025),v=rand(rng,lo,hi);return {value:v,text:`攻擊間隔 -${Math.round(v*100)}%`,mods:{rateMult:1-v}}}},
    {id:'critChance',name:'銳眼',weight:.95,roll:(lv,rng)=>{const lo=.02+Math.min(.025,lv*.0015),hi=.04+Math.min(.045,lv*.0025),v=rand(rng,lo,hi);return {value:v,text:`暴擊率 +${Math.round(v*100)}%`,mods:{critChance:v}}}},
    {id:'critDamage',name:'致命',weight:.9,roll:(lv,rng)=>{const lo=.10+Math.min(.12,lv*.006),hi=.20+Math.min(.22,lv*.009),v=rand(rng,lo,hi);return {value:v,text:`暴擊傷害 +${Math.round(v*100)}%`,mods:{critDamage:v}}}},
    {id:'guard',name:'護持',weight:.8,roll:(lv,rng)=>{const lo=.018+Math.min(.022,lv*.0012),hi=.035+Math.min(.035,lv*.0018),v=rand(rng,lo,hi);return {value:v,text:`受到傷害 -${Math.round(v*100)}%`,mods:{damageTakenMult:1-v}}}},
    {id:'socket',name:'共鳴孔',weight:.35,minLevel:4,roll:()=>({value:1,text:'技能孔 +1',mods:{sockets:1}})}
  ];

  function templateFor(item){
    const id=LEGEND_BASE[item?.id]||item?.id;
    return WEAPONS[id]||item||{};
  }
  function levelScale(lv){return 1 + .042*Math.pow(Math.max(0,lv-1),.90)}
  function mainRange(item,lv,rng){
    const t=templateFor(item),legendaryBase=(item?.rarity==='legendary'&&LEGEND_BASE[item?.id])?Number(item.baseDamage):0,base=legendaryBase||Number(t.baseDamage)||Number(item.baseDamage)||10,scale=levelScale(lv),quality=rand(rng,.96,1.04),center=base*scale*quality;
    let min=Math.max(1,Math.round(center*.70*rand(rng,.97,1.02)));
    let max=Math.max(min+1,Math.round(center*1.30*rand(rng,.98,1.04)));
    return {min,max,average:(min+max)/2};
  }
  function affixCount(rarity,rng){const r=RARITY_COUNT[rarity]||RARITY_COUNT.common;return irand(rng,r[0],r[1])}
  function rollAffixes(rarity,lv,rng){
    const count=affixCount(rarity,rng),pool=secondaryDefs.filter(x=>(x.minLevel||1)<=lv).slice(),out=[];
    for(let n=0;n<count&&pool.length;n++){
      const total=pool.reduce((s,x)=>s+x.weight,0);let roll=rng()*total,pick=pool[0],idx=0;
      for(let i=0;i<pool.length;i++){roll-=pool[i].weight;if(roll<=0){pick=pool[i];idx=i;break}}
      pool.splice(idx,1);const r=pick.roll(lv,rng);out.push({id:pick.id,name:pick.name,...r});
    }
    return out;
  }
  function worldRarity(rng){const r=rng();return r<.08?'rare':r<.35?'magic':'common'}
  function prefixName(item,rarity){
    const base=cleanName(item.baseName||item.name);item.baseName=base;
    if(rarity==='magic')return `✦ ${base}`;
    if(rarity==='rare')return `◆ ${base}`;
    return base;
  }
  function prepareWeapon(item,{level,rarity,rng,identified}={}){
    if(!item)return item;if(item.affixVersion===VERSION)return item;
    rng=rng||game?.rng||Math.random;level=Math.max(1,Number(level)||levelOf(game));rarity=rarity||item.rarity||'common';
    const main=mainRange(item,level,rng),affixes=rollAffixes(rarity,level,rng),baseSockets=Number(item.sockets)||0;
    item.rarity=rarity;item.rarityName=RARITY_NAME[rarity]||rarity;item.itemLevel=level;item.mainAffix={id:'damage',name:'武器傷害',min:main.min,max:main.max,text:`傷害 ${main.min}–${main.max}`};
    item.damageMin=main.min;item.damageMax=main.max;item.baseDamage=main.average;item.affixes=affixes;item.baseSockets=baseSockets;
    const socketBonus=affixes.reduce((n,a)=>n+(a.mods?.sockets||0),0);item.sockets=baseSockets+socketBonus;
    item.identified=identified!==undefined?!!identified:rarity==='common';item.name=prefixName(item,rarity);item.affixVersion=VERSION;
    return item;
  }
  function ensureCurrent(g){
    if(!g?.loadout?.weapon)return;state(g);if(g.loadout.weapon.affixVersion!==VERSION)prepareWeapon(g.loadout.weapon,{level:1,rarity:g.loadout.weapon.rarity||'common',rng:g.rng,identified:true});syncWeaponHp(g);
  }
  function weaponMods(item){
    const out={maxHp:0,rateMult:1,critChance:0,critDamage:0,damageTakenMult:1};
    if(!item?.identified)return out;
    for(const a of item.affixes||[]){const m=a.mods||{};if(m.maxHp)out.maxHp+=m.maxHp;if(m.rateMult)out.rateMult*=m.rateMult;if(m.critChance)out.critChance+=m.critChance;if(m.critDamage)out.critDamage+=m.critDamage;if(m.damageTakenMult)out.damageTakenMult*=m.damageTakenMult;}
    return out;
  }
  function syncWeaponHp(g){
    if(!g?.loadout)return;const s=state(g),next=weaponMods(g.loadout.weapon).maxHp||0,prev=s.appliedWeaponHpBonus||0,delta=next-prev;if(delta){g.loadout.maxHp=Math.max(1,g.loadout.maxHp+delta);g.loadout.hp=Math.min(g.loadout.hp,g.loadout.maxHp)}s.appliedWeaponHpBonus=next;
  }
  function notice(title,sub,icon='◈',rarity='fine'){
    const host=document.querySelector('#lootNotices');if(!host)return;const e=document.createElement('div');e.className=`loot-notice loot-${rarity}`;e.innerHTML=`<div class="loot-icon">${icon}</div><div><small>獲得物品</small><strong>${title}</strong><span>${sub}</span></div>`;host.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.remove(),2400);
  }
  function grantIdentifyStone(g,n=1,source='怪物掉落'){
    const s=state(g);s.identifyStones+=n;g.message=`${g.message||''}${g.message?' ':''}獲得鑑定石 ×${n}。`;notice(`鑑定石 ×${n}`,source,'◇','fine');return s.identifyStones;
  }
  function identifyWeapon(g,index){
    const inv=g.inventory?.[index],item=inv?.item,s=state(g);if(!inv||inv.kind!=='weapon'||!item||item.identified!==false)return false;if(s.identifyStones<1){g.message='沒有鑑定石。';return false}
    s.identifyStones--;item.identified=true;g.message=`鑑定完成：${item.name}。`;notice(item.name,`${item.rarityName} · 已揭露 ${item.affixes?.length||0} 個副詞綴`,item.icon||'◆',item.rarity||'fine');return true;
  }
  function buyIdentifyStone(g){const cost=8,s=state(g);if(g.gold<cost){g.message='金幣不足，鑑定石需要 8 金幣。';return false}g.gold-=cost;s.identifyStones++;g.message='購買鑑定石 ×1。';notice('鑑定石 ×1','旅商店購買','◇','fine');return true}
  function formatRange(item){return item?.damageMin!=null?`${Math.round(item.damageMin)}–${Math.round(item.damageMax)}`:`${Math.round(item?.baseDamage||0)}`}
  function publicAffixes(item){return item?.identified===false?[]:(item?.affixes||[])}

  A.VERSION=VERSION;A.RARITY_NAME=RARITY_NAME;A.state=state;A.levelOf=levelOf;A.prepareWeapon=prepareWeapon;A.weaponMods=weaponMods;A.syncWeaponHp=syncWeaponHp;A.grantIdentifyStone=grantIdentifyStone;A.identifyWeapon=identifyWeapon;A.buyIdentifyStone=buyIdentifyStone;A.formatRange=formatRange;A.publicAffixes=publicAffixes;A.worldRarity=worldRarity;

  const previousCompile=compileBuild;
  compileBuild=function(w,s=[],p={}){
    const out=previousCompile(w,s,p),mods=weaponMods(w),base=Math.max(.001,Number(w?.baseDamage)||out.damage||1),factor=out.damage/base;
    if(w?.damageMin!=null){out.damageMin=w.damageMin*factor;out.damageMax=w.damageMax*factor;out.damage=(out.damageMin+out.damageMax)/2}
    else{out.damageMin=out.damage;out.damageMax=out.damage}
    out.rate*=mods.rateMult;out.critChance=mods.critChance;out.critDamageBonus=mods.critDamage;out.weaponDamageTakenMult=mods.damageTakenMult;out.weaponItemLevel=w?.itemLevel||1;out.weaponAffixes=publicAffixes(w);return out;
  };
  window.rollBuildDamage=(b,rng=Math.random)=>{const lo=Number(b?.damageMin??b?.damage??0),hi=Number(b?.damageMax??b?.damage??lo);return lo+(hi-lo)*rng()};

  const previousReset=Game.prototype.reset;
  Game.prototype.reset=function(seed){previousReset.call(this,seed);this.affixState={identifyStones:0,appliedWeaponHpBonus:0};prepareWeapon(this.loadout.weapon,{level:1,rarity:'common',rng:this.rng,identified:true});syncWeaponHp(this)};

  const previousResolve=Game.prototype.resolveTile;
  Game.prototype.resolveTile=function(t){
    const before=this.inventory.length,weaponNode=!!(t&&!t.cleared&&t.type===TILE.WEAPON),result=previousResolve.call(this,t);
    if(weaponNode){for(let i=before;i<this.inventory.length;i++){const inv=this.inventory[i];if(inv?.kind==='weapon'){const rarity=worldRarity(this.rng);prepareWeapon(inv.item,{level:levelOf(this),rarity,rng:this.rng});this.message=`發現${inv.item.identified?'':'未鑑定的'}${inv.item.rarityName}武器：${inv.item.name} · 傷害 ${formatRange(inv.item)}`}}}
    return result;
  };

  const previousOffer=Game.prototype.offerChestRewards;
  Game.prototype.offerChestRewards=function(){
    const rewards=previousOffer.call(this)||[];for(const r of rewards){if(r?.kind==='weaponReward'&&r.item){prepareWeapon(r.item,{level:levelOf(this),rarity:r.item.rarity||'common',rng:this.rng});r.name=r.item.name;r.meta=`${r.item.rarityName} · Lv.${r.item.itemLevel} 武器${r.item.identified?'':' · 未鑑定'}`;r.desc=`主詞綴：傷害 ${formatRange(r.item)} · ${r.item.affixes?.length||0} 個副詞綴${r.item.identified?'':'待鑑定'}`;}}
    return rewards;
  };

  const previousEquip=Game.prototype.equipWeapon;
  Game.prototype.equipWeapon=function(index){
    const inv=this.inventory?.[index];if(inv?.kind==='weapon'){if(inv.item.affixVersion!==VERSION)prepareWeapon(inv.item,{level:levelOf(this),rarity:inv.item.rarity||'common',rng:this.rng});if(inv.item.identified===false){this.message='這把武器尚未鑑定，先使用鑑定石。';return false}}
    const ok=previousEquip.call(this,index);if(ok)syncWeaponHp(this);return ok;
  };

  ensureCurrent(game);
})();