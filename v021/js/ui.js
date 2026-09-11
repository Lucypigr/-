const $=s=>document.querySelector(s);
let game=new Game();
let uiBusy=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const tileIcon=t=>{
 if(t.cleared)return '·';
 if(t.type===TILE.ENEMY)return '⚔';
 if(t.type===TILE.CHEST)return '▤';
 if(t.type===TILE.WEAPON)return '▣';
 if(t.type===TILE.SUPPORT)return '✦';
 if(t.type===TILE.SHRINE)return '◈';
 if(t.type===TILE.BOSS)return '👹';
 if(t.type===TILE.SMITH)return '⚒';
 if(t.type===TILE.ROCK)return '🪨';
 return '';
};

function worldPalette(){
 const night=game.isNight();
 return night?{grass:'#18211d',grass2:'#1c2821',road:'#655b45',roadEdge:'#332f25',water:'#21343a',fog:'rgba(4,7,6,.88)'}:{grass:'#344b36',grass2:'#3c5540',road:'#8a7651',roadEdge:'#554832',water:'#385760',fog:'rgba(10,15,12,.78)'};
}
function drawTree(ctx,x,y,s=1){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 ctx.fillStyle='#2b2017';ctx.fillRect(-3,5,6,15);
 ctx.fillStyle='#1d3324';ctx.beginPath();ctx.arc(-8,2,12,0,Math.PI*2);ctx.arc(7,0,14,0,Math.PI*2);ctx.arc(0,-10,13,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#38543a';ctx.beginPath();ctx.arc(-5,-4,8,0,Math.PI*2);ctx.arc(7,-7,8,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawRock(ctx,x,y,s=1){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#555d56';ctx.strokeStyle='#2e342f';ctx.lineWidth=2;
 const rocks=[[-10,6,11,8],[2,1,13,11],[12,8,8,6]];for(const [rx,ry,rw,rh] of rocks){ctx.beginPath();ctx.ellipse(rx,ry,rw,rh,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
 ctx.fillStyle='#737b74';ctx.beginPath();ctx.ellipse(0,-3,7,3,-.2,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawBush(ctx,x,y,s=.8){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#263c2b';ctx.strokeStyle='#16241a';ctx.lineWidth=2;
 for(const [dx,dy,r] of [[-7,1,7],[0,-4,9],[8,1,7],[1,4,8]]){ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();ctx.stroke()}
 ctx.fillStyle='#3f6042';ctx.beginPath();ctx.arc(-3,-5,3,0,Math.PI*2);ctx.arc(6,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawGrassTuft(ctx,x,y,s=.8){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#66885c';ctx.lineWidth=2;ctx.lineCap='round';
 for(const [dx,h,sl] of [[-5,9,-3],[-2,12,-1],[2,11,1],[5,8,3]]){ctx.beginPath();ctx.moveTo(dx,5);ctx.quadraticCurveTo(dx+sl,0,dx+sl,-h);ctx.stroke()}
 ctx.restore();
}
function drawFlowerPatch(ctx,x,y,s=.75){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#d9c77e';ctx.strokeStyle='#55724f';ctx.lineWidth=1.5;
 for(const [dx,dy] of [[-6,2],[0,-2],[6,3]]){ctx.beginPath();ctx.moveTo(dx,7);ctx.lineTo(dx,dy+2);ctx.stroke();ctx.beginPath();ctx.arc(dx,dy,2.2,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function drawStump(ctx,x,y,s=.8){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#5a4631';ctx.strokeStyle='#2b2118';ctx.lineWidth=2;ctx.fillRect(-6,-2,12,9);ctx.strokeRect(-6,-2,12,9);ctx.fillStyle='#8d6d48';ctx.beginPath();ctx.ellipse(0,-2,6,3,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}
function drawPebble(ctx,x,y,s=.75){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#70776d';ctx.strokeStyle='#353a35';ctx.lineWidth=1.5;
 for(const [dx,dy,rx,ry] of [[-5,1,5,3],[3,-1,4,3],[7,4,3,2]]){ctx.beginPath();ctx.ellipse(dx,dy,rx,ry,-.2,0,Math.PI*2);ctx.fill();ctx.stroke()}
 ctx.restore();
}
function drawPoi(ctx,type,x,y,r=21){
 ctx.save();
 ctx.translate(x,y);
 ctx.lineCap='round';ctx.lineJoin='round';
 const shadow=()=>{ctx.shadowColor='rgba(0,0,0,.68)';ctx.shadowBlur=12;ctx.shadowOffsetY=6};
 const clearShadow=()=>{ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0};
 if(type==='enemy'){
  shadow();ctx.fillStyle='#321712';ctx.strokeStyle='#9a4638';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(-18,-15,36,31,10);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#e6aa83';ctx.lineWidth=3.2;
  for(const ox of [-7,0,7]){ctx.beginPath();ctx.moveTo(ox-2,7);ctx.quadraticCurveTo(ox,-2,ox+4,-10);ctx.stroke()}
  ctx.fillStyle='#d9745b';ctx.beginPath();ctx.arc(0,8,5,0,Math.PI*2);ctx.fill();
 }
 else if(type==='smith'){
  shadow();ctx.fillStyle='#322317';ctx.strokeStyle='#93663a';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(-20,-13,40,29,7);ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#a3a49e';ctx.strokeStyle='#e0c18d';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(7,-3);ctx.lineTo(14,2);ctx.lineTo(7,7);ctx.lineTo(-10,7);ctx.lineTo(-15,3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#71746f';ctx.fillRect(-4,7,8,10);
  ctx.fillStyle='#f0a14a';for(const [sx,sy] of [[13,-9],[18,-4],[9,-12]]){ctx.beginPath();ctx.arc(sx,sy,1.8,0,Math.PI*2);ctx.fill()}
 }
 else if(type==='chest'){
  shadow();ctx.fillStyle='#5a3a1d';ctx.strokeStyle='#d0a157';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.roundRect(-18,-8,36,23,5);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(0,-8,18,Math.PI,0);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#8b642f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,2);ctx.lineTo(17,2);ctx.stroke();
  ctx.fillStyle='#f0cf72';ctx.strokeStyle='#6d4b22';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-4,-1,8,10,2);ctx.fill();ctx.stroke();
 }
 else if(type==='shrine'){
  shadow();ctx.fillStyle='#283a2d';ctx.strokeStyle='#75a37b';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(-12,14);ctx.lineTo(-8,-8);ctx.lineTo(0,-16);ctx.lineTo(8,-8);ctx.lineTo(12,14);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#9bd69f';ctx.shadowColor='#71d28a';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,-3,4.5,0,Math.PI*2);ctx.fill();clearShadow();
  ctx.fillStyle='#536659';ctx.fillRect(-15,13,30,5);
 }
 else if(type==='boss'){
  ctx.scale(1.18,1.18);shadow();ctx.fillStyle='#2b1111';ctx.strokeStyle='#a4413e';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-20,15);ctx.lineTo(-18,-6);ctx.lineTo(-10,-15);ctx.lineTo(-5,-8);ctx.lineTo(0,-18);ctx.lineTo(5,-8);ctx.lineTo(10,-15);ctx.lineTo(18,-6);ctx.lineTo(20,15);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#d55f55';ctx.beginPath();ctx.moveTo(-8,6);ctx.lineTo(-4,-1);ctx.lineTo(0,6);ctx.lineTo(4,-1);ctx.lineTo(8,6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ff9886';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,10);ctx.lineTo(11,10);ctx.stroke();
 }
 else if(type==='weapon'){
  shadow();ctx.fillStyle='#2a241b';ctx.strokeStyle='#8f7953';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,13,17,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#e3d0a0';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-9,12);ctx.lineTo(8,-12);ctx.stroke();
  ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(3,-12);ctx.lineTo(10,-12);ctx.lineTo(8,-5);ctx.moveTo(-14,6);ctx.lineTo(-5,13);ctx.stroke();
 }
 else if(type==='support'){
  shadow();ctx.fillStyle='#172039';ctx.strokeStyle='#6f87c7';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(13,-5);ctx.lineTo(9,13);ctx.lineTo(0,18);ctx.lineTo(-9,13);ctx.lineTo(-13,-5);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#bed0ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);ctx.moveTo(-7,-3);ctx.lineTo(7,5);ctx.moveTo(7,-3);ctx.lineTo(-7,5);ctx.stroke();
  ctx.fillStyle='#aabfff';ctx.beginPath();ctx.arc(0,1,3,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

function roadMaskAt(x,y){
 const rows=game.world.tiles;
 const connected=(nx,ny)=>!!rows[ny]?.[nx]?.road;
 return (connected(x,y-1)?1:0)|(connected(x+1,y)?2:0)|(connected(x,y+1)?4:0)|(connected(x-1,y)?8:0);
}
function drawSpriteRotated(ctx,img,x,y,size,rotation=0,alpha=1){
 if(!img||!img.complete||!img.naturalWidth)return false;
 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.translate(x+size/2,y+size/2);
 if(rotation)ctx.rotate(rotation*Math.PI/180);
 ctx.drawImage(img,-size/2,-size/2,size,size);
 ctx.restore();
 return true;
}
function drawGrassCell(ctx,x,y,size){
 if(drawSpriteRotated(ctx,MAP_SPRITES.grass,x,y,size))return;
 const grd=ctx.createLinearGradient(x,y,x,y+size);
 grd.addColorStop(0,'#40543e');grd.addColorStop(1,'#2b3d2b');
 ctx.fillStyle=grd;ctx.fillRect(x,y,size,size);
}
function drawRoadCell(ctx,x,y,size,mask){
 if(mask===15){if(drawSpriteRotated(ctx,MAP_SPRITES.roadCross,x,y,size))return}
 if(mask===11){if(drawSpriteRotated(ctx,MAP_SPRITES.roadTMissingS,x,y,size))return}
 if(mask===7){if(drawSpriteRotated(ctx,MAP_SPRITES.roadTMissingS,x,y,size,90))return}
 if(mask===14){if(drawSpriteRotated(ctx,MAP_SPRITES.roadTMissingS,x,y,size,180))return}
 if(mask===13){if(drawSpriteRotated(ctx,MAP_SPRITES.roadTMissingS,x,y,size,270))return}
 if(mask===5||mask===1||mask===4){if(drawSpriteRotated(ctx,MAP_SPRITES.roadStraightV,x,y,size))return}
 if(mask===10||mask===2||mask===8){if(drawSpriteRotated(ctx,MAP_SPRITES.roadStraightH,x,y,size))return}
 if(mask===9){if(drawSpriteRotated(ctx,MAP_SPRITES.roadCornerNW,x,y,size))return}
 if(mask===3){if(drawSpriteRotated(ctx,MAP_SPRITES.roadCornerSW,x,y,size,180))return}
 if(mask===6){if(drawSpriteRotated(ctx,MAP_SPRITES.roadCornerSE,x,y,size))return}
 if(mask===12){if(drawSpriteRotated(ctx,MAP_SPRITES.roadCornerSW,x,y,size))return}
 if(mask===0){drawGrassCell(ctx,x,y,size);return}
 drawGrassCell(ctx,x,y,size);
 ctx.save();
 ctx.strokeStyle='rgba(74,57,37,.85)';
 ctx.lineWidth=size*.28;
 ctx.lineCap='round';
 ctx.translate(x+size/2,y+size/2);
 const seg=(dx,dy)=>{ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(dx*size*.44,dy*size*.44);ctx.stroke()};
 if(mask&1)seg(0,-1); if(mask&2)seg(1,0); if(mask&4)seg(0,1); if(mask&8)seg(-1,0);
 ctx.restore();
}
function drawDecorAsset(ctx,deco,cell){
 const img=DECOR_SPRITES[deco.key];
 if(!img||!img.complete||!img.naturalWidth)return;
 const scale=deco.scale||1;
 const w=cell*scale;
 const h=w*(img.naturalHeight/img.naturalWidth);
 const cx=(deco.x+.5)*cell;
 const baseY=(deco.y+1)*cell+(deco.offsetY||0)*cell;
 ctx.save();
 ctx.globalAlpha=.95;
 ctx.drawImage(img,cx-w/2,baseY-h,w,h);
 ctx.restore();
}

function renderMap(){
 const canvas=$('#worldCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height,N=game.world.size,cell=W/N,pal=worldPalette();
 ctx.clearRect(0,0,W,H);
 for(const row of game.world.tiles)for(const t of row){const tx=t.x*cell,ty=t.y*cell;drawGrassCell(ctx,tx,ty,cell+0.25)}
 for(const row of game.world.tiles)for(const t of row){if(!t.road)continue;const tx=t.x*cell,ty=t.y*cell;drawRoadCell(ctx,tx,ty,cell+0.25,roadMaskAt(t.x,t.y))}
 for(const deco of (game.world.decorations||[]))drawDecorAsset(ctx,deco,cell);
 ctx.strokeStyle='rgba(8,12,10,.15)';ctx.lineWidth=1;
 for(let i=0;i<=N;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,H);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(W,i*cell);ctx.stroke()}
 for(const row of game.world.tiles)for(const t of row){const cx=(t.x+.5)*cell,cy=(t.y+.5)*cell;if(t.type===TILE.ROCK){drawRock(ctx,cx,cy+2,.9)}}
 for(const row of game.world.tiles)for(const t of row){if(t.type===TILE.EMPTY||t.type===TILE.ROCK||t.cleared)continue;const cx=(t.x+.5)*cell,cy=(t.y+.5)*cell;drawPoi(ctx,t.type,cx,cy,t.type===TILE.BOSS?24:20)}
 const px=(game.pos.x+.5)*cell,py=(game.pos.y+.5)*cell;ctx.save();ctx.translate(px,py);ctx.shadowColor='rgba(244,201,113,.65)';ctx.shadowBlur=20;ctx.fillStyle='#d7b36a';ctx.strokeStyle='#201b13';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowColor='transparent';ctx.fillStyle='#262d27';ctx.beginPath();ctx.moveTo(-9,10);ctx.lineTo(0,-14);ctx.lineTo(9,10);ctx.closePath();ctx.fill();ctx.fillStyle='#f0d7a2';ctx.beginPath();ctx.arc(0,-6,4,0,Math.PI*2);ctx.fill();ctx.restore();
 const radius=game.visionRadius();
 for(const row of game.world.tiles)for(const t of row){const near=Math.max(Math.abs(t.x-game.pos.x),Math.abs(t.y-game.pos.y))<=radius;const visible=t.revealed&&(!game.isNight()||near);if(!visible){ctx.fillStyle=pal.fog;ctx.fillRect(t.x*cell,t.y*cell,cell+.5,cell+.5)}}
 if(game.isNight()){const ng=ctx.createRadialGradient(px,py,cell*.55,px,py,cell*(radius+1.3));ng.addColorStop(0,'rgba(12,18,15,0)');ng.addColorStop(.62,'rgba(5,8,7,.2)');ng.addColorStop(1,'rgba(2,4,3,.62)');ctx.fillStyle=ng;ctx.fillRect(0,0,W,H)}
 const vg=ctx.createRadialGradient(W/2,H/2,W*.28,W/2,H/2,W*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.42)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

function weaponHtml(w,compact=false){
 const b=compileBuild(w,game.loadout.weapon.id===w.id?game.loadout.supports:[],game.loadout.passives);
 const sockets=Array.from({length:game.loadout.weapon.id===w.id?getSocketCapacity(game.loadout):w.sockets},(_,i)=>{const id=game.loadout.weapon.id===w.id?game.loadout.supports[i]:null,s=id?SUPPORTS[id]:null;return `<div class="socket ${s?'filled':''}" title="${s?s.name:'空技能孔'}">${s?s.icon:'○'}</div>`}).join('');
 return `<div class="weapon-card"><div class="weapon-title"><strong>${w.icon} ${w.name}</strong><span>${game.loadout.weapon.id===w.id?getSocketCapacity(game.loadout):w.sockets} 孔</span></div><div class="tags">${w.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="sockets">${sockets}</div>${compact?'':`<div style="margin-top:10px;font-size:12px;color:#c7cdbf">傷害 ${b.damage.toFixed(1)} · 間隔 ${b.rate.toFixed(2)}s · 投射物 ${b.projectiles}${b.pierce?` · 穿透 ${b.pierce}`:''}${b.chain?` · 連鎖 ${b.chain}`:''}${b.ignite?` · 點燃 ${Math.round(b.ignite*100)}%`:''}</div>`}</div>`;
}
function renderWeapon(){ $('#weapon').innerHTML=weaponHtml(game.loadout.weapon); }
function renderSkills(){
 const root=$('#skillsPanel');root.innerHTML='';
 const owned=Object.entries(game.loadout.skills);
 if(!owned.length){root.innerHTML='<small style="color:#8b978f">尚未習得旅者技能。探索寶箱時有機會從三項獎勵中取得技能。</small>';return}
 owned.forEach(([id,rank])=>{const s=SKILLS[id];const d=document.createElement('div');d.className='skill-pill';d.innerHTML=`<div class="ico">${s.icon}</div><div class="meta"><b>${s.name}</b><span>${s.desc}</span></div><div class="rank">Lv.${rank}</div>`;root.appendChild(d)});
}

function renderInventory(){
 const root=$('#inventory');root.innerHTML='';
 if(!game.inventory.length){root.innerHTML='<small style="color:#89958d">尚未找到裝備。探索 ▣ 與 ✦ 格子，或打開背包查看目前裝備。</small>';return}
 game.inventory.slice(0,4).forEach((slot,i)=>{
  const d=document.createElement('div');d.className='inv-item';
  if(slot.kind==='weapon')d.innerHTML=`<div style="font-size:24px">${slot.item.icon}</div><div><strong>${slot.item.name}</strong><small>${slot.item.tags.join(' · ')} / ${slot.item.sockets} 孔</small></div><button>裝備</button>`;
  else{const fits=supportFits(game.loadout.weapon,slot.item);d.innerHTML=`<div style="font-size:22px">${slot.item.icon}</div><div><strong>${slot.item.name}</strong><small>${slot.item.desc}${fits?'':' · 不相容'}</small></div><button ${fits?'':'disabled'}>插入</button>`}
  d.querySelector('button').onclick=()=>{if(slot.kind==='weapon')game.equipWeapon(i);else game.socket(i);renderAll();renderBag()};root.appendChild(d);
 });
 if(game.inventory.length>4)root.insertAdjacentHTML('beforeend',`<small style="color:#89958d">另有 ${game.inventory.length-4} 件物品，打開背包查看。</small>`);
}

function renderBag(){
 const w=game.loadout.weapon,b=compileBuild(w,game.loadout.supports,game.loadout.passives);
 const socketHtml=Array.from({length:getSocketCapacity(game.loadout)},(_,i)=>{const id=game.loadout.supports[i],sup=id?SUPPORTS[id]:null;return `<div class="socket-slot ${sup?'filled':''}">${sup?`<strong>${sup.icon} ${sup.name}</strong><span>${sup.desc}</span><button data-unsocket="${i}" title="拔除">×</button>`:'<strong>空技能孔</strong><span>可插入與目前武器 Tag 相容的 Support</span>'}</div>`}).join('');
 $('#bagEquipped').innerHTML=`<div class="big-weapon">${w.icon} ${w.name}</div><div class="tags">${w.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="socket-row">${socketHtml}</div><div class="menu-hint">主技能由武器決定；Support 透過技能孔連接後，會即時改變投射物、傷害、攻速與特殊效果。</div>`;
 document.querySelectorAll('[data-unsocket]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.unsocket),id=game.loadout.supports[i];if(id){game.inventory.push({kind:'support',item:SUPPORTS[id]});game.loadout.supports.splice(i,1);game.message=`已拔除 ${SUPPORTS[id].name}`;renderAll();renderBag()}});
 const effects=[]; if(b.pierce)effects.push(`穿透 ${b.pierce}`); if(b.chain)effects.push(`連鎖 ${b.chain}`); if(b.ignite)effects.push(`點燃 ${Math.round(b.ignite*100)}%`); if(b.shock)effects.push(`感電 ${Math.round(b.shock*100)}%`);
 $('#bagBuildSummary').innerHTML=`<div class="build-panel-stats"><div class="build-stat-card"><strong>${b.damage.toFixed(1)}</strong><span>單次傷害</span></div><div class="build-stat-card"><strong>${b.rate.toFixed(2)}s</strong><span>攻擊間隔</span></div><div class="build-stat-card"><strong>${b.projectiles}</strong><span>投射物</span></div><div class="build-stat-card"><strong>${getSocketCapacity(game.loadout)}</strong><span>技能孔</span></div></div><div class="effect-strip">${effects.length?effects.map(e=>`<span class="effect-chip">${e}</span>`).join(''):'<span class="effect-chip">沒有額外效果</span>'}</div>`;
 const skillEntries=Object.entries(game.loadout.skills);
 $('#bagSkillList').innerHTML=skillEntries.length?skillEntries.map(([id,rank])=>{const s=SKILLS[id];return `<div class="bag-skill-entry"><div class="ico">${s.icon}</div><div><b>${s.name}</b><span>${s.desc}</span></div><div class="lv">Lv.${rank}</div></div>`}).join(''):'<div class="menu-hint">尚未習得旅者技能。寶箱三選一時有機會取得新的技能或升級。</div>';
 $('#bagCount').textContent=`${game.inventory.length} 件`;
 const root=$('#bagInventory');root.innerHTML='';
 if(!game.inventory.length){root.innerHTML='<div class="bag-empty menu-hint">背包目前是空的。繼續沿著道路探索，尋找武器、Support 與事件地點。</div>';return}
 const groups=[['武器',game.inventory.map((slot,i)=>({...slot,index:i})).filter(s=>s.kind==='weapon')],['Support',game.inventory.map((slot,i)=>({...slot,index:i})).filter(s=>s.kind==='support')]];
 groups.forEach(([label,items])=>{if(!items.length)return;const sec=document.createElement('div');sec.className='item-group';sec.innerHTML=`<h4>${label}</h4>`;items.forEach(slot=>{const d=document.createElement('div');d.className='bag-card';if(slot.kind==='weapon'){const preview=compileBuild(slot.item,[],game.loadout.passives);d.innerHTML=`<div class="ico">${slot.item.icon}</div><div><strong>${slot.item.name}</strong><small>${slot.item.tags.join(' · ')} · ${slot.item.sockets} 孔<br>預估傷害 ${preview.damage.toFixed(1)} · 間隔 ${preview.rate.toFixed(2)}s</small></div><button>裝備</button>`}else{const fits=supportFits(game.loadout.weapon,slot.item),full=game.loadout.supports.length>=getSocketCapacity(game.loadout);d.innerHTML=`<div class="ico">${slot.item.icon}</div><div><strong>${slot.item.name}</strong><small>${slot.item.desc}${!fits?' · 不相容':full?' · 技能孔已滿':''}</small></div><button ${fits&&!full?'':'disabled'}>插入</button>`}
 d.querySelector('button').onclick=()=>{if(slot.kind==='weapon')game.equipWeapon(slot.index);else game.socket(slot.index);renderAll();renderBag()};sec.appendChild(d)});root.appendChild(sec)});
}
function openBag(){if(uiBusy||game.dead||game.won)return;renderBag();$('#bagModal').classList.remove('hidden')}
function closeBag(){$('#bagModal').classList.add('hidden')}
