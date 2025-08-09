const STORAGE_KEY = 'rev_app_v1';

const DEFAULT_MATERIAS = [
  'Ouvidoria Pública (conceitos e funções)',
  'Código de Ética da ABO',
  'Lei de Acesso à Informação (LAI)',
  'LGPD aplicada à Administração Pública',
  'Administração Pública (princípios e organização)',
  'Legislação Municipal (Tapurah/MT)',
  'Atendimento e comunicação pública',
  'Direito Administrativo',
  'Direito Constitucional',
  'Língua Portuguesa',
  'Raciocínio Lógico/Matemática',
  'Informática Básica',
  'Redação oficial e protocolos',
  'Transparência e controle social',
  'Atualidades'
];

const $ = (q) => document.querySelector(q);
const hojeISO = () => new Date().toISOString().slice(0,10);
function weekStart(d=new Date()){const dt=new Date(d);const day=dt.getDay();const diff=((day===0?-6:1)-day);dt.setDate(dt.getDate()+diff);dt.setHours(0,0,0,0);return dt;}
function inThisWeek(iso){const d=new Date(iso);const s=weekStart();const e=new Date(s);e.setDate(s.getDate()+7);return d>=s && d<e;}

function load(){
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const materias=DEFAULT_MATERIAS.map((nome,i)=>({id:String(i+1),nome,historico:[]}));
    const metaSemanal=14;
    save({materias, metaSemanal});
    return {materias, metaSemanal};
  }
  try{return JSON.parse(raw);}catch{return {materias:[], metaSemanal:14};}
}
function save(s){localStorage.setItem(STORAGE_KEY, JSON.stringify(s));}

function render(){
  const s=load();
  $('#hoje').textContent=new Date().toLocaleDateString();
  $('#meta').value=s.metaSemanal;
  const totalSemana=s.materias.reduce((a,m)=>a+m.historico.filter(inThisWeek).length,0);
  $('#semana').textContent=totalSemana;
  $('#bar').style.width=Math.min(100, Math.round((totalSemana/s.metaSemanal)*100)||0)+'%';

  const root=$('#lista'); root.innerHTML='';
  s.materias.forEach(m=>{
    const hojeFeito=m.historico.includes(hojeISO());
    const ultima=m.historico[0];
    const el=document.createElement('div'); el.className='card';
    el.innerHTML=`
      <div class="row">
        <div>
          <h2>${m.nome}</h2>
          <div class="small">Última: ${ultima?new Date(ultima).toLocaleDateString():'—'}</div>
        </div>
        <div class="badge ${hojeFeito?'ok':''}">${hojeFeito?'Hoje':'Pendente'}</div>
      </div>
      <div class="row-btns">
        <button class="btn" data-a="${hojeFeito?'desfazer':'marcar'}" data-id="${m.id}">${hojeFeito?'Desfazer hoje':'Marcar hoje'}</button>
        <button class="btn" data-a="remover" data-id="${m.id}">Remover</button>
      </div>
      ${m.historico.length?`<details><summary>Histórico (${m.historico.length})</summary><ul class="small">${m.historico.map(d=>`<li>${new Date(d).toLocaleDateString()}</li>`).join('')}</ul></details>`:''}
    `;
    root.appendChild(el);
  });

  // Preenche o select do módulo de questões
  const sel = document.getElementById('qMateria');
  if (sel) {
    const opts = ['Geral', ...s.materias.map(m=>m.nome)];
    sel.innerHTML = opts.map(n=>`<option>${n}</option>`).join('');
  }
}
function update(fn){const s=load(); fn(s); save(s); render();}

document.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  const a=b.dataset.a; const id=b.dataset.id;
  if(a==='marcar'){update(s=>{const m=s.materias.find(x=>x.id===id); if(!m.historico.includes(hojeISO())) m.historico.unshift(hojeISO());});}
  if(a==='desfazer'){update(s=>{const m=s.materias.find(x=>x.id===id); m.historico=m.historico.filter(d=>d!==hojeISO());});}
  if(a==='remover'){update(s=>{s.materias=s.materias.filter(x=>x.id!==id);});}
});

$('#btnAdd').addEventListener('click',()=>{
  const inp=$('#novaMateria'); const nome=inp.value.trim(); if(!nome) return;
  update(s=>{s.materias.unshift({id:String(Date.now()),nome,historico:[]});}); inp.value='';
});
$('#meta').addEventListener('change',e=>{
  const v=Math.max(1, Number(e.target.value||1)); update(s=>{s.metaSemanal=v;});
});
$('#btnBackup').addEventListener('click',()=>{
  const data=localStorage.getItem(STORAGE_KEY)||'{}'; const blob=new Blob([data],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='revisoes_backup.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
$('#fileImport').addEventListener('change',ev=>{
  const file=ev.target.files?.[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{try{const p=JSON.parse(String(reader.result||'{}')); if(Array.isArray(p.materias)){localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); location.reload();}}catch{}};
  reader.readAsText(file);
});

render();
