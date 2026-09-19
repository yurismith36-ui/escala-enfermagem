const STORAGE_KEY='escala_enfermagem_ps_v3';
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
    {id:201,title:'Café da manhã',slots:[{id:1,time:'',names:'Rodízio conforme organização do plantão'}]},
    {id:202,title:'Almoço / Janta',slots:[{id:1,time:'11h',names:'Maria / Raquel / Elisandra'},{id:2,time:'12h',names:'Juliana / Lia / Lavanya'},{id:3,time:'13h',names:'Melyssa / Ivanir'}]},
    {id:203,title:'Lanche da tarde',slots:[{id:1,time:'15:00',names:'Maria / Raquel / Elisandra'},{id:2,time:'15:45',names:'Juliana / Lia / Lavanya'},{id:3,time:'16:00',names:'Melyssa / Ivanir'}]}
  ],
  history:[{time:'—',text:'Modelo inicial criado com base na escala do Pronto Socorro.'}],
  employeeNotices:{}
};

let state=load(), currentRole='nurse';
const $=s=>document.querySelector(s);
const fmtDate=iso=>new Date(iso+'T12:00:00').toLocaleDateString('pt-BR');
const nowTime=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const pad=n=>String(n).padStart(2,'0');
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(initialState)}catch{return structuredClone(initialState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function log(text){state.history.unshift({time:nowTime(),text});state.history=state.history.slice(0,120)}
function locked(){return !!(state.publishedAt && Date.now()>=state.deadline && !state.exceptionUnlocked)}
function editable(){return currentRole==='admin'||(currentRole==='nurse'&&!locked())}
function bumpVersion(reason){if(state.publishedAt){state.version=Math.max(1,state.version+1);log(`Versão ${pad(state.version)} criada: ${reason}`)}}
function roleLabel(){return currentRole==='admin'?'Administrador':currentRole==='nurse'?'Enf. responsável':'Funcionário'}
function statusClass(s='Escalado'){return 'status-'+s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}

function render(){
  $('#scheduleDateTitle').textContent=fmtDate(state.date); $('#versionLabel').textContent=pad(state.version);
  $('#dailyCoordinatorLabel').textContent=state.coordinator.name; $('#dailyCoordinatorRoleLabel').textContent=state.coordinator.role;
  renderTimer();renderRows();renderNurses();renderMeals();renderHistory();renderEmployeeOptions();renderEmployee();
  const employee=currentRole==='employee'; $('#nurseView').classList.toggle('hidden',employee); $('#employeeView').classList.toggle('hidden',!employee);
  $('#unlockBtn').classList.toggle('hidden',!(currentRole==='admin'&&locked()));
  ['addRowBtn','absenceBtn','addNurseBtn','editMealsBtn','coordinatorBtn'].forEach(id=>$('#'+id).disabled=!editable());
  $('#publishBtn').disabled=currentRole==='employee'||locked(); $('#publishBtn').textContent=state.publishedAt?'🟢 Publicar atualização':'🟢 Publicar escala';
  save();
}

function renderTimer(){
  const card=$('#timerCard'),status=$('#timerStatus'),help=$('#timerHelp'),value=$('#timerValue'),info=$('#publishInfo'); card.className='timer-card';
  if(!state.publishedAt){card.classList.add('draft');status.textContent='Rascunho';help.textContent='Publique a escala para iniciar a janela de 2 horas.';value.textContent='--:--:--';info.textContent=`Rascunho ainda não publicado • Responsável diário: ${state.coordinator.name}`;return}
  const pub=new Date(state.publishedAt),deadline=new Date(state.deadline);info.textContent=`Publicada às ${pub.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • limite ${deadline.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • Responsável diário: ${state.coordinator.name}`;
  if(locked()){card.classList.add('locked');status.textContent='🔒 Escala bloqueada';help.textContent='A janela normal de 2 horas terminou.';value.textContent='00:00:00';return}
  if(state.exceptionUnlocked){status.textContent='🔓 Desbloqueio excepcional';help.textContent='Administrador autorizou edição após o prazo.';value.textContent='ADMIN';return}
  const d=Math.max(0,state.deadline-Date.now()),h=Math.floor(d/3600000),m=Math.floor(d%3600000/60000),s=Math.floor(d%60000/1000);status.textContent='Alterações liberadas';help.textContent='Prazo restante para alterações normais.';value.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
}

function renderRows(){const root=$('#scheduleCards');root.innerHTML='';state.rows.forEach(r=>{const el=document.createElement('article');el.className='schedule-card';el.innerHTML=`<div class="top"><div class="position">${esc(r.position)}</div><div><h4>${esc(r.sector)}</h4><div class="person">${esc(r.professional)}</div><div class="meta"><span class="pill">${esc(r.role)}</span><span class="pill">${esc(r.start)}–${esc(r.end)}</span><span class="pill ${statusClass(r.status)}">${esc(r.status)}</span></div></div></div><div class="duties">${esc(r.duties||'Sem atribuição cadastrada.')}${r.notes?`<br><strong>Obs.:</strong> ${esc(r.notes)}`:''}</div>`;el.onclick=()=>openRow(r.id);root.appendChild(el)})}
function renderNurses(){const root=$('#nurseCards');root.innerHTML='';state.nurses.forEach(n=>{const el=document.createElement('article');el.className='nurse-card';el.innerHTML=`<h4>${esc(n.area)}</h4><strong>${esc(n.name)}</strong><p>${esc(n.duties)}</p>`;el.onclick=()=>openNurse(n.id);root.appendChild(el)})}
function renderMeals(){const root=$('#mealCards');root.innerHTML='';state.meals.forEach(m=>{const el=document.createElement('article');el.className='meal-card';el.innerHTML=`<h4>${esc(m.title)}</h4>${m.slots.map(s=>`<p>${s.time?`<strong>${esc(s.time)}</strong> — `:''}${esc(s.names)}</p>`).join('')}`;el.onclick=openMealsEditor;root.appendChild(el)})}
function renderHistory(){const root=$('#historyList');root.innerHTML='';state.history.forEach(h=>{const el=document.createElement('div');el.className='history-item';el.innerHTML=`<div class="history-time">${esc(h.time)}</div><p>${esc(h.text)}</p>`;root.appendChild(el)})}

function openRow(id){if(!editable())return alert('Escala bloqueada.');const r=state.rows.find(x=>x.id===id)||{id:'',position:'',sector:'',professional:'',role:'Técnico(a) de Enfermagem',status:'Escalado',start:'07:00',end:'19:00',duties:'',notes:''};$('#rowDialogTitle').textContent=id?'Editar posto':'Adicionar posto';$('#rowId').value=r.id;$('#rowPosition').value=r.position;$('#rowSector').value=r.sector;$('#rowProfessional').value=r.professional;$('#rowRole').value=r.role;$('#rowStatus').value=r.status;$('#rowStart').value=r.start;$('#rowEnd').value=r.end;$('#rowDuties').value=r.duties;$('#rowNotes').value=r.notes;$('#deleteRowBtn').classList.toggle('hidden',!id);$('#rowDialog').showModal()}
function saveRow(){if(!editable())return;const id=Number($('#rowId').value),data={id:id||Date.now(),position:$('#rowPosition').value.trim(),sector:$('#rowSector').value.trim(),professional:$('#rowProfessional').value.trim(),role:$('#rowRole').value.trim(),status:$('#rowStatus').value,start:$('#rowStart').value,end:$('#rowEnd').value,duties:$('#rowDuties').value.trim(),notes:$('#rowNotes').value.trim()};if(!data.position||!data.sector||!data.professional)return alert('Preencha posição, setor e profissional.');if(id)state.rows[state.rows.findIndex(x=>x.id===id)]=data;else state.rows.push(data);log(`${roleLabel()} salvou ${data.position} — ${data.sector} (${data.professional}) [${data.status}].`);bumpVersion(`alteração em ${data.sector}`);$('#rowDialog').close();render()}
function deleteRow(){const id=Number($('#rowId').value),r=state.rows.find(x=>x.id===id);if(!r||!confirm(`Remover ${r.professional} de ${r.sector}?`))return;state.rows=state.rows.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${r.professional} de ${r.sector}.`);bumpVersion(`remoção em ${r.sector}`);$('#rowDialog').close();render()}

function openNurse(id){if(!editable())return alert('Escala bloqueada.');const n=state.nurses.find(x=>x.id===id)||{id:'',area:'',name:'',duties:''};$('#nurseId').value=n.id;$('#nurseArea').value=n.area;$('#nurseName').value=n.name;$('#nurseDuties').value=n.duties;$('#deleteNurseBtn').classList.toggle('hidden',!id);$('#nurseDialog').showModal()}
function saveNurse(){if(!editable())return;const id=Number($('#nurseId').value),data={id:id||Date.now(),area:$('#nurseArea').value.trim(),name:$('#nurseName').value.trim(),duties:$('#nurseDuties').value.trim()};if(!data.area||!data.name)return alert('Informe área e enfermeiro.');if(id)state.nurses[state.nurses.findIndex(x=>x.id===id)]=data;else state.nurses.push(data);log(`${roleLabel()} atualizou enfermeiro responsável em ${data.area}: ${data.name}.`);bumpVersion(`alteração de enfermeiro em ${data.area}`);$('#nurseDialog').close();render()}
function deleteNurse(){const id=Number($('#nurseId').value),n=state.nurses.find(x=>x.id===id);if(!n||!confirm(`Remover ${n.name}?`))return;state.nurses=state.nurses.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${n.name} de ${n.area}.`);bumpVersion('remoção de enfermeiro');$('#nurseDialog').close();render()}

function openMealsEditor(){
  if(!editable())return alert('Escala bloqueada.');
  const root=$('#mealsEditor');root.innerHTML='';
  state.meals.forEach(meal=>{
    const section=document.createElement('section');section.className='meal-editor-section';section.dataset.mealId=meal.id;
    section.innerHTML=`<div class="meal-editor-head"><label>Título<input class="meal-title-input" value="${esc(meal.title)}"></label><button type="button" class="add-slot-btn small">＋ Adicionar horário</button></div><div class="meal-slots"></div>`;
    const slots=section.querySelector('.meal-slots');
    meal.slots.forEach(slot=>slots.appendChild(createSlotRow(slot)));
    section.querySelector('.add-slot-btn').onclick=()=>slots.appendChild(createSlotRow({id:Date.now()+Math.random(),time:'',names:''}));
    root.appendChild(section);
  });
  $('#mealsDialog').showModal();
}
function createSlotRow(slot){
  const row=document.createElement('div');row.className='meal-slot-row';row.dataset.slotId=slot.id;
  row.innerHTML=`<label>Horário<input class="slot-time" value="${esc(slot.time)}" placeholder="Ex.: 11h ou 15:45"></label><label>Nomes / observação<input class="slot-names" value="${esc(slot.names)}" placeholder="Ex.: Maria / Raquel / Elisandra"></label><button type="button" class="remove-slot-btn danger ghost" title="Remover linha">×</button>`;
  row.querySelector('.remove-slot-btn').onclick=()=>row.remove();return row;
}
function saveMeals(){
  if(!editable())return;
  const sections=[...document.querySelectorAll('.meal-editor-section')];
  const updated=[];
  for(const sec of sections){
    const id=Number(sec.dataset.mealId),title=sec.querySelector('.meal-title-input').value.trim();
    if(!title)return alert('Todos os intervalos precisam ter um título.');
    const slots=[...sec.querySelectorAll('.meal-slot-row')].map(row=>({id:Number(row.dataset.slotId)||Date.now()+Math.random(),time:row.querySelector('.slot-time').value.trim(),names:row.querySelector('.slot-names').value.trim()})).filter(s=>s.time||s.names);
    updated.push({id,title,slots});
  }
  state.meals=updated;log(`${roleLabel()} atualizou os horários e nomes dos intervalos.`);bumpVersion('alteração dos intervalos');$('#mealsDialog').close();render();
}

function openCoordinator(){if(!editable())return alert('Escala bloqueada.');$('#coordinatorName').value=state.coordinator.name;$('#coordinatorRole').value=state.coordinator.role;$('#coordinatorDialog').showModal()}
function saveCoordinator(){const name=$('#coordinatorName').value.trim(),role=$('#coordinatorRole').value.trim();if(!name||!role)return alert('Preencha nome e cargo.');state.coordinator={name,role};log(`${roleLabel()} definiu o responsável diário: ${name}.`);bumpVersion('alteração do responsável diário');$('#coordinatorDialog').close();render()}

function openAbsence(){if(!editable())return alert('Escala bloqueada.');$('#absenceProfessional').innerHTML=state.rows.map(r=>`<option value="${r.id}">${esc(r.professional)} — ${esc(r.sector)}</option>`).join('');$('#replacementProfessional').value='';$('#absenceReason').value='';$('#absenceDialog').showModal()}
function confirmAbsence(){const id=Number($('#absenceProfessional').value),rep=$('#replacementProfessional').value.trim(),reason=$('#absenceReason').value.trim(),r=state.rows.find(x=>x.id===id);if(!r||!rep||!reason)return alert('Informe substituto e motivo.');const old=r.professional;r.notes=`${rep} substituiu ${old}. Motivo: ${reason}`;r.professional=rep;r.status='Substituto';log(`${old} marcado como falta em ${r.sector}. Motivo: ${reason}`);log(`${rep} substituiu ${old} em ${r.sector} (${r.start}–${r.end}).`);state.employeeNotices[old]=`Você foi retirado(a) da escala de ${r.sector}. Motivo: ${reason}`;state.employeeNotices[rep]=`Você foi incluído(a) como substituto(a) em ${r.sector}, ${r.start}–${r.end}.`;bumpVersion(`substituição de ${old} por ${rep}`);$('#absenceDialog').close();render()}

function publish(){if(locked())return alert('Escala bloqueada.');if(!state.publishedAt){const now=Date.now();state.publishedAt=new Date(now).toISOString();state.deadline=now+TWO_HOURS;state.version=1;log(`Escala publicada por ${roleLabel()}. Janela normal aberta por 2 horas.`)}else{state.version++;log(`Versão ${pad(state.version)} publicada por ${roleLabel()}. O prazo original foi mantido.`)}state.exceptionUnlocked=false;render()}
function unlock(){if(currentRole!=='admin')return;$('#unlockReason').value='';$('#unlockDialog').showModal()}
function confirmUnlock(){const reason=$('#unlockReason').value.trim();if(!reason)return alert('Informe o motivo.');state.exceptionUnlocked=true;log(`Administrador desbloqueou a escala. Motivo: ${reason}`);$('#unlockDialog').close();render()}

function allPeople(){const s=new Set();state.rows.forEach(r=>r.professional.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>s.add(x)));state.nurses.forEach(n=>n.name.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>s.add(x)));if(state.coordinator.name)s.add(state.coordinator.name);return [...s].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function renderEmployeeOptions(){const sel=$('#employeeSelect'),old=sel.value,people=allPeople();sel.innerHTML=people.map(n=>`<option>${esc(n)}</option>`).join('');sel.value=people.includes(old)?old:(people.includes('Maria')?'Maria':(people[0]||''))}
function renderEmployee(){const name=$('#employeeSelect').value||'';$('#employeeHello').textContent=name||'Profissional';const r=state.rows.find(x=>x.professional.split('/').map(v=>v.trim()).includes(name)),n=state.nurses.find(x=>x.name.split('/').map(v=>v.trim()).includes(name)),coord=state.coordinator.name===name;let html;if(r)html=`<div class="eyebrow">SEU PLANTÃO</div><div class="big-sector">${esc(r.sector)}</div><div class="meta"><span class="pill">${esc(r.position)}</span><span class="pill">${esc(r.start)}–${esc(r.end)}</span><span class="pill ${statusClass(r.status)}">${esc(r.status)}</span></div><p>${esc(r.duties)}</p>`;else if(n)html=`<div class="eyebrow">SUA RESPONSABILIDADE</div><div class="big-sector">${esc(n.area)}</div><p>${esc(n.duties)}</p>`;else if(coord)html=`<div class="eyebrow">RESPONSÁVEL DIÁRIO</div><div class="big-sector">Escala diária</div><p>${esc(state.coordinator.role)}</p>`;else html='<div class="empty">Nenhum plantão encontrado.</div>';$('#employeeShift').innerHTML=html;$('#employeeNotice').textContent=state.employeeNotices[name]||'Nenhuma alteração importante para este profissional.';$('#employeeFullSchedule').innerHTML=`<h3>Escala completa — ${fmtDate(state.date)}</h3>`+state.rows.map(r=>`<div class="mini-row"><strong>${esc(r.position)} • ${esc(r.sector)}</strong><br>${esc(r.professional)} — ${esc(r.start)}–${esc(r.end)} • ${esc(r.status)}</div>`).join('')}

