function supportFits(weapon,support){
 const tags=new Set(weapon.tags);
 if(support.requires&&!support.requires.every(t=>tags.has(t)))return false;
 if(support.requiresAny&&!support.requiresAny.some(t=>tags.has(t)))return false;
 return true;
}
function getSocketCapacity(loadout){return loadout.weapon.sockets + ((loadout.passives&&loadout.passives.socketBonus)||0)}
function compileBuild(weapon,supportIds=[],passives={}){
 const out={damage:weapon.baseDamage,rate:weapon.rate,projectiles:1,pierce:0,chain:0,ignite:0,shock:0,splash:1,tags:[...weapon.tags]};
 for(const id of supportIds){const s=SUPPORTS[id];if(!s||!supportFits(weapon,s))continue;const m=s.mods||{};
  if(m.damage)out.damage*=m.damage;if(m.rate)out.rate*=m.rate;if(m.projectiles)out.projectiles+=m.projectiles;
  if(m.pierce)out.pierce+=m.pierce;if(m.chain)out.chain+=m.chain;if(m.ignite)out.ignite+=m.ignite;if(m.shock)out.shock+=m.shock;if(m.splash)out.splash*=m.splash;}
 if(passives.damageMult)out.damage*=passives.damageMult;
 if(passives.rateMult)out.rate*=passives.rateMult;
 if(passives.projectiles&&weapon.tags.includes('projectile'))out.projectiles+=passives.projectiles;
 if(passives.fireMult&&weapon.tags.includes('fire'))out.damage*=passives.fireMult;
 if(passives.spellMult&&weapon.tags.includes('spell'))out.damage*=passives.spellMult;
 if(passives.meleeMult&&weapon.tags.includes('melee'))out.damage*=passives.meleeMult;
 if(passives.projectileMult&&weapon.tags.includes('projectile'))out.damage*=passives.projectileMult;
 return out;
}
function socketSupport(loadout,supportId){
 const s=SUPPORTS[supportId];if(!s)return {ok:false,reason:'unknown'};
 if(!supportFits(loadout.weapon,s))return {ok:false,reason:'incompatible'};
 if(loadout.supports.includes(supportId))return {ok:false,reason:'duplicate'};
 if(loadout.supports.length>=getSocketCapacity(loadout))return {ok:false,reason:'full'};
 loadout.supports.push(supportId);return {ok:true};
}

