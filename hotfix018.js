(() => {
  const BUILD='0.18.1';
  const baseCreateWorld=createWorld;

  const EVENT_TYPES=new Set([
    TILE.BOSS,TILE.SMITH,TILE.SHRINE,TILE.CHEST,
    TILE.WEAPON,TILE.SUPPORT,TILE.ENEMY
  ]);
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  const key=(x,y)=>`${x},${y}`;

  function revealWide(g){
    if(!g?.world?.tiles||!g?.pos)return;
    const r=2;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const t=g.world.tiles[g.pos.y+dy]?.[g.pos.x+dx];
      if(t)t.revealed=true;
    }
  }

  function makeRoadNetwork(world,seed){
    const rng=seeded((seed^0x1815a7f3)>>>0);
    const tiles=world.tiles;
    const size=world.size||MAP_SIZE;
    const c=Math.floor(size/2);
    const hub={x:c,y:c};

    for(const row of tiles)for(const t of row)t.road=false;

    const mark=(x,y)=>{
      const t=tiles[y]?.[x];
      if(!t)return false;
      if(t.type===TILE.ROCK)t.type=TILE.EMPTY;
      t.road=true;
      return true;
    };
    const isRoad=(x,y)=>!!tiles[y]?.[x]?.road;
    const allRoads=()=>{
      const out=[];
      for(const row of tiles)for(const t of row)if(t.road)out.push({x:t.x,y:t.y});
      return out;
    };
    const neighbors=(x,y)=>DIRS.filter(([dx,dy])=>isRoad(x+dx,y+dy)).length;

    function jitterPoint(a,b,t,maxOff){
      const bx=Math.round(a.x+(b.x-a.x)*t);
      const by=Math.round(a.y+(b.y-a.y)*t);
      const horizontal=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y);
      const off=(rng()<.5?-1:1)*(1+Math.floor(rng()*maxOff));
      const along=Math.floor((rng()*3)-1);
      let x=bx,y=by;
      if(horizontal){y+=off;x+=along}else{x+=off;y+=along}
      return {x:clamp(x,1,size-2),y:clamp(y,1,size-2)};
    }

    function walk(a,b,{stopOnHit=true,meander=.34}={}){
      let x=a.x,y=a.y;
      let lastAxis=rng()<.5?'x':'y';
      let run=1+Math.floor(rng()*3);
      let guard=0;
      mark(x,y);
      while((x!==b.x||y!==b.y)&&guard++<size*size*4){
        const dx=b.x-x,dy=b.y-y;
        const options=[];
        if(dx!==0)options.push({dx:Math.sign(dx),dy:0,axis:'x',score:1.2});
        if(dy!==0)options.push({dx:0,dy:Math.sign(dy),axis:'y',score:1.2});
        if(rng()<meander){
          const side=DIRS[Math.floor(rng()*DIRS.length)];
          const nx=x+side[0],ny=y+side[1];
          if(nx>0&&ny>0&&nx<size-1&&ny<size-1){
            const toward=dist({x:nx,y:ny},b)<=dist({x,y},b)+2;
            if(toward)options.push({dx:side[0],dy:side[1],axis:side[0]?'x':'y',score:.45});
          }
        }
        if(run>0&&options.some(o=>o.axis===lastAxis)&&rng()<.72){
          options.forEach(o=>{if(o.axis===lastAxis)o.score*=1.65});
        }
        let total=options.reduce((s,o)=>s+o.score,0),pick=rng()*total,chosen=options[0];
        for(const o of options){pick-=o.score;if(pick<=0){chosen=o;break}}
        let nx=clamp(x+chosen.dx,1,size-2),ny=clamp(y+chosen.dy,1,size-2);
        if(nx===x&&ny===y)break;
        const hit=isRoad(nx,ny);
        x=nx;y=ny;mark(x,y);
        if(chosen.axis===lastAxis)run--;else{lastAxis=chosen.axis;run=1+Math.floor(rng()*3)}
        if(stopOnHit&&hit&&dist({x,y},a)>1)return;
      }
    }

    function route(a,b,mode='normal'){
      const d=dist(a,b);
      const pts=[];
      const maxOff=mode==='wild'?3:2;
      if(d>=10){
        pts.push(jitterPoint(a,b,.25,maxOff));
        if(rng()<.85)pts.push(jitterPoint(a,b,.52,maxOff));
        pts.push(jitterPoint(a,b,.76,maxOff));
      }else if(d>=6){
        pts.push(jitterPoint(a,b,.42,maxOff));
        if(rng()<.45)pts.push(jitterPoint(a,b,.7,maxOff));
      }else if(d>=4&&rng()<.7){
        pts.push(jitterPoint(a,b,.5,1));
      }
      pts.push(b);
      let from=a;
      for(const p of pts){walk(from,p,{stopOnHit:mode!=='trunk',meander:mode==='wild'?.42:.28});from=p;}
    }

    mark(hub.x,hub.y);
    const nodes=[];
    for(const row of tiles)for(const t of row)if(EVENT_TYPES.has(t.type))nodes.push({x:t.x,y:t.y,type:t.type});

    const far=nodes.slice().sort((a,b)=>dist(b,hub)-dist(a,hub));
    const trunkCount=1+Math.floor(rng()*3);
    const used=new Set();
    for(let i=0;i<trunkCount&&i<far.length;i++){
      const pickIndex=Math.min(far.length-1,i+Math.floor(rng()*Math.min(3,far.length-i)));
      const n=far[pickIndex];
      if(used.has(key(n.x,n.y)))continue;
      used.add(key(n.x,n.y));
      route(hub,n,'trunk');
    }

    const shuffled=nodes.filter(n=>!used.has(key(n.x,n.y)));
    for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
    for(const node of shuffled){
      const roads=allRoads().sort((a,b)=>dist(a,node)-dist(b,node));
      const pool=Math.min(8,roads.length);
      const bias=Math.pow(rng(),1.7);
      const target=roads[Math.min(pool-1,Math.floor(bias*pool))]||hub;
      route(node,target,rng()<.22?'wild':'normal');
      mark(node.x,node.y);
    }

    const loops=1+Math.floor(rng()*3);
    for(let i=0;i<loops;i++){
      const roads=allRoads().filter(p=>neighbors(p.x,p.y)<=2);
      if(roads.length<6)break;
      const a=roads[Math.floor(rng()*roads.length)];
      const candidates=roads.filter(b=>dist(a,b)>=5&&dist(a,b)<=10);
      if(!candidates.length)continue;
      const b=candidates[Math.floor(rng()*candidates.length)];
      route(a,b,'wild');
    }

    const spurCount=2+Math.floor(rng()*5);
    for(let i=0;i<spurCount;i++){
      const roads=allRoads().filter(p=>neighbors(p.x,p.y)<=2);
      if(!roads.length)break;
      const a=roads[Math.floor(rng()*roads.length)];
      const len=2+Math.floor(rng()*4);
      const dir=DIRS[Math.floor(rng()*DIRS.length)];
      const b={x:clamp(a.x+dir[0]*len,1,size-2),y:clamp(a.y+dir[1]*len,1,size-2)};
      if(dist(a,b)>=2)route(a,b,'wild');
    }

    for(const n of nodes)mark(n.x,n.y);
    mark(hub.x,hub.y);
    if(typeof generateDecorations==='function')world.decorations=generateDecorations(world,(seed^0x1810181)>>>0);
    world.roadVersion='organic-multi-trunk-loops-v0181';
    return world;
  }

  createWorld=function(seed=1){
    const world=baseCreateWorld(seed);
    return makeRoadNetwork(world,seed);
  };

  function ensureStarterDecor(g){
    if(!g?.world?.tiles)return;
    const out=g.world.decorations||(g.world.decorations=[]);
    const present=new Set(out.map(d=>key(d.x,d.y)));
    const keys=['grassPatch','flowerPatch','stumpPatch','grassPatch'];
    const cand=[];
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      if(dx===0&&dy===0)continue;
      const x=g.pos.x+dx,y=g.pos.y+dy,t=g.world.tiles[y]?.[x];
      if(!t||t.type!==TILE.EMPTY||t.road||present.has(key(x,y)))continue;
      cand.push({x,y,d:Math.abs(dx)+Math.abs(dy)});
    }
    cand.sort((a,b)=>a.d-b.d||((a.x*17+a.y*31+g.seed)%13)-((b.x*17+b.y*31+g.seed)%13));
    for(let i=0;i<Math.min(keys.length,cand.length);i++){
      const c=cand[i];
      out.push({key:keys[i],x:c.x,y:c.y,scale:1.22+(i%2)*.12,offsetY:.06,_starter0181:true});
    }
  }

  function addMapPolish(){
    const style=document.createElement('style');
    style.textContent=`
      #worldCanvas{border-radius:16px;box-shadow:inset 0 0 40px rgba(0,0,0,.34),0 12px 36px rgba(0,0,0,.28);filter:saturate(.94) contrast(1.04)}
      .map-wrap{background:radial-gradient(circle at 50% 45%,rgba(58,76,57,.16),rgba(5,9,7,.22) 70%);border-radius:18px}
    `;
    document.head.appendChild(style);
  }

  function roadPatina(ctx,t,cell){
    if(!t.road)return;
    const seed=((game.seed>>>0)^Math.imul(t.x+11,73856093)^Math.imul(t.y+17,19349663))>>>0;
    const rng=seeded(seed);
    const x=t.x*cell,y=t.y*cell;
    const mask=roadMaskAt(t.x,t.y);
    ctx.save();
    ctx.globalAlpha=.30;
    ctx.fillStyle='rgba(223,194,137,.42)';
    const specks=1+Math.floor(rng()*3);
    for(let i=0;i<specks;i++){
      const sx=x+cell*(.28+rng()*.44),sy=y+cell*(.28+rng()*.44),r=cell*(.018+rng()*.018);
      ctx.beginPath();ctx.ellipse(sx,sy,r*1.7,r,rng()*Math.PI,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=.28;
    ctx.strokeStyle='rgba(30,45,28,.65)';ctx.lineWidth=Math.max(1,cell*.035);ctx.lineCap='round';
    const edgeTuft=(px,py,ang)=>{ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(ang)*cell*.1,py+Math.sin(ang)*cell*.1);ctx.stroke()};
    if(!(mask&1)&&rng()<.8)edgeTuft(x+cell*(.25+rng()*.5),y+cell*.16,-Math.PI/2);
    if(!(mask&4)&&rng()<.8)edgeTuft(x+cell*(.25+rng()*.5),y+cell*.84,Math.PI/2);
    if(!(mask&8)&&rng()<.7)edgeTuft(x+cell*.16,y+cell*(.25+rng()*.5),Math.PI);
    if(!(mask&2)&&rng()<.7)edgeTuft(x+cell*.84,y+cell*(.25+rng()*.5),0);
    ctx.restore();
  }

  renderMap=function(){
    const canvas=$('#worldCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height,N=game.world.size,cell=W/N,pal=worldPalette();
    ctx.clearRect(0,0,W,H);
    for(const row of game.world.tiles)for(const t of row)drawGrassCell(ctx,t.x*cell,t.y*cell,cell+.5);
    for(const row of game.world.tiles)for(const t of row)if(t.road){drawRoadCell(ctx,t.x*cell,t.y*cell,cell+.5,roadMaskAt(t.x,t.y));roadPatina(ctx,t,cell)}
    for(const deco of (game.world.decorations||[]))drawDecorAsset(ctx,deco,cell);
    for(const row of game.world.tiles)for(const t of row){const cx=(t.x+.5)*cell,cy=(t.y+.5)*cell;if(t.type===TILE.ROCK)drawRock(ctx,cx,cy+2,.9)}
    for(const row of game.world.tiles)for(const t of row){if(t.type===TILE.EMPTY||t.type===TILE.ROCK||t.cleared)continue;drawPoi(ctx,t.type,(t.x+.5)*cell,(t.y+.5)*cell,t.type===TILE.BOSS?24:20)}
    const px=(game.pos.x+.5)*cell,py=(game.pos.y+.5)*cell;
    ctx.save();ctx.translate(px,py);ctx.shadowColor='rgba(244,201,113,.65)';ctx.shadowBlur=20;ctx.fillStyle='#d7b36a';ctx.strokeStyle='#201b13';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowColor='transparent';ctx.fillStyle='#262d27';ctx.beginPath();ctx.moveTo(-9,10);ctx.lineTo(0,-14);ctx.lineTo(9,10);ctx.closePath();ctx.fill();ctx.fillStyle='#f0d7a2';ctx.beginPath();ctx.arc(0,-6,4,0,Math.PI*2);ctx.fill();ctx.restore();
    const radius=game.visionRadius();
    for(const row of game.world.tiles)for(const t of row){const near=Math.max(Math.abs(t.x-game.pos.x),Math.abs(t.y-game.pos.y))<=radius;const visible=t.revealed&&(!game.isNight()||near);if(!visible){ctx.fillStyle=pal.fog;ctx.fillRect(t.x*cell,t.y*cell,cell+.6,cell+.6)}}
    if(game.isNight()){const ng=ctx.createRadialGradient(px,py,cell*.55,px,py,cell*(radius+1.3));ng.addColorStop(0,'rgba(12,18,15,0)');ng.addColorStop(.62,'rgba(5,8,7,.2)');ng.addColorStop(1,'rgba(2,4,3,.62)');ctx.fillStyle=ng;ctx.fillRect(0,0,W,H)}
    const vg=ctx.createRadialGradient(W/2,H/2,W*.28,W/2,H/2,W*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.40)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  };

  function stampBuild(){
    document.title='GRIMPATH v'+BUILD;
    const sub=document.querySelector('.brand small');
    if(sub)sub.textContent='荒暮森林 · 多主幹隨機路網 v'+BUILD;
  }

  const oldReset=Game.prototype.reset;
  Game.prototype.reset=function(seed){oldReset.call(this,seed);revealWide(this);ensureStarterDecor(this)};
  const oldMove=Game.prototype.move;
  Game.prototype.move=function(dx,dy){const ok=oldMove.call(this,dx,dy);if(ok&&!this.isNight())revealWide(this);return ok};

  addMapPolish();
  game.reset((Date.now()>>>0));
  revealWide(game);ensureStarterDecor(game);stampBuild();renderAll();
})();