window.ASSET_DATA=window.ASSET_DATA||{};
window.loadGrimpathAssets=async function(){
  const packRes=await fetch('../index_v0.17_full_embedded.html?assetpack=021',{cache:'no-store'});
  if(!packRes.ok)throw new Error('legacy asset pack HTTP '+packRes.status);
  const source=await packRes.text();
  const findData=(objectName,key)=>{
    const marks=[`const ${objectName}={` , `${objectName}={`];
    let start=-1;
    for(const m of marks){start=source.indexOf(m);if(start>=0)break}
    if(start<0)throw new Error('asset object missing: '+objectName);
    const end=source.indexOf('};',start);
    if(end<0)throw new Error('asset object malformed: '+objectName);
    const block=source.slice(start,end+2);
    const re=new RegExp(`${key}\\s*:\\s*['\"](data:image\\/webp;base64,[^'\"]+)['\"]`);
    const hit=block.match(re);
    if(!hit)throw new Error(`asset missing ${objectName}.${key}`);
    return hit[1];
  };
  const map={
    grass:'assets/maptiles/grass.webp',roadStraightH:'assets/maptiles/road_straight_h.webp',roadStraightV:'assets/maptiles/road_straight_v.webp',
    roadCornerNW:'assets/maptiles/road_corner_ne.webp',roadCornerSE:'assets/maptiles/road_corner_se.webp',roadCornerSW:'assets/maptiles/road_corner_sw.webp',
    roadCross:'assets/maptiles/road_cross.webp',roadTMissingS:'assets/maptiles/road_t_n.webp'
  };
  for(const [k,out] of Object.entries(map))ASSET_DATA[out]=findData('MAP_TILE_SOURCES',k);
  const dec={grassPatch:'assets/decors/grass_patch.webp',flowerPatch:'assets/decors/flower_patch.webp',swampPatch:'assets/decors/swamp_patch.webp',stumpPatch:'assets/decors/stump_patch.webp',hutRuin:'assets/decors/hut_ruin.webp',towerRuin:'assets/decors/tower_ruin.webp',altarRuin:'assets/decors/altar_ruin.webp'};
  for(const [k,out] of Object.entries(dec))ASSET_DATA[out]=findData('DECOR_SOURCES',k);
  const wolfMatch=source.match(/wolf\s*:\s*\{[^}]*?art\s*:\s*['\"](data:image\/webp;base64,[^'\"]+)['\"]/s);
  if(!wolfMatch)throw new Error('wolf art missing from legacy asset pack');
  ASSET_DATA['assets/monsters/wolf.webp']=wolfMatch[1];
  for(const name of ['cultist','shaman','stalker','boss']){
    const r=await fetch(`../assets/monsters/${name}.b64?assetpack=021`,{cache:'no-store'});
    if(!r.ok)throw new Error(`monster asset ${name} HTTP ${r.status}`);
    ASSET_DATA[`assets/monsters/${name}.webp`]='data:image/webp;base64,'+(await r.text()).trim();
  }
  return ASSET_DATA;
};
