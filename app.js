/* =========================================================
   iGotUp Growth Platform — super-app unificado
   Login SSO + shell + navegação entre 3 módulos (via proxy)
   ========================================================= */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const $id = s => document.getElementById(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const LAYERS = {
    matriz_admin: { nome:'Administrador Matriz', cam:'C1', cor:'accent' },
    equipe_matriz: { nome:'Equipe Matriz', cam:'C2', cor:'blue' },
    gestor_parceiro: { nome:'Gestor Parceiro', cam:'C3', cor:'gold' },
    equipe_parceiro: { nome:'Equipe Parceiro', cam:'C4', cor:'violet' },
    cliente: { nome:'Cliente Indicador', cam:'C5', cor:'blue' },
  };

  const MODULES = [
    { id:'referral', ic:'🛒', nome:'Referral Engine', sub:'Crescimento', desc:'Central de indicação, carteira digital, gamificação, níveis e multi-tenant.', rota:'/referral/', tags:['Indicação','Wallet','Gamificação','Multi-tenant'] },
    { id:'dic', ic:'🏛️', nome:'Decision Intelligence Center', sub:'Dados & IA', desc:'Command Center com 20 dashboards, mapa do Brasil, IA executiva e drill-downs.', rota:'/dic/', tags:['20 dashboards','IA','Mapa','Analytics'] },
    { id:'mgh', ic:'🎨', nome:'Marketing Growth Hub', sub:'Conteúdo', desc:'Biblioteca de conteúdo, campanhas, IA de criação, MPS e embaixadores.', rota:'/mgh/', tags:['Conteúdo','IA','MPS','Embaixadores'] },
  ];

  let session = null;
  const ADM_EMAIL = 'jhonercp@gmail.com';

  function toast(m){ const t=$id('toast'); t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,3000); }

  // ---------- Inicialização do Supabase / modo de dados ----------
  let dataMode = 'demo';
  function initData() {
    try {
      dataMode = window.iGotUpData.init(window.SUPABASE_CONFIG);
    } catch(e) { dataMode = 'demo'; }
    const sso = $id('ssoStatus');
    if (sso) {
      if (dataMode === 'supabase') sso.textContent = 'Conectado ao Supabase (dados reais)';
      else sso.textContent = 'Modo demonstração (dados demo)';
      sso.parentElement.style.color = dataMode === 'supabase' ? 'var(--accent)' : 'var(--gold)';
    }
    return dataMode;
  }
  function showMode() {
    const mp = $id('modePill');
    mp.hidden = false;
    mp.textContent = dataMode === 'supabase' ? '⚡ Supabase' : '🧪 Demo';
    mp.style.background = dataMode === 'supabase' ? 'var(--accent-glow)' : 'var(--gold-soft)';
    mp.style.color = dataMode === 'supabase' ? 'var(--accent)' : 'var(--gold)';
    mp.style.padding = '4px 11px'; mp.style.borderRadius = '20px'; mp.style.fontSize = '11px'; mp.style.fontWeight = '700';
  }

  function show(view){ $id('view-login').hidden = view!=='login'; $id('view-app').hidden = view!=='app'; }

  // Carrega as lojas reais do Supabase no campo "Loja que fez a compra"
  async function carregarLojas(){
    try {
      const data = window.iGotUpData;
      const lojas = await data.getLojas();
      const sel = $id('ssoLoja');
      if (lojas && lojas.length) {
        sel.innerHTML = '<option value="">Selecione a loja</option>';
        lojas.forEach(l => sel.insertAdjacentHTML('beforeend', `<option value="${l.id}">${l.nome}</option>`));
      }
    } catch(e) { console.warn('sem lojas', e); }
  }

  // Regra ADM: mostra a categoria SOMENTE se o email for o ADM Master
  function verificarAdm(){
    const email = $id('ssoEmail').value.trim().toLowerCase();
    const isAdm = email === ADM_EMAIL;
    $id('admBadge').hidden = !isAdm;
    $id('ssoCategoriaWrap').hidden = !isAdm;
  }

  // Cadastro completo com validação dos campos obrigatórios
  // Cadastro + login integrados ao Supabase (cria usuário e indicador)
  async function login(){
    const lojaId = $id('ssoLoja').value;
    const name = $id('ssoName').value.trim();
    const email = $id('ssoEmail').value.trim();
    const whats = $id('ssoWhats').value.trim();
    const cpf = $id('ssoCpf').value.trim();
    const senha = $id('ssoSenha').value;

    // ---- validação de obrigatórios ----
    if(!lojaId){ toast('Selecione a loja que fez a compra'); return; }
    if(!name){ toast('Informe o nome completo (sem abreviação)'); return; }
    if(name.split(' ').length < 2){ toast('Informe o nome completo (nome e sobrenome)'); return; }
    if(!email){ toast('Informe o email'); return; }
    if(!whats){ toast('Informe o WhatsApp'); return; }
    if(!cpf){ toast('Informe o CPF'); return; }
    if(!senha){ toast('Crie uma senha'); return; }
    if(!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) && !/^\d{11}$/.test(cpf)){ toast('CPF inválido'); return; }
    const tel = whats.replace(/\D/g,'');
    if(tel.length < 10 || tel.length > 11){ toast('WhatsApp inválido'); return; }

    // ---- camada: só ADM pode definir; senão, sempre cliente ----
    const isAdm = email.toLowerCase() === ADM_EMAIL;
    const layer = isAdm ? ($id('ssoCategoria').value || 'cliente') : 'cliente';

    const S = window.iGotUpSupabase;
    const data = window.iGotUpData;
    const modo = dataMode; // 'supabase' ou 'demo'

    if (modo === 'supabase' && S && S.client) {
      toast('Criando conta…');
      try {
        // 1) tenta criar usuário no auth; se já existe, faz login
        const { data: su, error } = await S.signUp(email, senha, {
          full_name: name, loja: lojaId, whats, cpf, layer,
        });
        if (error) {
          // se o usuário já existe, tenta login
          if (/already|existente|registered|usuario/i.test(error.message || '')) {
            const { error: le } = await S.signIn(email, senha);
            if (le) { toast('Não foi possível entrar. Verifique email/senha.'); return; }
          } else {
            toast('Erro ao criar conta: ' + error.message); return;
          }
        }
        // 2) obtém o usuário da sessão
        const sess = await S.getSession();
        const userId = sess ? sess.user.id : (su && su.user ? su.user.id : null);
        if (userId) {
          // verifica se já tem indicador; se não, cria
          const codigo = 'IG' + Math.random().toString(36).slice(2,8).toUpperCase();
          const whatsNorm = whats.replace(/\D/g,'');
          const existente = await data.getIndicador(userId);
          if (!existente) {
            await data.criarIndicador({
              user_id: userId, nome: name, whatsapp_norm: whatsNorm,
              loja_id: lojaId, cpf, codigo, aceite_lgpd_em: new Date().toISOString(),
            });
          }
        }
      } catch(e) { console.error(e); toast('Erro ao salvar: ' + e.message); return; }
    }

    // ---- cria sessão e navega ----
    session = { name, email, layer, lojaId, whats, cpf };
    const L = LAYERS[layer];
    $id('ahName').textContent = name;
    $id('ahRole').textContent = L.nome;
    $id('ahLayer').textContent = L.cam + ' · ' + L.nome;
    $id('ahAvatar').textContent = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    renderNav();
    show('app');
    showMode();
    loadHub();
    toast(isAdm ? 'Bem-vindo, Administrador! 👑' : 'Conta criada como Cliente. Bem-vindo!');
  }
  function logout(){ session=null; show('login'); $id('moduleFrame').hidden=true; }

  function renderNav(){
    $id('appNav').innerHTML = MODULES.map(m => `
      <div class="app-nav-item" data-mod="${m.id}"><span class="ic">${m.ic}</span> ${m.nome}<span class="sub">${m.sub}</span></div>
    `).join('');
    $$('.app-nav-item').forEach(it => it.addEventListener('click', ()=>loadModule(it.dataset.mod)));
  }

  // carrega o módulo no iframe via proxy
  function loadModule(id){
    const m = MODULES.find(x=>x.id===id); if(!m) return;
    $id('hubDash').hidden = true;
    const frame = $id('moduleFrame');
    frame.hidden = false;
    frame.src = m.rota;
    $id('ahCrumb').textContent = m.nome;
    $$('.app-nav-item').forEach(i=>i.classList.toggle('active', i.dataset.mod===id));
    toast('Abrindo ' + m.nome + '…');
  }

  // dashboard inicial do hub
  function loadHub(){
    $id('moduleFrame').hidden = true;
    $id('hubDash').hidden = false;
    $id('ahCrumb').textContent = 'Visão Geral';
    $$('.app-nav-item').forEach(i=>i.classList.remove('active'));
    const L = LAYERS[session.layer];
    $id('hubDash').innerHTML = `
      <div class="hub-hero">
        <div><h2>Olá, ${esc(session.name.split(' ')[0])} 👋</h2>
        <p>Acesso <b style="color:var(--accent)">${L.cam}</b> · ${L.nome} — você pode operar todos os módulos da plataforma com esta sessão única.</p></div>
      </div>
      <div class="hub-status">
        <div class="hs"><span class="dot ok"></span> Referral Engine</div>
        <div class="hs"><span class="dot ok"></span> Decision Intelligence Center</div>
        <div class="hs"><span class="dot ok"></span> Marketing Growth Hub</div>
      </div>
      <div class="hub-cards">
        ${MODULES.map(m=>`
          <div class="hub-card" data-open="${m.id}">
            <div class="hc-ic">${m.ic}</div>
            <h3>${m.nome}</h3>
            <p>${m.desc}</p>
            <span class="hc-btn">Abrir ${m.nome}</span>
            <div class="hc-tags">${m.tags.map(t=>`<span class="hub-tag">${t}</span>`).join('')}</div>
          </div>`).join('')}
      </div>`;
    $$('.hub-card').forEach(c=>c.addEventListener('click', ()=>loadModule(c.dataset.open)));
  }

  // eventos
  $id('ssoBtn').addEventListener('click', login);
  $id('btnLogout').addEventListener('click', logout);
  $id('btnMenu').addEventListener('click', ()=>{ $id('appSide').classList.toggle('collapsed'); $id('appSide').classList.toggle('open'); });
  $id('ssoEmail').addEventListener('input', verificarAdm);
  ['ssoName','ssoEmail','ssoWhats','ssoCpf','ssoSenha','ssoLoja'].forEach(id=>$id(id).addEventListener('keydown',e=>{ if(e.key==='Enter') login(); }));
  initData();
  carregarLojas();
  show('login');
})();
