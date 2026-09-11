(() => {
 const G=window.GRIMSKILL;
 const oldSummary=updateCombatSummary;
 updateCombatSummary=function(c){
  if(!c)return;
  if(c.interactive&&typeof c.seconds!=='number'){$('#combatLog').innerHTML=`即將交戰：<b>${c.enemy?.name||'未知敵人'}</b><br>主動技能可在戰鬥中手動施放。`;return}
  oldSummary(c);
 };
 Game.prototype.socket=function(index){
  const inv=this.inventory[index];if(!inv||inv.kind!=='support')return {ok:false};
  const s=SUPPORTS[inv.item.id];if(!s||!supportFits(this.loadout.weapon,s)){this.message='這顆技能石與目前武器 Tag 不相容。';return {ok:false,reason:'incompatible'}}
  const equipped=G.supportIds(this.loadout);if(equipped.includes(s.id)){this.message='同名技能石已經裝備。';return {ok:false,reason:'duplicate'}}
  if((this.loadout.supports||[]).length<getSocketCapacity(this.loadout))return this.socketTo(index,'weapon');
  for(const slot of ['head','body','feet']){const gear=this.loadout.equipment?.[slot];if(!gear)continue;const cap=Math.max(0,gear.sockets-(gear.utilityGem?1:0));if((gear.socketed?.length||0)<cap)return this.socketTo(index,slot)}
  this.message='目前所有裝備都沒有空技能孔。';return {ok:false,reason:'full'};
 };
})();