function wrap(ctx,text,x,y,maxWidth,lineHeight){const words=String(text||'').split(/\s+/);let line='';for(const word of words){const t=line?line+' '+word:word;if(ctx.measureText(t).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word}else line=t}if(line){ctx.fillText(line,x,y);y+=lineHeight}return y}
function generatePng(){
  const c=$('#exportCanvas'),ctx=c.getContext('2d'),w=1240,margin=55,content=w-margin*2;
  c.width=w;c.height=3000;ctx.fillStyle='#f3f6f8';ctx.fillRect(0,0,w,c.height);ctx.fillStyle='#0f766e';ctx.fillRect(0,0,w,16);
  ctx.fillStyle='#0f172a';ctx.font='700 48px Arial';ctx.fillText('ESCALA DE ENFERMAGEM',margin,76);ctx.font='700 34px Arial';ctx.fillText('PRONTO SOCORRO',margin,120);ctx.fillStyle='#475569';ctx.font='26px Arial';ctx.fillText(fmtDate(state.date),margin,160);ctx.fillStyle='#0f766e';ctx.font='700 24px Arial';ctx.fillText(`VERSÃO ${pad(state.version)}`,950,76);
  ctx.fillStyle='#334155';ctx.font='22px Arial';ctx.fillText(`Responsável diário: ${state.coordinator.name}`,margin,202);ctx.fillText(state.coordinator.role,margin,232);
  let y=280;
  const title=t=>{ctx.fillStyle='#0f766e';ctx.font='700 26px Arial';ctx.fillText(t,margin,y);y+=34;ctx.strokeStyle='#cbd5df';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();y+=24};
  title('POSTOS E ATRIBUIÇÕES');
  state.rows.forEach(r=>{ctx.fillStyle='#0f172a';ctx.font='700 22px Arial';ctx.fillText(`${r.position} • ${r.sector} — ${r.professional}`,margin,y);y+=28;ctx.fillStyle='#475569';ctx.font='20px Arial';ctx.fillText(`${r.role} • ${r.start}–${r.end} • ${r.status}`,margin,y);y+=28;ctx.fillStyle='#334155';ctx.font='20px Arial';y=wrap(ctx,r.duties,margin,y,content,25);if(r.notes){ctx.font='italic 19px Arial';y=wrap(ctx,`Obs.: ${r.notes}`,margin,y,content,24)}y+=20});
  title('ENFERMEIROS RESPONSÁVEIS');state.nurses.forEach(n=>{ctx.fillStyle='#0f172a';ctx.font='700 22px Arial';ctx.fillText(`${n.area} — ${n.name}`,margin,y);y+=27;ctx.fillStyle='#334155';ctx.font='20px Arial';y=wrap(ctx,n.duties,margin,y,content,25);y+=16});
  title('INTERVALOS');state.meals.forEach(m=>{ctx.fillStyle='#0f172a';ctx.font='700 22px Arial';ctx.fillText(m.title,margin,y);y+=28;ctx.fillStyle='#334155';ctx.font='20px Arial';m.slots.forEach(s=>{const line=`${s.time?`${s.time} — `:''}${s.names}`;y=wrap(ctx,line,margin+18,y,content-18,25)});y+=16});
  title('HISTÓRICO');state.history.slice(0,12).forEach(h=>{ctx.fillStyle='#334155';ctx.font='19px Arial';y=wrap(ctx,`${h.time} — ${h.text}`,margin,y,content,24);y+=8});
  const finalH=y+90;const img=ctx.getImageData(0,0,w,Math.min(finalH,c.height));c.height=Math.min(finalH,3000);ctx.putImageData(img,0,0);const a=document.createElement('a');a.download=`escala-${state.date}-v${pad(state.version)}.png`;a.href=c.toDataURL('image/png');a.click();
}