function seeded(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function revealAround(tiles,x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const t=tiles[y+dy]?.[x+dx];if(t)t.revealed=true}}
function isConnectedWithoutRocks(tiles,c){
 const seen=new Set([`${c},${c}`]),q=[[c,c]];
 while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=tiles[ny]?.[nx],k=`${nx},${ny}`;if(t&&t.type!==TILE.ROCK&&!seen.has(k)){seen.add(k);q.push([nx,ny])}}}
 for(const row of tiles)for(const t of row)if(t.type!==TILE.ROCK&&!seen.has(`${t.x},${t.y}`))return false;return true;
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function manhattan(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
function stepRoadSegment(worldTiles,a,b,rng){
 let x=a.x,y=a.y;
 worldTiles[y][x].road=true;
 let lastAxis='';
 let guard=0;
 while((x!==b.x||y!==b.y)&&guard<MAP_SIZE*MAP_SIZE){
  guard++;
  const dx=b.x-x,dy=b.y-y;
  const choices=[];
  if(dx!==0)choices.push({dx:Math.sign(dx),dy:0,axis:'x',w:lastAxis==='x'?1.15:.95});
  if(dy!==0)choices.push({dx:0,dy:Math.sign(dy),axis:'y',w:lastAxis==='y'?1.15:.95});
  const total=choices.reduce((s,c)=>s+c.w,0);
  let pick=rng()*total;
  let chosen=choices[0];
  for(const c of choices){pick-=c.w;if(pick<=0){chosen=c;break}}
  x+=chosen.dx;y+=chosen.dy;lastAxis=chosen.axis;
  worldTiles[y][x].road=true;
 }
}
function makeWaypoint(a,b,rng){
 const dx=b.x-a.x,dy=b.y-a.y;
 const span=Math.abs(dx)+Math.abs(dy);
 const mid={x:Math.round((a.x+b.x)/2),y:Math.round((a.y+b.y)/2)};
 const wiggle=Math.max(1,Math.floor(span*0.18));
 let wx=mid.x,wy=mid.y;
 if(Math.abs(dx)>=Math.abs(dy)){
  wy=clamp(mid.y+Math.floor((rng()*2-1)*(wiggle+1)),1,MAP_SIZE-2);
  wx=clamp(mid.x+Math.floor((rng()*2-1)*2),1,MAP_SIZE-2);
 }else{
  wx=clamp(mid.x+Math.floor((rng()*2-1)*(wiggle+1)),1,MAP_SIZE-2);
  wy=clamp(mid.y+Math.floor((rng()*2-1)*2),1,MAP_SIZE-2);
 }
 return {x:wx,y:wy};
}
function carveRoad(worldTiles,a,b,rng){
 const dist=manhattan(a,b);
 if(dist<=2){stepRoadSegment(worldTiles,a,b,rng);return}
 const viaCount=dist>10?2:1;
 let from=a;
 for(let i=0;i<viaCount;i++){
  const to=makeWaypoint(from,b,rng);
  stepRoadSegment(worldTiles,from,to,rng);
  from=to;
 }
 stepRoadSegment(worldTiles,from,b,rng);
}
function createWorld(seed=1){
 const rng=seeded(seed),tiles=[];for(let y=0;y<MAP_SIZE;y++){const row=[];for(let x=0;x<MAP_SIZE;x++)row.push({x,y,type:TILE.EMPTY,revealed:false,cleared:false});tiles.push(row)}
 const c=Math.floor(MAP_SIZE/2);tiles[c][c].revealed=true;
 const spots=[];for(let y=1;y<MAP_SIZE-1;y++)for(let x=1;x<MAP_SIZE-1;x++)if(Math.abs(x-c)+Math.abs(y-c)>2)spots.push([x,y]);
 for(let i=spots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]]}
 const put=(type,n)=>{for(let i=0;i<n&&spots.length;i++){const [x,y]=spots.pop();tiles[y][x].type=type}};
 put(TILE.ENEMY,18);put(TILE.CHEST,5);put(TILE.WEAPON,4);put(TILE.SUPPORT,7);put(TILE.SHRINE,3);put(TILE.SMITH,2);
 const [bx,by]=spots.pop();tiles[by][bx].type=TILE.BOSS;tiles[by][bx].bossDormant=true;
 for(const row of tiles)for(const t of row){if(t.type===TILE.ENEMY)t.enemyId=ENEMY_POOL[Math.floor(rng()*ENEMY_POOL.length)];else if(t.type===TILE.BOSS)t.enemyId='boss'}
 const roadNodes=[];for(const row of tiles)for(const t of row)if([TILE.BOSS,TILE.SMITH,TILE.SHRINE,TILE.CHEST,TILE.WEAPON,TILE.SUPPORT,TILE.ENEMY].includes(t.type))roadNodes.push({x:t.x,y:t.y,type:t.type});
 const hub={x:c,y:c};
 const priority=n=>({smith:0,chest:1,shrine:2,weapon:3,support:4,enemy:5,boss:6}[n.type]??9);
 roadNodes.sort((a,b)=>priority(a)-priority(b)||manhattan(a,hub)-manhattan(b,hub));
 const connected=[hub];
 roadNodes.forEach((node,i)=>{
  const anchor=i<3?hub:connected.reduce((best,cand)=>manhattan(cand,node)<manhattan(best,node)?cand:best,connected[0]);
  carveRoad(tiles,anchor,node,rng);
  connected.push(node);
 });
 let rocks=0;
 for(const [x,y] of spots){if(rocks>=18)break;if(rng()>.58)continue;if(Math.abs(x-c)+Math.abs(y-c)<3)continue;const t=tiles[y][x];if(t.road)continue;t.type=TILE.ROCK;if(isConnectedWithoutRocks(tiles,c))rocks++;else t.type=TILE.EMPTY}
 revealAround(tiles,c,c);const world={seed,tiles,boss:{x:bx,y:by},size:MAP_SIZE};
 world.decorations=generateDecorations(world,seed);
 return world;
}

