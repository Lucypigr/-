(() => {
 const baseCreateWorld=createWorld;
 const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
 const EVENT_TYPES=new Set([TILE.BOSS,TILE.SMITH,TILE.SHRINE,TILE.CHEST,TILE.WEAPON,TILE.SUPPORT,TILE.ENEMY]);
 const key=(x,y)=>`${x},${y}`;
 const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 function makeRoadNetwork(world,seed){
  const rng=seeded((seed^0x0215a7f3)>>>0),tiles=world.tiles,size=world.size||MAP_SIZE,c=Math.floor(size/2),hub={x:c,y:c};
  for(const row of tiles)for(const t of row)t.road=false;
  const mark=(x,y)=>{const t=tiles[y]?.[x];if(!t)return false;if(t.type===TILE.ROCK)t.type=TILE.EMPTY;t.road=true;return true};
  const isRoad=(x,y)=>!!tiles[y]?.[x]?.road;
  const allRoads=()=>{const out=[];for(const row of tiles)for(const t of row)if(t.road)out.push({x:t.x,y:t.y});return out};
  const neighbors=(x,y)=>DIRS.reduce((n,[dx,dy])=>n+(isRoad(x+dx,y+dy)?1:0),0);
  function jitter(a,b,t,maxOff){const bx=Math.round(a.x+(b.x-a.x)*t),by=Math.round(a.y+(b.y-a.y)*t),horizontal=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y),off=(rng()<.5?-1:1)*(1+Math.floor(rng()*maxOff)),along=Math.floor(rng()*3)-1;return horizontal?{x:clamp(bx+along,1,size-2),y:clamp(by+off,1,size-2)}:{x:clamp(bx+off,1,size-2),y:clamp(by+along,1,size-2)}}
  function walk(a,b,{stopOnHit=true,meander=.34}={}){let x=a.x,y=a.y,lastAxis=rng()<.5?'x':'y',run=1+Math.floor(rng()*3),guard=0;mark(x,y);while((x!==b.x||y!==b.y)&&guard++<size*size*4){const dx=b.x-x,dy=b.y-y,options=[];if(dx)options.push({dx:Math.sign(dx),dy:0,axis:'x',score:1.2});if(dy)options.push({dx:0,dy:Math.sign(dy),axis:'y',score:1.2});if(rng()<meander){const side=DIRS[Math.floor(rng()*DIRS.length)],nx=x+side[0],ny=y+side[1];if(nx>0&&ny>0&&nx<size-1&&ny<size-1&&dist({x:nx,y:ny},b)<=dist({x,y},b)+2)options.push({dx:side[0],dy:side[1],axis:side[0]?'x':'y',score:.45})}if(run>0&&options.some(o=>o.axis===lastAxis)&&rng()<.72)options.forEach(o=>{if(o.axis===lastAxis)o.score*=1.65});let total=options.reduce((s,o)=>s+o.score,0),pick=rng()*total,chosen=options[0];for(const o of options){pick-=o.score;if(pick<=0){chosen=o;break}}const nx=clamp(x+chosen.dx,1,size-2),ny=clamp(y+chosen.dy,1,size-2),hit=isRoad(nx,ny);if(nx===x&&ny===y)break;x=nx;y=ny;mark(x,y);if(chosen.axis===lastAxis)run--;else{lastAxis=chosen.axis;run=1+Math.floor(rng()*3)}if(stopOnHit&&hit&&dist({x,y},a)>1)return}}
  function route(a,b,mode='normal'){const d=dist(a,b),pts=[],maxOff=mode==='wild'?3:2;if(d>=10){pts.push(jitter(a,b,.25,maxOff));if(rng()<.85)pts.push(jitter(a,b,.52,maxOff));pts.push(jitter(a,b,.76,maxOff))}else if(d>=6){pts.push(jitter(a,b,.42,maxOff));if(rng()<.45)pts.push(jitter(a,b,.7,maxOff))}else if(d>=4&&rng()<.7)pts.push(jitter(a,b,.5,1));pts.push(b);let from=a;for(const p of pts){walk(from,p,{stopOnHit:mode!=='trunk',meander:mode==='wild'?.42:.28});from=p}}
  mark(hub.x,hub.y);
  const nodes=[];for(const row of tiles)for(const t of row)if(EVENT_TYPES.has(t.type))nodes.push({x:t.x,y:t.y,type:t.type});
  const far=nodes.slice().sort((a,b)=>dist(b,hub)-dist(a,hub)),used=new Set(),trunkCount=1+Math.floor(rng()*3);
  for(let i=0;i<trunkCount&&i<far.length;i++){const band=far.slice(i,Math.min(far.length,i+4)).filter(n=>!used.has(key(n.x,n.y)));if(!band.length)continue;const n=band[Math.floor(rng()*band.length)];used.add(key(n.x,n.y));route(hub,n,'trunk')}
  const shuffled=nodes.filter(n=>!used.has(key(n.x,n.y)));for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
  for(const node of shuffled){const roads=allRoads().sort((a,b)=>dist(a,node)-dist(b,node)),pool=Math.min(8,roads.length),target=roads[Math.min(pool-1,Math.floor(Math.pow(rng(),1.7)*pool))]||hub;route(node,target,rng()<.22?'wild':'normal');mark(node.x,node.y)}
  const loops=1+Math.floor(rng()*3);for(let i=0;i<loops;i++){const roads=allRoads().filter(p=>neighbors(p.x,p.y)<=2);if(roads.length<6)break;const a=roads[Math.floor(rng()*roads.length)],candidates=roads.filter(b=>dist(a,b)>=5&&dist(a,b)<=10);if(candidates.length)route(a,candidates[Math.floor(rng()*candidates.length)],'wild')}
  const spurCount=2+Math.floor(rng()*5);for(let i=0;i<spurCount;i++){const roads=allRoads().filter(p=>neighbors(p.x,p.y)<=2);if(!roads.length)break;const a=roads[Math.floor(rng()*roads.length)],len=2+Math.floor(rng()*4),dir=DIRS[Math.floor(rng()*DIRS.length)],b={x:clamp(a.x+dir[0]*len,1,size-2),y:clamp(a.y+dir[1]*len,1,size-2)};if(dist(a,b)>=2)route(a,b,'wild')}
  for(const n of nodes)mark(n.x,n.y);mark(hub.x,hub.y);
  const reachable=()=>{const seen=new Set([key(hub.x,hub.y)]),q=[hub];while(q.length){const p=q.shift();for(const [dx,dy] of DIRS){const nx=p.x+dx,ny=p.y+dy,k=key(nx,ny);if(isRoad(nx,ny)&&!seen.has(k)){seen.add(k);q.push({x:nx,y:ny})}}}return seen};
  let seen=reachable();
  for(const n of nodes){const nk=key(n.x,n.y);if(seen.has(nk))continue;const connected=allRoads().filter(p=>seen.has(key(p.x,p.y))).sort((a,b)=>dist(a,n)-dist(b,n));const target=connected[0]||hub;walk(n,target,{stopOnHit:false,meander:.12});seen=reachable()}
  world.decorations=generateDecorations(world,(seed^0x210021)>>>0);world.roadVersion='organic-multi-trunk-loops-v021';return world;
 }
 createWorld=function(seed=1){return makeRoadNetwork(baseCreateWorld(seed),seed)};
 const oldReset=Game.prototype.reset;
 Game.prototype.reset=function(seed){oldReset.call(this,seed);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const t=this.world.tiles[this.pos.y+dy]?.[this.pos.x+dx];if(t)t.revealed=true}}
 const oldMove=Game.prototype.move;
 Game.prototype.move=function(dx,dy){const moved=oldMove.call(this,dx,dy);if(moved){const r=this.isNight()?Math.max(1,this.visionRadius()):2;for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const t=this.world.tiles[this.pos.y+oy]?.[this.pos.x+ox];if(t)t.revealed=true}}return moved}
})();
