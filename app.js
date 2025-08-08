// 데이터 테이블: 간단한 NPS 외경(OD) & 두께(예시값)
const PIPE_TABLE = {
  '1"':  { OD_mm: 33.40,  SCH: { '40': 3.38, '80': 4.55, '160': 6.35 } },
  '2"':  { OD_mm: 60.33,  SCH: { '40': 3.91, '80': 5.54, '160': 8.74 } },
  '3"':  { OD_mm: 88.90,  SCH: { '40': 5.49, '80': 7.62, '160': 11.13 } },
  '4"':  { OD_mm: 114.30, SCH: { '40': 6.02, '80': 8.56, '160': 13.49 } },
  '6"':  { OD_mm: 168.28, SCH: { '40': 7.11, '80': 10.97,'160': 18.26 } },
};

// 상태
const state = {
  structure: 'horizontal',
  direction: 'right',
  unit: 'mm',
  nominalSize: '2"',
  schedule: '80',
  material: 'CS',
  items: [] // {type,len,rot}
};

// 엘리먼트
const svg = document.getElementById('svg');
const list = document.getElementById('list');
const specEl = document.getElementById('spec');

// 컨트롤 바인딩
['structure','direction','unit','nominalSize','schedule','material'].forEach(id=>{
  document.getElementById(id).onchange = e => { state[id] = e.target.value; render(); };
});

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.add;
    let len = parseFloat(document.getElementById('len').value||'0') || 0;
    if(state.unit==='inch') len = len*25.4; // 내부는 mm
    state.items.push({type, len, rot:0});
    render();
  };
});

document.getElementById('btnReset').onclick = ()=>{ state.items=[]; render(); };
document.getElementById('btnExportPng').onclick = ()=> exportPNG();
document.getElementById('btnPrint').onclick = ()=> printPDFLike();
document.getElementById('btnSave').onclick = ()=> {
  const data = new Blob([JSON.stringify(state)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(data); a.download='piping.json'; a.click();
  URL.revokeObjectURL(a.href);
};
document.getElementById('btnLoad').onclick = ()=> document.getElementById('fileLoad').click();
document.getElementById('fileLoad').onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ Object.assign(state, JSON.parse(r.result)); render(); };
  r.readAsText(f);
};

// 유틸
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
function text(x,y,txt){ const el = document.createElementNS('http://www.w3.org/2000/svg','text'); el.setAttribute('x',x); el.setAttribute('y',y); el.setAttribute('class','dimtxt'); el.textContent = txt; svg.appendChild(el); return el; }

// 심볼
function drawValve(cx,cy,size=60){ poly([[cx-size/2,cy-size/2],[cx,cy],[cx-size/2,cy+size/2]]); poly([[cx+size/2,cy-size/2],[cx,cy],[cx+size/2,cy+size/2]]); }
function drawGate(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size); line(cx-size/2,cy,cx+size/2,cy); }
function drawGlobe(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size,{fill:'none'}); poly([[cx-size/2,cy],[cx,cy-size/2],[cx+size/2,cy],[cx,cy+size/2],[cx-size/2,cy]]); }
function drawCheck(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size); poly([[cx-size/5,cy],[cx+size/3,cy-size/3],[cx+size/3,cy+size/3],[cx-size/5,cy]]); }
function drawStrainer(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size); poly([[cx-size/2,cy-size/2],[cx+size/2,cy+size/2]]); }
function drawTrap(cx,cy,size=60){ rect(cx-size/2,cy-size/2,size,size); text(cx-size/4,cy+size/4,'TR'); }

function arrow(x,y,dir,len=90){
  if(dir==='right'){ line(x,y,x+len,y,{w:3}); poly([[x+len,y],[x+len-12,y-8],[x+len-12,y+8],[x+len,y]],{w:3}); }
  if(dir==='left'){ line(x,y,x-len,y,{w:3}); poly([[x-len,y],[x-len+12,y-8],[x-len+12,y+8],[x-len,y]],{w:3}); }
  if(dir==='up'){ line(x,y,x,y-len,{w:3}); poly([[x,y-len],[x-8,y-len+12],[x+8,y-len+12],[x,y-len]],{w:3}); }
  if(dir==='down'){ line(x,y,x,y+len,{w:3}); poly([[x,y+len],[x-8,y+len-12],[x+8,y+len-12],[x,y+len]],{w:3}); }
}
function dimension(x1,y1,x2,y2,labelTxt){
  line(x1,y1-10,x1,y1+10,{w:3}); line(x2,y2-10,x2,y2+10,{w:3}); line(x1,y1,x2,y2,{w:2}); text((x1+x2)/2 - (labelTxt.length*3), y1-14, labelTxt);
}

function label(t){ return ({pipe:'배관',valve:'일반밸브',gate:'게이트',globe:'글로브',check:'체크',strainer:'스트레이너',trap:'트랩'})[t] || t; }
function drawSymbol(type, cx, cy, size=60){
  if(type==='valve') return drawValve(cx,cy,size);
  if(type==='gate') return drawGate(cx,cy,size);
  if(type==='globe') return drawGlobe(cx,cy,size);
  if(type==='check') return drawCheck(cx,cy,size);
  if(type==='strainer') return drawStrainer(cx,cy,size);
  if(type==='trap') return drawTrap(cx,cy,size);
}

