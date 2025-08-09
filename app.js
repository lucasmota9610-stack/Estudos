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
const $$ = (q) => Array.from(document.querySelectorAll(q));

const hojeISO = () => new Date().toISOString().slice(0,10);
function semanaAtual(dIso) {
  const d = new Date(dIso);
  const start = weekStart(new Date());
  const end = new Date(start); end.setDate(start.getDate()+7);
  return d >= start && d < end;
}
function weekStart(d=new Date()) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = ((day===0? -6:1) - day);
  dt.setDate(dt.getDate()+diff); dt.setHours(0,0,0,0);
  return dt;
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const materias = DEFAULT_MATERIAS.map((nome,i)=>({id:String(i+1),nome, historico:[]}));
    const metaSemanal = 14;
    save({materias, metaSemanal});
    return {materias, metaSemanal};
  }
  try { return JSON.parse(raw); } catch { return {materias:[], metaSemanal:14}; }
}
function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function render() {
  const state = load();
  $('#hoje').textContent = new Date().toLocaleDateString();
  $('#meta').value = state.metaSemanal;
  const totalSemana = state.materias.reduce((a,m)=> a + m.historico.filter(semanaAtual).length, 0);
  $('#semana').textContent = totalSemana;
  const progresso = Math.min(100, Math.round((totalSemana / state.metaSemanal)*100) || 0);
  $('#bar').style.width = progresso + '%';

  const root = $('#lista');
  root.innerHTML = '';
  state.materias.forEach(m => {
    const hojeFeito = m.historico.includes(hojeISO());
    const ultima = m.historico[0];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row">
        <div>
          <h2>${m.nome}</h2>
          <div class="small">Última: ${ultima ? new Date(ultima).toLocaleDateString() : '—'}</div>
        </div>
        <div class="badge ${hojeFeito?'ok':''}">${hojeFeito?'Hoje':'Pendente'}</div>
      </div>
      <div class="row-btns">
        <button class="btn" data-action="${hojeFeito?'desfazer':'marcar'}" data-id="${m.id}">${hojeFeito?'Desfazer hoje':'Marcar hoje'}</button>
        <button class="btn" data-action="remover" data-id="${m.id}">Remover</button>
      </div>
      ${m.historico.length ? `<details><summary>Histórico (${m.historico.length})</summary><ul class="small">${m.historico.map(d=>`<li>${new Date(d).toLocaleDateString()}</li>`).join('')}</ul></details>` : ''}
    `;
    root.appendChild(card);
  });
}
function update(mutator) {
  const s = load();
  mutator(s);
  save(s);
  render();
}

document.addEventListener('click', (e)=> {
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  if (!action) return;
  const id = btn.dataset.id;
  if (action==='marcar') {
    update(s => {
      const m = s.materias.find(x=>x.id===id);
      if (!m.historico.includes(hojeISO())) m.historico.unshift(hojeISO());
    });
  }
  if (action==='desfazer') {
    update(s => {
      const m = s.materias.find(x=>x.id===id);
      m.historico = m.historico.filter(d=> d!==hojeISO());
    });
  }
  if (action==='remover') {
    update(s => { s.materias = s.materias.filter(x=>x.id!==id); });
  }
});

$('#btnAdd').addEventListener('click', ()=> {
  const nome = $('#novaMateria').value.trim();
  if(!nome) return;
  update(s => {
    s.materias.unshift({id:String(Date.now()), nome, historico:[]});
  });
  $('#novaMateria').value='';
});

$('#meta').addEventListener('change', (e)=> {
  const v = Math.max(1, Number(e.target.value||1));
  update(s => { s.metaSemanal = v; });
});

$('#btnBackup').addEventListener('click', ()=> {
  const data = localStorage.getItem(STORAGE_KEY) || '{}';
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'revisoes_backup.json';
  a.click();
  setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
});

$('#fileImport').addEventListener('change', (ev)=> {
  const file = ev.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result||'{}'));
      if (Array.isArray(parsed.materias)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        location.reload();
      }
    } catch {}
  };
  reader.readAsText(file);
});

// init
render();