$('#roleSelect').onchange=e=>{currentRole=e.target.value;render()};$('#publishBtn').onclick=publish;$('#addRowBtn').onclick=()=>openRow(null);$('#absenceBtn').onclick=openAbsence;$('#pngBtn').onclick=generatePng;$('#pdfBtn').onclick=()=>window.print();$('#unlockBtn').onclick=unlock;$('#addNurseBtn').onclick=()=>openNurse(null);$('#editMealsBtn').onclick=openMealsEditor;$('#coordinatorBtn').onclick=openCoordinator;$('#saveRowBtn').onclick=saveRow;$('#deleteRowBtn').onclick=deleteRow;$('#saveNurseBtn').onclick=saveNurse;$('#deleteNurseBtn').onclick=deleteNurse;$('#saveMealsBtn').onclick=saveMeals;$('#confirmAbsenceBtn').onclick=confirmAbsence;$('#confirmUnlockBtn').onclick=confirmUnlock;$('#saveCoordinatorBtn').onclick=saveCoordinator;$('#employeeSelect').onchange=renderEmployee;$('#employeeFullScheduleBtn').onclick=()=>$('#employeeFullSchedule').scrollIntoView({behavior:'smooth'});$('#employeePngBtn').onclick=generatePng;$('#employeePdfBtn').onclick=()=>window.print();$('#resetBtn').onclick=()=>{if(confirm('Restaurar o modelo inicial?')){state=structuredClone(initialState);save();render()}};setInterval(()=>{renderTimer();if(state.publishedAt&&Date.now()>=state.deadline)render()},1000);render();