function generateDecorations(world,seed){
 const rng=seeded(seed^0x5f3759df);
 const occupied=new Set();
 const cells=[];
 const nearRoad=(x,y)=>[
  [x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]
 ].some(([nx,ny])=>world.tiles[ny]?.[nx]?.road);
 for(const row of world.tiles)for(const t of row){
  if(t.type!==TILE.EMPTY||t.road)continue;
  cells.push({x:t.x,y:t.y,nearRoad:nearRoad(t.x,t.y)});
 }
 for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]]}
 const out=[];
 const reserve=(x,y,r=0)=>{for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++)occupied.add(`${x+ox},${y+oy}`)};
 const canUse=(cell,r=0,needRoad=false)=>{
  if(needRoad&&!cell.nearRoad)return false;
  for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++)if(occupied.has(`${cell.x+ox},${cell.y+oy}`))return false;
  return true;
 };
 const place=(key,countMin,countMax,{radius=0,needRoad=false,weight=1}={})=>{
  const target=countMin+Math.floor(rng()*(countMax-countMin+1));
  let placed=0;
  const pool=cells.slice().sort((a,b)=>{
    const aw=(a.nearRoad===needRoad?1:0)+(rng()*0.3)+(weight?a.y*0.001:0);
    const bw=(b.nearRoad===needRoad?1:0)+(rng()*0.3)+(weight?b.y*0.001:0);
    return bw-aw;
  });
  for(const cell of pool){
    if(placed>=target)break;
    if(!canUse(cell,radius,needRoad))continue;
    out.push({key,x:cell.x,y:cell.y,scale:(DECOR_CONFIG[key]?.scale||1)*(0.94+rng()*0.14),offsetY:(DECOR_CONFIG[key]?.offsetY||0)+(rng()*0.05)});
    reserve(cell.x,cell.y,radius);
    placed++;
   }
 };
 place('grassPatch',5,8,{radius:0});
 place('flowerPatch',4,6,{radius:0});
 place('swampPatch',2,3,{radius:1});
 place('stumpPatch',3,5,{radius:0});
 place('hutRuin',1,2,{radius:1,needRoad:true});
 place('towerRuin',1,1,{radius:1});
 place('altarRuin',1,2,{radius:1,needRoad:true});
 out.sort((a,b)=>(a.y-b.y)||(a.x-b.x));
 return out;
}

function simulateCombat(loadout,enemyDef,rng=Math.random){
 const build=compileBuild(loadout.weapon,loadout.supports,loadout.passives||{}),enemies=[];const n=enemyDef.count[0]+Math.floor(rng()*(enemyDef.count[1]-enemyDef.count[0]+1));
 for(let i=0;i<n;i++)enemies.push({hp:enemyDef.hp,maxHp:enemyDef.hp,shock:0,burn:0});
 let playerHp=loadout.hp,clock=0,nextPlayer=0,nextEnemy=enemyDef.rate,log=[],casts=0;
 while(playerHp>0&&enemies.some(e=>e.hp>0)&&clock<45){clock+=.05;
  for(const e of enemies){if(e.hp>0&&e.burn>0){e.hp-=build.damage*.10*.05;e.burn-=.05}}
  if(clock>=nextPlayer){casts++;nextPlayer=clock+build.rate;log.push({t:clock,type:'cast',projectiles:build.projectiles,pattern:loadout.weapon.pattern,weaponId:loadout.weapon.id});const alive0=enemies.filter(e=>e.hp>0);for(let s=0;s<build.projectiles;s++){let target=alive0[s%Math.max(1,alive0.length)]||null;let hops=1+build.chain,pierce=build.pierce;
    while(target&&hops-->0){const dmg=build.damage*(target.shock>0?1+build.shock:1);target.hp-=dmg;if(build.ignite>0&&rng()<build.ignite)target.burn=2.5;if(build.shock>0)target.shock=2.2;log.push({t:clock,type:'hit',damage:Math.round(dmg),target:enemies.indexOf(target)});
      const alive=enemies.filter(e=>e.hp>0&&e!==target);if(pierce>0){pierce--;target=alive[0]||null}else if(hops>0)target=alive[0]||null;else target=null;}}}
  if(clock>=nextEnemy){nextEnemy=clock+enemyDef.rate;const alive=enemies.filter(e=>e.hp>0).length;if(alive){const dmg=enemyDef.damage*Math.min(3,alive);playerHp-=dmg;log.push({t:clock,type:'hurt',damage:dmg})}}
  for(const e of enemies)if(e.shock>0)e.shock-=.05;
 }
 return{won:enemies.every(e=>e.hp<=0),playerHp:Math.max(0,playerHp),seconds:clock,casts,build,log,enemies};
}

