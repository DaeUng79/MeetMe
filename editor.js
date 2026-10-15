const SIZE = { width: 860, height: 520, exportWidth: 2032, exportHeight: 1228, dpi: 600 };
const COLOR = { black: '#151719', gold: '#c7ac76', ivory: '#f7f5ef', gray: '#61666b' };
const STORAGE_KEY = 'meetme-card-editor-v1';
const DEFAULTS = {
  certLabel: 'AI챔피언', grade: 'BLACK', certCode: '2026-BC0663(임시데이터)',
  name: '오대웅', affiliation: '양산시', title: '지방전산주사',
  phone: '010-2886-5213', email: 'odw0902@korea.kr', tagline: 'BUILD · TEACH · SOLVE',
  eyebrow: 'PUBLIC SECTOR AI  /  PRACTICE & EDUCATION',
  headline1: '인재의 가치를 높이는 업스킬링,',
  headline2: '조직의 가치를 바꾸는 AI 혁신',
  leftHeading: 'AI 연구 스킬', rightHeading: '연구 수상 실적',
  leftItems: [
    '26년 AI챔피언 블랙 등급',
    '26년 인공지능을 활용한 행정혁신의 달인 선정',
    '26년 빅데이터분석기사 취득',
    '24년 데이터 분석 준전문가 취득(ADsP-041014800)',
    '24년 아키텍처준전문가 자격취득(DAsP-057001770)',
    '24년 SQL개발자 취득(SQLD-054020931)'
  ].join('\n'),
  rightItems: [
    '25년 경상남도 혁신 우수사례 경진대회 대상 수상',
    '25년 우수행정 및 정책사례 선발대회 최우수상 수상',
    '25년 지방정부 AI혁신 공공행정 우수 지자체 입상',
    '24년 공무원 정책연구 발표대회 인재개발원장상 수상',
    '22년 제39회 지역정보화 연구과제 행안부장관상 수상',
    '22년 지방자치단체 빅데이터 분석 우수사례 선정'
  ].join('\n'),
  callToAction: '로컬 AX 상담 · 업무자동화 강의 · 워크숍',
  siteText: 'daeung79.github.io/MeetMe'
};

const FRONT_FIELDS = [
  ['certLabel','인증 이름'], ['grade','등급'], ['certCode','인증번호'],
  ['name','이름'], ['affiliation','소속'], ['title','직위'],
  ['phone','연락처'], ['email','이메일'], ['tagline','오른쪽 영문 문구']
];
const BACK_FIELDS = [
  ['eyebrow','상단 영문 문구'], ['headline1','첫 번째 큰 문장'], ['headline2','두 번째 큰 문장'],
  ['leftHeading','왼쪽 소제목'], ['leftItems','왼쪽 경력 · 줄마다 한 항목',true],
  ['rightHeading','오른쪽 소제목'], ['rightItems','오른쪽 실적 · 줄마다 한 항목',true],
  ['callToAction','하단 안내 문구'], ['siteText','하단 사이트 표시']
];

let data = loadSaved();
const images = {};
const customImages = {qr:null};
const canvases = new Map();
const status = document.getElementById('status');

function loadSaved() {
  try { return {...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; }
  catch { return {...DEFAULTS}; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { status.textContent = '브라우저 저장 공간을 사용할 수 없습니다. 현재 화면에서는 계속 편집할 수 있습니다.'; }
}
function setupFields(containerId, fields) {
  const container = document.getElementById(containerId);
  for (const [key,label,multiline] of fields) {
    const wrapper = document.createElement('div'); wrapper.className = 'field-group';
    const id = `field-${key}`;
    const labelNode = document.createElement('label'); labelNode.htmlFor = id; labelNode.textContent = label;
    const input = document.createElement(multiline ? 'textarea' : 'input');
    input.id = id; input.name = key; input.value = data[key];
    if (!multiline) input.type = 'text';
    input.addEventListener('input', () => { data[key] = input.value; save(); renderAll(); });
    wrapper.append(labelNode,input);
    if (multiline) { const hint = document.createElement('p'); hint.className='field-hint'; hint.textContent='최대 6줄이 명함에 표시됩니다.'; wrapper.append(hint); }
    container.append(wrapper);
  }
}
setupFields('front-fields', FRONT_FIELDS);
setupFields('back-fields', BACK_FIELDS);

function showTab(side) {
  for (const tabSide of ['front','back','images']) {
    const selected = tabSide === side;
    document.getElementById(`tab-${tabSide}`).setAttribute('aria-selected', String(selected));
    document.getElementById(`${tabSide==='images'?'image':tabSide}-fields`).hidden = !selected;
  }
}
document.getElementById('tab-front').addEventListener('click', () => showTab('front'));
document.getElementById('tab-back').addEventListener('click', () => showTab('back'));
document.getElementById('tab-images').addEventListener('click', () => showTab('images'));
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('편집한 내용을 지우고 기본 문구로 복원할까요?')) return;
  data = {...DEFAULTS};
  document.querySelectorAll('#card-form [name]').forEach(input => { input.value = data[input.name]; });
  save(); renderAll(); status.textContent='기본 문구로 복원했습니다.';
});

