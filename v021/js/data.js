function iconSvg(name,size=18){
 const paths={
  heart:'<path d="M9 16s-6-3.8-6-8.1A3.9 3.9 0 0 1 9 4.8 3.9 3.9 0 0 1 15 7.9C15 12.2 9 16 9 16Z"/>',
  coin:'<circle cx="9" cy="9" r="6.2"/><circle cx="9" cy="9" r="2.8"/>',
  sun:'<circle cx="9" cy="9" r="3.2"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4"/>',
  moon:'<path d="M13.7 12.8A6.3 6.3 0 0 1 6.2 4.3a6.4 6.4 0 1 0 7.5 8.5Z"/>',
  boss:'<path d="M3.5 14.5 5 5.5l4 3 4-3 1.5 9Z"/><circle cx="7" cy="11" r=".7"/><circle cx="11" cy="11" r=".7"/>',
  bag:'<path d="M4 7.5h10v8H4z"/><path d="M6 7.5 7 4.5h4l1 3M6.5 11h5"/>',
  sword:'<path d="m4 14 9-9 2-1-1 3-9 9Z"/><path d="m6 11 3 3M3.5 14.5 5 16"/>',
  rune:'<path d="m9 2 1.8 4.2L15 8l-4.2 1.8L9 14l-1.8-4.2L3 8l4.2-1.8Z"/><circle cx="9" cy="8" r="1.2"/>',
  chest:'<path d="M3.5 7h11v8h-11zM3.5 7c.2-2 1.8-3 5.5-3s5.3 1 5.5 3M8 10h2v2H8z"/>',
  anvil:'<path d="M3 5.5h10.5l1.5 2H11l-2 2H5l-2-4Z"/><path d="M7 9.5v3.5M5.5 13h3"/>',
  shrine:'<path d="m9 2.5 5 11H4Z"/><circle cx="9" cy="9" r="1.7"/>',
  claw:'<path d="M5 3.5 4.5 14M9 2.5 9 14M13 3.5 13.5 14"/>',
  fire:'<path d="M10.5 2.5c.4 3-2.7 3.8-1.2 6.1.8 1.2 2.2.9 2.6-.3.7 3-1.1 6.2-4.2 6.2-3 0-5-2.1-4.7-5.1.2-2.5 1.9-4.5 3.9-6.4.1 2 1.1 2.8 1.8 3.1.2-1.6.6-3 1.4-4Z"/>',
  support:'<path d="M4 9h10M9 4v10"/><circle cx="9" cy="9" r="5.5"/>',
  heal:'<path d="M6 3h6v3h3v6h-3v3H6v-3H3V6h3Z"/>'
 };
 return `<span class="ui-icon" style="width:${size}px;height:${size}px"><svg viewBox="0 0 18 18" aria-hidden="true">${paths[name]||paths.rune}</svg></span>`;
}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.outerHTML=iconSvg(el.dataset.icon,Number(el.dataset.size)||18)})}
const MAP_SIZE=13;
const BOSS_TURN=28;
const DAY_LENGTH=8;
const TILE={EMPTY:'empty',ENEMY:'enemy',CHEST:'chest',WEAPON:'weapon',SUPPORT:'support',SHRINE:'shrine',BOSS:'boss',ROCK:'rock',SMITH:'smith'};

