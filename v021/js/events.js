function openChestChoice(){
 if(!game.pendingChestChoices.length)return;uiBusy=true;const root=$('#skillChoices');root.innerHTML='';
 game.pendingChestChoices.forEach((reward,index)=>{const card=document.createElement('div');card.className=`choice-card kind-${reward.kind}`;const kindLabel=reward.kind==='skill'?'旅者技能':reward.kind==='support'?'SUPPORT':reward.kind==='gold'?'資源':'補給';const ik=reward.kind==='skill'?'rune':reward.kind==='support'?'support':reward.kind==='gold'?'coin':'heal';const effect=reward.kind==='skill'?'學會或升級一項永久影響本次遠征的旅者能力。':reward.kind==='support'?'放入背包，可插入相容武器的技能孔改造主攻擊。':reward.kind==='gold'?'立即取得資源，用於黑鐵工坊購買強化。':'立即恢復或提高生存能力。';card.innerHTML=`<div class="reward-kind">${iconSvg(ik,13)}${kindLabel}</div><div class="head"><div class="ico">${iconSvg(ik,38)}</div><div><h4>${reward.name}</h4><small>${reward.meta}</small></div></div><p>${reward.desc}</p><div class="reward-effect">${effect}</div><button>選擇這項獎勵</button>`;card.querySelector('button').onclick=()=>chooseChestReward(index);root.appendChild(card)});
 $('#skillModal').classList.remove('hidden');
}
function chooseChestReward(index){const reward=game.pendingChestChoices[index];game.applyChestReward(reward);$('#skillModal').classList.add('hidden');uiBusy=false;renderAll()}
function openSmith(){
 if(!game.pendingSmith)return;uiBusy=true;$('#smithGoldLine').innerHTML=`${iconSvg('coin',16)}目前持有 ${game.gold} 金幣`;const root=$('#smithChoices');root.innerHTML='';
 const options=[
  {id:'socket',icon:'support',name:'擴充孔位',cost:14,desc:'目前武器額外 +1 孔，讓你能連接更多 Support。',detail:'讓你的主技能可以連接更多效果。'},
  {id:'damage',icon:'sword',name:'磨鋒鍛打',cost:12,desc:'全域傷害提高 12%。',detail:'對所有武器都有效，適合快速強化輸出。'},
  {id:'support',icon:'rune',name:'購買支援技能',cost:10,desc:'獲得 1 顆隨機 Support，直接放進背包。',detail:'有機會直接補足你的 Build 缺口。'}
 ];
 options.forEach(opt=>{const afford=game.gold>=opt.cost;const card=document.createElement('div');card.className='choice-card smith afford-'+afford;card.innerHTML=`<div class="reward-kind">工藝方案</div><div class="head"><div class="ico">${iconSvg(opt.icon,24)}</div><div><h4>${opt.name}</h4><small>花費 ${opt.cost} 金幣</small></div></div><p>${opt.desc}</p><small>${opt.detail}</small><button ${afford?'':'disabled'}>${afford?'購買':'金幣不足'}</button>`;card.querySelector('button').onclick=()=>smithAction(opt.id);root.appendChild(card)});
 $('#smithModal').classList.remove('hidden');
}
function smithAction(kind){if(game.smithAction(kind)){game.pendingSmith=false;$('#smithModal').classList.add('hidden');uiBusy=false;renderAll()}else{renderAll();openSmith()}}
function closeSmith(){game.pendingSmith=false;$('#smithModal').classList.add('hidden');uiBusy=false;renderAll()}
function closeBattle(){if(!$('#battleContinue').classList.contains('hidden')){$('#battleModal').classList.add('hidden');uiBusy=false;renderAll()}}

function poiMeta(type){
 const data={
  smith:{name:'鐵匠鋪',desc:'火爐與鐵砧。可以擴充孔位、磨鋒武器或購買 Support。',art:'forge'},
  enemy:{name:'敵人營地',desc:'道路旁有敵意的氣息。踏入後會進入自動戰鬥。',art:'camp'},
  shrine:{name:'古老祭壇',desc:'被苔蘚覆蓋的石壇，能提高最大生命並恢復生命。',art:'altar'},
  chest:{name:'隱藏寶箱',desc:'重要的 Build 獎勵點。開啟後會出現三項獎勵，只能選擇其中一項。',art:'chest'},
  boss:{name:'裂界之門',desc:'守門者沉睡之地。倒數結束後，它會等待你的挑戰。',art:'boss'},
  weapon:{name:'遺落武具',desc:'散落在道路旁的武器。拾取後會放入背包。',art:'chest'},
  support:{name:'法紋殘片',desc:'可與武器技能孔連結的 Support。',art:'altar'}
 };return data[type]||null;
}
function renderPoiPreview(){
 const root=$('#poiPreview');let best=null,bestD=99;
 for(const row of game.world.tiles)for(const t of row){if(!t.revealed||t.cleared)continue;const meta=poiMeta(t.type);if(!meta)continue;const d=Math.abs(t.x-game.pos.x)+Math.abs(t.y-game.pos.y);if(d<bestD){bestD=d;best={t,meta}}}
 if(!best||bestD>4){root.innerHTML='<div class="poi-info"><strong>道路向未知延伸</strong><span>靠近地標後，這裡會顯示事件插畫與用途。</span></div>';return}
 const cls=best.meta.art;let art='';
 const encounter=best.t.type===TILE.ENEMY&&best.t.enemyId?ENEMIES[best.t.enemyId]:null;
 const infoName=encounter?encounter.name:best.meta.name;
 const infoDesc=encounter?`${best.meta.desc} 目前偵測到：${encounter.name}。`:best.meta.desc;
 if(cls==='forge')art='<div class="forge-house"></div><div class="anvil"></div>';
 else if(cls==='camp')art=`<div class="tent"></div><div class="campfire"></div><img class="poi-creature" src="${encounter?encounter.art:ENEMIES.wolf.art}" alt="${encounter?encounter.name:'敵人'}">`;
 else if(cls==='altar')art='<div class="altar"></div>';
 else if(cls==='chest')art='<div class="chest-art"></div>';
 else if(cls==='boss')art='<div class="boss-gate"></div>';
 root.innerHTML=`<div class="poi-art">${game.isNight()?'<div class="moon"></div>':''}${art}</div><div class="poi-info"><strong>${infoName}</strong><span>${infoDesc}</span><span class="poi-distance">距離 ${bestD} 格</span></div>`;
}

