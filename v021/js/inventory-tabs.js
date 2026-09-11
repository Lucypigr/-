(() => {
 const G=window.GRIMSKILL;
 const SLOT_LABELS_I={weapon:'武器',head:'頭部',body:'身體',feet:'腳部'};
 let activeTab='equipment';
 const gearFor=s=>s==='weapon'?game.loadout.weapon:game.loadout.equipment?.[s]||null;
 const supportsFor=s=>s==='weapon'?(game.loadout.supports||[]):(game.loadout.equipment?.[s]?.socketed||[]);
 const capFor=s=>s==='weapon'?game.loadout.weapon.sockets+(game.loadout.passives?.socketBonus||0):(game.loadout.equipment?.[s]?.sockets||0);
 const utilityFor=s=>s==='weapon'?null:(game.loadout.equipment?.[s]?.utilityGem||null);
 function allSupportIds(){const a=[...(game.loadout.supports||[])];for(const s of ['head','body','feet'])a.push(...(game.loadout.equipment?.[s]?.socketed||[]));return a}
 function totalSockets(){return ['weapon','head','body','feet'].reduce((n,s)=>n+capFor(s),0)}
 function usedSockets(){return ['weapon','head','body','feet'].reduce((n,s)=>n+supportsFor(s).length+(utilityFor(s)?1:0),0)}
 function takenMultiplier(){let m=1;for(const s of ['head','body','feet']){const x=game.loadout.equipment?.[s]?.mods?.damageTakenMult;if(x)m*=x}if(G?.auraEffects)m*=G.auraEffects(game.loadout.weapon).damageTakenMult||1;return m}
 function auraList(){return G?G.utilityGems().filter(x=>x.kind==='aura'):[]}
 function activeList(){return G?G.utilityGems().filter(x=>x.kind==='active'):[]}
 function rarityClass(item){return item?.rarity?` rarity-${item.rarity}`:''}
 function socketRow(slot){
   const ids=supportsFor(slot),cap=capFor(slot),u=utilityFor(slot),out=[];
   for(let i=0;i<cap;i++){
     if(i<ids.length&&SUPPORTS[ids[i]]){const x=SUPPORTS[ids[i]];out.push(`<span class="paper-socket filled" title="${x.name}">${x.icon}</span>`)}
     else if(u&&i===ids.length){const x=G?.gems?.[u];out.push(`<span class="paper-socket utility" title="${x?.name||'技能'}">${x?.icon||'✧'}</span>`)}
     else out.push('<span class="paper-socket">○</span>');
   }
   return `<div class="paper-sockets">${out.join('')}</div>`;
 }
 function equipCard(slot){
   const item=gearFor(slot),label=SLOT_LABELS_I[slot];
   if(!item)return `<div class="paper-equip-card empty slot-${slot}"><small>${label}</small><strong>空欄位</strong><span>尚未裝備</span></div>`;
   const meta=slot==='weapon'?`${item.tags?.join(' · ')||'武器'} · ${capFor(slot)} 孔`:`${item.rarityName||'普通'} · ${item.sockets||0} 孔`;
   return `<div class="paper-equip-card${rarityClass(item)} slot-${slot}"><small>${label}</small><div class="paper-equip-name"><b>${item.icon||'◆'}</b><strong>${item.name}</strong></div><span>${meta}</span>${socketRow(slot)}</div>`;
 }
 function ensureLayout(){
   const modal=$('#bagModal'),body=modal?.querySelector('.inventory-body');if(!body)return;
   if(!body.classList.contains('split-inventory-body')){
     body.className='inventory-body split-inventory-body';
     body.innerHTML=`<div class="character-tabs"><button data-char-tab="equipment">⚔ 裝備</button><button data-char-tab="backpack">▦ 背包</button></div><section id="equipmentView" class="character-view"><div class="paperdoll-panel"><div class="paperdoll-title"><small>CHARACTER</small><h3>旅者裝備</h3></div><div class="paperdoll"><div class="traveler-silhouette"><i class="sil-head"></i><i class="sil-body"></i><i class="sil-legs"></i></div><div id="paperSlots"></div></div></div><aside class="character-stats-panel"><div class="paperdoll-title"><small>ATTRIBUTES</small><h3>人物屬性</h3></div><div id="characterStats" class="character-stat-grid"></div><div id="characterSkillSummary" class="character-skill-summary"></div></aside></section><section id="backpackView" class="character-view"><div class="backpack-head"><div><small>INVENTORY</small><h3>背包</h3></div><div><span id="backpackCount"></span></div></div><div id="bagInventory" class="backpack-grid"></div></section>`;
     body.querySelectorAll('[data-char-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.charTab;renderBag()});
   }
   const h=modal.querySelector('.modal-head h2');if(h)h.innerHTML='<span data-icon="bag"></span>角色與背包';
 }
 function renderEquipmentView(){
   const b=compileBuild(game.loadout.weapon,game.loadout.supports||[],game.loadout.passives||{}),taken=takenMultiplier(),auras=auraList(),acts=activeList();
   $('#paperSlots').innerHTML=['weapon','head','body','feet'].map(equipCard).join('');
   $('#characterStats').innerHTML=`<div><strong>${b.damage.toFixed(1)}</strong><span>攻擊傷害</span></div><div><strong>${b.rate.toFixed(2)}s</strong><span>攻擊間隔</span></div><div><strong>${b.projectiles||1}</strong><span>投射物</span></div><div><strong>${game.loadout.maxHp}</strong><span>最大生命</span></div><div><strong>${Math.round((1-taken)*100)}%</strong><span>傷害減免</span></div><div><strong>${usedSockets()}/${totalSockets()}</strong><span>技能孔</span></div>`;
   $('#characterSkillSummary').innerHTML=`<div><small>常駐光環</small>${auras.length?auras.map(x=>`<span class="char-skill-chip aura">${x.icon} ${x.name}</span>`).join(''):'<span class="char-skill-chip muted">無</span>'}</div><div><small>主動技能</small>${acts.length?acts.map(x=>`<span class="char-skill-chip active">${x.icon} ${x.name}</span>`).join(''):'<span class="char-skill-chip muted">無</span>'}</div><p>更換裝備、使用消耗品或配置技能石請切到「背包」。</p>`;
 }
 function canPutSupport(slot,id){
   if(!supportFits(game.loadout.weapon,SUPPORTS[id]))return false;
   if(allSupportIds().includes(id))return false;
   if(slot!=='weapon'&&!game.loadout.equipment?.[slot])return false;
   const occupied=supportsFor(slot).length+(utilityFor(slot)?1:0);return occupied<capFor(slot);
 }
 function itemDescription(inv){const item=inv.item||{};if(inv.kind==='gear')return `${SLOT_LABELS_I[item.slot]} · ${item.rarityName||'普通'} · ${item.sockets||0} 孔`;if(inv.kind==='weapon')return `武器 · ${item.sockets||0} 孔`;if(inv.kind==='support')return `Support · ${item.desc||''}`;if(inv.kind==='utilityGem')return `${item.kind==='aura'?'光環':'主動技能'} · ${item.desc||''}`;if(inv.kind==='food')return `食物 · ${item.desc||''}`;return inv.kind||'物品'}
 function inventoryToast(name,sub,icon='◆',rarity='common'){const host=$('#lootNotices');if(!host)return;const e=document.createElement('div');e.className=`loot-notice loot-${rarity}`;e.innerHTML=`<div class="loot-icon">${icon}</div><div><small>已使用</small><strong>${name}</strong><span>${sub}</span></div>`;host.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>e.classList.remove('show'),1900);setTimeout(()=>e.remove(),2300)}
 function consumeFood(index){
   const inv=game.inventory[index];if(!inv||inv.kind!=='food')return;const x=inv.item,m=x.mult||1;let effect='';
   if(x.id==='redStew'){const n=Math.round(35*m);game.loadout.hp=Math.min(game.loadout.maxHp,game.loadout.hp+n);effect=`恢復 ${n} 生命`}
   else if(x.id==='giantRoot'){const n=Math.round(8*m);game.loadout.maxHp+=n;game.loadout.hp=Math.min(game.loadout.maxHp,game.loadout.hp+n);effect=`最大生命 +${n}`}
   else if(x.id==='hunterRation'){const p=.04*m;game.loadout.passives.damageMult*=1+p;effect=`全域傷害 +${Math.round(p*100)}%`}
   else if(x.id==='swiftTea'){const p=.035*m;game.loadout.passives.rateMult*=1-p;effect=`攻擊間隔 -${Math.round(p*100)}%`}
   else effect='已使用';
   game.inventory.splice(index,1);game.message=`使用 ${x.name}：${effect}`;inventoryToast(x.name,effect,x.icon||'◆',x.rarity||'fine');renderAll();renderBag();
 }
 function openTicket(){if(!game.progression?.tickets)return;$('#lotteryModal')?.classList.remove('hidden')}
 function renderBackpackView(){
   const root=$('#bagInventory');root.innerHTML='';const tickets=game.progression?.tickets||0;$('#backpackCount').textContent=`${game.inventory.length} 件物品`;
   const ticket=document.createElement('button');ticket.className=`backpack-item consumable ticket-card ${tickets?'':'disabled'}`;ticket.innerHTML=`<span class="bp-icon">✦</span><strong>裂界券</strong><small>持有 ${tickets} 張</small><em>${tickets?'點擊使用':'升級後取得'}</em>`;ticket.disabled=!tickets;ticket.onclick=openTicket;root.appendChild(ticket);
   if(!game.inventory.length){const e=document.createElement('div');e.className='backpack-empty';e.textContent='背包目前沒有其他物品。';root.appendChild(e);return}
   game.inventory.forEach((inv,index)=>{
     const item=inv.item||{},card=document.createElement('div');card.className=`backpack-item kind-${inv.kind}${rarityClass(item)}`;
     let actions='';
     if(inv.kind==='food')actions=`<button class="bp-primary" data-food="${index}">使用</button>`;
     else if(inv.kind==='gear'||inv.kind==='weapon')actions=`<button class="bp-primary" data-equip="${index}">裝備</button>`;
     else if(inv.kind==='support')actions=`<div class="bp-slot-actions">${['weapon','head','body','feet'].map(s=>`<button data-support="${index}" data-slot="${s}" ${canPutSupport(s,item.id)?'':'disabled'}>${SLOT_LABELS_I[s]}</button>`).join('')}</div>`;
     else if(inv.kind==='utilityGem')actions=`<div class="bp-slot-actions">${['head','body','feet'].map(s=>{const gear=game.loadout.equipment?.[s],used=(gear?.socketed?.length||0)+(gear?.utilityGem?1:0),ok=gear&&(gear.utilityGem||used<gear.sockets);return `<button data-utility="${index}" data-slot="${s}" ${ok?'':'disabled'}>${SLOT_LABELS_I[s]}</button>`}).join('')}</div>`;
     card.innerHTML=`<div class="bp-icon">${item.icon||'◆'}</div><div class="bp-copy"><strong>${item.name||'未知物品'}</strong><small>${itemDescription(inv)}</small></div><div class="bp-actions">${actions}</div>`;
     if(inv.kind==='food')card.onclick=e=>{if(!e.target.closest('button'))consumeFood(index)};
     root.appendChild(card);
   });
   root.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>consumeFood(Number(b.dataset.food)));
   root.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.equip),inv=game.inventory[i];if(inv?.kind==='weapon')game.equipWeapon(i);else if(inv?.kind==='gear')game.equipGear(i);renderAll();renderBag()});
   root.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>{game.socketTo(Number(b.dataset.support),b.dataset.slot);renderAll();renderBag()});
   root.querySelectorAll('[data-utility]').forEach(b=>b.onclick=()=>{game.socketUtilityGem(Number(b.dataset.utility),b.dataset.slot);renderAll();renderBag()});
 }
 const previousApply=Game.prototype.applyChestReward;
 Game.prototype.applyChestReward=function(reward){
   if(reward?.kind==='food'){
     this.inventory.push({kind:'food',item:{id:reward.id,name:reward.name,icon:reward.icon,desc:reward.desc,mult:reward.mult||1,rarity:this.activeChestMeta?.tier||'common'}});this.pendingChestChoices=[];this.message=`取得食物：${reward.name}，已放入背包。`;this.activeChestMeta=null;inventoryToast(reward.name,'已放入背包',reward.icon||'◆','fine');return true;
   }
   return previousApply.call(this,reward);
 };
 renderBag=function(){
   ensureLayout();document.querySelectorAll('[data-char-tab]').forEach(b=>b.classList.toggle('active',b.dataset.charTab===activeTab));$('#equipmentView').classList.toggle('hidden',activeTab!=='equipment');$('#backpackView').classList.toggle('hidden',activeTab!=='backpack');if(activeTab==='equipment')renderEquipmentView();else renderBackpackView();hydrateIcons?.();
 };
 renderInventory=function(){const root=$('#inventory');if(!root)return;const foods=game.inventory.filter(x=>x.kind==='food').length,gear=game.inventory.filter(x=>x.kind==='gear'||x.kind==='weapon').length,gems=game.inventory.filter(x=>x.kind==='support'||x.kind==='utilityGem').length,t=game.progression?.tickets||0;root.innerHTML=`<button class="inv-summary-card" id="openEquipmentQuick"><b>⚔ 裝備</b><span>查看人物屬性與穿戴裝備</span></button><button class="inv-summary-card" id="openBackpackQuick"><b>▦ 背包 ${game.inventory.length}</b><span>裝備 ${gear} · 技能石 ${gems} · 食物 ${foods} · 裂界券 ${t}</span></button>`;$('#openEquipmentQuick').onclick=()=>{activeTab='equipment';openBag()};$('#openBackpackQuick').onclick=()=>{activeTab='backpack';openBag()}};
 ensureLayout();const open=$('#openBag');if(open)open.textContent='角色 / 背包';document.title='GRIMPATH v0.25';const sub=document.querySelector('.brand small');if(sub)sub.textContent='荒暮森林 · Character & Inventory v0.25';renderAll();
})();