const MAP_TILE_SOURCES={
 grass:ASSET_DATA['assets/maptiles/grass.webp'],
 roadStraightH:ASSET_DATA['assets/maptiles/road_straight_h.webp'],
 roadStraightV:ASSET_DATA['assets/maptiles/road_straight_v.webp'],
 roadCornerNW:ASSET_DATA['assets/maptiles/road_corner_ne.webp'],
 roadCornerSE:ASSET_DATA['assets/maptiles/road_corner_se.webp'],
 roadCornerSW:ASSET_DATA['assets/maptiles/road_corner_sw.webp'],
 roadCross:ASSET_DATA['assets/maptiles/road_cross.webp'],
 roadTMissingS:ASSET_DATA['assets/maptiles/road_t_n.webp']
};
const DECOR_SOURCES={
 grassPatch:ASSET_DATA['assets/decors/grass_patch.webp'],
 flowerPatch:ASSET_DATA['assets/decors/flower_patch.webp'],
 swampPatch:ASSET_DATA['assets/decors/swamp_patch.webp'],
 stumpPatch:ASSET_DATA['assets/decors/stump_patch.webp'],
 hutRuin:ASSET_DATA['assets/decors/hut_ruin.webp'],
 towerRuin:ASSET_DATA['assets/decors/tower_ruin.webp'],
 altarRuin:ASSET_DATA['assets/decors/altar_ruin.webp']
};
const DECOR_CONFIG={
 grassPatch:{scale:1.32,offsetY:.06},
 flowerPatch:{scale:1.25,offsetY:.05},
 swampPatch:{scale:1.3,offsetY:.08},
 stumpPatch:{scale:1.34,offsetY:.06},
 hutRuin:{scale:1.7,offsetY:.18},
 towerRuin:{scale:1.78,offsetY:.22},
 altarRuin:{scale:1.64,offsetY:.18}
};
const MAP_SPRITES={};
const DECOR_SPRITES={};
let mapSpritesReady=false;
function loadMapSprites(){
 const bundles=[
  [MAP_TILE_SOURCES,MAP_SPRITES],
  [DECOR_SOURCES,DECOR_SPRITES]
 ];
 const entries=bundles.flatMap(([sources,target])=>Object.entries(sources).map(([key,src])=>({key,src,target})));
 if(!entries.length){mapSpritesReady=true;renderAll();return}
 let loaded=0;
 const done=()=>{loaded++;if(loaded===entries.length){mapSpritesReady=true;renderAll()}};
 entries.forEach(({key,src,target})=>{
  const img=new Image();
  img.decoding='async';
  img.onload=done;
  img.onerror=done;
  img.src=src;
  target[key]=img;
 })
}
const WEAPONS={
 fireStaff:{id:'fireStaff',name:'火球杖',icon:'🔥',tags:['spell','fire','projectile','aoe'],baseDamage:18,rate:1.15,sockets:2,pattern:'projectile'},
 longbow:{id:'longbow',name:'長弓',icon:'🏹',tags:['attack','projectile','physical'],baseDamage:15,rate:.85,sockets:2,pattern:'projectile'},
 greatAxe:{id:'greatAxe',name:'巨斧',icon:'🪓',tags:['attack','melee','physical','aoe'],baseDamage:27,rate:1.45,sockets:2,pattern:'melee'},
 stormWand:{id:'stormWand',name:'雷霆法杖',icon:'⚡',tags:['spell','lightning','projectile','chain'],baseDamage:16,rate:1.05,sockets:3,pattern:'chain'}
};
const SUPPORTS={
 multi:{id:'multi',name:'多重投射',icon:'✦',requires:['projectile'],desc:'+2 投射物，單發傷害 -15%',mods:{projectiles:2,damage:.85}},
 fireAmp:{id:'fireAmp',name:'燃燒增幅',icon:'♨',requires:['fire'],desc:'火焰傷害 +35%，可點燃',mods:{damage:1.35,ignite:.35}},
 pierce:{id:'pierce',name:'穿透',icon:'➶',requires:['projectile'],desc:'投射物額外穿透 2 名敵人',mods:{pierce:2}},
 chain:{id:'chain',name:'連鎖',icon:'ϟ',requires:['projectile'],desc:'命中後彈向另一名敵人',mods:{chain:1,damage:.9}},
 rapid:{id:'rapid',name:'快速施放',icon:'»',requiresAny:['spell','attack'],desc:'攻擊間隔 -25%',mods:{rate:.75}},
 brutal:{id:'brutal',name:'重擊',icon:'◆',requires:['melee'],desc:'近戰傷害 +45%，攻擊變慢',mods:{damage:1.45,rate:1.2}},
 shock:{id:'shock',name:'感電',icon:'⚡',requires:['lightning'],desc:'雷電命中使後續傷害提高',mods:{shock:.22}},
 splash:{id:'splash',name:'擴散',icon:'◎',requiresAny:['aoe','melee'],desc:'範圍傷害半徑提高',mods:{splash:1.6}}
};
const SKILLS={
 volley:{id:'volley',name:'飛射訣',icon:'✦',desc:'投射物技能額外 +1 投射物。',max:2,apply:p=>p.projectiles=(p.projectiles||0)+1},
 combustion:{id:'combustion',name:'餘燼灌注',icon:'🔥',desc:'火焰傷害提高 25%。',max:3,apply:p=>p.fireMult=(p.fireMult||1)*1.25},
 tempo:{id:'tempo',name:'迅捷節奏',icon:'»',desc:'攻擊間隔縮短 12%。',max:3,apply:p=>p.rateMult=(p.rateMult||1)*0.88},
 spellcraft:{id:'spellcraft',name:'法紋專精',icon:'📘',desc:'法術傷害提高 20%。',max:3,apply:p=>p.spellMult=(p.spellMult||1)*1.2},
 brutality:{id:'brutality',name:'猛襲鍛體',icon:'🪓',desc:'近戰傷害提高 28%。',max:3,apply:p=>p.meleeMult=(p.meleeMult||1)*1.28},
 vitality:{id:'vitality',name:'命火脈動',icon:'❤',desc:'最大生命 +15，並恢復 15 生命。',max:4,apply:(p,loadout)=>{loadout.maxHp+=15;loadout.hp=Math.min(loadout.maxHp,loadout.hp+15)}},
 prosperity:{id:'prosperity',name:'獵金直覺',icon:'💰',desc:'擊敗敵人時額外獲得 4 金幣。',max:3,apply:p=>p.goldOnKill=(p.goldOnKill||0)+4},
 nightwatch:{id:'nightwatch',name:'夜巡燈火',icon:'🕯',desc:'夜晚視野 +1。',max:2,apply:p=>p.nightSight=(p.nightSight||0)+1},
 marksmanship:{id:'marksmanship',name:'精準射擊',icon:'🎯',desc:'投射物傷害提高 18%。',max:3,apply:p=>p.projectileMult=(p.projectileMult||1)*1.18}
};