function renderAll(){
 renderMap();renderPoiPreview();renderWeapon();renderSkills();renderInventory();updateCombatSummary(game.lastCombat);
 $('#message').textContent=game.message;$('#hp').textContent=`${Math.ceil(game.loadout.hp)} / ${game.loadout.maxHp}`;$('#gold').textContent=game.gold;const hpTop=$('#hpTop'),hpFill=$('#hpFill'),skillCount=$('#skillCount');if(hpTop)hpTop.textContent=`${Math.ceil(game.loadout.hp)} / ${game.loadout.maxHp}`;if(hpFill)hpFill.style.width=`${Math.max(0,game.loadout.hp/game.loadout.maxHp*100)}%`;if(skillCount)skillCount.textContent=Object.keys(game.loadout.skills).length;
 const remain=Math.max(0,BOSS_TURN-game.turn);$('#turnText').textContent=remain?`${remain} 步`:'已甦醒';$('#threatFill').style.width=`${Math.min(100,game.turn/BOSS_TURN*100)}%`;const night=game.isNight(),phaseStep=game.turn%DAY_LENGTH,left=DAY_LENGTH-phaseStep;$('#dayCycle').innerHTML=night?`${iconSvg('moon',15)}夜晚 · ${left}步`:`${iconSvg('sun',15)}白天 · ${left}步`;$('#dayCycle').classList.toggle('night',night);document.querySelector('.app').classList.toggle('night',night);
 if((game.dead||game.won)&&!uiBusy){$('#end').classList.remove('hidden');$('#endTitle').textContent=game.won?'遠征完成':'遠征失敗';$('#endText').textContent=game.won?'你用自己的技能組合擊敗了裂界守門者。':'調整武器與支援技能，再嘗試不同路線。'}
}

async function move(dx,dy){if(uiBusy||!$('#bagModal').classList.contains('hidden')||!$('#skillModal').classList.contains('hidden')||!$('#smithModal').classList.contains('hidden'))return;const before=game.lastCombat;if(game.move(dx,dy)){renderAll();if(game.lastCombat&&game.lastCombat!==before)await playBattle(game.lastCombat);else if(game.pendingSmith)openSmith();else if(game.pendingChestChoices.length)openChestChoice()}}
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.move.split(',').map(Number);move(x,y)});
$('#worldCanvas').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*game.world.size),y=Math.floor((e.clientY-r.top)/r.height*game.world.size),dx=x-game.pos.x,dy=y-game.pos.y;if(Math.abs(dx)+Math.abs(dy)===1)move(dx,dy)});
window.addEventListener('keydown',e=>{if(e.key==='i'||e.key==='I'||e.key==='b'||e.key==='B'){e.preventDefault();$('#bagModal').classList.contains('hidden')?openBag():closeBag();return}if(e.key==='Escape'){if(!$('#bagModal').classList.contains('hidden'))closeBag();return}const m={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]}[e.key];if(m){e.preventDefault();move(...m)}});
function reset(){game=new Game();uiBusy=false;$('#end').classList.add('hidden');$('#battleModal').classList.add('hidden');$('#bagModal').classList.add('hidden');$('#skillModal').classList.add('hidden');$('#smithModal').classList.add('hidden');$('#combatLog').innerHTML='踏入敵人格子後會切換到完整戰鬥畫面，現在敵人已套用自訂怪物插畫。<br>寶箱會提供三選一獎勵，技能只是其中一種可能。';renderAll()}
$('#restart').onclick=reset;$('#again').onclick=reset;$('#openBag').onclick=openBag;$('#closeBag').onclick=closeBag;$('#closeSmith').onclick=closeSmith;$('#battleContinue').onclick=closeBattle;$('#bagModal').addEventListener('click',e=>{if(e.target.id==='bagModal')closeBag()});$('#smithModal').addEventListener('click',e=>{if(e.target.id==='smithModal')closeSmith()});$('#skillModal').addEventListener('click',e=>{if(e.target.id==='skillModal'&&game.pendingChestChoices.length)openChestChoice()});
hydrateIcons();loadMapSprites();renderAll();
