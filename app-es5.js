
// ES5 runtime (no arrow, no template, no destructuring)
function rnd(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function fmt(n){return Number(n).toLocaleString('en-US');}
function nowISO(){return new Date().toISOString();}

var KEYWORDS = ["ransom","zero-day","supply-chain","C2","phishing","APT","onion","darkmarket","drop site","broker","wallet","exploit","persistence","beacon","stealer","loader","initial access","MFA bypass","proxy","leak"];
var POSTS = [
  "Rumors of a new zero-day spreading in unmanaged edge routers.",
  "Broker seeks access to midsize EU logistics firm, DM with onion.",
  "Phishing kit update adds MFA bypass techniques.",
  "Wallet tumbling service now supports faster mixing.",
  "Ransom group recruiting affiliates. Payouts weekly.",
  "Darkmarket vendor claims fresh DB dump of 2M emails.",
  "Forum mod warns about fake C2 frameworks loaded with stealers.",
  "Looking for loader devs. Need stable persistence on Win + AD.",
  "New beacon signature evades common EDR, ask for sample.",
  "Supply-chain hit discussed in private channel."
];
var CONTRACT_TEMPLATES=[
  {title:"Corporate Breach Intel",brief:"Find indicators of a planned breach against a manufacturing client. Identify keyword, source, and confidence.",reward:[800,1400],heat:[6,12],type:"OSINT"},
  {title:"Silent Backdoor Hunt",brief:"Trace a C2 route (graph puzzle) and keep noise under threshold. Optimize path cost.",reward:[1200,2000],heat:[8,16],type:"ROUTING"},
  {title:"Password Vault Crack",brief:"Solve the cipher pattern (mini-CRACK) to unlock a protected archive.",reward:[600,1200],heat:[5,10],type:"CRACK"}
];

function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

var state={
  day: load('cy_day',1),
  funds: load('cy_funds',2500),
  heat: load('cy_heat',5),
  rep: load('cy_rep',{corp:5,state:5,shadow:5}),
  contracts: load('cy_contracts',[]),
  active: null,
  log: load('cy_log',[])
};

if(!state.contracts || state.contracts.length===0){
  state.contracts=[newContract(1),newContract(1),newContract(1)];
}

function newContract(day){
  var t=CONTRACT_TEMPLATES[rnd(0,CONTRACT_TEMPLATES.length-1)];
  return { id: day+'-'+Math.random().toString(36).slice(2,8),
    title:t.title, brief:t.brief, type:t.type,
    reward:rnd(t.reward[0],t.reward[1]), heat:rnd(t.heat[0],t.heat[1]),
    createdAt:nowISO(), expiresIn:rnd(2,4) };
}

function $(sel){return document.querySelector(sel);}
function setText(id,val){var el=typeof id==='string'?document.getElementById(id):id; if(el)el.innerText=val;}
function addLog(msg){state.log.unshift({t:nowISO(),text:msg}); state.log=state.log.slice(0,100); save('cy_log',state.log); renderLog();}
function toast(kind,msg){var t=$('#toast'); if(!t)return; if(kind==='bad'){t.classList.add('bad');}else{t.classList.remove('bad');} t.style.display='block'; t.textContent=msg; setTimeout(function(){t.style.display='none';},2500);}
function persist(){save('cy_day',state.day); save('cy_funds',state.funds); save('cy_heat',state.heat); save('cy_rep',state.rep); save('cy_contracts',state.contracts);}

function renderTop(){setText('day',state.day); setText('funds',fmt(state.funds)); setText('heat',state.heat);}
function renderContracts(){
  var root=document.getElementById('contracts'); root.innerHTML='';
  if(state.contracts.length===0){root.innerHTML='<div class="pad mut">Нет доступных контрактов. Используй <span class="mono">next</span> в терминале.</div>'; return;}
  for(var i=0;i<state.contracts.length;i++){
    var c=state.contracts[i];
    var div=document.createElement('div'); div.className='item';
    var html='';
    html+='<div style="flex:1">';
    html+='<div style="font-weight:600">'+c.title+'</div>';
    html+='<div class="mut" style="font-size:14px">'+c.brief+'</div>';
    html+='<div class="mut" style="margin-top:6px;font-size:12px">Type: '+c.type+' • Reward $'+fmt(c.reward)+' • Heat '+c.heat+' • Expires in '+c.expiresIn+'d • ID: <span class="mono">'+c.id+'</span></div>';
    html+='</div>';
    html+='<div class="grid" style="grid-auto-flow:row">';
    html+='<button class="btn pr" data-act="accept" data-id="'+c.id+'">Принять</button>';
    html+='<button class="btn" data-act="decline" data-id="'+c.id+'">Отклонить</button>';
    html+='</div>';
    div.innerHTML=html;
    root.appendChild(div);
  }
}
function renderRep(){
  var r=state.rep;
  var html='';
  var keys=['corp','state','shadow'];
  for(var i=0;i<keys.length;i++){
    var k=keys[i];
    html+='<div class="cell"><div class="mut" style="text-transform:uppercase;font-size:12px">'+k+'</div><div style="font-size:18px;font-weight:700">'+r[k]+'</div></div>';
  }
  document.getElementById('rep').innerHTML=html;
}
function renderLog(){
  var root=document.getElementById('log'); root.innerHTML='';
  for(var i=0;i<state.log.length;i++){
    var e=state.log[i]; var d=new Date(e.t);
    var it=document.createElement('div'); it.className='it';
    it.innerHTML='<div class="mut">'+d.toLocaleString()+'</div><div>'+e.text+'</div>';
    root.appendChild(it);
  }
}
function renderActiveTag(){
  var tag=document.getElementById('activeTag');
  if(state.active){tag.style.display='inline-block'; tag.textContent='Active: '+state.active.type;}
  else{tag.style.display='none';}
}
function renderMiniHost(){
  var host=document.getElementById('miniHost');
  if(!state.active){host.textContent='Прими контракт, чтобы начать мини-игру.'; return;}
  var type=state.active.type;
  if(type==='OSINT'){ mountOsint(host); return; }
  if(type==='ROUTING'){ mountRouting(host); return; }
  if(type==='CRACK'){ mountCrack(host); return; }
  host.textContent='Unknown contract type.';
}

// Minis
function mountOsint(host){
  var targetKw=KEYWORDS[rnd(0,KEYWORDS.length-1)];
  var rows=[]; for(var i=0;i<POSTS.length;i++){rows.push({text:POSTS[i],kw:false});}
  var injectCount=rnd(2,3);
  for(var j=0;j<injectCount;j++){
    var idx=rnd(0,rows.length-1);
    if(rows[idx].text.indexOf(targetKw)===-1){
      var words=rows[idx].text.split(' ');
      var pos=rnd(1,words.length);
      words.splice(pos,0,targetKw);
      rows[idx]={text:words.join(' '),kw:true};
    } else { rows[idx].kw=true; }
  }
  host.innerHTML=''
    +'<div class="mut" style="font-size:14px">Target intel keyword is hidden in the noise. Hint: it exists <b>'
    +rows.filter(function(r){return r.text.indexOf(targetKw)!==-1;}).length
    +'</b>×.</div>'
    +'<div class="flex mt12"><input type="text" id="osintQ" placeholder="Search posts (try keywords)…"><button id="osintConfirm" class="btn pr">Confirm</button></div>'
    +'<div class="mut" style="font-size:12px;margin-top:4px">Tip: попробуй слова из мира угроз (APT, C2, zero-day, stealer…).</div>'
    +'<div id="osintList" class="list mt12"></div>'
    +'<div class="mut" style="font-size:12px;margin-top:6px">Your guess must equal the hidden intel keyword exactly.</div>'
    +'<div class="flex mt12"><button class="btn" id="giveup">Сдаться</button><button class="btn" id="pause">Пауза</button></div>';

  var list=document.getElementById('osintList');
  function draw(q){
    if(q===undefined) q='';
    list.innerHTML='';
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      if(r.text.toLowerCase().indexOf(q)>-1){
        var d=document.createElement('div'); d.className='it'; d.style.padding='10px 12px'; d.textContent=r.text; list.appendChild(d);
      }
    }
  }
  draw('');
  document.getElementById('osintQ').addEventListener('input',function(e){
    draw(e.target.value.toLowerCase());
  });
  document.getElementById('osintConfirm').onclick=function(){
    var q=document.getElementById('osintQ').value.trim().toLowerCase();
    if(q===targetKw.toLowerCase()) completeMission(true,{keyword:targetKw}); else toast('bad','Неверный ключ. Подумай о терминах на уровне SOC/Threat Intel.');
  };
  document.getElementById('giveup').onclick=function(){ completeMission(false); };
  document.getElementById('pause').onclick=function(){ state.active=null; renderActiveTag(); renderMiniHost(); persist(); };
}

