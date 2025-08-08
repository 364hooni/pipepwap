// ===== Helpers =====
const svg = document.getElementById('svg');
function clearSVG(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }
function line(x1,y1,x2,y2,opts={}){
  const el = document.createElementNS('http://www.w3.org/2000/svg','line');
  el.setAttribute('x1',x1); el.setAttribute('y1',y1);
  el.setAttribute('x2',x2); el.setAttribute('y2',y2);
  el.setAttribute('stroke', opts.color || '#e9e9e9');
  el.setAttribute('stroke-width', opts.w || 4);
  el.setAttribute('stroke-linecap','square');
  svg.appendChild(el); return el;
}
function poly(points,opts={}){
  const el = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  el.setAttribute('points', points.map(p=>p.join(',')).join(' '));
  el.setAttribute('fill', opts.fill || 'none');
  el.setAttribute('stroke', opts.color || '#e9e9e9');
  el.setAttribute('stroke-width', opts.w || 4);
  svg.appendChild(el); return el;
}
function rect(x,y,w,h,opts={}){
  const el = document.createElementNS('http://www.w3.org/2000/svg','rect');
  el.setAttribute('x',x); el.setAttribute('y',y);
  el.setAttribute('width',w); el.setAttribute('height',h);
  el.setAttribute('fill', opts.fill || 'none');
  el.setAttribute('stroke', opts.color || '#e9e9e9');
  el.setAttribute('stroke-width', opts.w || 4);
  svg.appendChild(el); return el;
}
function text(x,y,txt,opts={}){
  const el = document.createElementNS('http://www.w3.org/2000/svg','text');
  el.setAttribute('x',x); el.setAttribute('y',y);
  el.setAttribute('fill', opts.color || '#e9e9e9');
  el.setAttribute('font-size', opts.size || 14);
  svg.appendChild(el); el.textContent = txt; return el;
}
function arrow(x,y,dir,len=90){
  if(dir==='right'){ line(x,y,x+len,y,{w:3}); poly([[x+len,y],[x+len-12,y-8],[x+len-12,y+8],[x+len,y]],{w:3}); }
  if(dir==='left'){ line(x,y,x-len,y,{w:3}); poly([[x-len,y],[x-len+12,y-8],[x-len+12,y+8],[x-len,y]],{w:3}); }
  if(dir==='up'){ line(x,y,x,y-len,{w:3}); poly([[x,y-len],[x-8,y-len+12],[x+8,y-len+12],[x,y-len]],{w:3}); }
  if(dir==='down'){ line(x,y,x,y+len,{w:3}); poly([[x,y+len],[x-8,y+len-12],[x+8,y+len-12],[x,y+len]],{w:3}); }
}

// Symbols
function drawValve(cx,cy,size=60){ poly([[cx-size/2,cy-size/2],[cx,cy],[cx-size/2,cy+size/2]]); poly([[cx+size/2,cy-size/2],[cx,cy],[cx+size/2,cy+size/2]]); }
function drawTrap(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size); text(cx-14,cy+5,'TR'); }

// ===== Wizard dynamic inputs =====
const countValve = document.getElementById('countValve');
const countTrap = document.getElementById('countTrap');
const countPipe = document.getElementById('countPipe');
const pipeInputs = document.getElementById('pipeInputs');
const totalLen = document.getElementById('totalLen');
const valveLen = document.getElementById('valveLen');
const trapLen = document.getElementById('trapLen');
const sumInfo = document.getElementById('sumInfo');

