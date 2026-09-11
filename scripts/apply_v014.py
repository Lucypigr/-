from pathlib import Path
import re

p = Path('index.html')
html = p.read_text(encoding='utf-8')
if 'v0.14 chest reward redesign' in html:
    print('v0.14 already applied')
    raise SystemExit(0)

html = html.replace('GRIMPATH v0.13', 'GRIMPATH v0.14')
old_modal = '<div id="skillModal" class="modal-backdrop hidden"><div class="modal-card"><div class="modal-head"><h2><span data-icon="chest"></span>寶箱獎勵</h2><span>三選一，只能拿走 1 項</span></div><div class="choice-body"><div id="skillChoices" class="choice-grid"></div></div></div></div>'
new_modal = '''<div id="skillModal" class="modal-backdrop hidden"><div class="modal-card chest-modal"><div class="chest-stage-head"><div class="chest-art" aria-hidden="true"><div class="chest-lid"></div><div class="chest-body"></div><div class="chest-lock"></div><div class="chest-glow"></div></div><div class="chest-eyebrow">LOOT CACHE</div><h2>選擇你的獎勵</h2><p>寶箱只允許帶走一項。選擇會直接改變這次遠征的 Build。</p></div><div class="choice-body chest-choice-body"><div id="skillChoices" class="choice-grid chest-choice-grid"></div><div class="chest-choice-hint">每個寶箱固定提供技能、Support 與資源類獎勵中的組合。</div></div></div></div>'''
if old_modal not in html:
    raise SystemExit('old chest modal not found')
html = html.replace(old_modal, new_modal, 1)

css = r'''
/* v0.14 chest reward redesign */
.chest-modal{width:min(1180px,96vw);overflow:hidden;background:radial-gradient(circle at 50% 0,#2a2117 0,#141713 22%,#090c0a 76%);border-color:#69563a;box-shadow:0 30px 100px #000d,inset 0 1px 0 #ffffff0b}
.chest-stage-head{position:relative;text-align:center;padding:30px 24px 8px;min-height:238px;overflow:hidden;background:linear-gradient(180deg,#1a1711cc,#0c100d00)}
.chest-stage-head:before{content:"";position:absolute;left:50%;top:10px;transform:translateX(-50%);width:520px;height:220px;background:radial-gradient(circle,#b88a3b25 0,#b88a3b0d 38%,transparent 72%);pointer-events:none}
.chest-art{position:relative;width:136px;height:94px;margin:0 auto 18px;filter:drop-shadow(0 18px 20px #0008)}
.chest-body{position:absolute;left:14px;right:14px;bottom:4px;height:58px;border:2px solid #9d7443;border-radius:10px 10px 15px 15px;background:linear-gradient(180deg,#49331e,#21170f);box-shadow:inset 0 2px 0 #ffffff12}
.chest-lid{position:absolute;left:6px;right:6px;top:7px;height:36px;border:2px solid #b68b51;border-radius:18px 18px 8px 8px;background:linear-gradient(180deg,#5a3d22,#2d1e13);z-index:2}
.chest-lock{position:absolute;left:52px;top:39px;width:32px;height:32px;border:2px solid #70502e;border-radius:8px;background:linear-gradient(180deg,#d4b46e,#8f6b39);z-index:3;box-shadow:0 0 18px #d6a34d55}
.chest-glow{position:absolute;left:26px;right:26px;top:28px;height:34px;background:radial-gradient(ellipse,#ffd87c66,transparent 68%);filter:blur(4px);z-index:1}
.chest-eyebrow{font-size:10px;letter-spacing:.28em;color:#b6a37a;margin-bottom:6px;position:relative}
.chest-stage-head h2{margin:0;font-size:30px;letter-spacing:.05em;color:#f3ead7;position:relative}.chest-stage-head p{margin:8px auto 0;max-width:540px;font-size:12px;line-height:1.6;color:#9ea79e;position:relative}
.chest-choice-body{padding:10px 30px 28px}.chest-choice-grid{gap:22px;align-items:stretch}
.chest-choice-grid .choice-card{position:relative;min-height:360px;padding:18px 18px 16px;border-radius:22px;overflow:hidden;gap:12px;transform:translateY(0);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;background:linear-gradient(180deg,#171a16,#0e110f)}
.chest-choice-grid .choice-card:before{content:"";position:absolute;left:18px;right:18px;top:10px;height:3px;border-radius:99px;background:#756744;opacity:.85}
.chest-choice-grid .choice-card:hover{transform:translateY(-7px);box-shadow:0 24px 50px #0009,inset 0 1px 0 #ffffff0e}
.chest-choice-grid .choice-card:nth-child(2){transform:translateY(-10px);min-height:380px}.chest-choice-grid .choice-card:nth-child(2):hover{transform:translateY(-17px)}
.chest-choice-grid .reward-kind{align-self:flex-start;margin-top:6px;padding:5px 9px;font-size:9px;letter-spacing:.16em;border-radius:999px}
.chest-choice-grid .head{display:block;text-align:center;margin-top:4px}.chest-choice-grid .head .ico{width:86px;height:86px;margin:0 auto 16px;border-radius:50%;font-size:32px;border-width:2px;box-shadow:0 0 0 7px #ffffff04,0 12px 28px #0007}
.chest-choice-grid .head h4{font-size:20px;letter-spacing:.025em;color:#f0e6d3}.chest-choice-grid .head small{display:block;margin-top:5px;font-size:10px;letter-spacing:.06em;color:#8f9a92}
.chest-choice-grid .choice-card p{font-size:12px;line-height:1.65;min-height:58px;padding:0 3px;color:#aeb7af;text-align:left}
.chest-choice-grid .reward-effect{margin-top:auto;padding:10px 12px;border:1px solid #343d36;border-radius:12px;background:#0d1210;font-size:11px;line-height:1.5;color:#c8d0c8}
.chest-choice-grid .choice-card button{margin-top:2px;padding:12px 14px;border-radius:12px;font-weight:800;letter-spacing:.04em;box-shadow:inset 0 1px 0 #ffffff13}
.chest-choice-grid .kind-skill{border-color:#746341;background:linear-gradient(180deg,#1d1b14,#0f120f)}.chest-choice-grid .kind-skill:before{background:#b79b5d}.chest-choice-grid .kind-skill .head .ico{background:radial-gradient(circle at 35% 30%,#55472c,#1d1a13);border-color:#b79b5d}.chest-choice-grid .kind-skill button{background:linear-gradient(180deg,#675737,#463a27);border-color:#a98d55}
.chest-choice-grid .kind-support{border-color:#53678f;background:linear-gradient(180deg,#151c27,#0c1016)}.chest-choice-grid .kind-support:before{background:#7890c3}.chest-choice-grid .kind-support .head .ico{background:radial-gradient(circle at 35% 30%,#334363,#151b29);border-color:#8098cb;box-shadow:0 0 0 7px #7189bc12,0 12px 30px #0008,0 0 24px #6079ad26}.chest-choice-grid .kind-support button{background:linear-gradient(180deg,#536a99,#354668);border-color:#819bd0;color:#eef3ff}
.chest-choice-grid .kind-gold,.chest-choice-grid .kind-heal{border-color:#916247;background:linear-gradient(180deg,#251a13,#100d0b)}.chest-choice-grid .kind-gold:before,.chest-choice-grid .kind-heal:before{background:#bc8452}.chest-choice-grid .kind-gold .head .ico,.chest-choice-grid .kind-heal .head .ico{background:radial-gradient(circle at 35% 30%,#68452a,#24170f);border-color:#b97e4e}.chest-choice-grid .kind-gold button,.chest-choice-grid .kind-heal button{background:linear-gradient(180deg,#784a2a,#4b2f1e);border-color:#ae7448}
.chest-choice-hint{text-align:center;margin-top:18px;color:#7f8982;font-size:10px;letter-spacing:.04em}
@media(max-width:980px){.chest-stage-head{min-height:205px;padding-top:20px}.chest-art{transform:scale(.82);margin-bottom:4px}.chest-stage-head h2{font-size:25px}.chest-choice-body{padding:6px 14px 20px}.chest-choice-grid{grid-template-columns:1fr;gap:12px}.chest-choice-grid .choice-card,.chest-choice-grid .choice-card:nth-child(2){min-height:0;transform:none}.chest-choice-grid .choice-card:hover,.chest-choice-grid .choice-card:nth-child(2):hover{transform:none}.chest-choice-grid .head{display:flex;text-align:left;align-items:center;gap:12px}.chest-choice-grid .head .ico{width:58px;height:58px;margin:0;flex:0 0 auto}.chest-choice-grid .choice-card p{min-height:0}.chest-choice-grid .reward-effect{margin-top:0}}
'''
marker='@media(max-width:980px){.choice-grid{grid-template-columns:1fr}.skill-list{display:grid;grid-template-columns:1fr}}'
if marker not in html:
    raise SystemExit('css marker not found')
