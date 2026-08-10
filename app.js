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
    { id:'referral', ic:'🛒', nome:'Referral Engine', sub:'Crescimento', desc:'Central de indicação, carteira digital, gamificação, níveis e multi-tenant.', rota:'referral/', tags:['Indicação','Wallet','Gamificação','Multi-tenant'] },
    { id:'dic', ic:'🏛️', nome:'Decision Intelligence Center', sub:'Dados & IA', desc:'Command Center com 20 dashboards, mapa do Brasil, IA executiva e drill-downs.', rota:'dic/', tags:['20 dashboards','IA','Mapa','Analytics'] },
    { id:'mgh', ic:'🎨', nome:'Marketing Growth Hub', sub:'Conteúdo', desc:'Biblioteca de conteúdo, campanhas, IA de criação, MPS e embaixadores.', rota:'mgh/', tags:['Conteúdo','IA','MPS','Embaixadores'] },
  ];

  // base do site (para caminhos relativos funcionarem em subdiretório)
  const BASE = (window.location.pathname || '/').replace(/index\.html$/, '');

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

  function show(view){
    const login = $id('view-login');
    const app = $id('view-app');
    if (!login || !app) { console.error('[show] elementos não encontrados'); return; }
    const showLogin = (view === 'login');
    // usa hidden E style.display para garantir
    login.hidden = !showLogin;
    login.style.display = showLogin ? '' : 'none';
    app.hidden = showLogin;
    app.style.display = showLogin ? 'none' : '';
    console.log('[show] view =', view, '| login.display =', login.style.display, '| app.display =', app.style.display);
  }

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
  async function login(){
    const lojaId = $id('ssoLoja').value;
    const name = $id('ssoName').value.trim();
    const email = $id('ssoEmail').value.trim();
    const whats = $id('ssoWhats').value.trim();
    const cpf = $id('ssoCpf').value.trim();
    const senha = $id('ssoSenha').value;

    // ---- validação de obrigatórios (com mensagens claras) ----
    if(!lojaId){ toast('⚠️ Selecione a loja que fez a compra'); return; }
    if(!name){ toast('⚠️ Informe o nome completo (sem abreviação)'); return; }
    if(name.trim().split(/\s+/).length < 2){ toast('⚠️ Informe nome completo com nome e sobrenome'); return; }
    if(!email || !email.includes('@')){ toast('⚠️ Informe um email válido'); return; }
    if(!whats){ toast('⚠️ Informe o WhatsApp'); return; }
    if(!cpf){ toast('⚠️ Informe o CPF'); return; }
    if(!senha){ toast('⚠️ Crie uma senha'); return; }

    // CPF: aceita só dígitos, normaliza
    const cpfDigitos = cpf.replace(/\D/g,'');
    if(cpfDigitos.length !== 11){ toast('⚠️ CPF inválido — use 11 dígitos'); return; }

    // WhatsApp: normaliza removendo DDI +55 e pontuação; aceita 10-11 dígitos
    let tel = whats.replace(/\D/g,'');
    if(tel.length === 13 && tel.startsWith('55')) tel = tel.slice(2); // remove +55
    if(tel.length === 12 && tel.startsWith('55')) tel = tel.slice(2);
    if(tel.length < 10 || tel.length > 11){ toast('⚠️ WhatsApp inválido — use DDD + número'); return; }

    // ---- camada: só ADM pode definir; senão, sempre cliente ----
    const isAdm = email.toLowerCase() === ADM_EMAIL;
    const layer = isAdm ? ($id('ssoCategoria').value || 'cliente') : 'cliente';

    const S = window.iGotUpSupabase;
    const data = window.iGotUpData;
    const modo = dataMode; // 'supabase' ou 'demo'

    // ---- cria sessão e NAVEGA IMEDIATAMENTE (sem esperar Supabase) ----
    session = { name, email, layer, lojaId, whats, cpf: cpfDigitos };
    const L = LAYERS[layer];
    $id('ahName').textContent = name;
    $id('ahRole').textContent = L.nome;
    $id('ahLayer').textContent = L.cam + ' · ' + L.nome;
    $id('ahAvatar').textContent = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    // navega PRIMEIRO (garante a troca de tela antes de qualquer coisa)
    finalizarEntrada();
    toast(isAdm ? 'Bem-vindo, Administrador! 👑' : 'Conta criada como Cliente. Bem-vindo!');

    // ---- Supabase em SEGUNDO PLANO (não bloqueia a navegação) ----
    if (modo === 'supabase' && S && S.client) {
      (async () => {
        try {
          const { error } = await S.signUp(email, senha, {
            full_name: name, loja: lojaId, whats, cpf: cpfDigitos, layer,
          });
          if (error && /already|existente|registered|usuario|user/i.test(error.message || '')) {
            await S.signIn(email, senha);
          }
          const sess = await S.getSession();
          const userId = (sess && sess.user) ? sess.user.id : null;
          if (userId) {
            const existente = await data.getIndicador(userId).catch(()=>null);
            if (!existente) {
              const codigo = 'IG' + Math.random().toString(36).slice(2,8).toUpperCase();
              await data.criarIndicador({
                user_id: userId, nome: name, whatsapp_norm: tel,
                loja_id: lojaId, cpf: cpfDigitos, codigo, aceite_lgpd_em: new Date().toISOString(),
              }).catch(e=>console.warn('indicador não criado:', e.message));
            }
          }
        } catch(e) { console.warn('Supabase em 2º plano falhou:', e.message); }
      })();
    }
  }
  function logout(){ session=null; show('login'); $id('moduleFrame').hidden=true; }

  // ---------- CONTROLE DE ACESSO POR CAMADA (RBAC) ----------
  // Define quais módulos cada camada pode acessar
  const MODULE_ACCESS = {
    'matriz_admin':   ['referral', 'dic', 'mgh'],   // C1: todos
    'equipe_matriz':  ['referral', 'dic', 'mgh'],   // C2: operação
    'gestor_parceiro':['referral', 'mgh'],          // C3: loja + marketing
    'equipe_parceiro':['referral'],                 // C4: apenas indicação
    'cliente':        ['referral'],                 // C5: apenas seu painel de indicação
  };

  // Módulos visíveis para a camada atual
  function modulosPermitidos(){
    const permitidos = MODULE_ACCESS[session ? session.layer : 'cliente'] || ['referral'];
    return MODULES.filter(m => permitidos.includes(m.id));
  }

  function renderNav(){
    $id('appNav').innerHTML = modulosPermitidos().map(m => `
      <div class="app-nav-item" data-mod="${m.id}"><span class="ic">${m.ic}</span> ${m.nome}<span class="sub">${m.sub}</span></div>
    `).join('');
    $$('.app-nav-item').forEach(it => it.addEventListener('click', ()=>loadModule(it.dataset.mod)));
  }

  // carrega o módulo no iframe via proxy (protegido por permissão)
  function loadModule(id){
    if (session && !modulosPermitidos().some(m=>m.id===id)) {
      toast('Acesso não permitido para sua camada.');
      return;
    }
    const m = MODULES.find(x=>x.id===id); if(!m) return;
    $id('hubDash').hidden = true;
    const frame = $id('moduleFrame');
    frame.hidden = false;
    // caminho relativo à base do site (funciona em subdiretório)
    frame.src = BASE + m.rota;
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
    const modulos = modulosPermitidos();
    const isAdmin = session.layer !== 'cliente';
    $id('hubDash').innerHTML = `
      <div class="hub-hero">
        <div><h2>Olá, ${esc(session.name.split(' ')[0])} 👋</h2>
        <p>Acesso <b style="color:var(--accent)">${L.cam}</b> · ${L.nome}${isAdmin ? ' — módulos conforme sua permissão.' : ' — este é o seu painel de indicação.'}</p></div>
      </div>
      <div class="hub-cards">
        ${modulos.map(m=>`
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

  // ---------- ABAS LOGIN / CADASTRO ----------
  function alternarAbas(aba){
    const showLogin = (aba === 'login');
    $id('formLogin').hidden = !showLogin;
    $id('formCadastro').hidden = showLogin;
    $id('tabLoginBtn').classList.toggle('active', showLogin);
    $id('tabCadastroBtn').classList.toggle('active', !showLogin);
    if (!showLogin) { carregarLojas().catch(()=>{}); }
  }

  // ---------- LOGIN (quem já tem cadastro) ----------
  async function entrar(){
    const email = $id('loginEmail').value.trim();
    const senha = $id('loginSenha').value;
    if(!email || !senha){ toast('⚠️ Informe email e senha'); return; }

    const S = window.iGotUpSupabase;
    if (dataMode === 'supabase' && S && S.client) {
      const { data: sess, error } = await S.signIn(email, senha);
      if (error) { toast('⚠️ Email ou senha incorretos'); return; }
      // busca o perfil/indicador
      const userId = sess.user ? sess.user.id : null;
      const layer = await detectarCamada(email, userId);
      session = { name: email.split('@')[0], email, layer };
    } else {
      // modo demo: entra direto
      const layer = email.toLowerCase() === ADM_EMAIL ? 'matriz_admin' : 'cliente';
      session = { name: email.split('@')[0], email, layer };
    }
    finalizarEntrada();
    toast('Bem-vindo de volta! 👋');
  }

  // detecta a camada do usuário logado (ADM ou cliente; futuro: ler do banco)
  async function detectarCamada(email, userId){
    if (email.toLowerCase() === ADM_EMAIL) return 'matriz_admin';
    if (userId) {
      const ind = await window.iGotUpData.getIndicador(userId).catch(()=>null);
      if (ind && ind.codigo) return 'cliente';
    }
    return 'cliente';
  }

  // finaliza a entrada comum (login ou cadastro)
  function finalizarEntrada(){
    const L = LAYERS[session.layer];
    $id('ahName').textContent = session.name;
    $id('ahRole').textContent = L.nome;
    $id('ahLayer').textContent = L.cam + ' · ' + L.nome;
    $id('ahAvatar').textContent = session.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    show('app');
    renderNav();
    showMode();
    loadHub();
  }

  // eventos — registrados de forma robusta
  function registrarEventos() {
    try {
      // abas
      $id('tabLoginBtn').addEventListener('click', ()=>alternarAbas('login'));
      $id('tabCadastroBtn').addEventListener('click', ()=>alternarAbas('cadastro'));
      // login
      $id('loginBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = $id('loginBtn');
        const original = btn.textContent;
        btn.disabled = true; btn.textContent = 'Entrando…';
        try { await entrar(); } catch (err) { console.error('[login] erro:', err); toast('Erro ao entrar: ' + err.message); }
        finally { btn.disabled = false; btn.textContent = original; }
      });
      ['loginEmail','loginSenha'].forEach(id=>{
        const el = $id(id);
        if (el) el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); entrar(); } });
      });
      // cadastro
      $id('ssoBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = $id('ssoBtn');
        const original = btn.textContent;
        btn.disabled = true; btn.textContent = 'Criando conta…';
        try {
          await login();
        } catch (err) {
          console.error('[login] erro capturado:', err);
          toast('Ocorreu um erro: ' + err.message + '. Tente novamente.');
        }
        finally { btn.disabled = false; btn.textContent = original; }
      });
      $id('btnLogout').addEventListener('click', logout);
      $id('btnMenu').addEventListener('click', ()=>{ $id('appSide').classList.toggle('collapsed'); $id('appSide').classList.toggle('open'); });
      $id('ssoEmail').addEventListener('input', verificarAdm);
      ['ssoName','ssoEmail','ssoWhats','ssoCpf','ssoSenha','ssoLoja'].forEach(id=>{
        const el = $id(id);
        if (el) el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); login(); } });
      });
    } catch(e) {
      console.error('[eventos] erro ao registrar:', e);
    }
  }

  // inicialização com proteção total
  try {
    initData();
    carregarLojas().catch(e=>console.warn('carregar lojas falhou (não bloqueia):', e.message));
    registrarEventos();
    show('login');
  } catch(e) {
    console.error('[init] erro:', e);
  }
})();
