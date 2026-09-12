(() => {
  const X=window.GRIMWEAPON;if(!X)return;
  function decorate(){
    const w=game?.loadout?.weapon,tr=w?.trait;
    const slot=document.querySelector('.paper-equip-card.slot-weapon');
    if(slot){slot.querySelector('.weapon-trait-card')?.remove();if(tr)slot.insertAdjacentHTML('beforeend',`<div class="weapon-trait-card"><b>${tr.name}</b><span>${tr.desc}</span></div>`)}
    const stats=[...document.querySelectorAll('#characterStats > div')];if(stats[2]&&w){const b=compileBuild(w,window.GRIMSKILL?.supportIds?window.GRIMSKILL.supportIds(game.loadout):(game.loadout.supports||[]),game.loadout.passives||{}),form=X.attackForm(w);stats[2].querySelector('strong').textContent=form==='投射物'?String(b.projectiles):form;stats[2].querySelector('span').textContent=form==='投射物'?'投射物數':'攻擊型態';}
    const weaponCards=[...document.querySelectorAll('#bagInventory .backpack-item.kind-weapon')],items=game.inventory.filter(x=>x.kind==='weapon');weaponCards.forEach((card,i)=>{card.querySelector('.weapon-trait-mini')?.remove();const t=items[i]?.item?.trait;if(t){const c=card.querySelector('.bp-copy');c?.insertAdjacentHTML('beforeend',`<em class="weapon-trait-mini">${t.name} · ${t.desc}</em>`)}});
    const hud=$('#weapon');if(hud&&tr&&!hud.querySelector('.weapon-trait-hud'))hud.insertAdjacentHTML('beforeend',`<div class="weapon-trait-hud"><b>${tr.name}</b> ${tr.desc}</div>`);
  }
  const oldBag=renderBag;renderBag=function(){oldBag();decorate()};
  const oldWeapon=renderWeapon;renderWeapon=function(){oldWeapon();decorate()};
  const style=document.createElement('style');style.textContent=`
    .weapon-trait-card{margin-top:8px;padding:7px 8px;border:1px solid #5c4f3a;border-radius:8px;background:#17130e;color:#cbb991;font-size:10px;line-height:1.35}.weapon-trait-card b{display:block;color:#f0d39d;font-size:11px;margin-bottom:2px}
    .weapon-trait-mini{display:block;margin-top:4px;color:#c7ae82;font-size:10px;font-style:normal;line-height:1.35}.weapon-trait-hud{margin-top:6px;padding-top:6px;border-top:1px solid #ffffff16;color:#c9b58e;font-size:10px;line-height:1.35}.weapon-trait-hud b{color:#efd49f}
  `;document.head.appendChild(style);decorate();
})();