const UPLOADS = [
  {key:'qr',title:'QR 이미지',help:'세 시안 뒷면의 QR을 교체합니다. 정사각형 QR 이미지가 좋습니다.'}
];
const uploadUI = {};
for (const {key,title,help} of UPLOADS) {
  const wrap=document.createElement('section');wrap.className='upload-field';
  const heading=document.createElement('h3');heading.textContent=title;
  const note=document.createElement('p');note.textContent=help;
  const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
  input.id=`upload-${key}`;input.setAttribute('aria-label',`${title} 등록`);
  const meta=document.createElement('div');meta.className='upload-meta';
  const actions=document.createElement('div');actions.className='upload-actions';
  const remove=document.createElement('button');remove.type='button';remove.textContent='이미지 제거';remove.disabled=true;
  actions.append(remove);wrap.append(heading,note,input,meta,actions);
  document.getElementById('upload-list').append(wrap);
  uploadUI[key]={input,meta,remove};
  input.addEventListener('change',async()=>{const file=input.files?.[0];if(file) await registerUpload(key,file);input.value='';});
  remove.addEventListener('click',()=>removeUpload(key));
  refreshUploadUI(key);
}

function refreshUploadUI(key) {
  const record=customImages[key],ui=uploadUI[key];
  ui.meta.textContent=record?`${record.name} · ${record.width} × ${record.height}px 등록됨`:'등록된 이미지 없음 · 기본 디자인 사용';
  ui.remove.disabled=!record;
}
function openUploadDB() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('meetme-card-uploads',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('images');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
const dbPromise=openUploadDB().catch(()=>null);
async function dbWrite(key,value) {
  const db=await dbPromise;if(!db) throw new Error('브라우저 이미지 저장소를 사용할 수 없습니다.');
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('images','readwrite');
    if(value) tx.objectStore('images').put(value,key);else tx.objectStore('images').delete(key);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
}
async function restoreUploads() {
  const db=await dbPromise;
  if(!db) {status.textContent='이 브라우저에서는 이미지 등록 내용이 다시 열 때 유지되지 않을 수 있습니다.';return;}
  for(const {key} of UPLOADS) {
    const record=await new Promise(resolve=>{
      const request=db.transaction('images').objectStore('images').get(key);
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);
    });
    if(!record?.blob) continue;
    const url=URL.createObjectURL(record.blob),image=await loadImage(url);
    if(!image){URL.revokeObjectURL(url);continue;}
    customImages[key]={image,url,name:record.name,width:image.naturalWidth,height:image.naturalHeight};
    refreshUploadUI(key);
  }
  renderAll();
}
async function registerUpload(key,file) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)) {status.textContent='PNG·JPG·WebP 이미지만 등록할 수 있습니다.';return;}
  if(file.size>20*1024*1024){status.textContent='이미지는 20MB 이하로 선택해 주세요.';return;}
  const url=URL.createObjectURL(file),image=await loadImage(url);
  if(!image){URL.revokeObjectURL(url);status.textContent='이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.';return;}
  const previous=customImages[key];
  customImages[key]={image,url,name:file.name,width:image.naturalWidth,height:image.naturalHeight};
  if(previous)URL.revokeObjectURL(previous.url);
  refreshUploadUI(key);renderAll();
  try {await dbWrite(key,{blob:file,name:file.name});status.textContent='QR 이미지를 등록했습니다.';}
  catch {status.textContent='이미지는 현재 화면에 적용됐지만 브라우저에 저장하지 못했습니다.';}
}
async function removeUpload(key) {
  const previous=customImages[key];if(!previous)return;
  customImages[key]=null;URL.revokeObjectURL(previous.url);
  refreshUploadUI(key);renderAll();
  try{await dbWrite(key,null);status.textContent='이미지를 제거하고 기본 디자인으로 복원했습니다.';}
  catch{status.textContent='현재 화면에서는 복원됐지만 저장소에서 제거하지 못했습니다.';}
}