class Game{
 constructor(seed=Date.now()>>>0){this.reset(seed)}
 reset(seed){
  this.seed=seed;this.rng=seeded(seed^99173);this.world=createWorld(seed);this.pos={x:6,y:6};this.turn=0;this.gold=0;this.dead=false;this.won=false;
  this.loadout={weapon:{...WEAPONS.fireStaff},supports:[],hp:100,maxHp:100,passives:{damageMult:1,rateMult:1,projectiles:0,fireMult:1,spellMult:1,meleeMult:1,projectileMult:1,nightSight:0,goldOnKill:0,socketBonus:0},skills:{}};
  this.inventory=[];this.lastCombat=null;this.pendingSkillChoices=[];this.pendingChestChoices=[];this.pendingSmith=false;this.message='探索裂界，準備迎戰即將甦醒的守門者。';
 }
 tile(){return this.world.tiles[this.pos.y][this.pos.x]}
 isNight(){return Math.floor(this.turn/DAY_LENGTH)%2===1}
 visionRadius(){return this.isNight()?1+(this.loadout.passives.nightSight||0):99}
 move(dx,dy){if(this.dead||this.won)return false;const nx=this.pos.x+dx,ny=this.pos.y+dy;if(nx<0||ny<0||nx>=this.world.size||ny>=this.world.size)return false;const target=this.world.tiles[ny][nx];if(target.type===TILE.ROCK){this.message='巨石擋住去路。';return false}this.pos={x:nx,y:ny};this.turn++;revealAround(this.world.tiles,nx,ny);this.resolveTile(this.tile());return true}
 offerSkills(){
  const pool=Object.values(SKILLS).filter(s=>(this.loadout.skills[s.id]||0)<s.max);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool.slice(0,3);
 }
 applySkill(skillId){
  const skill=SKILLS[skillId];if(!skill)return false;const rank=this.loadout.skills[skillId]||0;if(rank>=skill.max)return false;
  this.loadout.skills[skillId]=rank+1;skill.apply(this.loadout.passives,this.loadout);this.pendingSkillChoices=[];this.message=`領悟技能：${skill.name}`;return true;
 }
 offerChestRewards(){
  const rewards=[];
  const skills=this.offerSkills();
  if(skills.length){const s=skills[Math.floor(this.rng()*skills.length)];rewards.push({kind:'skill',id:s.id,name:s.name,icon:s.icon,desc:s.desc,meta:`旅者技能 · Lv.${(this.loadout.skills[s.id]||0)+1}`})}
  const supports=Object.values(SUPPORTS);const sup=supports[Math.floor(this.rng()*supports.length)];
  rewards.push({kind:'support',id:sup.id,name:sup.name,icon:sup.icon,desc:sup.desc,meta:'Support'});
  const utility=this.rng()<.5
   ? {kind:'gold',name:'旅商錢袋',icon:'●',desc:'立即獲得 18～28 金幣。',meta:'資源'}
   : {kind:'heal',name:'赤紅藥劑',icon:'◆',desc:'恢復 35 生命；若生命已滿，改為最大生命 +8。',meta:'補給'};
  rewards.push(utility);
  for(let i=rewards.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[rewards[i],rewards[j]]=[rewards[j],rewards[i]]}
  return rewards.slice(0,3);
 }
 applyChestReward(reward){
  if(!reward)return false;
  if(reward.kind==='skill'){this.applySkill(reward.id)}
  else if(reward.kind==='support'){const s=SUPPORTS[reward.id];this.inventory.push({kind:'support',item:s});this.message=`從寶箱取得 Support：${s.name}`}
  else if(reward.kind==='gold'){const amount=18+Math.floor(this.rng()*11);this.gold+=amount;this.message=`從寶箱取得 ${amount} 金幣。`}
  else if(reward.kind==='heal'){if(this.loadout.hp>=this.loadout.maxHp){this.loadout.maxHp+=8;this.loadout.hp=this.loadout.maxHp;this.message='藥劑強化了生命：最大生命 +8。'}else{this.loadout.hp=Math.min(this.loadout.maxHp,this.loadout.hp+35);this.message='喝下赤紅藥劑，恢復 35 生命。'}}
  this.pendingChestChoices=[];return true;
 }
 resolveTile(t){
  if(t.cleared)return;
  if(t.type===TILE.BOSS&&this.turn<BOSS_TURN){this.message=`守門者仍在沉睡。${BOSS_TURN-this.turn} 步後甦醒。`;return}
  if(t.type===TILE.ENEMY||t.type===TILE.BOSS){
   const id=t.type===TILE.BOSS?'boss':(t.enemyId||ENEMY_POOL[Math.floor(this.rng()*ENEMY_POOL.length)]);
   const result=simulateCombat(this.loadout,ENEMIES[id],this.rng);this.loadout.hp=result.playerHp;this.lastCombat={enemy:ENEMIES[id],...result};
   if(result.won){
     t.cleared=true;this.gold+=(id==='boss'?50:6)+(id==='boss'?0:(this.loadout.passives.goldOnKill||0));
     if(id==='boss'){this.won=true;this.message='裂界守門者倒下了。';}
     else{this.message=`擊敗 ${ENEMIES[id].name}，獲得金幣並清除道路威脅。`;}
   }else{this.dead=true;this.message='你倒在裂界之中。';}
   return;
  }
  if(t.type===TILE.CHEST){this.pendingChestChoices=this.offerChestRewards();this.message='找到寶箱：從三項獎勵中選擇一項。';t.cleared=true;return}
  if(t.type===TILE.SHRINE){this.loadout.maxHp+=12;this.loadout.hp=Math.min(this.loadout.maxHp,this.loadout.hp+30);this.message='古老祭壇回應了你：最大生命提高。';t.cleared=true;return}
  if(t.type===TILE.WEAPON){const vals=Object.values(WEAPONS).filter(w=>w.id!==this.loadout.weapon.id);const w={...vals[Math.floor(this.rng()*vals.length)]};this.inventory.push({kind:'weapon',item:w});this.message=`發現武器：${w.name}`;t.cleared=true;return}
  if(t.type===TILE.SUPPORT){const vals=Object.values(SUPPORTS);const s=vals[Math.floor(this.rng()*vals.length)];this.inventory.push({kind:'support',item:s});this.message=`發現支援技能：${s.name}`;t.cleared=true;return}
  if(t.type===TILE.SMITH){t.cleared=true;this.pendingSmith=true;this.message='抵達鐵匠鋪，你可以購買一項工藝。';return}
 }
 equipWeapon(index){const slot=this.inventory[index];if(!slot||slot.kind!=='weapon')return false;this.loadout.weapon=slot.item;this.loadout.supports=this.loadout.supports.filter(id=>SUPPORTS[id]&&supportFits(slot.item,SUPPORTS[id])).slice(0,getSocketCapacity(this.loadout));this.inventory.splice(index,1);this.message=`裝備 ${slot.item.name}`;return true}
 socket(index){const slot=this.inventory[index];if(!slot||slot.kind!=='support')return {ok:false};const result=socketSupport(this.loadout,slot.item.id);if(result.ok){this.inventory.splice(index,1);this.message=`${slot.item.name} 已連接到 ${this.loadout.weapon.name}`;}else if(result.reason==='incompatible')this.message='這顆支援技能與目前武器標籤不相容。';else if(result.reason==='full')this.message='目前武器沒有空技能孔。';return result}
 smithAction(kind){
   if(kind==='socket'){if(this.gold<14)return false;this.gold-=14;this.loadout.passives.socketBonus+=1;this.message='鐵匠擴充了你的武器孔位。';return true}
   if(kind==='damage'){if(this.gold<12)return false;this.gold-=12;this.loadout.passives.damageMult*=1.12;this.message='鐵匠磨鋒了你的武器，傷害上升。';return true}
   if(kind==='support'){if(this.gold<10)return false;this.gold-=10;const vals=Object.values(SUPPORTS);const s=vals[Math.floor(this.rng()*vals.length)];this.inventory.push({kind:'support',item:s});this.message=`鐵匠交給你支援技能：${s.name}`;return true}
   return false;
 }
}
