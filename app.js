const STORAGE_KEY='escala_enfermagem_ps_v1';
const TWO_HOURS=2*60*60*1000;

const initialState={
  date:'2026-09-18',version:0,publishedAt:null,deadline:null,exceptionUnlocked:false,
  rows:[
    {id:1,position:'1º',sector:'Leitos 3 a 8 + ISO',professional:'Maria',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Organizar e acolher pacientes no leito; administrar medicação; realizar evolução e procedimentos conforme rotina do setor.',notes:''},
    {id:2,position:'2º',sector:'Leitos 9 a 14 + G.O',professional:'Juliana',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Organizar e acolher pacientes, administrar medicações, cumprir prescrições e rotinas do posto.',notes:''},
    {id:3,position:'3º',sector:'Pediatria',professional:'Lia',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Organizar o setor de pediatria, preparar e administrar medicação e acompanhar evolução dos pacientes.',notes:''},
    {id:5,position:'5º',sector:'SVA',professional:'Raquel',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Organizar setor, receber paciente, manter vigilância e comunicar alterações; preparar materiais e medicações.',notes:''},
    {id:6,position:'6º',sector:'SVP',professional:'Melyssa',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Atendimento dos pacientes do setor e apoio aos procedimentos conforme protocolo.',notes:''},
    {id:7,position:'7º',sector:'Politrauma',professional:'Elisandra / Lavanya / Ivanir',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Organizar setor e medicação de politrauma; acolher pacientes e apoiar procedimentos de urgência.',notes:''},
    {id:8,position:'8º',sector:'Rotina',professional:'Equipe de rotina',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Realizar rotina nos consultórios, clínica médica e ortopedia.',notes:''},
    {id:9,position:'9º',sector:'Curativo + Café + Expurgo',professional:'João',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'Realizar curativos e auxiliar procedimentos; organizar expurgo; encaminhar materiais e realizar check-list.',notes:''},
    {id:10,position:'10º',sector:'Maqueiro',professional:'Israel',role:'Maqueiro',start:'07:00',end:'19:00',duties:'Transporte de pacientes intra-hospitalar.',notes:''}
  ],
  nurses:[
    {id:101,area:'OBS Adulto / GO',name:'Nayra',duties:'Gestão clínica e acolhimento dos pacientes; apoio aos técnicos e conferência de rotinas.'},
    {id:102,area:'SVA / SVP / PED',name:'Francineide / Ana Paula',duties:'Organizar rotina dos técnicos, conferir materiais, apoiar medicação e procedimentos.'},
    {id:103,area:'ACR 1',name:'Mateus',duties:'Organizar setor de ACR e preencher formulários e protocolos.'},
    {id:104,area:'ACR 2',name:'Francineide após 16h',duties:'Apoio ao ACR e organização dos fluxos assistenciais.'}
  ],
  meals:[
    {title:'Café da manhã',lines:['Rodízio conforme organização do plantão']},
    {title:'Almoço / Janta',lines:['11h — Maria / Raquel / Elisandra','12h — Juliana / Lia / Lavanya','13h — Melyssa / Ivanir']},
    {title:'Lanche da tarde',lines:['15:00 — Maria / Raquel / Elisandra','15:45 — Juliana / Lia / Lavanya','16:00 — Melyssa / Ivanir']}
  ],
  history:[{time:'—',text:'Modelo inicial criado com base na escala do Pronto Socorro.'}],
  employeeNotices:{}
};

let state=load();
let currentRole='nurse';
let lastRole='nurse';

const $=s=>document.querySelector(s);
const fmtDate=iso=>new Date(iso+'T12:00:00').toLocaleDateString('pt-BR');
const nowTime=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const pad=n=>String(n).padStart(2,'0');
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(initialState)}catch{return structuredClone(initialState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function log(text){state.history.unshift({time:nowTime(),text});state.history=state.history.slice(0,80)}
function locked(){return state.publishedAt && Date.now()>=state.deadline && !state.exceptionUnlocked}
function editable(){return currentRole==='admin'||currentRole==='nurse'&&!locked()}
function bumpVersion(reason){if(!state.publishedAt)return;state.version=Math.max(1,state.version+1);log(`Versão ${pad(state.version)} criada: ${reason}`)}
function roleLabel(){return currentRole==='admin'?'Administrador':currentRole==='nurse'?'Enf. responsável':'Funcionário'}

function render(){
  $('#scheduleDateTitle').textContent=fmtDate(state.date);
  $('#versionLabel').textContent=pad(state.version);
  renderTimer(); renderRows(); renderNurses(); renderMeals(); renderHistory(); renderEmployeeOptions(); renderEmployee();
  const employee=currentRole==='employee';
  $('#nurseView').classList.toggle('hidden',employee);
  $('#employeeView').classList.toggle('hidden',!employee);
  $('#unlockBtn').classList.toggle('hidden',!(currentRole==='admin'&&locked()));
  $('#addRowBtn').disabled=!editable(); $('#absenceBtn').disabled=!editable(); $('#addNurseBtn').disabled=!editable();
  $('#publishBtn').disabled=currentRole==='employee'||locked();
  $('#publishBtn').textContent=state.publishedAt?'🟢 Publicar atualização':'🟢 Publicar escala';
  save();
}

function renderTimer(){
  const card=$('#timerCard'),status=$('#timerStatus'),help=$('#timerHelp'),value=$('#timerValue'),info=$('#publishInfo');
  card.className='timer-card';
  if(!state.publishedAt){card.classList.add('draft');status.textContent='Rascunho';help.textContent='Publique a escala para iniciar a janela de 2 horas.';value.textContent='--:--:--';info.textContent='Rascunho ainda não publicado';return}
  const pub=new Date(state.publishedAt),deadline=new Date(state.deadline);
  info.textContent=`Publicada às ${pub.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • limite ${deadline.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
  if(locked()){card.classList.add('locked');status.textContent='🔒 Escala bloqueada';help.textContent='A janela normal de 2 horas terminou.';value.textContent='00:00:00';return}
  if(state.exceptionUnlocked){status.textContent='🔓 Desbloqueio excepcional';help.textContent='Administrador autorizou edição após o prazo.';value.textContent='ADMIN';return}
  const diff=Math.max(0,state.deadline-Date.now()),h=Math.floor(diff/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  status.textContent='Alterações liberadas';help.textContent='Prazo restante para alterações normais.';value.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
}

function renderRows(){
  const root=$('#scheduleCards');root.innerHTML='';
  state.rows.forEach(r=>{const el=document.createElement('article');el.className='schedule-card';el.innerHTML=`<div class="top"><div class="position">${esc(r.position)}</div><div><h4>${esc(r.sector)}</h4><div class="person">${esc(r.professional)}</div><div class="meta"><span class="pill">${esc(r.role)}</span><span class="pill">${esc(r.start)}–${esc(r.end)}</span></div></div></div><div class="duties">${esc(r.duties||'Sem atribuição cadastrada.')}${r.notes?`<br><strong>Obs.:</strong> ${esc(r.notes)}`:''}</div>`;el.onclick=()=>openRow(r.id);root.appendChild(el)});
}
function renderNurses(){const root=$('#nurseCards');root.innerHTML='';state.nurses.forEach(n=>{const el=document.createElement('article');el.className='nurse-card';el.innerHTML=`<h4>${esc(n.area)}</h4><strong>${esc(n.name)}</strong><p>${esc(n.duties||'')}</p>`;el.onclick=()=>openNurse(n.id);root.appendChild(el)})}
function renderMeals(){const root=$('#mealCards');root.innerHTML='';state.meals.forEach(m=>{const el=document.createElement('article');el.className='meal-card';el.innerHTML=`<h4>${esc(m.title)}</h4>${m.lines.map(x=>`<p>${esc(x)}</p>`).join('')}`;root.appendChild(el)})}
function renderHistory(){const root=$('#historyList');root.innerHTML=state.history.length?'':'<div class="empty">Sem alterações.</div>';state.history.forEach(h=>{const el=document.createElement('div');el.className='history-item';el.innerHTML=`<div class="history-time">${esc(h.time)}</div><p>${esc(h.text)}</p>`;root.appendChild(el)})}
function esc(v=''){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function openRow(id){
  if(!editable()){alert('A escala está bloqueada para este perfil.');return}
  const r=state.rows.find(x=>x.id===id)||{id:'',position:'',sector:'',professional:'',role:'Técnico(a) de Enfermagem',start:'07:00',end:'19:00',duties:'',notes:''};
  $('#rowDialogTitle').textContent=id?'Editar posto':'Adicionar posto';
  $('#rowId').value=r.id;$('#rowPosition').value=r.position;$('#rowSector').value=r.sector;$('#rowProfessional').value=r.professional;$('#rowRole').value=r.role;$('#rowStart').value=r.start;$('#rowEnd').value=r.end;$('#rowDuties').value=r.duties;$('#rowNotes').value=r.notes;$('#deleteRowBtn').classList.toggle('hidden',!id);$('#rowDialog').showModal();
}
function saveRow(){
  if(!editable())return;const id=Number($('#rowId').value);const data={id:id||Date.now(),position:$('#rowPosition').value.trim(),sector:$('#rowSector').value.trim(),professional:$('#rowProfessional').value.trim(),role:$('#rowRole').value.trim(),start:$('#rowStart').value,end:$('#rowEnd').value,duties:$('#rowDuties').value.trim(),notes:$('#rowNotes').value.trim()};
  if(!data.position||!data.sector||!data.professional)return alert('Preencha posição, setor e profissional.');
  if(id){const i=state.rows.findIndex(x=>x.id===id);state.rows[i]=data;log(`${roleLabel()} alterou ${data.position} — ${data.sector} (${data.professional}).`);bumpVersion(`alteração em ${data.sector}`)}else{state.rows.push(data);log(`${roleLabel()} adicionou ${data.position} — ${data.sector} (${data.professional}).`);bumpVersion(`novo posto ${data.sector}`)}
  $('#rowDialog').close();render();
}
function deleteRow(){const id=Number($('#rowId').value),r=state.rows.find(x=>x.id===id);if(!r||!confirm(`Remover ${r.professional} de ${r.sector}?`))return;state.rows=state.rows.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${r.professional} de ${r.sector}.`);bumpVersion(`remoção em ${r.sector}`);$('#rowDialog').close();render()}

function openNurse(id){if(!editable())return alert('Escala bloqueada.');const n=state.nurses.find(x=>x.id===id)||{id:'',area:'',name:'',duties:''};$('#nurseId').value=n.id;$('#nurseArea').value=n.area;$('#nurseName').value=n.name;$('#nurseDuties').value=n.duties;$('#deleteNurseBtn').classList.toggle('hidden',!id);$('#nurseDialog').showModal()}
function saveNurse(){if(!editable())return;const id=Number($('#nurseId').value),data={id:id||Date.now(),area:$('#nurseArea').value.trim(),name:$('#nurseName').value.trim(),duties:$('#nurseDuties').value.trim()};if(!data.area||!data.name)return alert('Informe área e enfermeiro.');if(id)state.nurses[state.nurses.findIndex(x=>x.id===id)]=data;else state.nurses.push(data);log(`${roleLabel()} atualizou enfermeiro responsável em ${data.area}: ${data.name}.`);bumpVersion(`alteração de enfermeiro em ${data.area}`);$('#nurseDialog').close();render()}
function deleteNurse(){const id=Number($('#nurseId').value),n=state.nurses.find(x=>x.id===id);if(!n||!confirm(`Remover ${n.name}?`))return;state.nurses=state.nurses.filter(x=>x.id!==id);log(`${roleLabel()} removeu ${n.name} de ${n.area}.`);bumpVersion('remoção de enfermeiro');$('#nurseDialog').close();render()}

function openAbsence(){if(!editable())return alert('Escala bloqueada.');const s=$('#absenceProfessional');s.innerHTML=state.rows.map(r=>`<option value="${r.id}">${esc(r.professional)} — ${esc(r.sector)}</option>`).join('');$('#replacementProfessional').value='';$('#absenceReason').value='';$('#absenceDialog').showModal()}
function confirmAbsence(){const id=Number($('#absenceProfessional').value),rep=$('#replacementProfessional').value.trim(),reason=$('#absenceReason').value.trim(),r=state.rows.find(x=>x.id===id);if(!r||!rep||!reason)return alert('Informe substituto e motivo.');const old=r.professional;r.notes=`Substitui ${old}. Motivo: ${reason}`;r.professional=rep;log(`${old} marcado como ausência em ${r.sector}. Motivo: ${reason}`);log(`${rep} substituiu ${old} em ${r.sector} (${r.start}–${r.end}). Alteração por ${roleLabel()}.`);state.employeeNotices[old]=`Você foi retirado(a) da escala de ${r.sector}. Motivo registrado: ${reason}`;state.employeeNotices[rep]=`Você foi incluído(a) como substituto(a) em ${r.sector}, ${r.start}–${r.end}.`;bumpVersion(`substituição de ${old} por ${rep}`);$('#absenceDialog').close();render()}

function publish(){if(locked())return alert('Escala bloqueada.');if(!state.publishedAt){const now=Date.now();state.publishedAt=new Date(now).toISOString();state.deadline=now+TWO_HOURS;state.version=1;log(`Escala publicada por ${roleLabel()}. Janela normal aberta por 2 horas.`)}else{state.version++;log(`Versão ${pad(state.version)} publicada por ${roleLabel()}. O prazo original de 2 horas foi mantido.`)}state.exceptionUnlocked=false;render()}
function unlock(){if(currentRole!=='admin')return;$('#unlockReason').value='';$('#unlockDialog').showModal()}
function confirmUnlock(){const reason=$('#unlockReason').value.trim();if(!reason)return alert('Informe o motivo.');state.exceptionUnlocked=true;log(`Administrador desbloqueou a escala excepcionalmente. Motivo: ${reason}`);$('#unlockDialog').close();render()}

function allPeople(){const names=new Set();state.rows.forEach(r=>r.professional.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>names.add(x)));state.nurses.forEach(n=>n.name.split('/').map(x=>x.trim()).filter(Boolean).forEach(x=>names.add(x)));return [...names].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function renderEmployeeOptions(){const s=$('#employeeSelect'),old=s.value,people=allPeople();s.innerHTML=people.map(n=>`<option>${esc(n)}</option>`).join('');if(people.includes(old))s.value=old;else if(people.includes('Maria'))s.value='Maria'}
function renderEmployee(){const name=$('#employeeSelect').value||'Maria';$('#employeeHello').textContent=name;const match=state.rows.find(r=>r.professional.split('/').map(x=>x.trim()).includes(name));const nurse=state.nurses.find(n=>n.name.split('/').map(x=>x.trim()).includes(name));let html;if(match)html=`<div class="eyebrow">SEU PLANTÃO</div><div class="big-sector">${esc(match.sector)}</div><div class="meta"><span class="pill">🏥 ${esc(match.position)}</span><span class="pill">🕐 ${esc(match.start)}–${esc(match.end)}</span><span class="pill">${esc(match.role)}</span></div><p>${esc(match.duties)}</p><strong>Status: Escalado</strong>`;else if(nurse)html=`<div class="eyebrow">SUA RESPONSABILIDADE</div><div class="big-sector">${esc(nurse.area)}</div><p>${esc(nurse.duties)}</p><strong>Status: Responsável pela área</strong>`;else html='<div class="empty">Nenhum plantão encontrado.</div>';$('#employeeShift').innerHTML=html;$('#employeeNotice').textContent=state.employeeNotices[name]||'Nenhuma alteração importante para este profissional.';$('#employeeFullSchedule').innerHTML=`<h3>Escala completa — ${fmtDate(state.date)}</h3>`+state.rows.map(r=>`<div class="mini-row"><strong>${esc(r.position)} • ${esc(r.sector)}</strong><br>${esc(r.professional)} — ${esc(r.start)}–${esc(r.end)}</div>`).join('')}

function generatePng(){
  const c=$('#exportCanvas'),ctx=c.getContext('2d'),w=1080,padX=70,rowH=76,header=250,footer=150,h=header+state.rows.length*rowH+footer;c.width=w;c.height=h;
  ctx.fillStyle='#f7fafc';ctx.fillRect(0,0,w,h);ctx.fillStyle='#0f766e';ctx.fillRect(0,0,w,18);ctx.fillStyle='#0f172a';ctx.font='700 50px Arial';ctx.fillText('ESCALA DE ENFERMAGEM',padX,90);ctx.font='700 34px Arial';ctx.fillText('PRONTO SOCORRO',padX,140);ctx.font='28px Arial';ctx.fillStyle='#475569';ctx.fillText(fmtDate(state.date),padX,185);ctx.fillStyle='#0f766e';ctx.font='700 28px Arial';ctx.fillText(`VERSÃO ${pad(state.version)}`,770,90);
  let y=header;state.rows.forEach((r,i)=>{ctx.fillStyle=i%2?'#ffffff':'#eef6f5';ctx.fillRect(50,y-42,980,rowH-4);ctx.fillStyle='#0f172a';ctx.font='700 25px Arial';ctx.fillText(`${r.position}  ${r.sector}`,padX,y);ctx.font='23px Arial';ctx.fillStyle='#334155';ctx.fillText(`${r.professional}  •  ${r.start}–${r.end}`,padX,y+30);y+=rowH});
  ctx.fillStyle='#475569';ctx.font='22px Arial';const pub=state.publishedAt?new Date(state.publishedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'não publicada';ctx.fillText(`Publicação: ${pub} • Versão atual: ${pad(state.version)}`,padX,h-78);ctx.fillText('Escala de uso interno da equipe de enfermagem',padX,h-42);
  const a=document.createElement('a');a.download=`escala-${state.date}-v${pad(state.version)}.png`;a.href=c.toDataURL('image/png');a.click();
}

$('#roleSelect').addEventListener('change',e=>{lastRole=currentRole;currentRole=e.target.value;render()});
$('#publishBtn').onclick=publish;$('#addRowBtn').onclick=()=>openRow(null);$('#absenceBtn').onclick=openAbsence;$('#pngBtn').onclick=generatePng;$('#pdfBtn').onclick=()=>window.print();$('#unlockBtn').onclick=unlock;$('#addNurseBtn').onclick=()=>openNurse(null);$('#saveRowBtn').onclick=saveRow;$('#deleteRowBtn').onclick=deleteRow;$('#saveNurseBtn').onclick=saveNurse;$('#deleteNurseBtn').onclick=deleteNurse;$('#confirmAbsenceBtn').onclick=confirmAbsence;$('#confirmUnlockBtn').onclick=confirmUnlock;$('#employeeSelect').onchange=renderEmployee;$('#employeeFullScheduleBtn').onclick=()=>$('#employeeFullSchedule').scrollIntoView({behavior:'smooth'});$('#employeePngBtn').onclick=generatePng;$('#employeePdfBtn').onclick=()=>window.print();
$('#resetBtn').onclick=()=>{if(confirm('Restaurar o modelo inicial e apagar alterações deste navegador?')){state=structuredClone(initialState);save();render()}};
setInterval(()=>{renderTimer();if(state.publishedAt&&Date.now()>=state.deadline)render()},1000);
render();
