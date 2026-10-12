const STORAGE_KEY = 'ComoMorar_v1';
const $ = (sel) => document.querySelector(sel);
const app = $('#app');
const toastEl = $('#toast');

// Categorias de Alojamento
const categories = [
  { id: 'Quarto Individual', icon: '<i class="fa-solid fa-bed"></i>' },
  { id: 'Quarto Partilhado', icon: '<i class="fa-solid fa-people-roof"></i>' },
  { id: 'T1 / T2 Completo', icon: '<i class="fa-solid fa-house"></i>' },
  { id: 'Residência / Co-Housing', icon: '<i class="fa-solid fa-building"></i>' }
];

// Estado Inicial da Plataforma ComoMorar (Generalizado)
const demo = {
  users: [
    { id: 'u1', name: 'Matilde Silva', email: 'matilde@universidade.pt', role: 'student', location: 'Zona Universitária' },
    { id: 'u2', name: 'Sr. António Ferreira', email: 'antonio@ComoMorar.pt', role: 'landlord', location: 'Zona Central' }
  ],
  items: [
    {
      id: 'i1',
      ownerId: 'u2',
      ownerName: 'Sr. António Ferreira',
      title: 'Quarto em T3 perto do Campus Universitário',
      category: 'Quarto Individual',
      description: 'Quarto mobilado e com muita luz natural, a 5 minutos a pé da Universidade. Ambiente calmo, ideal para estudantes de 1.º ano.',
      location: 'Zona Universitária',
      distance: 0.4,
      price: 260,
      verified: true,
      certifiedIRS: true,
      hasInsurance: true,
      allowSkillsExchange: true,
      skillsNote: 'Apoio pontual em tarefas digitais ou reparações básicas.',
      status: 'Ativo (Selo ComoMorar)',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'i2',
      ownerId: 'u2',
      ownerName: 'Sr. António Ferreira',
      title: 'Apartamento T1 Aconchegante no Centro',
      category: 'T1 / T2 Completo',
      description: 'Apartamento completo com teto de renda regulado e proteção do imóvel contra estragos, sem isenção fiscal de IRS.',
      location: 'Zona Central',
      distance: 0.9,
      price: 380,
      verified: true,
      certifiedIRS: false,
      hasInsurance: true,
      allowSkillsExchange: false,
      status: 'Ativo (Sem Selo ComoMorar)',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
    }
  ],
  applications: [
    {
      id: 'app1',
      studentName: 'Matilde Silva (Estudante Universitária - Bolseira)',
      propertyTitle: 'Quarto em T3 perto do Campus Universitário',
      rent: '260€/mês',
      status: 'Pendente de Confirmação',
      guarantee: 'Garantia Pública e Seguros Ativos'
    }
  ],
  events: [
    {
      id: 'e1',
      title: 'Speed-Dating de Alojamento Estudantil',
      organizer: 'Associação Académica & Serviços Sociais',
      date: 'Quinta-feira, 17:00',
      location: 'Bloco Pedagógico - Campus Universitário',
      description: 'Encontro presencial descontraído para estudantes e senhorios locais se conhecerem e celebrarem novos contratos protegidos.',
      enrolled: 24
    },
    {
      id: 'e2',
      title: 'Café de Boas-Vindas & Convívio de Vizinhança',
      organizer: 'Associação Académica & Freguesia Local',
      date: 'Sábado, 15:00',
      location: 'Centro Comunitário Local',
      description: 'Lanche comunitário para integrar os novos estudantes residentes e acolher os senhorios da rede ComoMorar.',
      enrolled: 18
    }
  ],
  messages: [
    { id: 'm1', from: 'u1', to: 'u2', text: 'Olá Sr. António! Gostaria de saber se o quarto no Campus Universitário ainda está disponível.', date: 'Hoje 10:12' },
    { id: 'm2', from: 'u2', to: 'u1', text: 'Com certeza, Matilde! Está verificado com o Selo ComoMorar e seguro ativado. Podemos conversar no evento da Associação Académica na quinta-feira?', date: 'Hoje 10:20' }
  ],
  currentUserId: 'u1',
  activeView: 'explore'
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const apartment = saved.items?.find(item => item.id === 'i2');
      if (apartment) {
        apartment.certifiedIRS = false;
        apartment.status = 'Ativo (Sem Selo ComoMorar)';
        if (apartment.description === 'Apartamento completo com teto de renda regulado. Contrato ativado com isenção fiscal e proteção do imóvel contra estragos.') {
          apartment.description = 'Apartamento completo com teto de renda regulado e proteção do imóvel contra estragos, sem isenção fiscal de IRS.';
        }
      }
      return saved;
    }
  } catch (e) { console.warn(e); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return structuredClone(demo);
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function money(v) { return `${Number(v || 0).toFixed(0)}€/mês`; }
function user() { return state.users.find(u => u.id === state.currentUserId) || state.users[0]; }
function toast(text) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function setView(view) {
  state.activeView = view;
  save();
  render();
}

function init() { render(); }

// Menus Adaptativos (Estudante vs Senhorio)
function getNavItems(role) {
  if (role === 'landlord') {
    return [
      { id: 'items', label: 'Os Meus Imóveis', icon: '<i class="fa-solid fa-house-user"></i>' },
      { id: 'add', label: 'Publicar Alojamento', icon: '<i class="fa-solid fa-circle-plus"></i>' },
      { id: 'applications', label: 'Candidaturas Recebidas', icon: '<i class="fa-solid fa-user-check"></i>' },
      { id: 'events', label: 'Eventos Comunitários', icon: '<i class="fa-solid fa-calendar-days"></i>' },
      { id: 'messages', label: 'Mensagens', icon: '<i class="fa-regular fa-comment-dots"></i>' },
      { id: 'profile', label: 'Perfil & Isenção IRS', icon: '<i class="fa-solid fa-shield-halved"></i>' }
    ];
  }
  return [
    { id: 'explore', label: 'Explorar Alojamentos', icon: '<i class="fa-solid fa-magnifying-glass"></i>' },
    { id: 'events', label: 'Eventos Comunitários', icon: '<i class="fa-solid fa-calendar-days"></i>' },
    { id: 'my_rents', label: 'As Minhas Candidaturas', icon: '<i class="fa-solid fa-file-contract"></i>' },
    { id: 'messages', label: 'Mensagens', icon: '<i class="fa-regular fa-comment-dots"></i>' },
    { id: 'profile', label: 'Perfil & Estatuto', icon: '<i class="fa-solid fa-user-shield"></i>' }
  ];
}

function render() {
  const u = user();
  const navList = getNavItems(u.role);
  const navHtml = navList.map(n => `<button class="${state.activeView === n.id ? 'active' : ''}" data-view="${n.id}"><span class="ico">${n.icon}</span><span>${n.label}</span></button>`).join('');

  let body = '';
  if (u.role === 'landlord') {
    if (state.activeView === 'add') body = viewAddItem();
    else if (state.activeView === 'applications') body = viewApplications();
    else if (state.activeView === 'events') body = viewEvents();
    else if (state.activeView === 'messages') body = viewMessages();
    else if (state.activeView === 'profile') body = viewLandlordProfile();
    else body = viewLandlordItems();
  } else {
    if (state.activeView === 'events') body = viewEvents();
    else if (state.activeView === 'my_rents') body = viewStudentRents();
    else if (state.activeView === 'messages') body = viewMessages();
    else if (state.activeView === 'profile') body = viewStudentProfile();
    else if (state.activeView === 'detail') body = viewDetail();
    else body = viewExplore();
  }

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div><strong style="color:var(--primary); font-size:1.6rem;">ComoMorar</strong><div style="font-size:0.75rem; color:var(--muted);">Vem morar com confiança • Universidade</div></div>
        </div>
        <nav class="nav">${navHtml}</nav>
        <div class="sidebar-footer">
          <div class="profile-chip">
            <div class="avatar">${u.name.slice(0, 1).toUpperCase()}</div>
            <div style="min-width:0">
              <strong>${u.name}</strong>
              <div class="tiny">${u.role === 'student' ? 'Estudante Universitário' : 'Senhorio Certificado'}</div>
            </div>
          </div>
          <button class="btn ghost full" id="toggleRoleBtn"><i class="fa-solid fa-repeat"></i> Alternar Perfil</button>
        </div>
      </aside>
      <main class="content">
        <div class="topbar">
          <div class="mobile-brand"><strong>ComoMorar</strong></div>
          <h1>${pageTitle(state.activeView, u.role)}</h1>
        </div>
        <section class="view">${body}</section>
      </main>
      <nav class="mobile-nav"><div class="nav">${navHtml}</div></nav>
    </div>
  `;

  bindShell();
}

function pageTitle(view, role) {
  if (role === 'landlord') {
    const titles = {
      items: 'Gestão de Imóveis & Benefícios Fiscais',
      add: 'Publicar Imóvel com Selo ComoMorar',
      applications: 'Candidaturas de Estudantes Recebidas',
      events: 'Agenda de Convívios com Inquilinos',
      messages: 'Mensagens Diretas',
      profile: 'Estatuto de Senhorio Par e Isenção Fiscal'
    };
    return titles[view] || 'Painel do Senhorio';
  }
  const titles = {
    explore: 'Explorar Alojamento Protegido',
    events: 'Eventos & Convívios Presenciais',
    my_rents: 'As Minhas Candidaturas de Alojamento',
    messages: 'Mensagens Mútuas',
    profile: 'Estatuto de Estudante Verificado',
    detail: 'Detalhe do Alojamento'
  };
  return titles[view] || 'Portal do Estudante';
}

function bindShell() {
  document.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => setView(btn.dataset.view));
  const btn = $('#toggleRoleBtn');
  if (btn) btn.onclick = toggleUserRole;
  bindEvents();
}

function toggleUserRole() {
  const current = user();
  if (current.id === 'u1') {
    state.currentUserId = 'u2'; // Sr. António (Senhorio)
    state.activeView = 'items';
  } else {
    state.currentUserId = 'u1'; // Matilde Silva (Estudante)
    state.activeView = 'explore';
  }
  save();
  toast(`Perfil alterado para: ${user().name}`);
  render();
}

// --- VISTAS DO ESTUDANTE ---
function viewExplore() {
  return `
    <div class="hero">
      <div>
        <h2>Alojamento Estudantil Seguro e Acessível</h2>
        <p>A plataforma universitária que garante rendas com teto regulado, isenção fiscal ao senhorio e seguro público contra estragos.</p>
      </div>
      <div class="hero-panel">
        <strong>${state.items.length}</strong>
        <span>alojamentos publicados</span>
      </div>
    </div>
    <div class="search-panel">
      <div class="search-row">
        <input class="input" id="searchText" placeholder="Pesquisar por zona (ex: Campus, Centro)...">
        <select id="sortFilter">
          <option value="near">Mais perto do Campus</option>
          <option value="price">Renda mais acessível</option>
        </select>
      </div>
      <div class="cat-row">
        <button class="cat-btn active" data-cat=""><span><i class="fa-solid fa-list"></i></span><span>Todas</span></button>
        ${categories.map(c => `<button class="cat-btn" data-cat="${c.id}"><span>${c.icon}</span><span>${c.id}</span></button>`).join('')}
      </div>
    </div>
    <div class="section-title"><h2>Alojamentos disponíveis</h2></div>
    <div class="item-list" id="itemsList"></div>
  `;
}

function renderItemsList() {
  const text = ($('#searchText')?.value || '').trim().toLowerCase();
  const cat = document.querySelector('.cat-btn.active')?.dataset.cat || '';
  let items = [...state.items];

  if (text) items = items.filter(i => `${i.title} ${i.location} ${i.description}`.toLowerCase().includes(text));
  if (cat) items = items.filter(i => i.category === cat);

  $('#itemsList').innerHTML = items.map(i => `
    <article class="item-card">
      <div class="item-img"><img src="${i.image}" alt="Alojamento"></div>
      <div class="item-info">
        <h3>${i.title}</h3>
        <p>📍 ${i.location} · ${i.distance} km do Campus</p>
        <p class="price">${money(i.price)}</p>
        <div class="status-line">
          ${i.certifiedIRS
            ? '<span class="badge success"><i class="fa-solid fa-shield-halved"></i> Selo ComoMorar (IRS 0%)</span>'
            : '<span class="badge danger"><i class="fa-solid fa-circle-xmark"></i> Sem Selo ComoMorar</span>'}
          ${i.allowSkillsExchange ? `<span class="badge warn"><i class="fa-solid fa-handshake"></i> Troca de Competências</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn primary" data-detail="${i.id}">Ver Detalhes e Contrato</button>
      </div>
    </article>
  `).join('') || `<div class="card"><p>Nenhum alojamento encontrado.</p></div>`;

  document.querySelectorAll('[data-detail]').forEach(b => {
    b.onclick = () => {
      state.selectedItemId = b.dataset.detail;
      setView('detail');
    };
  });
}

function viewDetail() {
  const i = state.items.find(x => x.id === state.selectedItemId) || state.items[0];
  return `
    <button class="btn ghost" data-view="explore">← Voltar à pesquisa</button>
    <div class="detail-layout" style="margin-top:1rem;">
      <div class="card">
        <div class="big-visual"><img src="${i.image}" alt="Imóvel"></div>
        <h2>${i.title}</h2>
        <p>${i.description}</p>
        <div class="status-line" style="margin:1rem 0;">
          ${i.certifiedIRS
            ? '<span class="badge success"><i class="fa-solid fa-shield-halved"></i> Contrato Protegido (IRS 0%)</span>'
            : '<span class="badge danger"><i class="fa-solid fa-circle-xmark"></i> Sem Selo ComoMorar</span>'}
          <span class="badge success"><i class="fa-solid fa-lock"></i> Seguro contra Danos Incluído</span>
        </div>
        <div class="summary-box">
          <div class="summary-row"><span>Senhorio Verificado:</span><strong>${i.ownerName}</strong></div>
          <div class="summary-row"><span>Localização:</span><strong>${i.location}</strong></div>
          <div class="summary-row"><span>Módulo Comunitário:</span><strong>${i.allowSkillsExchange ? i.skillsNote : 'Não aplicável'}</strong></div>
        </div>
      </div>
      <aside class="card">
        <h3>Condições do Contrato Protegido</h3>
        <div class="summary-box">
          <div class="summary-row"><span>Renda Mensal Regulada</span><strong>${money(i.price)}</strong></div>
          <div class="summary-row"><span>Garantia de Pagamento</span><strong>Ativa (Dia 1)</strong></div>
          <div class="summary-row"><span>Benefício Fiscal Senhorio</span><strong>${i.certifiedIRS ? '0% IRS / IMI Reduzido' : 'Sem benefício de IRS 0%'}</strong></div>
        </div>
        <button class="btn primary full" style="margin-top:1rem;" id="applyBtn">Candidatar com Perfil Verificado da Universidade</button>
        <button class="btn ghost full" style="margin-top:0.5rem;" id="chatBtn">Enviar Mensagem ao Senhorio</button>
      </aside>
    </div>
  `;
}

function viewStudentRents() {
  return `
    <div class="card">
      <h3>As Minhas Candidaturas</h3>
      <div class="summary-box" style="margin-top:1rem;">
        <div class="summary-row"><span>Imóvel:</span><strong>Quarto em T3 perto do Campus Universitário</strong></div>
        <div class="summary-row"><span>Senhorio:</span><strong>Sr. António Ferreira</strong></div>
        <div class="summary-row"><span>Renda Mensal:</span><strong>260€/mês (Teto Regulado)</strong></div>
        <div class="summary-row"><span>Estado:</span><strong style="color:var(--warning);">Pendente de Confirmação pelo Senhorio</strong></div>
      </div>
    </div>
  `;
}

function viewStudentProfile() {
  return `
    <div class="card">
      <h2>Estatuto de Estudante Verificado</h2>
      <p>Utilizador: <strong>Matilde Silva</strong> (matilde@universidade.pt)</p>
      <div class="summary-box" style="margin-top:1rem;">
        <div class="summary-row"><span>Estatuto Institucional:</span><strong>Estudante Deslocada / Bolseira de Ação Social</strong></div>
        <div class="summary-row"><span>Validação de Perfil:</span><strong>Ativa via Email Institucional (@universidade.pt)</strong></div>
      </div>
    </div>
  `;
}

// --- VISTAS EXCLUSIVAS DO SENHORIO (SR. ANTÓNIO) ---
function viewLandlordItems() {
  const own = state.items;
  return `
    <div class="hero" style="background:linear-gradient(135deg, #1e293b, #334155);">
      <div>
        <h2>Painel do Senhorio Certificado</h2>
        <p>Os seus imóveis beneficiam de Isenção de IRS (0%), redução de IMI e Seguro de Danos garantido em parceria com a Universidade.</p>
      </div>
      <div class="hero-panel">
        <strong>0% IRS</strong>
        <span>Benefício Fiscal Ativo</span>
      </div>
    </div>

    <div class="section-title" style="margin-top:1rem;">
      <h2>Os Meus Imóveis na Rede ComoMorar</h2>
      <button class="btn primary" data-view="add">+ Publicar Novo Imóvel Certificado</button>
    </div>

    <div class="grid two" style="margin-top:1rem;">
      ${own.map(i => `
        <div class="card">
          <div class="item-img" style="height:140px; border-radius:14px; overflow:hidden;"><img src="${i.image}" alt="Imóvel"></div>
          <h3 style="margin-top:0.75rem;">${i.title}</h3>
          <p class="price">${money(i.price)}</p>
          <div class="status-line">
            ${i.certifiedIRS
              ? '<span class="badge success"><i class="fa-solid fa-check"></i> Selo IRS 0% Ativo</span>'
              : '<span class="badge danger"><i class="fa-solid fa-circle-xmark"></i> Sem Selo IRS 0%</span>'}
            <span class="badge success"><i class="fa-solid fa-shield"></i> Seguro Danos Coberto</span>
          </div>
          <button class="btn ghost full" style="margin-top:1rem;" onclick="toast('Garantia Pública de Pagamento Revalidada!')">Consultar Certificado Fiscal</button>
        </div>
      `).join('')}
    </div>
  `;
}

function viewApplications() {
  return `
    <div class="section-title"><h2>Candidaturas de Estudantes Recebidas</h2></div>
    <div class="grid one" style="margin-top:1rem;">
      ${state.applications.map(a => `
        <div class="card">
          <span class="badge warn">${a.status}</span>
          <h3 style="margin-top:0.5rem;">Candidato: ${a.studentName}</h3>
          <p class="tiny">Imóvel Pretendido: <strong>${a.propertyTitle}</strong></p>
          <p class="tiny">Renda Acordada: <strong>${a.rent}</strong></p>
          <p class="tiny">Proteção: <strong>${a.guarantee}</strong></p>
          <div class="status-line" style="margin-top:1rem;">
            <button class="btn success" onclick="toast('Contrato Protegido Aceite com Isenção Fiscal Ativada!')">Aceitar Contrato Protegido</button>
            <button class="btn ghost" onclick="setView('messages')">Conversar com Estudante</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function viewAddItem() {
  return `
    <button class="btn ghost" data-view="items">← Voltar aos Meus Imóveis</button>
    <div class="card" style="margin-top:1rem;">
      <h2>Publicar Imóvel com Selo ComoMorar</h2>
      <form id="itemForm" class="login-form">
        <div><label>Título do Anúncio</label><input class="input" id="itemTitle" placeholder="Ex: Quarto perto do Campus" required></div>
        <div><label>Zona / Localização</label><input class="input" id="itemLoc" placeholder="Ex: Zona Universitária, Centro" required></div>
        <div><label>Renda Mensal Regulada (€)</label><input class="input" type="number" id="itemPrice" placeholder="260" required></div>
        <div class="summary-box">
          <label><input type="checkbox" checked disabled> Ativar Selo ComoMorar (Isenção de IRS/IMI + Seguro contra Danos)</label>
          <label style="margin-top:0.5rem; display:block;"><input type="checkbox" id="itemSkills"> Aceitar Módulo de Apoio Mútuo / Troca de Competências (Desconto voluntário na renda)</label>
        </div>
        <button class="btn primary full" type="submit">Emitir Certificado e Publicar</button>
      </form>
    </div>
  `;
}

function viewLandlordProfile() {
  return `
    <div class="card">
      <h2>Perfil de Senhorio Certificado</h2>
      <p>Titular: <strong>Sr. António Ferreira</strong> (antonio@ComoMorar.pt)</p>
      <div class="summary-box" style="margin-top:1rem;">
        <div class="summary-row"><span>Selo de Senhorio Par:</span><strong>Ativo e Validado</strong></div>
        <div class="summary-row"><span>Isenção Fiscal de IRS:</span><strong>0% Aplicado sobre Rendas Reguladas</strong></div>
        <div class="summary-row"><span>Fundo de Garantia de Renda:</span><strong>Ativo (Pagamento Assegurado no Dia 1)</strong></div>
      </div>
    </div>
  `;
}

// --- VISTAS COMUNS ---
function viewEvents() {
  return `
    <div class="section-title"><h2>Agenda de Convívios e Integração Presencial</h2></div>
    <p class="muted">Eventos organizados em parceria com a Associação Académica e Serviços Sociais para construir confiança mútua entre estudantes e senhorios.</p>
    <div class="grid two" style="margin-top:1rem;">
      ${state.events.map(e => `
        <div class="card">
          <span class="badge warn">${e.date}</span>
          <h3 style="margin-top:0.5rem;">${e.title}</h3>
          <p class="tiny">Organização: <strong>${e.organizer}</strong></p>
          <p class="tiny">📍 ${e.location}</p>
          <p style="margin-top:0.5rem; font-size:0.9rem;">${e.description}</p>
          <div class="status-line" style="margin-top:1rem;">
            <button class="btn primary" onclick="toast('Inscrição confirmada no evento presencial!')">Inscrever-me no Encontro</button>
            <span class="tiny">${e.enrolled} inscritos</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function viewMessages() {
  const u = user();
  return `
    <div class="chat-layout">
      <div class="card">
        <h3>Conversa Direta Mútua</h3>
        <p class="tiny">Contacto entre Matilde Silva (Estudante) e Sr. António Ferreira (Senhorio)</p>
        <div class="messages" style="margin-top:1rem;">
          ${state.messages.map(m => `
            <div class="bubble ${m.from === u.id ? 'me' : ''}">
              ${m.text}
              <div class="tiny">${m.date}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  if ($('#searchText')) {
    renderItemsList();
    $('#searchText').oninput = renderItemsList;
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderItemsList();
      };
    });
  }

  const applyBtn = $('#applyBtn');
  if (applyBtn) applyBtn.onclick = () => toast('Candidatura submetida com perfil verificado pela Universidade!');

  const chatBtn = $('#chatBtn');
  if (chatBtn) chatBtn.onclick = () => setView('messages');

  const itemForm = $('#itemForm');
  if (itemForm) {
    itemForm.onsubmit = (e) => {
      e.preventDefault();
      toast('Novo imóvel registado com Selo ComoMorar e Isenção Fiscal ativada!');
      setView('items');
    };
  }
}

init();
