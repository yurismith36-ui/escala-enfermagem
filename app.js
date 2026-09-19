const STORAGE_KEY='escala_enfermagem_ps_v2';
const TWO_HOURS=2*60*60*1000;

const initialState={
  date:'2026-09-18',version:0,publishedAt:null,deadline:null,exceptionUnlocked:false,
  coordinator:{name:'Enf. Carlos',role:'Enfermeiro responsável pela escala diária'},
  rows:[
    {id:1,position:'1º',sector:'Leitos 3 a 8 + ISO',professional:'Maria',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Organizar e acolher pacientes no leito; administrar medicação; realizar evolução e procedimentos conforme rotina do setor.',notes:''},
    {id:2,position:'2º',sector:'Leitos 9 a 14 + G.O',professional:'Juliana',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Organizar e acolher pacientes, administrar medicações, cumprir prescrições e rotinas do posto.',notes:''},
    {id:3,position:'3º',sector:'Pediatria',professional:'Lia',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Organizar o setor de pediatria, preparar e administrar medicação e acompanhar evolução dos pacientes.',notes:''},
    {id:5,position:'5º',sector:'SVA',professional:'Raquel',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Organizar setor, receber paciente, manter vigilância e comunicar alterações; preparar materiais e medicações.',notes:''},
    {id:6,position:'6º',sector:'SVP',professional:'Melyssa',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Atendimento dos pacientes do setor e apoio aos procedimentos conforme protocolo.',notes:''},
    {id:7,position:'7º',sector:'Politrauma',professional:'Elisandra / Lavanya / Ivanir',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Organizar setor e medicação de politrauma; acolher pacientes e apoiar procedimentos de urgência.',notes:''},
    {id:8,position:'8º',sector:'Rotina',professional:'Equipe de rotina',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Realizar rotina nos consultórios, clínica médica e ortopedia.',notes:''},
    {id:9,position:'9º',sector:'Curativo + Café + Expurgo',professional:'João',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'Realizar curativos e auxiliar procedimentos; organizar expurgo; encaminhar materiais e realizar check-list.',notes:''},
    {id:10,position:'10º',sector:'Maqueiro',professional:'Israel',role:'Maqueiro',status:'Escalado',start:'07:00',end:'19:00',duties:'Transporte de pacientes intra-hospitalar.',notes:''}
  ],
  nurses:[
    {id:101,area:'OBS Adulto / GO',name:'Nayra',duties:'Gestão clínica e acolhimento dos pacientes; apoio aos técnicos e conferência de rotinas.'},
    {id:102,area:'SVA / SVP / PED',name:'Francineide / Ana Paula',duties:'Organizar rotina dos técnicos, conferir materiais, apoiar medicação e procedimentos.'},
    {id:103,area:'ACR 1',name:'Mateus',duties:'Organizar setor de ACR e preencher formulários e protocolos.'},
    {id:104,area:'ACR 2',name:'Francineide após 16h',duties:'Apoio ao ACR e organização dos fluxos assistenciais.'}
  ],
  meals:[
    {id:201,title:'Café da manhã',lines:['Rodízio conforme organização do plantão']},
    {id:202,title:'Almoço / Janta',lines:['11h — Maria / Raquel / Elisandra','12h — Juliana / Lia / Lavanya','13h — Melyssa / Ivanir']},
    {id:203,title:'Lanche da tarde',lines:['15:00 — Maria / Raquel / Elisandra','15:45 — Juliana / Lia / Lavanya','16:00 — Melyssa / Ivanir']}
  ],
  history:[{time:'—',text:'Modelo inicial criado com base na escala do Pronto Socorro.'}],
  employeeNotices:{}
};

let state=load();
let currentRole='nurse';

const $=s=>document.querySelector(s);
const fmtDate=iso=>new Date(iso+'T12:00:00').toLocaleDateString('pt-BR');
const nowTime=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const pad=n=>String(n).padStart(2,'0');
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(initialState)}catch{return structuredClone(initialState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function log(text){state.history.unshift({time:nowTime(),text});state.history=state.history.slice(0,120)}
function locked(){return state.publishedAt && Date.now()>=state.deadline && !state.exceptionUnlocked}
function editable(){return currentRole==='admin'||currentRole==='nurse'&&!locked()}
function bumpVersion(reason){if(!state.publishedAt)return;state.version=Math.max(1,state.version+1);log(`Versão ${pad(state.version)} criada: ${reason}`)}
function roleLabel(){return currentRole==='admin'?'Administrador':currentRole==='nurse'?'Enf. responsável':'Funcionário'}
function esc(v=''){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function statusClass(status='Escalado'){return `status-${status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}`}

function render(){
  $('#scheduleDateTitle').textContent=fmtDate(state.date);
  $('#versionLabel').textContent=pad(state.version);
  $('#dailyCoordinatorLabel').textContent=state.coordinator.name;
  $('#dailyCoordinatorRoleLabel').textContent=state.coordinator.role;
  renderTimer(); renderRows(); renderNurses(); renderMeals(); renderHistory(); renderEmployeeOptions(); renderEmployee();
  const employee=currentRole==='employee';
  $('#nurseView').classList.toggle('hidden',employee);
  $('#employeeView').classList.toggle('hidden',!employee);
  $('#unlockBtn').classList.toggle('hidden',!(currentRole==='admin'&&locked()));
  $('#addRowBtn').disabled=!editable(); $('#absenceBtn').disabled=!editable(); $('#addNurseBtn').disabled=!editable(); $('#addMealBtn').disabled=!editable(); $('#coordinatorBtn').disabled=!editable();
  $('#publishBtn').disabled=currentRole==='employee'||locked();
  $('#publishBtn').textContent=state.publishedAt?'🟢 Publicar atualização':'🟢 Publicar escala';
  save();
}

function renderTimer(){
  const card=$('#timerCard'),status=$('#timerStatus'),help=$('#timerHelp'),value=$('#timerValue'),info=$('#publishInfo');
  card.className='timer-card';
  if(!state.publishedAt){card.classList.add('draft');status.textContent='Rascunho';help.textContent='Publique a escala para iniciar a janela de 2 horas.';value.textContent='--:--:--';info.textContent=`Rascunho ainda não publicado • Responsável diário: ${state.coordinator.name}`;return}
  const pub=new Date(state.publishedAt),deadline=new Date(state.deadline);
  info.textContent=`Publicada às ${pub.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • limite ${deadline.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • Responsável diário: ${state.coordinator.name}`;
  if(locked()){card.classList.add('locked');status.textContent='🔒 Escala bloqueada';help.textContent='A janela normal de 2 horas terminou.';value.textContent='00:00:00';return}
  if(state.exceptionUnlocked){status.textContent='🔓 Desbloqueio excepcional';help.textContent='Administrador autorizou edição após o prazo.';value.textContent='ADMIN';return}
  const diff=Math.max(0,state.deadline-Date.now()),h=Math.floor(diff/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  status.textContent='Alterações liberadas';help.textContent='Prazo restante para alterações normais.';value.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
}

function renderRows(){
  const root=$('#scheduleCards');root.innerHTML='';
  state.rows.forEach(r=>{const el=document.createElement('article');el.className='schedule-card';el.innerHTML=`<div class="top"><div class="position">${esc(r.position)}</div><div><h4>${esc(r.sector)}</h4><div class="person">${esc(r.professional)}</div><div class="meta"><span class="pill">${esc(r.role)}</span><span class="pill">${esc(r.start)}–${esc(r.end)}</span><span class="pill ${statusClass(r.status)}">${esc(r.status||'Escalado')}</span></div></div></div><div class="duties">${esc(r.duties||'Sem atribuição cadastrada.')}${r.notes?`<br><strong>Obs.:</strong> ${esc(r.notes)}`:''}</div>`;el.onclick=()=>openRow(r.id);root.appendChild(el)});
}
function renderNurses(){const root=$('#nurseCards');root.innerHTML='';state.nurses.forEach(n=>{const el=document.createElement('article');el.className='nurse-card';el.innerHTML=`<h4>${esc(n.area)}</h4><strong>${esc(n.name)}</strong><p>${esc(n.duties||'')}</p>`;el.onclick=()=>openNurse(n.id);root.appendChild(el)})}
function renderMeals(){const root=$('#mealCards');root.innerHTML='';state.meals.forEach(m=>{const el=document.createElement('article');el.className='meal-card';el.innerHTML=`<h4>${esc(m.title)}</h4>${m.lines.map(x=>`<p>${esc(x)}</p>`).join('')}`;el.onclick=()=>openMeal(m.id);root.appendChild(el)})}
function renderHistory(){const root=$('#historyList');root.innerHTML=state.history.length?'':'<div class="empty">Sem alterações.</div>';state.history.forEach(h=>{const el=document.createElement('div');el.className='history-item';el.innerHTML=`<div class="history-time">${esc(h.time)}</div><p>${esc(h.text)}</p>`;root.appendChild(el)})}

function openRow(id){
  if(!editable()){alert('A escala está bloqueada para este perfil.');return}
  const r=state.rows.find(x=>x.id===id)||{id:'',position:'',sector:'',professional:'',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'',notes:''};
  $('#rowDialogTitle').textContent=id?'Editar posto':'Adicionar posto';
  $('#rowId').value=r.id;$('#rowPosition').value=r.position;$('#rowSector').value=r.sector;$('#rowProfessional').value=r.professional;$('#rowRole').value=r.role;$('#rowStatus').value=r.status||'Escalado';$('#rowStart').value=r.start;$('#rowEnd').value=r.end;$('#rowDuties').value=r.duties;$('#rowNotes').value=r.notes;$('#deleteRowBtn').classList.toggle('hidden',!id);$('#rowDialog').showModal();
}
function saveRow(){
  if(!editable())return;const id=Number($('#rowId').value);const data={id:id||Date.now(),position:$('#rowPosition').value.trim(),sector:$('#rowSector').value.trim(),professional:$('#rowProfessional').value.trim(),role:$('#rowRole').value.trim(),status:$('#rowStatus').value,start:$('#rowStart').value,end:$('#rowEnd').value,duties:$('#rowDuties').value.trim(),notes:$('#rowNotes').value.trim()};
  if(!data.position||!data.sector||!data.professional)return alert('Preencha posição, setor e profissional.');
  if(id){const i=state.rows.findIndex(x=>x.id===id);state.rows[i]=data;log(`${roleLabel()} alterou ${data.position} — ${data.sector} (${data.professional}) [${data.status}].`);bumpVersion(`alteração em ${data.sector}`)}else{state.rows.push(data);log(`${roleLabel()} adicionou ${data.position} — ${data.sector} (${data.professional}) [${data.status}].`);bumpVersion(`novo posto ${data.sector}`)}
  $('#rowDialog').close();render();
}
function deleteRow(){const id=Number($('#rowId').value),r=state.rows.find(x=>x.id===id);if(!r||!confirm(`Remover ${r.professional} de ${r.sector}?`))return;state.rows=state.rows.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${r.professional} de ${r.sector}.`);bumpVersion(`remoção em ${r.sector}`);$('#rowDialog').close();render()}

function openNurse(id){if(!editable())return alert('Escala bloqueada.');const n=state.nurses.find(x=>x.id===id)||{id:'',area:'',name:'',duties:''};$('#nurseId').value=n.id;$('#nurseArea').value=n.area;$('#nurseName').value=n.name;$('#nurseDuties').value=n.duties;$('#deleteNurseBtn').classList.toggle('hidden',!id);$('#nurseDialog').showModal()}
function saveNurse(){if(!editable())return;const id=Number($('#nurseId').value),data={id:id||Date.now(),area:$('#nurseArea').value.trim(),name:$('#nurseName').value.trim(),duties:$('#nurseDuties').value.trim()};if(!data.area||!data.name)return alert('Informe área e enfermeiro.');if(id)state.nurses[state.nurses.findIndex(x=>x.id===id)]=data;else state.nurses.push(data);log(`${roleLabel()} atualizou enfermeiro responsável em ${data.area}: ${data.name}.`);bumpVersion(`alteração de enfermeiro em ${data.area}`);$('#nurseDialog').close();render()}
function deleteNurse(){const id=Number($('#nurseId').value),n=state.nurses.find(x=>x.id===id);if(!n||!confirm(`Remover ${n.name}?`))return;state.nurses=state.nurses.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${n.name} de ${n.area}.`);bumpVersion('remoção de enfermeiro');$('#nurseDialog').close();render()}

function openMeal(id){if(!editable())return alert('Escala bloqueada.');const m=state.meals.find(x=>x.id===id)||{id:'',title:'',lines:[]};$('#mealId').value=m.id;$('#mealTitle').value=m.title;$('#mealLines').value=(m.lines||[]).join('\n');$('#deleteMealBtn').classList.toggle('hidden',!id);$('#mealDialog').showModal()}
function saveMeal(){if(!editable())return;const id=Number($('#mealId').value),data={id:id||Date.now(),title:$('#mealTitle').value.trim(),lines:$('#mealLines').value.split('\n').map(x=>x.trim()).filter(Boolean)};if(!data.title)return alert('Informe o título do intervalo.');if(id)state.meals[state.meals.findIndex(x=>x.id===id)]=data;else state.meals.push(data);log(`${roleLabel()} atualizou o intervalo "${data.title}".`);bumpVersion(`atualização de intervalo: ${data.title}`);$('#mealDialog').close();render()}
function deleteMeal(){const id=Number($('#mealId').value),m=state.meals.find(x=>x.id===id);if(!m||!confirm(`Remover ${m.title}?`))return;state.meals=state.meals.filter(x=>x.id!==id);log(`${roleLabel()} removeu o intervalo ${m.title}.`);bumpVersion(`remoção de intervalo ${m.title}`);$('#mealDialog').close();render()}

function openCoordinator(){if(!editable())return alert('Escala bloqueada.');$('#coordinatorName').value=state.coordinator.name;$('#coordinatorRole').value=state.coordinator.role;$('#coordinatorDialog').showModal()}
function saveCoordinator(){if(!editable())return;const name=$('#coordinatorName').value.trim(),role=$('#coordinatorRole').value.trim();if(!name||!role)return alert('Preencha nome e cargo.');state.coordinator={name,role};log(`${roleLabel()} definiu o responsável diário: ${name}.`);bumpVersion('alteração do responsável diário');$('#coordinatorDialog').close();render()}

function openAbsence(){if(!editable())return alert('Escala bloqueada.');const s=$('#absenceProfessional');s.innerHTML=state.rows.map(r=>`<option value="${r.id}">${esc(r.professional)} — ${esc(r.sector)}</option>`).join('');$('#replacementProfessional').value='';$('#absenceReason').value='';$('#absenceDialog').showModal()}
function confirmAbsence(){const id=Number($('#absenceProfessional').value),rep=$('#replacementProfessional').value.trim(),reason=$('#absenceReason').value.trim(),r=state.rows.find(x=>x.id===id);if(!r||!rep||!reason)return alert('Informe substituto e motivo.');const old=r.professional;r.notes=`${rep} substituiu ${old}. Motivo: ${reason}`;r.professional=rep;r.status='Substituto';log(`${old} marcado como falta em ${r.sector}. Motivo: ${reason}`);log(`${rep} substituiu ${old} em ${r.sector} (${r.start}–${r.end}). Alteração por ${roleLabel()}.`);state.employeeNotices[old]=`Você foi retirado(a) da escala de ${r.sector}. Motivo registrado: ${reason}`;state.employeeNotices[rep]=`Você foi incluído(a) como substituto(a) em ${r.sector}, ${r.start}–${r.end}.`;bumpVersion(`substituição de ${old} por ${rep}`);$('#absenceDialog').close();render()}

function publish(){if(locked())return alert('Escala bloqueada.');if(!state.publishedAt){const now=Date.now();state.publishedAt=new Date(now).toISOString();state.deadline=now+TWO_HOURS;state.version=1;log(`Escala publicada por ${roleLabel()}. Janela normal aberta por 2 horas.`)}else{state.version++;log(`Versão ${pad(state.version)} publicada por ${roleLabel()}. O prazo original de 2 horas foi mantido.`)}state.exceptionUnlocked=false;render()}
function unlock(){if(currentRole!=='admin')return;$('#unlockReason').value='';$('#unlockDialog').showModal()}
function confirmUnlock(){const reason=$('#unlockReason').value.trim();if(!reason)return alert('Informe o motivo.');state.exceptionUnlocked=true;log(`Administrador desbloqueou a escala excepcionalmente. Motivo: ${reason}`);$('#unlockDialog').close();render()}

function allPeople(){const names=new Set();state.rows.forEach(r=>r.professional.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>names.add(x)));state.nurses.forEach(n=>n.name.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>names.add(x)));if(state.coordinator?.name)names.add(state.coordinator.name);return [...names].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function renderEmployeeOptions(){const s=$('#employeeSelect'),old=s.value,people=allPeople();s.innerHTML=people.map(n=>`<option>${esc(n)}</option>`).join('');if(people.includes(old))s.value=old;else if(people.includes('Maria'))s.value='Maria';else s.value=people[0]||''}
function renderEmployee(){
  const name=$('#employeeSelect').value||'';$('#employeeHello').textContent=name||'Profissional';
  const match=state.rows.find(r=>r.professional.split('/').map(x=>x.trim()).includes(name));
  const nurse=state.nurses.find(n=>n.name.split('/').map(x=>x.trim()).includes(name));
  const coord=state.coordinator.name===name;
  let html;
  if(match)html=`<div class="eyebrow">SEU PLANTÃO</div><div class="big-sector">${esc(match.sector)}</div><div class="meta"><span class="pill">🏥 ${esc(match.position)}</span><span class="pill">🕐 ${esc(match.start)}–${esc(match.end)}</span><span class="pill">${esc(match.role)}</span><span class="pill ${statusClass(match.status)}">${esc(match.status||'Escalado')}</span></div><p>${esc(match.duties)}</p><strong>Status: ${esc(match.status||'Escalado')}</strong>`;
  else if(nurse)html=`<div class="eyebrow">SUA RESPONSABILIDADE</div><div class="big-sector">${esc(nurse.area)}</div><p>${esc(nurse.duties)}</p><strong>Status: Responsável pela área</strong>`;
  else if(coord)html=`<div class="eyebrow">RESPONSABILIDADE DO DIA</div><div class="big-sector">Escala diária</div><p>${esc(state.coordinator.role)}</p><strong>Status: Responsável diário da escala</strong>`;
  else html='<div class="empty">Nenhum plantão encontrado.</div>';
  $('#employeeShift').innerHTML=html;
  $('#employeeNotice').textContent=state.employeeNotices[name]||'Nenhuma alteração importante para este profissional.';
  $('#employeeFullSchedule').innerHTML=`<h3>Escala completa — ${fmtDate(state.date)}</h3>`+state.rows.map(r=>`<div class="mini-row"><strong>${esc(r.position)} • ${esc(r.sector)}</strong><br>${esc(r.professional)} — ${esc(r.start)}–${esc(r.end)} • ${esc(r.status||'Escalado')}</div>`).join('');
}

function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,color='#334155',font='24px Arial'){
  ctx.font=font;ctx.fillStyle=color;
  const paragraphs=String(text||'').split('\n');
  let curY=y;
  paragraphs.forEach((p,pi)=>{
    const words=p.split(/\s+/); let line='';
    if(p===''){curY+=lineHeight; return}
    words.forEach(word=>{const test=line?line+' '+word:word; if(ctx.measureText(test).width>maxWidth && line){ctx.fillText(line,x,curY); curY+=lineHeight; line=word}else{line=test}});
    if(line){ctx.fillText(line,x,curY); curY+=lineHeight;}
    if(pi<paragraphs.length-1)curY+=4;
  });
  return curY;
}
function measureWrapped(ctx,text,maxWidth,font='24px Arial',lineHeight=30){
  ctx.font=font;
  const paragraphs=String(text||'').split('\n');
  let total=0;
  paragraphs.forEach((p,pi)=>{
    if(p===''){total+=lineHeight; return}
    const words=p.split(/\s+/); let line=''; let lines=0;
    words.forEach(word=>{const test=line?line+' '+word:word; if(ctx.measureText(test).width>maxWidth && line){lines++; line=word;}else line=test});
    if(line)lines++;
    total+=lines*lineHeight + (pi<paragraphs.length-1?4:0);
  });
  return total;
}
function drawSectionCard(ctx,{x,y,w,title,items}){
  const innerX=x+24, contentW=w-48;
  let height=56;
  items.forEach(item=>{
    height+=32;
    if(item.meta) height+=measureWrapped(ctx,item.meta,contentW,'20px Arial',26);
    if(item.body) height+=measureWrapped(ctx,item.body,contentW,'20px Arial',26);
    height+=16;
  });
  ctx.fillStyle='#ffffff'; roundRect(ctx,x,y,w,height,18,true,false);
  ctx.strokeStyle='#dbe3e8'; roundRect(ctx,x,y,w,height,18,false,true);
  ctx.fillStyle='#0f766e'; ctx.font='700 22px Arial'; ctx.fillText(title,innerX,y+34);
  let cy=y+62;
  items.forEach(item=>{
    ctx.fillStyle='#0f172a'; ctx.font='700 21px Arial'; ctx.fillText(item.heading,innerX,cy); cy+=28;
    if(item.meta){cy=drawWrapped(ctx,item.meta,innerX,cy,contentW,24,'#475569','20px Arial')+6}
    if(item.body){cy=drawWrapped(ctx,item.body,innerX,cy,contentW,24,'#334155','20px Arial')+8}
    ctx.strokeStyle='#eef2f6'; ctx.beginPath(); ctx.moveTo(innerX,cy); ctx.lineTo(x+w-24,cy); ctx.stroke(); cy+=16;
  });
  return y+height;
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); if(fill)ctx.fill(); if(stroke)ctx.stroke();}

function generatePng(){
  const c=$('#exportCanvas'),ctx=c.getContext('2d');
  const width=1240,margin=50,cardW=width-(margin*2);
  // estimate total height
  ctx.font='20px Arial';
  let totalH=220;
  const sections=[];
  sections.push({title:'POSTOS E ATRIBUIÇÕES',items:state.rows.map(r=>({heading:`${r.position} • ${r.sector} — ${r.professional}`,meta:`${r.role} • ${r.start}–${r.end} • ${r.status||'Escalado'}`,body:`${r.duties||''}${r.notes?`\nObs.: ${r.notes}`:''}`}))});
  sections.push({title:'ENFERMEIROS RESPONSÁVEIS',items:state.nurses.map(n=>({heading:`${n.area} — ${n.name}`,body:n.duties||''}))});
  sections.push({title:'INTERVALOS',items:state.meals.map(m=>({heading:m.title,body:(m.lines||[]).join('\n')}))});
  sections.push({title:'HISTÓRICO',items:state.history.slice(0,12).map(h=>({heading:`${h.time}`,body:h.text}))});
  sections.forEach(sec=>{
    let h=56; sec.items.forEach(item=>{h+=32; if(item.meta)h+=measureWrapped(ctx,item.meta,cardW-48,'20px Arial',26); if(item.body)h+=measureWrapped(ctx,item.body,cardW-48,'20px Arial',26); h+=16;}); totalH+=h+18;
  });
  totalH+=120;
  c.width=width; c.height=totalH;

  ctx.fillStyle='#f3f6f8'; ctx.fillRect(0,0,width,totalH);
  ctx.fillStyle='#0f766e'; ctx.fillRect(0,0,width,16);
  ctx.fillStyle='#0f172a'; ctx.font='700 48px Arial'; ctx.fillText('ESCALA DE ENFERMAGEM',margin,76);
  ctx.font='700 34px Arial'; ctx.fillText('PRONTO SOCORRO',margin,120);
  ctx.fillStyle='#475569'; ctx.font='26px Arial'; ctx.fillText(fmtDate(state.date),margin,158);
  ctx.fillStyle='#0f766e'; ctx.font='700 24px Arial'; ctx.fillText(`VERSÃO ${pad(state.version)}`,width-260,76);
  const pub=state.publishedAt?new Date(state.publishedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'não publicada';
  ctx.fillStyle='#334155'; ctx.font='22px Arial';
  ctx.fillText(`Responsável diário: ${state.coordinator.name}`,margin,194);
  ctx.fillText(`Categoria: ${state.coordinator.role}`,margin,224);
  ctx.fillText(`Publicação: ${pub}`,width-340,112);
  const updatedTime=state.history[0]?.time && state.history[0].time!=='—' ? state.history[0].time : pub;
  ctx.fillText(`Atualizada às: ${updatedTime}`,width-340,144);

  let y=254;
  sections.forEach(sec=>{y=drawSectionCard(ctx,{x:margin,y,w:cardW,title:sec.title,items:sec.items})+18});
  ctx.fillStyle='#475569'; ctx.font='20px Arial';
  ctx.fillText('Escala gerada para compartilhamento. Conferir sempre a versão mais atual.',margin,totalH-38);

  const a=document.createElement('a');a.download=`escala-${state.date}-v${pad(state.version)}.png`;a.href=c.toDataURL('image/png');a.click();
}

$('#roleSelect').addEventListener('change',e=>{currentRole=e.target.value;render()});
$('#publishBtn').onclick=publish;$('#addRowBtn').onclick=()=>openRow(null);$('#absenceBtn').onclick=openAbsence;$('#pngBtn').onclick=generatePng;$('#pdfBtn').onclick=()=>window.print();$('#unlockBtn').onclick=unlock;$('#addNurseBtn').onclick=()=>openNurse(null);$('#addMealBtn').onclick=()=>openMeal(null);$('#coordinatorBtn').onclick=openCoordinator;
$('#saveRowBtn').onclick=saveRow;$('#deleteRowBtn').onclick=deleteRow;$('#saveNurseBtn').onclick=saveNurse;$('#deleteNurseBtn').onclick=deleteNurse;$('#saveMealBtn').onclick=saveMeal;$('#deleteMealBtn').onclick=deleteMeal;$('#confirmAbsenceBtn').onclick=confirmAbsence;$('#confirmUnlockBtn').onclick=confirmUnlock;$('#saveCoordinatorBtn').onclick=saveCoordinator;
$('#employeeSelect').onchange=renderEmployee;$('#employeeFullScheduleBtn').onclick=()=>$('#employeeFullSchedule').scrollIntoView({behavior:'smooth'});$('#employeePngBtn').onclick=generatePng;$('#employeePdfBtn').onclick=()=>window.print();
$('#resetBtn').onclick=()=>{if(confirm('Restaurar o modelo inicial e apagar alterações deste navegador?')){state=structuredClone(initialState);save();render()}};
setInterval(()=>{renderTimer();if(state.publishedAt&&Date.now()>=state.deadline)render()},1000);
render();