// 메인 렌더
function render(){
  clearSVG();
  // 규격 정보
  const spec = PIPE_TABLE[state.nominalSize];
  const t = spec ? spec.SCH[state.schedule] : undefined;
  const od = spec ? spec.OD_mm : undefined;
  specEl.textContent = spec ? `NPS ${state.nominalSize} / SCH ${state.schedule} → OD ${od.toFixed(2)} mm, t ${t.toFixed(2)} mm` : '-';

  // 방향 라벨
  arrow(260,140,state.direction,90);
  text(370,146, `방향:${dirLabel(state.direction)}  재질:${state.material}  크기:${state.nominalSize}  SCH:${state.schedule}`);

  const margin = 140;
  let x = margin, y = 520;
  let totalPipe = 0;

  if(state.structure==='horizontal'){
    let currX = x;
    state.items.forEach(it=>{
      if(it.type==='pipe'){
        line(currX,y,currX+it.len,y);
        currX += it.len; totalPipe += it.len;
      }else{
        drawSymbol(it.type,currX+30,y,60);
        currX += 60;
      }
    });
    dimension(x,y+70,currX,y+70,`총 배관 길이: ${fmtLen(totalPipe)}`);
  }else if(state.structure==='vertical'){
    let currY = y-240;
    state.items.forEach(it=>{
      if(it.type==='pipe'){
        line(x,currY,x,currY+it.len);
        currY += it.len; totalPipe += it.len;
      }else{
        drawSymbol(it.type,x,currY+30,60);
        currY += 60;
      }
    });
    dimension(x+70,y-240,x+70,y-240+totalPipe,`총 배관 길이: ${fmtLen(totalPipe)}`);
  }else if(state.structure==='elbow'){
    const tgt = totalPipeLen()/2;
    let left = tgt;
    let cx = x, cy = y;
    state.items.forEach(it=>{
      if(it.type==='pipe'){
        if(left>0){
          const seg = Math.min(left, it.len);
          line(cx,cy,cx+seg,cy); cx+=seg; left-=seg;
          const remain = it.len - seg;
          if(remain>0){ line(cx,cy,cx,cy+remain); cy+=remain; }
        }else{
          line(cx,cy,cx,cy+it.len); cy+=it.len;
        }
        totalPipe += it.len;
      }else{
        if(left>0){ drawSymbol(it.type,cx+30,cy,60); cx+=60; }
        else { drawSymbol(it.type,cx,cy+30,60); cy+=60; }
      }
    });
    dimension(x,y+70,x+tgt,y+70,`수평: ${fmtLen(tgt)}`);
    dimension(x+70,y,x+70,y+(totalPipe - tgt),`수직: ${fmtLen(totalPipe - tgt)}`);
  }

  // 리스트
  renderList();
  // 저장
  localStorage.setItem('pipingProState', JSON.stringify(state));
}

function totalPipeLen(){ return state.items.filter(i=>i.type==='pipe').reduce((a,b)=>a+(b.len||0),0); }
function fmtLen(mm){ return state.unit==='mm' ? `${Math.round(mm)} mm` : `${(mm/25.4).toFixed(2)} in`; }
function dirLabel(d){ return {right:'오른쪽',left:'왼쪽',up:'위쪽',down:'아래쪽'}[d]; }

function renderList(){
  list.innerHTML='';
  state.items.forEach((it,i)=>{
    const row = document.createElement('div'); row.className='item';
    const span = document.createElement('span'); span.className='grow';
    span.textContent = `${i+1}. ${label(it.type)} ${it.type==='pipe' ? '('+fmtLen(it.len)+')' : ''}`;
    const up = document.createElement('button'); up.textContent='↑'; up.onclick=()=>{ if(i>0){ [state.items[i-1],state.items[i]]=[state.items[i],state.items[i-1]]; render(); } };
    const down = document.createElement('button'); down.textContent='↓'; down.onclick=()=>{ if(i<state.items.length-1){ [state.items[i+1],state.items[i]]=[state.items[i],state.items[i+1]]; render(); } };
    const edit = document.createElement('button'); edit.textContent='수정'; edit.onclick=()=>{
      if(it.type==='pipe'){
        const v = prompt('길이(mm 또는 현재 단위):', state.unit==='mm' ? it.len : (it.len/25.4).toFixed(2));
        if(v!==null){ let mm = parseFloat(v)||0; if(state.unit==='inch') mm*=25.4; it.len = mm; render(); }
      } else {
        alert('심볼 회전은 필요시 구조/방향으로 제어하세요.');
      }
    };
    const del = document.createElement('button'); del.textContent='삭제'; del.onclick=()=>{ state.items.splice(i,1); render(); };
    row.append(span, up, down, edit, del);
    list.appendChild(row);
  });
}

// PNG 내보내기
function exportPNG(){
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
    a.href = canvas.toDataURL('image/png'); a.download='piping.png'; a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// 인쇄(PDF 저장용)
function printPDFLike(){
  const win = window.open('','_blank');
  const s = new XMLSerializer().serializeToString(svg);
  win.document.write(`<html><head><title>Piping Print</title><style>body{margin:0;background:#fff}</style></head><body>${s}</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(), 300);
}

// 상태 복원
try{
  const saved = localStorage.getItem('pipingProState');
  if(saved) Object.assign(state, JSON.parse(saved));
}catch(e){}
render();