function mountRouting(host){
  var graph={nodes:['SRC','A','B','C','DST'], edges:[]};
  var ed=[['SRC','A'],['SRC','B'],['A','C'],['B','C'],['C','DST']];
  for(var i=0;i<ed.length;i++){ graph.edges.push({u:ed[i][0],v:ed[i][1],w:rnd(2,9),noise:rnd(1,5)}); }
  var budget=rnd(10,16), noiseCap=rnd(6,10);
  var path=['SRC'];
  function canExtend(to){
    var last=path[path.length-1];
    for(var i=0;i<graph.edges.length;i++){
      var e=graph.edges[i];
      if((e.u===last&&e.v===to)||(e.v===last&&e.u===to)) return true;
    }
    return false;
  }
  function measure(){
    var total=0, noise=0;
    for(var i=0;i<path.length-1;i++){
      var u=path[i], v=path[i+1];
      for(var j=0;j<graph.edges.length;j++){
        var e=graph.edges[j];
        if((e.u===u&&e.v===v)||(e.v===u&&e.u===v)){ total+=e.w; noise+=e.noise; break; }
      }
    }
    return {total:total,noise:noise};
  }
  function draw(){
    var html='';
    html+='<div class="mut" style="font-size:14px">Проложи маршрут от <b>SRC</b> к <b>DST</b> под бюджетом <b>'+budget+'</b> и шумом ≤ <b>'+noiseCap+'</b>.</div>';
    html+='<div class="grid mt12" style="grid-template-columns:repeat(5,1fr)">';
    for(var i=0;i<graph.nodes.length;i++){
      var n=graph.nodes[i];
      var allowed=canExtend(n)||(n==='SRC'&&path.length===1);
      var chosen=path.indexOf(n)>-1;
      var cls=chosen?'btn ring':'btn'+(allowed?'':' mut');
      html+='<button class="'+cls+'" data-n="'+n+'" '+(allowed||chosen?'':'disabled')+'>'+n+'</button>';
    }
    html+='</div>';
    var m=measure();
    html+='<div class="mut mt12" style="font-size:12px">Path: '+path.join(' → ')+' | Cost: '+m.total+' | Noise: '+m.noise+'</div>';
    html+='<div class="flex mt12"><button id="valid" class="btn pr">Validate</button><button id="reset" class="btn">Reset</button><button id="giveup" class="btn">Сдаться</button><button id="pause" class="btn">Пауза</button></div>';
    html+='<div class="mut" style="font-size:12px;margin-top:8px;border:1px solid var(--line);padding:10px;border-radius:12px">Подсказка: обычно SRC→A→C→DST или SRC→B→C→DST; сравни веса (cost) и шум (noise).</div>';
    host.innerHTML=html;
    var btns=host.querySelectorAll('button[data-n]');
    for(var i=0;i<btns.length;i++){
      btns[i].onclick=(function(b){
        return function(){
          var n=b.getAttribute('data-n');
          if(n===path[path.length-1]) return;
          if(canExtend(n)||(n==='SRC'&&path.length===1)){ path.push(n); draw(); }
        };
      })(btns[i]);
    }
    document.getElementById('valid').onclick=function(){
      var m=measure(); var ok=(path[path.length-1]==='DST'&&m.total<=budget&&m.noise<=noiseCap);
      if(ok) completeMission(true,{path:path.slice(0),cost:m}); else toast('bad','Маршрут превышает лимиты по бюджету/шуму.');
    };
    document.getElementById('reset').onclick=function(){ path=['SRC']; draw(); };
    document.getElementById('giveup').onclick=function(){ completeMission(false); };
    document.getElementById('pause').onclick=function(){ state.active=null; renderActiveTag(); renderMiniHost(); persist(); };
  }
  draw();
}

