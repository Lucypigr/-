(() => {
  const BUILD='0.17.2';
  function revealWide(g){
    if(!g?.world?.tiles||!g?.pos)return;
    const r=2;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const t=g.world.tiles[g.pos.y+dy]?.[g.pos.x+dx];
      if(t)t.revealed=true;
    }
  }
  function ensureStarterDecor(g){
    if(!g?.world?.tiles)return;
    const out=g.world.decorations||(g.world.decorations=[]);
    out.splice(0,out.length,...out.filter(d=>!d._starter));
    const keys=['grassPatch','flowerPatch','stumpPatch','grassPatch'];
    const cand=[];
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      if(dx===0&&dy===0)continue;
      const x=g.pos.x+dx,y=g.pos.y+dy,t=g.world.tiles[y]?.[x];
      if(!t||t.type!=='empty'||t.road)continue;
      cand.push({x,y,d:Math.abs(dx)+Math.abs(dy)});
    }
    cand.sort((a,b)=>a.d-b.d||((a.x*17+a.y*31+g.seed)%13)-((b.x*17+b.y*31+g.seed)%13));
    for(let i=0;i<Math.min(keys.length,cand.length);i++){
      const c=cand[i];
      out.push({key:keys[i],x:c.x,y:c.y,scale:i===2?1.5:1.38,offsetY:.08,_starter:true});
    }
    const nearRoad=[];
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
      const x=g.pos.x+dx,y=g.pos.y+dy,t=g.world.tiles[y]?.[x];
      if(!t||t.type!=='empty'||t.road)continue;
      const nr=[[1,0],[-1,0],[0,1],[0,-1]].some(([ox,oy])=>g.world.tiles[y+oy]?.[x+ox]?.road);
      if(nr)nearRoad.push({x,y,d:Math.abs(dx)+Math.abs(dy)});
    }
    nearRoad.sort((a,b)=>a.d-b.d);
    if(nearRoad[0])out.push({key:'hutRuin',x:nearRoad[0].x,y:nearRoad[0].y,scale:1.72,offsetY:.18,_starter:true});
  }
  function stampBuild(){
    document.title='GRIMPATH v'+BUILD;
    const sub=document.querySelector('.brand small');
    if(sub)sub.textContent='荒暮森林 · 地景生成 v'+BUILD;
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
  revealWide(game);
  ensureStarterDecor(game);
  stampBuild();
  renderAll();
})();