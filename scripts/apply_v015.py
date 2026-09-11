from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
start = s.find('function drawPoi(ctx,type,x,y,r=21){')
end = s.find('\nfunction renderMap(){', start)
if start == -1 or end == -1:
    raise SystemExit('drawPoi block not found')
new = r'''function drawPoi(ctx,type,x,y,r=21){
 ctx.save();
 ctx.translate(x,y);
 ctx.lineCap='round';ctx.lineJoin='round';
 const shadow=()=>{ctx.shadowColor='rgba(0,0,0,.68)';ctx.shadowBlur=12;ctx.shadowOffsetY=6};
 const clearShadow=()=>{ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0};
 if(type==='enemy'){
  shadow();ctx.fillStyle='#321712';ctx.strokeStyle='#9a4638';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(-18,-15,36,31,10);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#e6aa83';ctx.lineWidth=3.2;
  for(const ox of [-7,0,7]){ctx.beginPath();ctx.moveTo(ox-2,7);ctx.quadraticCurveTo(ox,-2,ox+4,-10);ctx.stroke()}
  ctx.fillStyle='#d9745b';ctx.beginPath();ctx.arc(0,8,5,0,Math.PI*2);ctx.fill();
 }
 else if(type==='smith'){
  shadow();ctx.fillStyle='#322317';ctx.strokeStyle='#93663a';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(-20,-13,40,29,7);ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#a3a49e';ctx.strokeStyle='#e0c18d';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(7,-3);ctx.lineTo(14,2);ctx.lineTo(7,7);ctx.lineTo(-10,7);ctx.lineTo(-15,3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#71746f';ctx.fillRect(-4,7,8,10);
  ctx.fillStyle='#f0a14a';for(const [sx,sy] of [[13,-9],[18,-4],[9,-12]]){ctx.beginPath();ctx.arc(sx,sy,1.8,0,Math.PI*2);ctx.fill()}
 }
 else if(type==='chest'){
  shadow();ctx.fillStyle='#5a3a1d';ctx.strokeStyle='#d0a157';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.roundRect(-18,-8,36,23,5);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(0,-8,18,Math.PI,0);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#8b642f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,2);ctx.lineTo(17,2);ctx.stroke();
  ctx.fillStyle='#f0cf72';ctx.strokeStyle='#6d4b22';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-4,-1,8,10,2);ctx.fill();ctx.stroke();
 }
 else if(type==='shrine'){
  shadow();ctx.fillStyle='#283a2d';ctx.strokeStyle='#75a37b';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(-12,14);ctx.lineTo(-8,-8);ctx.lineTo(0,-16);ctx.lineTo(8,-8);ctx.lineTo(12,14);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#9bd69f';ctx.shadowColor='#71d28a';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,-3,4.5,0,Math.PI*2);ctx.fill();clearShadow();
  ctx.fillStyle='#536659';ctx.fillRect(-15,13,30,5);
 }
 else if(type==='boss'){
  ctx.scale(1.18,1.18);shadow();ctx.fillStyle='#2b1111';ctx.strokeStyle='#a4413e';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-20,15);ctx.lineTo(-18,-6);ctx.lineTo(-10,-15);ctx.lineTo(-5,-8);ctx.lineTo(0,-18);ctx.lineTo(5,-8);ctx.lineTo(10,-15);ctx.lineTo(18,-6);ctx.lineTo(20,15);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.fillStyle='#d55f55';ctx.beginPath();ctx.moveTo(-8,6);ctx.lineTo(-4,-1);ctx.lineTo(0,6);ctx.lineTo(4,-1);ctx.lineTo(8,6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ff9886';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,10);ctx.lineTo(11,10);ctx.stroke();
 }
 else if(type==='weapon'){
  shadow();ctx.fillStyle='#2a241b';ctx.strokeStyle='#8f7953';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,13,17,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#e3d0a0';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-9,12);ctx.lineTo(8,-12);ctx.stroke();
  ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(3,-12);ctx.lineTo(10,-12);ctx.lineTo(8,-5);ctx.moveTo(-14,6);ctx.lineTo(-5,13);ctx.stroke();
 }
 else if(type==='support'){
  shadow();ctx.fillStyle='#172039';ctx.strokeStyle='#6f87c7';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(13,-5);ctx.lineTo(9,13);ctx.lineTo(0,18);ctx.lineTo(-9,13);ctx.lineTo(-13,-5);ctx.closePath();ctx.fill();ctx.stroke();clearShadow();
  ctx.strokeStyle='#bed0ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);ctx.moveTo(-7,-3);ctx.lineTo(7,5);ctx.moveTo(7,-3);ctx.lineTo(-7,5);ctx.stroke();
  ctx.fillStyle='#aabfff';ctx.beginPath();ctx.arc(0,1,3,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}'''
s = s[:start] + new + s[end:]
s = s.replace('GRIMPATH v0.14', 'GRIMPATH v0.15')
p.write_text(s, encoding='utf-8')