function mountCrack(host){
  var seq=[]; for(var i=0;i<rnd(4,6);i++){ seq.push(rnd(1,4)); }
  var input=[]; var showing=false;
  host.innerHTML=''
    +'<div class="mut" style="font-size:14px">Повтори мигающую последовательность. Нажми «Play sequence» для подсказки.</div>'
    +'<div id="pads" class="grid minipads mt12" style="grid-template-columns:repeat(2,1fr); gap:10px">'
    +'<button data-id="1">1</button><button data-id="2">2</button><button data-id="3">3</button><button data-id="4">4</button></div>'
    +'<div class="flex mt12"><button id="play" class="btn pr">Play sequence</button><button id="giveup" class="btn">Сдаться</button><button id="pause" class="btn">Пауза</button></div>';
  function playback(){
    if(showing) return; showing=true;
    var i=0;
    function step(){
      if(i>=seq.length){ showing=false; return; }
      var id=seq[i++];
      var el=host.querySelector('button[data-id="'+id+'"]');
      if(el){ el.classList.add('ring'); setTimeout(function(){el.classList.remove('ring'); setTimeout(step,120);},350); }
      else { setTimeout(step,120); }
    }
    step();
  }
  playback();
  var pads=host.querySelectorAll('#pads button');
  for(var i=0;i<pads.length;i++){
    pads[i].onclick=function(){ if(showing) return; input.push(Number(this.getAttribute('data-id')));
      if(input.length===seq.length){ var ok=true; for(var j=0;j<seq.length;j++){ if(input[j]!==seq[j]){ok=false;break;} }
        if(ok) completeMission(true,{length:seq.length}); else { toast('bad','Неверная последовательность. Попробуй снова.'); input=[]; } }
    };
  }
  document.getElementById('play').onclick=playback;
  document.getElementById('giveup').onclick=function(){ completeMission(false); };
  document.getElementById('pause').onclick=function(){ state.active=null; renderActiveTag(); renderMiniHost(); persist(); };
}

