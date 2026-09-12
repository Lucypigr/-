(()=>{
  function bind(g){
    if(!g)return;
    g.progression||={level:1,xp:0,nextXp:40,tickets:0};
    if(!Number.isFinite(g.progression.nextXp))g.progression.nextXp=Number.isFinite(g.progression.nextExp)?g.progression.nextExp:40;
    try{Object.defineProperty(g.progression,'nextExp',{configurable:true,get(){return this.nextXp},set(v){this.nextXp=v}})}catch(_){g.progression.nextExp=g.progression.nextXp}
  }
  bind(game);
  const oldReset=Game.prototype.reset;
  Game.prototype.reset=function(seed){oldReset.call(this,seed);bind(this)};

  const style=document.createElement('style');
  style.id='grimpath-mobile-hotfix-0252';
  style.textContent=`
    /* Battle cleanup: keep the hidden log DOM for combat code, but remove it from the visible UI. */
    .battle-logbox{display:none!important}
    .battle-info{grid-template-columns:1fr!important}
    .battle-build{min-width:0}

    @media (max-width:760px) and (orientation:portrait){
      .modal-backdrop{
        padding-top:max(6px,env(safe-area-inset-top));
        padding-right:max(6px,env(safe-area-inset-right));
        padding-bottom:max(6px,env(safe-area-inset-bottom));
        padding-left:max(6px,env(safe-area-inset-left));
        overflow:hidden;
        align-items:stretch;
      }
      .modal-card{width:100%;max-height:calc(100dvh - 12px);border-radius:14px}
      .modal-head{padding:10px 12px;min-height:48px;position:sticky;top:0;z-index:30;background:#111713f2;backdrop-filter:blur(10px)}

      /* Battle: make Return to Map reachable with one thumb. */
      .modal-battle{height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);overflow:hidden;display:flex;flex-direction:column}
      .modal-battle>.modal-head{flex:0 0 auto}
      .modal-battle .battle-shell{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 8px calc(74px + env(safe-area-inset-bottom))}
      .modal-battle .battle-stage{height:min(46dvh,330px)!important;min-height:270px}
      .modal-battle .battle-info{margin-top:8px}
      .modal-battle .battle-build{padding:9px}
      .modal-battle .continue-battle{
        position:sticky;
        bottom:calc(4px + env(safe-area-inset-bottom));
        z-index:50;
        width:100%;
        min-height:52px;
        margin:10px 0 0;
        border-radius:12px;
        font-weight:800;
        font-size:15px;
        box-shadow:0 10px 26px #000c,0 0 0 1px #d0a86a33 inset;
      }

      /* Chest: one reward per row so option 3 can always be reached and tapped. */
      .chest-modal{height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);overflow-y:auto!important;-webkit-overflow-scrolling:touch}
      .chest-stage-head{min-height:136px!important;padding:10px 12px 4px!important}
      .chest-stage-head:before{height:130px!important}
      .chest-art{transform:scale(.58);transform-origin:center top;margin:-8px auto -34px!important}
      .chest-stage-head h2{font-size:22px!important}
      .chest-stage-head p{font-size:11px!important;margin-top:5px!important;line-height:1.35!important}
      .chest-choice-body{padding:8px 10px calc(18px + env(safe-area-inset-bottom))!important}
      .chest-choice-grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;align-items:stretch!important}
      .chest-choice-grid .choice-card{width:100%!important;min-width:0!important;min-height:0!important;padding:12px!important}
      .chest-choice-grid .choice-card p{line-height:1.35!important}
      .chest-choice-grid .choice-card button{min-height:48px!important;font-size:14px!important;touch-action:manipulation}
      .chest-choice-hint{padding-bottom:max(8px,env(safe-area-inset-bottom))}

      /* General touch targets inside modal UI. */
      .modal-card button{touch-action:manipulation}
      .close-btn{min-width:64px;min-height:42px}
    }

    @media (max-width:390px) and (orientation:portrait){
      .modal-battle .battle-stage{height:43dvh!important;min-height:250px}
      .battle-banner{max-width:88%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .chest-stage-head{min-height:124px!important}
    }
  `;
  if(!document.getElementById(style.id))document.head.appendChild(style);
})();