const MONSTER_ART={
 wolf:ASSET_DATA['assets/monsters/wolf.webp'],
 cultist:ASSET_DATA['assets/monsters/cultist.webp'],
 shaman:ASSET_DATA['assets/monsters/shaman.webp'],
 stalker:ASSET_DATA['assets/monsters/stalker.webp'],
 boss:ASSET_DATA['assets/monsters/boss.webp']
};
const ENEMY_POOL=['wolf','cultist','shaman','stalker'];
const ENEMIES={
 wolf:{id:'wolf',name:'幽影灰狼',icon:'🐺',art:MONSTER_ART.wolf,hp:38,damage:7,rate:1.0,count:[1,2]},
 cultist:{id:'cultist',name:'灰燼信徒',icon:'🧙',art:MONSTER_ART.cultist,hp:48,damage:9,rate:1.25,count:[1,2]},
 shaman:{id:'shaman',name:'瘟疫渡鴉薩滿',icon:'☠',art:MONSTER_ART.shaman,hp:56,damage:10,rate:1.18,count:[1,1]},
 stalker:{id:'stalker',name:'沼林苔木獵魂者',icon:'🌿',art:MONSTER_ART.stalker,hp:82,damage:13,rate:1.35,count:[1,1]},
 boss:{id:'boss',name:'灰燼骨甲亡騎',icon:'👹',art:MONSTER_ART.boss,hp:330,damage:18,rate:1.15,count:[1,1]}
};