function rebuildPipeInputs(){
  pipeInputs.innerHTML = '';
  const n = Math.max(1, parseInt(countPipe.value||'1',10));
  for(let i=1;i<=n;i++){
    const wrap = document.createElement('div');
    const inp = document.createElement('input');
    inp.type='number'; inp.min='0'; inp.value = i===1 ? 300 : 200;
    inp.id = 'pipeLen'+i;
    const lab = document.createElement('label');
    lab.textContent = `배관 ${i} 길이(mm)`;
    wrap.appendChild(lab); wrap.appendChild(inp);
    wrap.style.display='flex'; wrap.style.flexDirection='column';
    pipeInputs.appendChild(wrap);
    inp.oninput = updateSumInfo;
  }
  updateSumInfo();
}
function parsePipeLens(){
  const n = Math.max(1, parseInt(countPipe.value||'1',10));
  let arr=[];
  for(let i=1;i<=n;i++){
    const v = parseFloat(document.getElementById('pipeLen'+i).value||'0');
    arr.push(isNaN(v)?0:v);
  }
  return arr;
}
function updateSumInfo(){
  const arr = parsePipeLens();
  const sumPipes = arr.reduce((a,b)=>a+b,0);
  const sumValves = (parseInt(countValve.value||'0')||0) * (parseFloat(valveLen.value||'0')||0);
  const sumTraps = (parseInt(countTrap.value||'0')||0) * (parseFloat(trapLen.value||'0')||0);
  const total = sumPipes + sumValves + sumTraps;
  const target = parseFloat(totalLen.value||'0')||0;
  const diff = total - target;
  sumInfo.innerHTML = `배관합 ${sumPipes} + 밸브합 ${sumValves} + 트랩합 ${sumTraps} = <b>${total} mm</b>` +
    (target>0 ? (Math.abs(diff)<1 ? ` <span class="ok">(총길이와 일치)</span>` : ` <span class="warn">(총길이와 ${diff>0?'+'+diff:diff} mm 차이)</span>`) : '');
}

// events
[countValve,countTrap,countPipe,totalLen,valveLen,trapLen].forEach(el=> el.oninput = ()=>{
  if(el===countPipe) rebuildPipeInputs(); else updateSumInfo();
});
rebuildPipeInputs();

// ===== Generate Diagram =====
const direction = document.getElementById('direction');
const material = document.getElementById('material');
const sizeSel = document.getElementById('size');
const schedule = document.getElementById('schedule');
const equipName = document.getElementById('equipName');
const equipLoc = document.getElementById('equipLoc');

const titleTop = document.getElementById('titleTop');
const titleMid = document.getElementById('titleMid');
const titleDir = document.getElementById('titleDir');
const lengthSummary = document.getElementById('lengthSummary');

function genTitle(){
  titleTop.textContent = `${equipLoc.value||'설비위치'}  ${equipName.value||'설비명'}`;
  titleMid.textContent = `${material.value}  ${sizeSel.value}  ${schedule.value}`;
  titleDir.textContent = `방향: ${dirLabel(direction.value)}`;
}
function dirLabel(d){ return {right:'→',left:'←',up:'↑',down:'↓'}[d] || d; }

function drawDimension(x1,y1,x2,y2,labelTxt){
  line(x1,y1-10,x1,y1+10,{w:3}); line(x2,y2-10,x2,y2+10,{w:3}); line(x1,y1,x2,y2,{w:2});
  text((x1+x2)/2 - (labelTxt.length*3), y1-14, labelTxt);
}

function generate(){
  genTitle();
  clearSVG();

  // direction arrow
  arrow(240,120,direction.value,90);

  const layout = document.querySelector('input[name="layout"]:checked').value;
  const nValve = Math.max(0, parseInt(countValve.value||'0',10));
  const nTrap  = Math.max(0, parseInt(countTrap.value||'0',10));
  const nPipe  = Math.max(1, parseInt(countPipe.value||'1',10));
  const vLen = Math.max(0, parseFloat(valveLen.value||'0'));
  const tLen = Math.max(0, parseFloat(trapLen.value||'0'));
  const pipes = parsePipeLens();

  // Compose sequence for series: P1, Valve1, P2, Trap1, P3, Valve2, P4, Trap2, ...
  const seq = [];
  let pi = 0, vi = 0, ti = 0;
  while(pi < nPipe || vi < nValve || ti < nTrap){
    if(pi < nPipe){ seq.push({type:'pipe', len:pipes[pi], label:`배관 ${pi+1} (${pipes[pi]}mm)`}); pi++; }
    if(vi < nValve){ seq.push({type:'valve', len:vLen, label:`밸브 ${vi+1} (${vLen}mm)`}); vi++; }
    if(ti < nTrap){ seq.push({type:'trap', len:tLen, label:`트랩 ${ti+1} (${tLen}mm)`}); ti++; }
  }

  const total = pipes.reduce((a,b)=>a+b,0) + nValve*vLen + nTrap*tLen;
  lengthSummary.textContent = `총 길이: ${total} mm`;

  if(layout==='series'){
    drawSeries(seq);
  }else{
    drawParallel(seq);
  }
}