// flow
function accept(id){
  var c=null; for(var i=0;i<state.contracts.length;i++){ if(state.contracts[i].id===id){ c=state.contracts[i]; break; } }
  if(!c) return false;
  state.active=c;
  var next=[]; for(var i=0;i<state.contracts.length;i++){ if(state.contracts[i]!==c) next.push(state.contracts[i]); } state.contracts=next;
  addLog('Контракт принят: '+c.title);
  persist(); renderContracts(); renderActiveTag(); renderMiniHost();
  return true;
}
function decline(id){
  var idx=-1; for(var i=0;i<state.contracts.length;i++){ if(state.contracts[i].id===id){ idx=i; break; } }
  if(idx===-1) return false;
  state.contracts.splice(idx,1);
  addLog('Контракт отклонён: '+id);
  persist(); renderContracts();
  return true;
}
function nextDay(){
  state.day+=1;
  state.heat=clamp(state.heat-1,0,100);
  for(var i=0;i<state.contracts.length;i++){ state.contracts[i].expiresIn-=1; }
  var left=[]; for(var i=0;i<state.contracts.length;i++){ if(state.contracts[i].expiresIn>0) left.push(state.contracts[i]); }
  state.contracts=left;
  while(state.contracts.length<3) state.contracts.push(newContract(state.day));
  addLog('День завершён. Поступили новые контракты и снизился шум.');
  persist(); renderTop(); renderContracts();
}
function completeMission(success,details){
  var c=state.active; if(!c) return;
  if(success){
    state.funds+=c.reward;
    state.heat=clamp(state.heat+rnd(0,Math.max(1,c.heat-3)),0,100);
    var d=(c.type==='OSINT')?{corp:1,state:1,shadow:0}:(c.type==='ROUTING')?{corp:0,state:1,shadow:1}:{corp:1,state:0,shadow:1};
    state.rep.corp=clamp(state.rep.corp+d.corp,0,100);
    state.rep.state=clamp(state.rep.state+d.state,0,100);
    state.rep.shadow=clamp(state.rep.shadow+d.shadow,0,100);
    addLog('Успех: '+c.title+' (+$'+fmt(c.reward)+').');
    toast('ok','Контракт выполнен: +$'+fmt(c.reward));
  } else {
    state.heat=clamp(state.heat+c.heat,0,100);
    state.funds=Math.max(0,state.funds-rnd(200,400));
    addLog('Провал: '+c.title+'. Клиент недоволен.');
    toast('bad','Контракт провален. Рост шума и штраф.');
  }
  state.active=null; persist(); renderTop(); renderRep(); renderActiveTag(); renderMiniHost();
}

