(() => {
 const G={}; window.GRIMSKILL=G;
 G.gems={
  emberAura:{id:'emberAura',kind:'aura',name:'灰燼共鳴',icon:'♨',desc:'常駐：火焰武器傷害 +22%；其他武器 +7%。'},
  stormAura:{id:'stormAura',kind:'aura',name:'雷鳴共振',icon:'ϟ',desc:'常駐：雷電武器傷害 +22%；其他武器 +7%。'},
  ironAura:{id:'ironAura',kind:'aura',name:'鐵壁誓約',icon:'⬢',desc:'常駐：受到的傷害降低 14%。'},
  hasteAura:{id:'hasteAura',kind:'aura',name:'迅捷脈動',icon:'»',desc:'常駐：攻擊間隔縮短 10%。'},
  moltenWard:{id:'moltenWard',kind:'active',name:'熔火壁障',icon:'◉',cooldown:6,desc:'3 秒內最多減免 2 次敵方攻擊，破裂時灼燒所有敵人。'},
  bloodFury:{id:'bloodFury',kind:'active',name:'血潮狂怒',icon:'◆',cooldown:8,desc:'消耗 8% 最大生命，5 秒內傷害 +15%、攻擊間隔 -28%。'},
  riftStep:{id:'riftStep',kind:'active',name:'裂界閃步',icon:'◇',cooldown:5,desc:'閃避下一次敵方攻擊，並立刻造成 60% 武器傷害。'},
  thunderBurst:{id:'thunderBurst',kind:'active',name:'雷暴釋放',icon:'⚡',cooldown:7,desc:'立即對所有存活敵人造成 110% 武器傷害。'}
 };
 G.labels={head:'頭部',body:'身體',feet:'腳部'};
 G.ensureProgress=g=>{g.progression||={level:1,xp:0,nextExp:40,nextXp:40,tickets:0};if(!Number.isFinite(g.progression.nextExp))g.progression.nextExp=Number.isFinite(g.progression.nextXp)?g.progression.nextXp:40;if(!Number.isFinite(g.progression.nextXp))g.progression.nextXp=g.progression.nextExp};
 G.toast=(name,sub='',rarity='magic',icon='✦')=>{const host=document.querySelector('#lootNotices');if(!host)return;const e=document.createElement('div');e.className=`loot-notice loot-${rarity}`;e.innerHTML=`<div class="loot-icon">${icon}</div><div><small>獲得技能石</small><strong>${name}</strong><span>${sub}</span></div>`;host.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.classList.remove('show'),2100);setTimeout(()=>e.remove(),2500)};
 G.grantXp=(g,n)=>{G.ensureProgress(g);g.progression.xp+=n;while(g.progression.xp>=g.progression.nextExp){g.progression.xp-=g.progression.nextExp;g.progression.level++;g.progression.tickets++;g.progression.nextExp=Math.round(40+Math.pow(g.progression.level-1,1.25)*26);g.progression.nextXp=g.progression.nextExp;const h=document.querySelector('#lootNotices');if(h){const e=document.createElement('div');e.className='loot-notice loot-legendary';e.innerHTML=`<div class="loot-icon">✦</div><div><small>等級提升</small><strong>LEVEL ${g.progression.level}</strong><span>獲得裂界券 ×1</span></div>`;h.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.remove(),2400)}}};
 G.gear=slot=>game.loadout?.equipment?.[slot]||null;
 G.utilityIds=()=>['head','body','feet'].map(s=>G.gear(s)?.utilityGem).filter(Boolean);
 G.utilityGems=()=>G.utilityIds().map(id=>G.gems[id]).filter(Boolean);
 G.activeGems=()=>G.utilityGems().filter(x=>x.kind==='active');
 G.supportIds=loadout=>{const out=[...(loadout.supports||[])];for(const s of ['head','body','feet'])for(const id of(loadout.equipment?.[s]?.socketed||[]))if(SUPPORTS[id])out.push(id);return out};
 G.auraEffects=weapon=>{const o={damageMult:1,rateMult:1,damageTakenMult:1};for(const g of G.utilityGems().filter(x=>x.kind==='aura')){if(g.id==='emberAura')o.damageMult*=weapon.tags?.includes('fire')?1.22:1.07;if(g.id==='stormAura')o.damageMult*=weapon.tags?.includes('lightning')?1.22:1.07;if(g.id==='ironAura')o.damageTakenMult*=.86;if(g.id==='hasteAura')o.rateMult*=.90}return o};
 const oldCompile=compileBuild;compileBuild=function(w,s=[],p={}){const o=oldCompile(w,s,p);if(game?.loadout?.weapon?.id===w?.id){const a=G.auraEffects(w);o.damage*=a.damageMult;o.rate*=a.rateMult;o.auraDamageTakenMult=a.damageTakenMult;o.utilityGems=G.utilityIds()}return o};
 const oldReset=Game.prototype.reset;Game.prototype.reset=function(seed){oldReset.call(this,seed);G.ensureProgress(this)};G.ensureProgress(game);
 const oldSocket=Game.prototype.socketTo;Game.prototype.socketTo=function(i,slot='weapon'){if(slot!=='weapon'){const gear=this.loadout.equipment?.[slot],inv=this.inventory[i];if(gear?.utilityGem&&inv?.kind==='support'&&(gear.socketed?.length||0)>=Math.max(0,gear.sockets-1)){this.message='這件裝備有 1 個技能孔被主動／光環佔用。';return{ok:false,reason:'full'}}}return oldSocket.call(this,i,slot)};
 Game.prototype.socketUtilityGem=function(i,slot){const inv=this.inventory[i],gear=this.loadout.equipment?.[slot];if(!inv||inv.kind!=='utilityGem'||!gear)return false;const used=(gear.socketed?.length||0)+(gear.utilityGem?1:0);if(!gear.utilityGem&&used>=gear.sockets){this.message='這件裝備沒有空技能孔。';return false}const prev=gear.utilityGem;gear.utilityGem=inv.item.id;this.inventory.splice(i,1);if(prev)this.inventory.push({kind:'utilityGem',item:G.gems[prev]});this.message=`${inv.item.name} 已插入${G.labels[slot]}裝備。`;return true};
 Game.prototype.unsocketUtilityGem=function(slot){const gear=this.loadout.equipment?.[slot],id=gear?.utilityGem;if(!id)return false;gear.utilityGem=null;this.inventory.push({kind:'utilityGem',item:G.gems[id]});this.message=`已拔除 ${G.gems[id].name}`;return true};
 const oldOffer=Game.prototype.offerChestRewards;Game.prototype.offerChestRewards=function(){const r=oldOffer.call(this),m=this.activeChestMeta,vals=Object.values(G.gems),g=vals[Math.floor(this.rng()*vals.length)],reward={kind:'utilityGem',id:g.id,item:g,name:g.name,icon:g.icon,meta:g.kind==='aura'?'光環技能石':'主動技能石',desc:g.desc};if(m?.type==='skill')r[Math.floor(this.rng()*r.length)]=reward;else if(m?.type==='mixed'&&this.rng()<.55)r[2]=reward;return r};
 const oldApply=Game.prototype.applyChestReward;Game.prototype.applyChestReward=function(r){if(r?.kind==='utilityGem'){this.inventory.push({kind:'utilityGem',item:G.gems[r.id]});this.pendingChestChoices=[];this.activeChestMeta=null;this.message=`取得${r.meta}：${r.name}`;G.toast(r.name,r.meta,'magic',r.icon);return true}return oldApply.call(this,r)};
})();