html = html.replace(marker, css + '\n' + marker, 1)

pattern = re.compile(r"function openChestChoice\(\)\{\n if\(!game\.pendingChestChoices\.length\)return;uiBusy=true;const root=\$\('#skillChoices'\);root\.innerHTML='';\n game\.pendingChestChoices\.forEach\(\(reward,index\)=>\{.*?\n \$\('#skillModal'\)\.classList\.remove\('hidden'\);\n\}", re.S)
new_fn = '''function openChestChoice(){
 if(!game.pendingChestChoices.length)return;uiBusy=true;const root=$('#skillChoices');root.innerHTML='';
 game.pendingChestChoices.forEach((reward,index)=>{const card=document.createElement('div');card.className=`choice-card kind-${reward.kind}`;const kindLabel=reward.kind==='skill'?'旅者技能':reward.kind==='support'?'SUPPORT':reward.kind==='gold'?'資源':'補給';const ik=reward.kind==='skill'?'rune':reward.kind==='support'?'support':reward.kind==='gold'?'coin':'heal';const effect=reward.kind==='skill'?'學會或升級一項永久影響本次遠征的旅者能力。':reward.kind==='support'?'放入背包，可插入相容武器的技能孔改造主攻擊。':reward.kind==='gold'?'立即取得資源，用於黑鐵工坊購買強化。':'立即恢復或提高生存能力。';card.innerHTML=`<div class="reward-kind">${iconSvg(ik,13)}${kindLabel}</div><div class="head"><div class="ico">${iconSvg(ik,38)}</div><div><h4>${reward.name}</h4><small>${reward.meta}</small></div></div><p>${reward.desc}</p><div class="reward-effect">${effect}</div><button>選擇這項獎勵</button>`;card.querySelector('button').onclick=()=>chooseChestReward(index);root.appendChild(card)});
 $('#skillModal').classList.remove('hidden');
}'''
html, count = pattern.subn(new_fn, html, count=1)
if count != 1:
    raise SystemExit('openChestChoice function not found')

p.write_text(html, encoding='utf-8')
print('GRIMPATH v0.14 applied')