// terminal
var term={lines:["AGM> help for commands."],
  cmd:function(c){
    var parts=c.trim().split(/\s+/); var cmd=parts[0]; var args=parts.slice(1);
    if(cmd==='help'){return ["Commands:","help — подсказка","status — показатели","scan — сгенерировать разведданные (безопасно)","probe — рискованная разведка (меньше бюджета на миссию, но шум)","accept <id> — принять контракт","decline <id> — отклонить контракт","next — перейти к следующему дню"];}
    if(cmd==='status'){return ["Day "+state.day+" | Funds $"+fmt(state.funds)+" | Heat "+state.heat+"/100","Reputation — Corp "+state.rep.corp+", State "+state.rep.state+", Shadow "+state.rep.shadow,(state.active?("Active: "+state.active.title):"Active: none"),"Contracts: "+state.contracts.map(function(c){return c.id;}).join(", ")];}
    if(cmd==='scan'){state.funds+=50; persist(); renderTop(); return ["Сканирование открытых источников… +$50 консультативного дохода."];}
    if(cmd==='probe'){state.funds+=120; state.heat=clamp(state.heat+2,0,100); persist(); renderTop(); return ["Активная разведка… +$120, +2 heat (следы в логах)."];}
    if(cmd==='accept'){return [accept(args[0])?"Принято.":"Не найдено либо уже принято."];}
    if(cmd==='decline'){return [decline(args[0])?"Отклонено.":"Не найдено.","Совет: держи три слота для лучших предложений."];}
    if(cmd==='next'){nextDay(); return ["Переход к следующему дню…"];}
    return ["Unknown command. type: help"];
  }
};
function drawTerm(){var scr=document.getElementById('term'); var html=''; for(var i=0;i<term.lines.length;i++){ var l=term.lines[i]; html+='<div>'+l.replace(/</g,'&lt;')+'</div>'; } scr.innerHTML=html; scr.scrollTop=scr.scrollHeight;}
function runCmd(){var inp=document.getElementById('termInput'); var c=inp.value.trim(); if(!c)return; var out=term.cmd(c); term.lines.push('AGM> '+c); for(var i=0;i<out.length;i++){term.lines.push(out[i]);} inp.value=''; drawTerm();}

// Wire
document.addEventListener('click', function(e){
  var el=e.target; while(el && el!==document.body && !(el.getAttribute && el.getAttribute('data-act'))){ el=el.parentNode; }
  if(!el||!el.getAttribute) return;
  var act=el.getAttribute('data-act'); var id=el.getAttribute('data-id');
  if(act==='accept') accept(id);
  if(act==='decline') decline(id);
});

document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('newReq').onclick=function(){ state.contracts.push(newContract(state.day)); persist(); renderContracts(); };
  document.getElementById('reset').onclick=function(){ if(confirm('Сбросить прогресс?')){ localStorage.clear(); location.reload(); } };
  document.getElementById('termRun').onclick=runCmd;
  document.getElementById('termInput').addEventListener('keydown', function(e){ if(e.key==='Enter'){ runCmd(); } });
  renderTop(); renderContracts(); renderRep(); renderLog(); renderActiveTag(); renderMiniHost(); drawTerm();
});
