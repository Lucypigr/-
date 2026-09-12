(() => {
  const X = window.GRIMWEAPON = window.GRIMWEAPON || {};
  const ensure = (w, tags=[]) => { if(!w) return; w.tags ||= []; for(const t of tags) if(!w.tags.includes(t)) w.tags.push(t); };

  // Existing weapon traits
  ensure(WEAPONS.fireStaff,['magic']);
  WEAPONS.fireStaff.trait={id:'emberBurst',name:'爆燃',desc:'命中時有 18% 機率點燃敵人 2.5 秒。',igniteChance:.18};
  ensure(WEAPONS.longbow,['physical']);
  WEAPONS.longbow.trait={id:'precision',name:'精準',desc:'連續命中同一敵人時，每層傷害 +6%，最多 5 層。',stackDamage:.06,maxStacks:5};
  ensure(WEAPONS.greatAxe,['physical']);
  WEAPONS.greatAxe.trait={id:'stun',name:'震懾',desc:'命中有 18% 機率使敵人暈眩 1.2 秒；Boss 僅 0.45 秒。',chance:.18,duration:1.2,bossDuration:.45};
  ensure(WEAPONS.stormWand,['magic','beam']);
  WEAPONS.stormWand.tags=WEAPONS.stormWand.tags.filter(t=>t!=='projectile');
  WEAPONS.stormWand.pattern='beam';
  WEAPONS.stormWand.trait={id:'conduction',name:'導電',desc:'雷電射線天生額外連鎖 1 次。',chain:1};
  if(WEAPONS.frostRay){
    ensure(WEAPONS.frostRay,['magic','beam','ice']);
    WEAPONS.frostRay.trait={id:'frost',name:'霜凍累積',desc:'每次命中累積 25 寒霜；達 100 時冰凍敵人。',buildup:25,freeze:1.2,bossFreeze:.45};
  }

  // New physical weapons
  WEAPONS.katana={id:'katana',name:'太刀',icon:'🗡️',tags:['attack','physical','melee','crit'],baseDamage:17,rate:.62,sockets:3,pattern:'melee',trait:{id:'iaiCrit',name:'居合',desc:'每次命中 15% 機率暴擊，造成 200% 傷害。',critChance:.15,critMult:2}};
  WEAPONS.warhammer={id:'warhammer',name:'戰鎚',icon:'🔨',tags:['attack','physical','melee','aoe'],baseDamage:31,rate:1.55,sockets:2,pattern:'melee',trait:{id:'armorBreak',name:'碎甲',desc:'命中使目標受到的物理傷害 +6%，最多 5 層。',perStack:.06,maxStacks:5}};
  WEAPONS.dualDaggers={id:'dualDaggers',name:'雙匕首',icon:'🗡️',tags:['attack','physical','melee','bleed'],baseDamage:9,rate:.36,sockets:3,pattern:'melee',trait:{id:'bleed',name:'割裂',desc:'命中有 25% 機率造成 3 秒流血，可疊加 3 層。',chance:.25,duration:3,maxStacks:3,dpsFactor:.22}};
  WEAPONS.spear={id:'spear',name:'長槍',icon:'🔱',tags:['attack','physical','melee','piercing'],baseDamage:19,rate:.90,sockets:3,pattern:'melee',trait:{id:'spearPierce',name:'貫穿',desc:'每次攻擊可同時命中最多 3 名敵人。',extraTargets:2}};
  WEAPONS.heavyCrossbow={id:'heavyCrossbow',name:'重弩',icon:'🏹',tags:['attack','physical','projectile'],baseDamage:30,rate:1.65,sockets:3,pattern:'projectile',trait:{id:'chargedBolt',name:'蓄力射擊',desc:'每第 3 次主攻擊造成 220% 傷害。',every:3,mult:2.2}};

  // New magic weapons
  WEAPONS.venomFocus={id:'venomFocus',name:'腐毒法器',icon:'☠',tags:['spell','magic','poison','projectile'],baseDamage:12,rate:.80,sockets:3,pattern:'projectile',trait:{id:'corrosion',name:'腐蝕',desc:'每次命中施加 1 層毒素，持續 4 秒，最多 5 層。',duration:4,maxStacks:5,dpsFactor:.10}};
  WEAPONS.voidWand={id:'voidWand',name:'虛空法杖',icon:'◈',tags:['spell','magic','void','beam'],baseDamage:20,rate:1.25,sockets:3,pattern:'beam',trait:{id:'focus',name:'聚焦',desc:'射線持續命中同一敵人時，每層傷害 +12%，最多 5 層。',stackDamage:.12,maxStacks:5}};

  // Build metadata shared by battle/UI.
  const oldCompile=compileBuild;
  compileBuild=function(w,s=[],p={}){
    const out=oldCompile(w,s,p);
    const tr=w?.trait||{};
    out.weaponTrait=tr;
    if(tr.chain) out.chain=(out.chain||0)+tr.chain;
    return out;
  };

  X.damageClass=w=>w?.tags?.includes('magic')?'魔法':w?.tags?.includes('physical')?'物理':'特殊';
  X.attackForm=w=>w?.tags?.includes('beam')?'射線物':w?.tags?.includes('projectile')?'投射物':w?.tags?.includes('melee')?'近戰':'特殊';
  X.trait=w=>w?.trait||null;

  // Names shown in battle.
  const oldSkillName=skillName;
  skillName=function(w){
    const names={katana:'居合斬',warhammer:'碎甲重擊',dualDaggers:'雙刃連襲',spear:'貫穿槍擊',heavyCrossbow:'重弩射擊',venomFocus:'腐毒彈',voidWand:'虛空聚焦'};
    return names[w?.id]||oldSkillName(w);
  };

  // VFX language for new weapons.
  const oldKind=weaponFxKind;
  weaponFxKind=function(w){
    if(w?.tags?.includes('poison')) return 'blight';
    if(w?.tags?.includes('void')) return 'void';
    return oldKind(w);
  };
  const oldCast=castVfx;
  castVfx=function(w,b,index,total,targetIndex=0){
    const from=getPlayerAnchor(),to=getEnemyAnchor(targetIndex),id=w?.id;
    if(id==='katana'){
      if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,false);stageFlash('physical',100)}
      return;
    }
    if(id==='warhammer'){
      if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,true);spawnShockwave(to,'physical',1.45);stageShake('heavy');stageFlash('physical',150)}
      return;
    }
    if(id==='dualDaggers'){
      if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,false);setTimeout(()=>spawnSlash(targetIndex,false),80);stageFlash('physical',90)}
      return;
    }
    if(id==='spear'){
      if(index===0){spawnRune('physical',from);spawnSlash(targetIndex,false);stageFlash('physical',90)}
      return;
    }
    if(id==='heavyCrossbow'){
      if(index===0){spawnRune('physical',from);stageFlash('physical',110)}
      spawnMissile({x:from.x+18,y:from.y-12+(index-(total-1)/2)*5},{x:to.x,y:to.y-10+(index-(total-1)/2)*3},'arrow');
      return;
    }
    if(id==='venomFocus'){
      if(index===0){spawnRune('blight',from);stageFlash('blight',120)}
      spawnMissile({x:from.x+10,y:from.y-15},{x:to.x,y:to.y-12},'blight');
      return;
    }
    if(id==='voidWand'){
      if(index===0){spawnRune('void',from);stageFlash('void',150)}
      spawnBeam({x:from.x+14,y:from.y-18},{x:to.x-4,y:to.y-14},'void');
      return;
    }
    return oldCast(w,b,index,total,targetIndex);
  };

  const style=document.createElement('style');
  style.textContent=`
    .fx-beam.void{background:linear-gradient(90deg,#f7efff,#c995ff 28%,#7445d9 62%,#28104a00);box-shadow:0 0 10px #d9b6ff,0 0 30px #7d4de8}
    .fx-rune.void{border-color:#c89cffaa;box-shadow:0 0 0 3px #0003 inset,0 0 34px #7d4de866}.fx-rune.void:before,.fx-rune.void:after{border-color:#ead8ffaa}
    .fx-impact.void{background:radial-gradient(circle,#fff 0 10%,#d9c2ff 12%,#8554e5 44%,#32115f 64%,#0000 72%)}
    .fx-shockwave.void{border-color:#a774ffaa}
    .battle-stage.flash-void{box-shadow:inset 0 0 0 999px #9e70ff20,inset 0 -60px 100px #0007,0 0 52px #7d4de855}
    .battle-stage.theme-katana{background:radial-gradient(circle at 52% 42%,#402b2b 0,#211718 40%,#0b100e 100%)}
    .battle-stage.theme-warhammer{background:radial-gradient(circle at 52% 42%,#49392a 0,#261d16 40%,#0b100e 100%)}
    .battle-stage.theme-dualDaggers{background:radial-gradient(circle at 52% 42%,#28352f 0,#17221c 42%,#0b100e 100%)}
    .battle-stage.theme-spear{background:radial-gradient(circle at 52% 42%,#344047 0,#1a2327 42%,#0b100e 100%)}
    .battle-stage.theme-heavyCrossbow{background:radial-gradient(circle at 52% 42%,#384232 0,#1b2418 42%,#0b100e 100%)}
    .battle-stage.theme-venomFocus{background:radial-gradient(circle at 52% 42%,#2d4030 0,#17251a 42%,#0b100e 100%)}
    .battle-stage.theme-voidWand{background:radial-gradient(circle at 52% 42%,#302044 0,#171126 42%,#090b0d 100%)}
  `;
  document.head.appendChild(style);
})();