function drawSeries(seq){
  const margin = 140;
  let x = margin, y = 520;
  let currX = x;
  seq.forEach(s=>{
    if(s.type==='pipe'){
      line(currX,y,currX+s.len,y);
      text(currX + s.len/2 - 20, y-10, `${s.len}mm`);
      drawDimension(currX, y+60, currX+s.len, y+60, s.label);
      currX += s.len;
    } else if(s.type==='valve'){
      drawValve(currX+30,y,60);
      text(currX+10, y-12, `${s.len}mm`);
      drawDimension(currX, y+60, currX+60, y+60, s.label);
      currX += 60;
    } else if(s.type==='trap'){
      drawTrap(currX+30,y,60);
      text(currX+10, y-12, `${s.len}mm`);
      drawDimension(currX, y+60, currX+60, y+60, s.label);
      currX += 60;
    }
  });
  drawDimension(140, y+100, currX, y+100, `총 길이 ${document.getElementById('totalLen').value||'-'} mm (계산:${seqLength(seq)} mm)`);
}

function drawParallel(seq){
  // Split into two rows roughly half each by length
  const rowA = [], rowB = [];
  let lenA=0,lenB=0;
  seq.forEach(s=>{
    const l = s.type==='pipe'?s.len:60;
    if(lenA<=lenB){ rowA.push(s); lenA += l; } else { rowB.push(s); lenB += l; }
  });

  const baseX = 140;
  const yA = 420, yB = 620;

  const drawRow = (row,y)=>{
    let cx = baseX;
    row.forEach(s=>{
      if(s.type==='pipe'){
        line(cx,y,cx+s.len,y);
        text(cx + s.len/2 - 20, y-10, `${s.len}mm`);
        drawDimension(cx, y+50, cx+s.len, y+50, s.label);
        cx += s.len;
      } else if(s.type==='valve'){
        drawValve(cx+30,y,60);
        text(cx+10, y-12, `${s.len}mm`);
        drawDimension(cx, y+50, cx+60, y+50, s.label);
        cx += 60;
      } else if(s.type==='trap'){
        drawTrap(cx+30,y,60);
        text(cx+10, y-12, `${s.len}mm`);
        drawDimension(cx, y+50, cx+60, y+50, s.label);
        cx += 60;
      }
    });
    drawDimension(baseX, y+80, cx, y+80, `라인 길이 ${rowLength(row)} mm`);
  };

  drawRow(rowA, yA);
  drawRow(rowB, yB);
}

function rowLength(row){ return row.reduce((a,s)=> a + (s.type==='pipe'?s.len: (s.type==='valve'||s.type==='trap'? (s.len) : 0)), 0); }
function seqLength(seq){ return rowLength(seq); }

// Buttons
document.getElementById('btnGen').onclick = generate;
document.getElementById('btnReset').onclick = ()=>{
  document.getElementById('equipName').value='';
  document.getElementById('equipLoc').value='';
  clearSVG();
  document.getElementById('titleTop').textContent = '설비위치  설비명';
  document.getElementById('titleMid').textContent = '재질  크기  스케쥴';
  document.getElementById('titleDir').textContent = '방향: →';
  document.getElementById('lengthSummary').textContent = '총 길이: -';
};

document.getElementById('btnExport').onclick = ()=>{
  const s = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([s], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = function(){
    const canvas = document.createElement('canvas');
    canvas.width = svg.viewBox.baseVal.width;
    canvas.height = svg.viewBox.baseVal.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png'); a.download='piping_wizard.png'; a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

document.getElementById('btnPrint').onclick = ()=>{
  const win = window.open('','_blank');
  const s = new XMLSerializer().serializeToString(svg);
  win.document.write(`<html><head><title>Print</title><style>body{margin:0;background:#fff}</style></head><body>${s}</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(),300);
};
