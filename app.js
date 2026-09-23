
// スマホの意図しない拡大を防止
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
document.addEventListener("gesturechange",e=>e.preventDefault(),{passive:false});
document.addEventListener("gestureend",e=>e.preventDefault(),{passive:false});
let lastTouchEnd=0;
document.addEventListener("touchend",e=>{const now=Date.now();if(now-lastTouchEnd<350)e.preventDefault();lastTouchEnd=now},{passive:false});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});

const KEY="koyaku-counter-v3",OLD_KEY="koyaku-counter-v2",DEFAULT_COUNTERS=["ベル","スイカ","チェリー"],DEFAULT_MACHINES=["マイジャグラーV","アイムジャグラーEX","その他"];
let minusMode=false;
function blankData(){return {games:0,startGames:0,counters:DEFAULT_COUNTERS.map(name=>({name,count:0})),layout:'2',memo:''}}
function normalizeData(d){
  d.games=Number(d.games)||0;d.startGames=Number(d.startGames)||0;
  d.counters=(d.counters&&d.counters.length?d.counters:DEFAULT_COUNTERS.map(name=>({name,count:0}))).map(c=>({name:String(c.name||'小役'),count:Number(c.count)||0}));
  d.layout=['2','1','first1','first2','memo'].includes(d.layout)?d.layout:'2';
  d.memo=String(d.memo||'');
  return d;
}
function normalizeMachine(m){
  if(!m.modes){m.modes={通常:{games:Number(m.games)||0,startGames:Number(m.startGames)||0,counters:(m.counters||DEFAULT_COUNTERS.map(name=>({name,count:0}))).map(c=>({name:c.name,count:Number(c.count)||0}))}}}
  if(!m.modes.通常)m.modes.通常=blankData();
  if(!m.modes.合成)m.modes.合成=blankData();
  Object.keys(m.modes).forEach(k=>normalizeData(m.modes[k]));
  if(!Array.isArray(m.modeOrder))m.modeOrder=Object.keys(m.modes);
  m.modeOrder=m.modeOrder.filter(k=>m.modes[k]);
  Object.keys(m.modes).forEach(k=>{if(!m.modeOrder.includes(k))m.modeOrder.push(k)});
  delete m.games;delete m.startGames;delete m.counters;
  return m;
}
function blankMachine(){return {modes:{通常:blankData(),合成:blankData()},modeOrder:['通常','合成']}}
let state=JSON.parse(localStorage.getItem(KEY)||"null");
if(!state){const old=JSON.parse(localStorage.getItem(OLD_KEY)||"null");state={selected:"マイジャグラーV",machines:{}};DEFAULT_MACHINES.forEach(n=>state.machines[n]=blankMachine());if(old)state.machines["マイジャグラーV"].modes.通常={games:old.games||0,startGames:old.startGames||0,counters:(old.counters||[]).map(c=>({name:c.name,count:c.count||0})),layout:'2'};localStorage.setItem(KEY,JSON.stringify(state))}
Object.keys(state.machines||{}).forEach(n=>state.machines[n]=normalizeMachine(state.machines[n]));
let displayMode="通常";
let combined=false;
function current(){return state.machines[state.selected]}
function currentData(){const m=current();if(!m.modes[displayMode]){displayMode=m.modeOrder[0]||Object.keys(m.modes)[0]||"通常";if(!m.modes[displayMode])m.modes.通常=blankData()}return normalizeData(m.modes[displayMode])}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function displayData(){return currentData()}
function rate(n,data){const games=Number(data?.games)||0;const count=Number(n)||0;if(count===0)return "1/0.00";return games>0?`1/${(games/count).toFixed(2)}`:"1/0.00"}
function renderModeSwitch(){const sw=document.querySelector('.modeSwitch');sw.innerHTML='';const machine=current();const modes=(machine.modeOrder||Object.keys(machine.modes||{})).filter(x=>machine.modes[x]);modes.forEach(mode=>{const b=document.createElement('button');b.className='modeBtn'+(displayMode===mode?' active':'');b.textContent=mode;b.onclick=()=>setDisplayMode(mode);sw.appendChild(b)});sw.style.gridTemplateColumns=`repeat(${Math.max(1,modes.length)},1fr)`}
function renderMachineSelect(){const s=document.getElementById("machine");s.innerHTML="";Object.keys(state.machines).forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;o.selected=n===state.selected;s.appendChild(o)})}
function render(){
  renderMachineSelect();renderModeSwitch();
  const d=displayData();
  document.getElementById("gamesInput").value=d.games;document.getElementById("startGamesInput").value=d.startGames||0;
  const root=document.getElementById("counters");root.className='counterGrid'+(d.layout==='1'?' oneCol':d.layout==='first1'?' firstOne':d.layout==='first2'?' firstTwo':'');root.innerHTML="";
  if(d.layout==='memo'){const memo=document.createElement('textarea');memo.className='memoBox';memo.placeholder='ここに自由にメモを書けます';memo.value=d.memo;memo.addEventListener('input',()=>{d.memo=memo.value;localStorage.setItem(KEY,JSON.stringify(state))});root.appendChild(memo);return}
  d.counters.forEach(c=>{const card=document.createElement("section");card.className="card counter";if(rateSettingActive){card.classList.add('settingRates');card.innerHTML=Array.from({length:6},(_,i)=>`<div class="settingRate"><span>設定${i+1}</span><b>1/0.00</b></div>`).join('');}else{card.innerHTML='<div class="name"></div><div class="countLine"></div><div class="rate"></div>';card.querySelector('.name').textContent=c.name;card.querySelector('.countLine').textContent=String(c.count);card.querySelector('.rate').textContent=rate(c.count,d);}let pressTimer=null,longPress=false;
    if(!combined){card.addEventListener('pointerdown',()=>{longPress=false;pressTimer=setTimeout(()=>{longPress=true;const v=prompt(`${c.name} のカウントを入力`,String(c.count));if(v!==null){const n=parseInt(v,10);if(!Number.isNaN(n)&&n>=0){const target=currentData().counters.find(x=>x.name===c.name);if(target){target.count=n;save()}}}},600)});card.addEventListener('pointerup',()=>{clearTimeout(pressTimer);if(!longPress){const target=currentData().counters.find(x=>x.name===c.name);if(target){target.count=Math.max(0,target.count+(minusMode?-1:1));save()}}});card.addEventListener('pointerleave',()=>clearTimeout(pressTimer));}else{card.style.opacity='.92';card.style.cursor='default'}
    root.appendChild(card);
  });
  document.getElementById('gamesInput').disabled=combined;document.getElementById('startGamesInput').disabled=combined;document.getElementById('machineMinus').disabled=combined;document.getElementById('reset').style.display=combined?'none':'block';document.getElementById('machine').disabled=combined;
}
function resetModalSections(){document.getElementById('newMachine').style.display='none';document.querySelector('.sheetRow').style.display='none';document.getElementById('machines').style.display='none';document.getElementById('modeSettings').style.display='none';document.getElementById('historyView').style.display='none'}
function renderMachineList(){
  const e=document.getElementById('machines');resetModalSections();e.style.display='block';e.innerHTML='';
  const n=state.selected,machine=state.machines[n];if(!machine)return;
  const title=document.createElement('div');title.className='label';title.textContent=`「${n}」だけを管理`;e.appendChild(title);
  const r=document.createElement('div');r.className='item';r.style.gridTemplateColumns='1fr auto auto';r.innerHTML=`<span></span><button class="rename">機種名を変更</button><button class="del">削除</button>`;r.querySelector('span').textContent=n;
  r.querySelector('.rename').onclick=()=>renameMachine(n);r.querySelector('.del').onclick=()=>deleteMachine(n);e.appendChild(r);
  const note=document.createElement('div');note.className='small';note.textContent='この機種の設定だけを変更します。';e.appendChild(note);
}
function renameMachine(machineName){const nn=prompt('変更後の機種名を入力してください',machineName);if(nn===null)return;const name=nn.trim();if(!name){alert('機種名を入力してください');return}if(name!==machineName&&state.machines[name]){alert('その機種名はすでに登録されています');return}if(name!==machineName){state.machines[name]=state.machines[machineName];delete state.machines[machineName];state.selected=name;save();openModeSettings(name)}}
function deleteMachine(machineName){if(Object.keys(state.machines).length<=1){alert('機種は1台以上必要です');return}if(confirm(`「${machineName}」を削除しますか？`)){delete state.machines[machineName];state.selected=Object.keys(state.machines)[0];displayMode='通常';save();renderMachineList()}}
function openModeSettings(machineName, editOrder=false){
  if(!state.machines[machineName])return;
  normalizeMachine(state.machines[machineName]);
  const machine=state.machines[machineName];
  resetModalSections();
  const box=document.getElementById('modeSettings');box.style.display='block';box.innerHTML='';
  const title=document.createElement('div');title.className='label';title.textContent=`「${machineName}」の機種・モード管理`;box.appendChild(title);
  const hint=document.createElement('div');hint.className='small';hint.textContent=editOrder?'☰をそのまま上下にスワイプして、この機種のモードだけ並び替えできます。':'ここから、この機種だけのモード名・カウンター・順番・レイアウトを変更できます。';box.appendChild(hint);
  const modeTitle=document.createElement('div');modeTitle.className='label';modeTitle.style.marginTop='14px';modeTitle.textContent='この機種のモード';box.appendChild(modeTitle);
  const list=document.createElement('div');list.style.marginTop='8px';box.appendChild(list);
  let drag=null;
  (machine.modeOrder||Object.keys(machine.modes)).forEach(mode=>{
    if(!machine.modes[mode])return;
    const row=document.createElement('div');row.className='item dragRow';row.dataset.mode=mode;
    row.style.gridTemplateColumns=editOrder?'34px 1fr auto auto':'1fr auto auto';
    if(editOrder){
      const handle=document.createElement('div');handle.className='dragHandle';handle.textContent='☰';handle.setAttribute('aria-label','並べ替え');handle.style.cssText='font-size:22px;line-height:1;text-align:center;cursor:grab;touch-action:none;user-select:none';
      row.appendChild(handle);
      handle.addEventListener('pointerdown',ev=>{ev.preventDefault();handle.setPointerCapture?.(ev.pointerId);drag={row,startY:ev.clientY,moved:false};row.classList.add('dragging');row.style.transition='none'});
      handle.addEventListener('pointermove',ev=>{if(!drag||drag.row!==row)return;ev.preventDefault();const dy=ev.clientY-drag.startY;drag.moved=true;row.style.transform=`translateY(${dy}px)`;const rows=[...list.querySelectorAll('.modeDragRow')],idx=rows.indexOf(row),next=rows[idx+1],prev=rows[idx-1];if(next&&ev.clientY>next.getBoundingClientRect().top+next.offsetHeight/2){list.insertBefore(next,row);drag.startY=ev.clientY;row.style.transform='translateY(0)'}else if(prev&&ev.clientY<prev.getBoundingClientRect().top+prev.offsetHeight/2){list.insertBefore(row,prev);drag.startY=ev.clientY;row.style.transform='translateY(0)'}});
      const end=()=>{if(!drag||drag.row!==row)return;row.classList.remove('dragging');row.style.transition='';row.style.transform='';if(drag.moved){machine.modeOrder=[...list.querySelectorAll('.modeDragRow')].map(r=>r.dataset.mode);save();if(state.selected===machineName)renderModeSwitch()}drag=null};
      handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
    }
    row.classList.add('modeDragRow');
    const span=document.createElement('span');span.textContent=mode;span.style.cssText='font-weight:800;display:flex;align-items:center';
    const counter=document.createElement('button');counter.className='headerBtn';counter.style.cssText='height:38px;border-radius:9px;padding:0 10px;font-size:13px';counter.textContent='⚙ カウンター編集';counter.onclick=()=>openCounterEdit(machineName,mode);
    const edit=document.createElement('button');edit.className='rename';edit.textContent='変更';edit.onclick=()=>openModeRename(machineName,mode);
    row.append(span,counter,edit);list.appendChild(row);
  });
  const add=document.createElement('button');add.className='primary';add.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:10px';add.textContent='＋ モードを追加';add.onclick=()=>{const name=(prompt('追加するモード名を入力してください','')||'').trim();if(!name)return;if(machine.modes[name]){alert('そのモードはすでにあります');return}machine.modes[name]=blankData();machine.modeOrder.push(name);save();openModeSettings(machineName,editOrder)};box.appendChild(add);
  const back=document.createElement('button');back.className='headerBtn';back.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:8px';back.textContent='← 機種管理に戻る';back.onclick=()=>renderMachineList();box.appendChild(back);
}
function openModeRename(machineName,onlyMode){const machine=state.machines[machineName];const mode=onlyMode||displayMode;const nn=prompt('変更後のモード名を入力してください',mode);if(nn===null)return;const name=nn.trim();if(!name){alert('モード名を入力してください');return}if(mode==='通常'){alert('「通常」は基本モードのため名前を変更できません');return}if(name!==mode&&machine.modes[name]){alert('そのモード名はすでにあります');return}if(name!==mode){machine.modes[name]=machine.modes[mode];delete machine.modes[mode];machine.modeOrder=machine.modeOrder.map(x=>x===mode?name:x);if(state.selected===machineName&&displayMode===mode)displayMode=name;save()}openModeSettings(machineName)}
function openCounterEdit(machineName,onlyMode){
  const machine=state.machines[machineName];const editMode=onlyMode||displayMode;if(!machine||!machine.modes[editMode])return;
  resetModalSections();
  const box=document.getElementById('modeSettings');box.style.display='block';box.innerHTML='';
  const title=document.createElement('div');title.className='label';title.textContent=`「${machineName}」のカウンター編集（${editMode}）`;box.appendChild(title);
  const hint=document.createElement('div');hint.className='small';hint.textContent='この画面ではレイアウト編集だけできます。';box.appendChild(hint);
  const layoutBtn=document.createElement('button');layoutBtn.className='primary';layoutBtn.style.cssText='width:100%;height:48px;border-radius:10px;margin-top:12px';layoutBtn.textContent='レイアウト編集';layoutBtn.onclick=()=>openLayoutEdit(machineName,editMode);box.appendChild(layoutBtn);
  const back=document.createElement('button');back.className='headerBtn';back.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:10px';back.textContent='← 機種・モード管理に戻る';back.onclick=()=>openModeSettings(machineName);box.appendChild(back);
}
function openModeOrder(machineName){
  const machine=state.machines[machineName];resetModalSections();const box=document.getElementById('modeSettings');box.style.display='block';box.innerHTML='';
  const title=document.createElement('div');title.className='label';title.textContent=`「${machineName}」のモード順`;box.appendChild(title);
  const hint=document.createElement('div');hint.className='small';hint.textContent='☰をつかんで、そのまま上下にスワイプすると並び替えできます。';box.appendChild(hint);
  const list=document.createElement('div');list.style.marginTop='8px';
  machine.modeOrder.forEach((mode,i)=>{const row=document.createElement('div');row.className='item dragRow';row.style.gridTemplateColumns='34px 1fr';
    const handle=document.createElement('div');handle.className='dragHandle';handle.textContent='☰';handle.setAttribute('aria-label','並べ替え');handle.style.cssText='font-size:22px;line-height:1;text-align:center;cursor:grab;user-select:none';
    const sp=document.createElement('span');sp.textContent=mode;row.append(handle,sp);list.appendChild(row);
  });
  box.appendChild(list);let drag=null;
  list.querySelectorAll('.dragHandle').forEach(handle=>{const row=handle.parentElement;
    handle.addEventListener('pointerdown',e=>{e.preventDefault();handle.setPointerCapture?.(e.pointerId);drag={row,startY:e.clientY,moved:false};row.classList.add('dragging');row.style.transition='none'});
    handle.addEventListener('pointermove',e=>{if(!drag||drag.row!==row)return;e.preventDefault();const dy=e.clientY-drag.startY;drag.moved=true;row.style.transform=`translateY(${dy}px)`;const rows=[...list.querySelectorAll('.dragRow')],idx=rows.indexOf(row),next=rows[idx+1],prev=rows[idx-1];if(next&&e.clientY>next.getBoundingClientRect().top+next.offsetHeight/2){list.insertBefore(next,row);[machine.modeOrder[idx],machine.modeOrder[idx+1]]=[machine.modeOrder[idx+1],machine.modeOrder[idx]];drag.startY=e.clientY;row.style.transform='translateY(0)'}else if(prev&&e.clientY<prev.getBoundingClientRect().top+prev.offsetHeight/2){list.insertBefore(row,prev);[machine.modeOrder[idx],machine.modeOrder[idx-1]]=[machine.modeOrder[idx-1],machine.modeOrder[idx]];drag.startY=e.clientY;row.style.transform='translateY(0)'}});
    const end=()=>{if(!drag||drag.row!==row)return;row.classList.remove('dragging');row.style.transition='';row.style.transform='';if(drag.moved)save();drag=null};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
  });
  const back=document.createElement('button');back.className='headerBtn';back.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:10px';back.textContent='← 管理画面に戻る';back.onclick=()=>openModeSettings(machineName);box.appendChild(back)
}
function openLayoutEdit(machineName,mode){
  const machine=state.machines[machineName];if(!machine||!machine.modes[mode||displayMode])return;
  const editMode=mode||displayMode;const d=normalizeData(machine.modes[editMode]);
  resetModalSections();const box=document.getElementById('modeSettings');box.style.display='block';box.innerHTML='';
  const title=document.createElement('div');title.className='label';title.textContent='レイアウト編集';box.appendChild(title);
  const wrap=document.createElement('div');wrap.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start;margin-top:10px';box.appendChild(wrap);
  const choicesBox=document.createElement('div');wrap.appendChild(choicesBox);
  const previewBox=document.createElement('div');previewBox.style.cssText='position:sticky;top:8px;min-width:0;max-width:100%;overflow:hidden';wrap.appendChild(previewBox);
  const previewTitle=document.createElement('div');previewTitle.className='small';previewTitle.textContent='プレビュー';previewBox.appendChild(previewTitle);
  const preview=document.createElement('div');preview.style.cssText='margin-top:8px;padding:10px;border:1px solid #27303c;border-radius:12px;background:#10151c;display:grid;gap:6px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);box-sizing:border-box;min-width:0;max-width:100%;overflow:hidden';previewBox.appendChild(preview);
  function renderPreview(){
    preview.innerHTML='';
    const cols=d.layout==='1'?'1':'2';preview.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;
    if(d.layout==='memo'){const memoPreview=document.createElement('div');memoPreview.style.cssText='grid-column:1 / -1;min-height:150px;border-radius:10px;background:#10151c;border:1px solid #27303c;box-sizing:border-box;padding:10px;color:#687585;font-size:12px;white-space:normal;overflow:hidden';memoPreview.textContent='自由にメモを書けるメモ帳';preview.appendChild(memoPreview);return}
    const count=d.layout==='1'?4:d.layout==='first1'?7:6;
    for(let i=0;i<count;i++){
      const cell=document.createElement('div');cell.textContent='';cell.style.cssText='height:34px;border-radius:8px;background:#26303b;min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden';
      if(d.layout==='first1'&&i===0)cell.style.gridColumn='1 / -1';
      if(d.layout==='first2'&&i<2)cell.style.gridColumn='1 / -1';
      preview.appendChild(cell);
    }
  }
  const choices=[['2','2列'],['1','1列'],['first1','1行目だけ1列＋2行目以降2列'],['first2','1・2行目だけ1列＋3行目以降2列'],['memo','メモ帳']];
  choices.forEach(([v,label])=>{const b=document.createElement('button');b.className='headerBtn';b.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:8px;text-align:left;font-size:12px;line-height:1.3;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box';b.textContent=(d.layout===v?'✓ ':'')+label;b.onclick=()=>{d.layout=v;machine.modes[editMode]=d;localStorage.setItem(KEY,JSON.stringify(state));render();openLayoutEdit(machineName,editMode)};choicesBox.appendChild(b)});
  renderPreview();
  const done=document.createElement('button');done.className='primary';done.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:12px';done.textContent='完了';done.onclick=()=>openCounterEdit(machineName,editMode);box.appendChild(done)
}

document.getElementById('machine').onchange=e=>{state.selected=e.target.value;displayMode=Object.keys(current().modes)[0]||'通常';combined=false;save()};
document.getElementById('machineMinus').onclick=()=>{minusMode=!minusMode;document.getElementById('machineMinus').textContent=minusMode?'＋':'−';document.getElementById('machineMinus').style.background=minusMode?'#2563eb':'#343d49'};
document.getElementById('judge').onclick=()=>alert('設定判別機能は準備中です。小役データをもとに判別機能を追加できます。');
let rateSettingActive=false;document.getElementById('rateBtn').onclick=()=>{rateSettingActive=!rateSettingActive;const b=document.getElementById('rateBtn');b.textContent='当選率';b.classList.toggle('active',rateSettingActive);render()};
function setDisplayMode(mode){const m=current();if(!m||!m.modes||!m.modes[mode])return;displayMode=mode;combined=false;render()}
function setupGameInput(id,key){const el=document.getElementById(id);el.addEventListener('focus',()=>{if(el.value==='0')el.value=''});el.addEventListener('click',()=>{if(el.value==='0')el.value=''});el.addEventListener('blur',()=>{if(el.value==='')el.value='0'});el.addEventListener('change',()=>{if(combined)return;currentData()[key]=Math.max(0,parseInt(el.value||'0',10)||0);save()})}
setupGameInput('gamesInput','games');setupGameInput('startGamesInput','startGames');
document.getElementById('reset').onclick=()=>{if(confirm(`「${state.selected}」の「${displayMode}」のゲーム数と小役カウントをリセットしますか？`)){const d=currentData();d.games=0;d.startGames=0;d.counters.forEach(c=>c.count=0);save()}};
function historyData(){const m=current();if(!m||!m.modes||!m.modes[displayMode])return [];m.modes[displayMode].history=m.modes[displayMode].history||[];return m.modes[displayMode].history}
function migrateHistory(){if(!state.history)return;Object.keys(state.history).forEach(k=>{const parts=k.split('\u0000');if(parts.length!==2)return;const m=state.machines[parts[0]],mode=parts[1];if(m&&m.modes&&m.modes[mode]){m.modes[mode].history=m.modes[mode].history||[];if(!m.modes[mode].history.length)m.modes[mode].history=state.history[k]||[];}});delete state.history;}
function saveProgress(){const d=currentData();const rows=historyData();rows.push({time:new Date().toLocaleString('ja-JP'),games:d.games,startGames:d.startGames,counters:d.counters.map(c=>({name:c.name,count:c.count,rate:rate(c.count,d)}))});if(rows.length>50)rows.splice(0,rows.length-50);save();alert('途中経過を「小役確率の推移」に保存しました');}
function showTrend(){const box=document.getElementById('historyView');modal.classList.add('show');document.getElementById('modalTitle').textContent='小役確率の推移';document.getElementById('newMachine').style.display='none';document.querySelector('.sheetRow').style.display='none';document.getElementById('machines').style.display='none';document.getElementById('modeSettings').style.display='none';box.style.display='block';box.innerHTML='';const title=document.createElement('div');title.className='label';title.textContent=`「${state.selected}」・「${displayMode}」の小役確率の推移`;box.appendChild(title);const rows=historyData();const tabs=document.createElement('div');tabs.className='historyTabs';const trendTab=document.createElement('button');trendTab.className='historyTab active';trendTab.textContent='推移';const tableTab=document.createElement('button');tableTab.className='historyTab';tableTab.textContent='表';tabs.appendChild(trendTab);tabs.appendChild(tableTab);box.appendChild(tabs);const content=document.createElement('div');box.appendChild(content);function renderTrendList(){content.innerHTML='';if(!rows.length){const e=document.createElement('div');e.style.cssText='padding:14px 0;color:#9da8b7';e.textContent='保存された途中経過はありません。';content.appendChild(e)}else{rows.forEach(h=>{const r=document.createElement('div');r.className='historyRow';const rates=h.counters.map(c=>`${c.name} ${c.rate}`).join('　');r.innerHTML=`<div class="historyTime">${h.time}　${h.games}G</div><div class="historyMain">${rates}</div>`;content.appendChild(r)})}}function renderHistoryTable(){content.innerHTML='';if(!rows.length){const e=document.createElement('div');e.style.cssText='padding:14px 0;color:#9da8b7';e.textContent='保存された途中経過はありません。';content.appendChild(e);return}const wrap=document.createElement('div');wrap.className='historyTableWrap';const table=document.createElement('table');table.className='historyTable';const head=document.createElement('thead');const hr=document.createElement('tr');const thg=document.createElement('th');thg.textContent='ゲーム数';hr.appendChild(thg);const names=[];rows.forEach(h=>h.counters.forEach(c=>{if(!names.includes(c.name))names.push(c.name)}));names.forEach(n=>{const th=document.createElement('th');th.textContent=n;hr.appendChild(th)});head.appendChild(hr);table.appendChild(head);const body=document.createElement('tbody');rows.forEach(h=>{const tr=document.createElement('tr');const tdg=document.createElement('td');tdg.textContent=h.games+'G';tr.appendChild(tdg);names.forEach(n=>{const td=document.createElement('td');const c=h.counters.find(x=>x.name===n);td.textContent=c?c.count:0;tr.appendChild(td)});body.appendChild(tr)});table.appendChild(body);wrap.appendChild(table);content.appendChild(wrap)}trendTab.onclick=()=>{trendTab.classList.add('active');tableTab.classList.remove('active');renderTrendList()};tableTab.onclick=()=>{tableTab.classList.add('active');trendTab.classList.remove('active');renderHistoryTable()};renderTrendList();const back=document.createElement('button');back.className='headerBtn';back.style.cssText='width:100%;height:44px;border-radius:10px;margin-top:10px';back.textContent='← 戻る';back.onclick=()=>{box.style.display='none';modal.classList.remove('show');render()};box.appendChild(back);}document.getElementById('saveProgress').onclick=saveProgress;document.getElementById('showTrend').onclick=showTrend;
const modal=document.getElementById('modal');document.getElementById('manage').onclick=()=>{modal.classList.add('show');document.getElementById('modalTitle').textContent='機種を管理';document.getElementById('newMachine').style.display='none';document.querySelector('.sheetRow').style.display='none';document.getElementById('manageEdit').style.display='inline-flex';openModeSettings(state.selected)};document.getElementById('manageEdit').onclick=()=>{if(state.selected)toggleModeEdit()};document.getElementById('addMachine').onclick=()=>{modal.classList.add('show');document.getElementById('modalTitle').textContent='機種を追加';document.getElementById('newMachine').style.display='block';document.querySelector('.sheetRow').style.display='flex';document.getElementById('newMachine').focus()};document.getElementById('close').onclick=()=>modal.classList.remove('show');document.getElementById('closeTop').onclick=()=>{document.getElementById('manageEdit').style.display='none';modal.classList.remove('show')};modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});document.getElementById('add').onclick=()=>{const i=document.getElementById('newMachine'),n=i.value.trim();if(!n)return;if(state.machines[n]){alert('その機種はすでに登録されています');return}state.machines[n]=blankMachine();state.selected=n;displayMode='通常';combined=false;i.value='';save();modal.classList.remove('show')};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));migrateHistory();save();render();