const CONCEPTS = [
  {key:'a',name:'01 · BLACK & GOLD',desc:'검정 바탕 · 골드 인증'},
  {key:'b',name:'02 · IVORY & BLACK',desc:'밝은 바탕 · 블랙 인증'},
  {key:'c',name:'03 · RIGHT SIGNATURE',desc:'오른쪽에 크게 배치한 인증'}
];
for (const concept of CONCEPTS) {
  const section = document.createElement('article'); section.className='concept';
  const head = document.createElement('div'); head.className='concept-head';
  const title = document.createElement('h3'); title.textContent=concept.name;
  const desc = document.createElement('span'); desc.textContent=concept.desc;
  head.append(title,desc); section.append(head);
  const pair = document.createElement('div'); pair.className='card-pair';
  for (const side of ['front','back']) {
    const block = document.createElement('div'); block.className='card-side';
    const label = document.createElement('span'); label.textContent=side==='front'?'FRONT · 앞면':'BACK · 뒷면';
    const canvas = document.createElement('canvas'); canvas.width=860; canvas.height=520;
    canvas.setAttribute('aria-label',`${concept.name} ${side==='front'?'앞면':'뒷면'} 미리보기`);
    canvases.set(`${concept.key}-${side}`,canvas);
    const button = document.createElement('button'); button.type='button'; button.className='download';
    button.textContent=`${side==='front'?'앞면':'뒷면'} PNG 다운로드 · 600dpi`;
    button.addEventListener('click',()=>downloadPNG(concept.key,side,button));
    block.append(label,canvas,button); pair.append(block);
  }
  section.append(pair); document.getElementById('card-grid').append(section);
}

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
Promise.all([
  document.fonts.load('400 24px MeetSans'),document.fonts.load('800 24px MeetSans'),
  loadImage('assets/yangsan.png'),loadImage('assets/mois.png'),loadImage('assets/nia.png'),
  loadImage('assets/portfolio-qr.svg')
]).then(([, ,yangsan,mois,nia,qr]) => {
  Object.assign(images,{yangsan,mois,nia,qr});
  status.textContent = qr && yangsan && mois && nia ? '' : '일부 이미지가 로드되지 않았습니다. 서버에서 페이지를 다시 열어주세요.';
  renderAll();
  return restoreUploads();
}).catch(()=>{status.textContent='폰트 또는 이미지를 불러오지 못했습니다. 페이지를 다시 열어주세요.';});

