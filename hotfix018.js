(() => {
  const BUILD='0.18';
  const baseCreateWorld=createWorld;

  const EVENT_TYPES=new Set([
    TILE.BOSS,TILE.SMITH,TILE.SHRINE,TILE.CHEST,
    TILE.WEAPON,TILE.SUPPORT,TILE.ENEMY
  ]);
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

  function revealWide(g){
    if(!g?.world?.tiles||!g?.pos)return;
    const r=2;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const t=g.world.tiles[g.pos.y+dy]?.[g.pos.x+dx];
      if(t)t.revealed=true;
    }
  }

  function makeRoadNetwork(world,seed){
    const rng=seeded((seed^0x18a7f31)>>>0);
    const tiles=world.tiles;
    const size=world.size||MAP_SIZE;
    const c=Math.floor(size/2);

    for(const row of tiles)for(const t of row)t.road=false;

    const mark=(x,y)=>{
      const t=tiles[y]?.[x];
      if(!t)return false;
      if(t.type===TILE.ROCK)t.type=TILE.EMPTY;
      t.road=true;
      return true;
    };
    const roadCells=()=>{
      const out=[];
      for(const row of tiles)for(const t of row)if(t.road)out.push({x:t.x,y:t.y});
      return out;
    };
    const isRoad=(x,y)=>!!tiles[y]?.[x]?.road;

    function waypoint(a,b,t,offset){
      const mx=Math.round(a.x+(b.x-a.x)*t);
      const my=Math.round(a.y+(b.y-a.y)*t);
      const dx=b.x-a.x,dy=b.y-a.y;
      let x=mx,y=my;
      if(Math.abs(dx)>=Math.abs(dy))y+=offset;
      else x+=offset;
      return {x:clamp(x,1,size-2),y:clamp(y,1,size-2)};
    }

    function segment(a,b,stopOnNetwork=true){
      let x=a.x,y=a.y;
      let axis=rng()<.5?'x':'y';
      let run=1+Math.floor(rng()*3);
      let guard=0;
      mark(x,y);
      while((x!==b.x||y!==b.y)&&guard++<size*size*3){
        const dx=b.x-x,dy=b.y-y;
        if(dx===0)axis='y';
        else if(dy===0)axis='x';
        else if(run<=0||rng()<.18){
          const xBias=Math.abs(dx)/(Math.abs(dx)+Math.abs(dy));
          axis=rng()<xBias?'x':'y';
          run=1+Math.floor(rng()*3);
        }
        let nx=x,ny=y;
        if(axis==='x'&&dx!==0)nx+=Math.sign(dx);
        else if(dy!==0)ny+=Math.sign(dy);
        else nx+=Math.sign(dx);
        nx=clamp(nx,1,size-2);ny=clamp(ny,1,size-2);
        if(nx===x&&ny===y)break;
        const hitExisting=isRoad(nx,ny);
        x=nx;y=ny;mark(x,y);run--;
        if(stopOnNetwork&&hitExisting&&(x!==a.x||y!==a.y))return true;
      }
      return isRoad(b.x,b.y);
    }

    function organicBranch(node,target){
      const d=dist(node,target);
      const points=[];
      if(d>=9){
        const off1=(rng()<.5?-1:1)*(1+Math.floor(rng()*2));
        const off2=-off1+(rng()<.35?(rng()<.5?-1:1):0);
        points.push(waypoint(node,target,.34,off1));
        points.push(waypoint(node,target,.67,off2));
      }else if(d>=5){
        const off=(rng()<.5?-1:1)*(1+Math.floor(rng()*2));
        points.push(waypoint(node,target,.48,off));
      }
      points.push(target);
      let from=node;
      for(const p of points){
        const connected=segment(from,p,true);
        if(connected&&isRoad(p.x,p.y)===false)return;
        from=p;
        if(isRoad(p.x,p.y)&&p!==target){
          // keep going through waypoint unless we already touched the old network
          const touching=DIRS.some(([dx,dy])=>isRoad(p.x+dx,p.y+dy));
          if(touching&&rng()<.25)return;
        }
      }
    }

    const hub={x:c,y:c};
    mark(hub.x,hub.y);

    const nodes=[];
    for(const row of tiles)for(const t of row){
      if(EVENT_TYPES.has(t.type))nodes.push({x:t.x,y:t.y,type:t.type});
    }

    // Build one long trunk first, then attach the rest to nearby existing road cells.
    let trunk=null,trunkD=-1;
    for(const n of nodes){const d=dist(n,hub);if(d>trunkD){trunk=n;trunkD=d}}
    if(trunk){organicBranch(trunk,hub);mark(trunk.x,trunk.y)}

    const remaining=nodes.filter(n=>n!==trunk);
    for(let i=remaining.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
    }

    for(const node of remaining){
      const roads=roadCells();
      roads.sort((a,b)=>dist(a,node)-dist(b,node));
      const k=Math.min(5,roads.length);
      let target=roads[Math.floor(rng()*k)]||hub;
      if(dist(node,target)<=1)target=roads[0]||hub;
      organicBranch(node,target);
      mark(node.x,node.y);
    }

    // Every interactive tile is guaranteed to be part of the road network.
    for(const n of nodes)mark(n.x,n.y);
    mark(hub.x,hub.y);

    // Rebuild decorations after the new road network so roadside props follow the new layout.
    if(typeof generateDecorations==='function')world.decorations=generateDecorations(world,(seed^0x180018)>>>0);
    world.roadVersion='organic-branching-v018';
    return world;
  }

  createWorld=function(seed=1){
    const world=baseCreateWorld(seed);
    return makeRoadNetwork(world,seed);
  };

  function ensureStarterDecor(g){
    if(!g?.world?.tiles)return;
    const out=g.world.decorations||(g.world.decorations=[]);
    const keys=['grassPatch','flowerPatch','stumpPatch'];
    const cand=[];
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      if(dx===0&&dy===0)continue;
      const x=g.pos.x+dx,y=g.pos.y+dy,t=g.world.tiles[y]?.[x];
      if(!t||t.type!==TILE.EMPTY||t.road)continue;
      cand.push({x,y,d:Math.abs(dx)+Math.abs(dy)});
    }
    cand.sort((a,b)=>a.d-b.d||((a.x*17+a.y*31+g.seed)%13)-((b.x*17+b.y*31+g.seed)%13));
    for(let i=0;i<Math.min(keys.length,cand.length);i++){
      const c=cand[i];
      out.push({key:keys[i],x:c.x,y:c.y,scale:i===2?1.48:1.34,offsetY:.07,_starter018:true});
    }
  }

  function stampBuild(){
    document.title='GRIMPATH v'+BUILD;
    const sub=document.querySelector('.brand small');
    if(sub)sub.textContent='荒暮森林 · 不規則分支路網 v'+BUILD;
  }

  const oldReset=Game.prototype.reset;
  Game.prototype.reset=function(seed){
    oldReset.call(this,seed);
    revealWide(this);
    ensureStarterDecor(this);
  };

  const oldMove=Game.prototype.move;
  Game.prototype.move=function(dx,dy){
    const ok=oldMove.call(this,dx,dy);
    if(ok&&!this.isNight())revealWide(this);
    return ok;
  };

  // Replace the currently visible old world immediately; future restarts also use v0.18.
  game.reset((Date.now()>>>0));
  revealWide(game);
  ensureStarterDecor(game);
  stampBuild();
  renderAll();
})();