function rect(ctx,x,y,w,h,color) {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function rounded(ctx,x,y,w,h,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function rule(ctx,x1,y1,x2,y2,color,width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function font(ctx,size,bold=false) {ctx.font=`${bold?800:400} ${size}px MeetSans, sans-serif`;ctx.textBaseline='alphabetic';}
function fittedText(ctx,value,x,baseline,maxWidth,size,color,bold=false,minSize=12,align='left') {
  const text=String(value||''); let current=size; font(ctx,current,bold);
  while (current>minSize && ctx.measureText(text).width>maxWidth) {current-=.5;font(ctx,current,bold);}
  let display=text;
  if(ctx.measureText(display).width>maxWidth){while(display.length && ctx.measureText(display+'…').width>maxWidth) display=display.slice(0,-1);display+='…';}
  ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(display,x,baseline);ctx.textAlign='left';
}
function pacLabel(ctx,x,baseline,color) {
  font(ctx,25.5); ctx.fillStyle=color; ctx.fillText('PAC',x,baseline);
  const suffixX=x+ctx.measureText('PAC').width+4;
  font(ctx,17); ctx.fillText('(Public AI Champion)',suffixX,baseline);
}
function imageOrText(ctx,img,x,y,w,h,label) {
  if(img) ctx.drawImage(img,x,y,w,h);
  else fittedText(ctx,label,x,y+h*.75,w,22,COLOR.black,true);
}
function drawFittedImage(ctx,img,x,y,w,h,fit='contain') {
  const iw=img.naturalWidth,ih=img.naturalHeight;
  if(fit==='cover') {
    const ratio=Math.max(w/iw,h/ih),sw=w/ratio,sh=h/ratio;
    ctx.drawImage(img,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h);
  } else {
    const ratio=Math.min(w/iw,h/ih),dw=iw*ratio,dh=ih*ratio;
    ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }
}
function agencies(ctx) {
  rounded(ctx,34,412,832,78,13,'#fff');
  imageOrText(ctx,images.yangsan,101,432,132,37,'양산시');
  imageOrText(ctx,images.mois,293,426.45,169,48.1,'행정안전부');
  imageOrText(ctx,images.nia,522,432,277.5,37,'NIA 한국지능정보사회진흥원');
}
function front(ctx,concept) {
  const dark=concept!=='b', bg=dark?COLOR.black:COLOR.ivory, fg=dark?COLOR.ivory:COLOR.black;
  rect(ctx,0,0,900,500,bg);
  const role=[data.affiliation,data.title].filter(Boolean).join('  |  ');
  if(concept==='c') {
    fittedText(ctx,data.name,70,154,450,64,fg,true,35);
    font(ctx,64,true); pacLabel(ctx,70+ctx.measureText(data.name).width+13,155,COLOR.gold);
    fittedText(ctx,role,74,200,460,23,fg,false,15);
    rule(ctx,73,235,135,235,COLOR.gold,2);
    fittedText(ctx,data.phone,74,289,490,25,fg,false,17);
    fittedText(ctx,data.email,74,334,490,25,fg,false,17);
    const left=580,right=842,center=(left+right)/2;
    rule(ctx,left,70,right,70,COLOR.gold,1.5);rule(ctx,right,70,right,98,COLOR.gold,1.5);
    fittedText(ctx,data.certLabel,center,128,260,40,COLOR.gold,true,22,'center');
    fittedText(ctx,data.grade,center,200,280,64,COLOR.gold,true,32,'center');
    rule(ctx,left,224,right,224,'#62583f');
    fittedText(ctx,data.certCode,center,256,260,17,'#aaa69d',false,11,'center');
    fittedText(ctx,data.tagline,right,334,280,13,COLOR.gold,false,10,'right');
  } else {
    if(dark){rule(ctx,690,388,844,234,'#38352e',1.4);rule(ctx,731,388,855,264,'#38352e',1.4);rule(ctx,760,388,865,283,'#38352e',1.4);}
    else {rect(ctx,0,0,18,417,COLOR.black);rect(ctx,657,0,243,224,COLOR.black);
      fittedText(ctx,data.grade,694,118,190,39,COLOR.ivory,true,20);
      fittedText(ctx,'AI CHAMPION',694,153,190,15,COLOR.gold);}
    fittedText(ctx,data.certLabel,73,62,300,29,dark?COLOR.gold:COLOR.black,true,18);
    if(dark) fittedText(ctx,data.grade,Math.min(480,73+ctx.measureText(data.certLabel).width+13),62,360,28,COLOR.gold,true,18);
    fittedText(ctx,data.certCode,73,94,480,17,dark?'#aaa69d':COLOR.gray,false,11);
    fittedText(ctx,data.name,70,198,560,64,fg,true,35);
    font(ctx,64,true); pacLabel(ctx,70+ctx.measureText(data.name).width+13,199,dark?COLOR.gold:COLOR.gray);
    fittedText(ctx,role,74,241,560,23,fg,false,15);
    rule(ctx,73,275,135,275,COLOR.gold,2);
    fittedText(ctx,data.phone,74,320,560,25,fg,false,17);
    fittedText(ctx,data.email,74,360,560,25,fg,false,17);
    fittedText(ctx,data.tagline,646,dark?210:358,210,13,dark?COLOR.gold:COLOR.gray,false,10);
  }
  agencies(ctx);
}
function itemLines(value){return String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,6);}
function back(ctx,concept) {
  rect(ctx,0,0,900,500,concept==='b'?'#fff':COLOR.ivory);
  fittedText(ctx,data.eyebrow,45,50,570,14,COLOR.gray,false,10);
  fittedText(ctx,data.headline1,46,102,555,36,COLOR.black,true,20);
  fittedText(ctx,data.headline2,600,152,555,36,COLOR.black,true,20,'right');
  rule(ctx,46,176,600,176,'#c8c8c0');
  fittedText(ctx,data.leftHeading,38,209,390,24,COLOR.black,true,16);
  fittedText(ctx,data.rightHeading,454,209,410,24,COLOR.black,true,16);
  const ys=[240,273,306,339,372,405];
  for(const [i,item] of itemLines(data.leftItems).entries()) fittedText(ctx,'· '+item,38,ys[i],390,18,COLOR.gray,false,13);
  for(const [i,item] of itemLines(data.rightItems).entries()) fittedText(ctx,'· '+item,454,ys[i],410,18,COLOR.gray,false,13);
  rect(ctx,680,10,190,190,'#fff');
  if(customImages.qr)drawFittedImage(ctx,customImages.qr.image,686,16,178,178);
  else imageOrText(ctx,images.qr,680,10,190,190,'QR');
  rounded(ctx,34,428,832,60,12,COLOR.black);
  fittedText(ctx,data.callToAction,55,466,535,21,COLOR.ivory,true,13);
  fittedText(ctx,data.siteText,847,465,235,15,'#d9c9a6',false,11,'right');
}
function drawCard(canvas,concept,side){
  const ctx=canvas.getContext('2d');
  ctx.setTransform(canvas.width/SIZE.width,0,0,canvas.height/SIZE.height,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const base=side==='back'?(concept==='b'?'#fff':COLOR.ivory):(concept==='b'?COLOR.ivory:COLOR.black);
  rect(ctx,0,0,SIZE.width,SIZE.height,base);
  ctx.save();ctx.translate(0,(520-500*(860/900))/2);ctx.scale(860/900,860/900);
  if(side==='front') front(ctx,concept); else back(ctx,concept);
  ctx.restore();
}
function renderAll(){for(const [key,canvas] of canvases){const [concept,side]=key.split('-');drawCard(canvas,concept,side);}}
renderAll();

function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function pngChunk(type,payload){
  const out=new Uint8Array(payload.length+12), view=new DataView(out.buffer);
  view.setUint32(0,payload.length);for(let i=0;i<4;i++)out[4+i]=type.charCodeAt(i);
  out.set(payload,8);view.setUint32(out.length-4,crc32(out.subarray(4,out.length-4)));return out;
}
async function addDpiMetadata(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const ihdrEnd=8+12+view.getUint32(8);
  const payload=new Uint8Array(9), pv=new DataView(payload.buffer);
  const pixelsPerMeter=Math.round(SIZE.dpi/0.0254);
  pv.setUint32(0,pixelsPerMeter);pv.setUint32(4,pixelsPerMeter);payload[8]=1;
  return new Blob([bytes.subarray(0,ihdrEnd),pngChunk('pHYs',payload),bytes.subarray(ihdrEnd)],{type:'image/png'});
}
async function downloadPNG(concept,side,button){
  button.disabled=true;button.textContent='PNG 생성 중…';
  try {
    const canvas=document.createElement('canvas');canvas.width=SIZE.exportWidth;canvas.height=SIZE.exportHeight;
    drawCard(canvas,concept,side);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('이미지를 만들지 못했습니다.')),'image/png'));
    const output=await addDpiMetadata(blob),url=URL.createObjectURL(output);
    const a=document.createElement('a');a.href=url;a.download=`oh-daeung-card-${concept}-${side}-86x52mm-600dpi.png`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
    status.textContent=`${concept.toUpperCase()} 시안 ${side==='front'?'앞면':'뒷면'} PNG를 저장했습니다.`;
  } catch(error) {status.textContent=`PNG 저장 실패: ${error.message}`;}
  finally {button.disabled=false;button.textContent=`${side==='front'?'앞면':'뒷면'} PNG 다운로드 · 600dpi`;}
}
