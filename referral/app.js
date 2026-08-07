/* =========================================================
   iGotUp · Growth Referral Engine — Demo Multi-Tenant
   5 camadas de acesso · RBAC · auditoria · IA contextualizada
   Persistência local (localStorage). Sem backend.
   ========================================================= */
(function () {
  'use strict';

  const LS_KEY = 'igotup_gre_v2';

  // ---------- Configuração (regras oficiais) ----------
  const SETTINGS = {
    recompensaIndicador: 200,  // R$ indicador por compra
    descontoIndicado: 200,     // R$ desconto do indicado
    bonusCiclo: 500,           // R$ bônus a cada N compras
    bonusCompras: 5,
    valorCompraSimulado: 699,
  };

  const NIVEIS = [
    { nome: 'Bronze',   min: 1,   cor: 'lv-bronze' },
    { nome: 'Prata',    min: 5,   cor: 'lv-prata' },
    { nome: 'Ouro',     min: 15,  cor: 'lv-ouro' },
    { nome: 'Diamante', min: 40,  cor: 'lv-diamante' },
    { nome: 'Black',    min: 100, cor: 'lv-black' },
    { nome: 'Legend',   min: 250, cor: 'lv-legend' },
  ];
  const NIVEIS_BONUS = { 'Bronze': 500, 'Prata': 750, 'Ouro': 1000, 'Diamante': 1500, 'Black': 2500, 'Legend': 5000 };

  const XP_EVENTS = { indicar: 25, conversao: 150, ativacao: 75, bonusCiclo: 400 };

  // ---------- Definição das 5 camadas ----------
  const LAYERS = {
    matriz_admin:     { num: 1, nome: 'Administrador Matriz',  perfis: ['Gestor Geral'] },
    equipe_matriz:    { num: 2, nome: 'Equipe Matriz',         perfis: ['Comercial', 'Growth', 'Marketing', 'Suporte', 'Financeiro', 'Customer Success', 'SDR', 'Operações'] },
    gestor_parceiro:  { num: 3, nome: 'Gestor Parceiro',       perfis: ['Gestor da Loja'] },
    equipe_parceiro:  { num: 4, nome: 'Equipe Parceiro',       perfis: ['Vendedor', 'SDR Loja', 'Caixa', 'Atendimento', 'Supervisor'] },
    cliente:          { num: 5, nome: 'Cliente Indicador',     perfis: ['Cliente'] },
  };

  // Ordem de hierarquia (maior num = mais baixo na hierarquia)
  // Camada pode ver dados do próprio tenant e (se matriz) de todos.
  const PARTNERS = [
    { id: 'p1', nome: 'Mobilidade Vale', cidade: 'Caxias do Sul', regiao: 'Sul', estado: 'RS', receita: 48200, conversoes: 86, indicadores: 64, xp: 5120 },
    { id: 'p2', nome: 'Carga Elétrica Center', cidade: 'Porto Alegre', regiao: 'Sul', estado: 'RS', receita: 61500, conversoes: 112, indicadores: 88, xp: 7340 },
    { id: 'p3', nome: 'Voltz Distribuidora', cidade: 'São Paulo', regiao: 'Sudeste', estado: 'SP', receita: 90800, conversoes: 176, indicadores: 142, xp: 11100 },
    { id: 'p4', nome: 'Energia Move', cidade: 'Curitiba', regiao: 'Sul', estado: 'PR', receita: 39200, conversoes: 61, indicadores: 45, xp: 4300 },
    { id: 'p5', nome: 'BateriaMax', cidade: 'Belo Horizonte', regiao: 'Sudeste', estado: 'MG', receita: 54800, conversoes: 97, indicadores: 72, xp: 6010 },
  ];

  // ---------- Estado ----------
  function defaultState() {
    return {
      users: [], referrals: [], campanhas: [], audit: [],
      settings: Object.assign({}, SETTINGS),
    };
  }
  let state;
  try {
    const raw = localStorage.getItem(LS_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
    state.settings = Object.assign({}, SETTINGS, state.settings || {});
    if (!state.campanhas) state.campanhas = [];
    if (!state.audit) state.audit = [];
  } catch (e) { state = defaultState(); }
  function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

  let current = null;

  // ---------- Helpers ----------
  const $id = id => document.getElementById(id);
  function rand(n) { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let r = ''; for (let i=0;i<n;i++) r += c[Math.floor(Math.random()*c.length)]; return r; }
  function fmt(v) { return (v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fmtD(d) { return new Date(d).toLocaleDateString('pt-BR'); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toast(msg){ const t=$id('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2800); }

  function logAudit(layer, ator, acao, tenant, meta) {
    state.audit.unshift({ id: 'a'+rand(5), ts: new Date().toISOString(), layer, ator, acao, tenant: tenant||'', meta: meta||'', status: 'ok' });
    save();
  }

  // ---------- Login ----------
  function login() {
    const layer = $id('loginLayer').value;
    const name = $id('loginName').value.trim();
    const email = $id('loginEmail').value.trim();
    const role = $id('loginRole').value;
    const partner = $id('loginPartner').value;
    if (!name || !email) { toast('Preencha nome e email'); return; }

    const key = email.toLowerCase() + '|' + layer + '|' + role + '|' + partner;
    let user = state.users.find(u => u.key === key);
    if (!user) {
      user = {
        id: 'u'+rand(6), key, name, email, layer, role,
        partnerId: partner || null,
        slug: rand(6).toUpperCase(), cupom: 'IGOTUP-'+rand(5).toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      state.users.push(user); save();
    } else { user.name = name; save(); }
    current = user;
    logAudit(layer, name, 'login', partner ? PARTNERS.find(p=>p.id===partner)?.nome : 'Matriz');
    toast('Bem-vindo, ' + name.split(' ')[0] + '!');
    location.hash = '#/' + layer;
  }
  function logout(){ current=null; location.hash='#/login'; }
  function requireAuth(){ if(!current){ location.hash='#/login'; return false;} return true; }
  function layerOf(u){ return u ? LAYERS[u.layer] : null; }

  // ---------- Dados do cliente ----------
  function myRefs(u){ return state.referrals.filter(r => r.indicadorId === u.id && (u.layer !== 'cliente' || r.layer==='cliente')); }
  function conversoes(u){ return myRefs(u).filter(r=>r.status==='premiado').length; }
  function calcBonus(conv){ const lv=NIVEIS_BONUS[getNivel(conv).nome]; return Math.floor(conv/SETTINGS.bonusCompras)*lv; }
  function getNivel(conv){ let n=NIVEIS[0]; for(const l of NIVEIS) if(conv>=l.min) n=l; return n; }
  function calcXp(u){ const c=conversoes(u); const bonus=Math.floor(c/SETTINGS.bonusCompras)*XP_EVENTS.bonusCiclo; return myRefs(u).length*XP_EVENTS.indicar + c*XP_EVENTS.conversao + bonus; }
  function walletSaldo(u){ const c=conversoes(u); return c*SETTINGS.recompensaIndicador + calcBonus(c); }

  // ---------- Render: Camada 5 · Cliente ----------
  function renderCliente(){
    if(!requireAuth()) return;
    const u=current;
    $id('cliName').textContent = u.name.split(' ')[0];
    $id('cliTenant').textContent = 'Cliente indicador · ' + (u.partnerId ? 'loja ' + partnerNome(u.partnerId) : 'matriz');
    $id('cliLink').value = buildLink(u.slug);
    $id('cliCupom').value = u.cupom;
    renderQr(u.slug);

    const refs = myRefs(u), pend=refs.filter(r=>r.status==='pendente').length, conv=conversoes(u);
    const emAndamento = refs.filter(r=>r.status!=='premiado').length;
    const saldo = walletSaldo(u), xp = calcXp(u), nivel = getNivel(conv);
    const lv = NIVEIS.find(l=>l.min>conv);
    $id('cliLevel').textContent = nivel.nome;
    $id('cliLevel').className = 'level-badge ' + nivel.cor;
    $id('cliXp').textContent = xp + ' XP';
    $id('cliWallet').textContent = fmt(saldo);
    $id('cliProgressLabel').textContent = lv ? (conv + ' de ' + lv.min + ' compras para ' + lv.nome) : 'Nível máximo!';
    $id('cliProgress').style.width = (lv? Math.min(100, Math.round(conv/lv.min*100)) : 100) + '%';
    $id('cliHint').innerHTML = 'Você ganha <b>'+fmt(SETTINGS.recompensaIndicador)+'</b> por compra confirmada, o convidado recebe <b>'+fmt(SETTINGS.descontoIndicado)+'</b> de desconto e a cada <b>'+SETTINGS.bonusCompras+'</b> compras <b>'+fmt(calcBonus(Math.max(conv,0)))+'</b> de bônus.';

    $id('cliStats').innerHTML = [
      {n:refs.length,l:'Indicações'}, {n:emAndamento,l:'Em andamento'},
      {n:conv,l:'Compras confirmadas'}, {n:fmt(saldo),l:'Saldo na carteira'}
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');

    renderRefRows(u, refs);
  }

  function renderQr(slug){
    const el=$id('cliQr'); if(!el) return;
    // QR simulado (demo) — renderizamos um padrão estável derivado do slug
    const seed = slug.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    let html='<svg viewBox="0 0 21 21" width="92" height="92">';
    for(let y=0;y<21;y++){ for(let x=0;x<21;x++){
      const v = (seed*31 + x*7 + y*13) % 100;
      const cell = v<48 ? 'var(--accent)' : 'transparent';
      // corners
      const corner = (x<4&&y<4)||(x>16&&y<4)||(x<4&&y>16);
      if(corner) { html += `<rect x="${x}" y="${y}" width="1" height="1" fill="var(--text)"/>`; }
      else if(cell!=='transparent'){ html += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cell}"/>`; }
    }}
    html+='</svg>';
    el.innerHTML = html;
  }

  function renderRefRows(u, refs){
    $id('cliRefCount').textContent = refs.length + ' registro(s)';
    if(!refs.length){ $id('cliRefRows').innerHTML=''; $id('cliEmpty').textContent='Você ainda não fez indicações.'; return; }
    $id('cliEmpty').textContent='';
    $id('cliRefRows').innerHTML = refs.map(r=>{
      const sb = {pendente:'<span class="badge pendente">Pendente</span>',aprovado:'<span class="badge aprovado">Aprovado</span>',premiado:'<span class="badge premiado">Premiado</span>'}[r.status];
      const rew = r.status==='premiado'? fmt(r.recompensa) : '—';
      const act = r.status==='pendente'? `<button class="btn btn-ghost btn-sm" data-advance="${r.id}">Aprovar</button>` : (r.status==='aprovado'? `<button class="btn btn-ghost btn-sm" data-advance="${r.id}">Premiar</button>`:'');
      return `<tr><td>${escapeHtml(r.nomeConvidado)}</td><td class="muted">${escapeHtml(r.contato)}</td><td class="muted">${fmtD(r.createdAt)}</td><td>${sb}</td><td>${rew}</td><td>${act}</td></tr>`;
    }).join('');
  }

  function advance(id){
    const r = state.referrals.find(x=>x.id===id); if(!r) return;
    if(r.status==='pendente'){ r.status='aprovado'; r.valorCompra=SETTINGS.valorCompraSimulado; toast('Aprovado! Aguardando compra.'); }
    else if(r.status==='aprovado'){
      r.status='premiado'; r.recompensa=SETTINGS.recompensaIndicador;
      const conv = state.referrals.filter(x=>x.indicadorId===r.indicadorId && x.status==='premiado').length;
      const ciclo = conv>0 && conv%SETTINGS.bonusCompras===0;
      logAudit('cliente', current.name, 'referral.reward', '', {conv});
      toast(ciclo ? 'Recompensa '+fmt(r.recompensa)+' + BÔNUS ciclo '+fmt(SETTINGS.bonusCiclo)+' 🏆' : 'Recompensa '+fmt(r.recompensa)+' 🎉');
    }
    save(); renderCliente();
  }

  function renderIndicar(){
    if(!requireAuth()) return;
    const conv = conversoes(current);
    const prox = SETTINGS.bonusCompras - (conv % SETTINGS.bonusCompras);
    $id('rewardPreview').innerHTML = 'Você ganha <b>'+fmt(SETTINGS.recompensaIndicador)+'</b> por compra confirmada. O convidado recebe <b>'+fmt(SETTINGS.descontoIndicado)+'</b> de desconto.<br>Faltam <b>'+prox+'</b> compra(s) para liberar o <b>bônus de '+fmt(SETTINGS.bonusCiclo)+'</b>.';
  }
  function submitReferral(){
    if(!requireAuth()) return;
    const nome=$id('refName').value.trim(), contato=$id('refContact').value.trim();
    if(!nome||!contato){ toast('Preencha nome e contato'); return; }
    state.referrals.unshift({ id:'r'+rand(6), indicadorId:current.id, layer:'cliente', nomeConvidado:nome, contato, status:'pendente', valorCompra:null, recompensa:null, createdAt:new Date().toISOString() });
    logAudit('cliente', current.name, 'referral.created', current.partnerId?partnerNome(current.partnerId):'Matriz');
    save();
    $id('refName').value=''; $id('refContact').value='';
    $id('formMsg').hidden=false; $id('formMsg').textContent='Indicação registrada! Aprove no dashboard (demo).';
    toast('Indicação registrada!'); renderCliente();
  }

  function renderWallet(){
    if(!requireAuth()) return;
    const u=current, saldo=walletSaldo(u);
    $id('walSaldo').textContent = fmt(saldo);
    // extrato simulado
    const rows=[];
    for(let i=0;i<conversoes(u);i++) rows.push({d:new Date(Date.now()-i*86400000*3).toISOString(), desc:'Recompensa por indicação', tipo:'crédito', val:SETTINGS.recompensaIndicador});
    const bonus=calcBonus(conversoes(u));
    if(bonus>0) rows.unshift({d:new Date().toISOString(), desc:'Bônus de ciclo de '+SETTINGS.bonusCompras+' compras', tipo:'bônus', val:bonus});
    if(!rows.length) rows.push({d:new Date().toISOString(), desc:'Sem movimentações', tipo:'—', val:0});
    $id('walExtrato').innerHTML = rows.map(r=>`<tr><td class="muted">${fmtD(r.d)}</td><td>${r.desc}</td><td><span class="badge ${r.tipo==='crédito'?'premiado':r.tipo==='bônus'?'revendedor':'cliente'}">${r.tipo}</span></td><td>+ ${fmt(r.val)}</td></tr>`).join('');
  }
  function resgatar(){
    if(!requireAuth()) return;
    const saldo=walletSaldo(current);
    if(saldo<=0){ toast('Nenhum saldo para resgatar.'); return; }
    logAudit('cliente', current.name, 'wallet.withdrawn', '', {valor:saldo});
    toast('Solicitação de Pix de '+fmt(saldo)+' registrada (demo).');
  }

  // ---------- Render: Camada 4 · Equipe Parceiro ----------
  function renderEquipeParceiro(){
    if(!requireAuth()) return;
    const p = partner(current.partnerId);
    $id('eqpLoja').textContent = p ? p.nome : '—';
    $id('eqpLink').value = buildLink(current.slug) || '';
    $id('eqpStats').innerHTML = [
      {n:Math.floor(p.conversoes*0.3),l:'Conversões'}, {n:fmt(p.receita*0.12),l:'Comissão do mês'},
      {n:'Lv 12',l:'Seu nível'}, {n:1200,l:'XP'}
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');
    $id('eqpMetas').innerHTML = [
      {l:'Meta de conversões do mês', v:64, p:72}, {l:'Meta de comissão', v:1800, p:64}, {l:'Clientes registrados', v:40, p:85}
    ].map(m=>`<div class="meta"><div class="meta-head"><span>${m.l}</span><b>${m.v}</b></div><div class="progress-track"><div class="progress-bar" style="width:${m.p}%"></div></div></div>`).join('');
    $id('eqpMissoes').innerHTML = ['Registrar 5 clientes hoje','Enviar 10 convites','Converter 3 indicações','Subir de XP rank local']
      .map((m,i)=>`<div class="mission ${i<2?'done':''}">${i<2?'✅':'⬜'} ${m}</div>`).join('');
  }

  // ---------- Render: Camada 3 · Gestor Parceiro ----------
  function renderGestor(){
    if(!requireAuth()) return;
    const p = partner(current.partnerId);
    $id('gesLoja').textContent = p?p.nome:'—';
    $id('gesRanking').textContent = '#3 no RS · Top 12 BR';
    $id('gesStats').innerHTML = [
      {n:fmt(p.receita),l:'Receita da loja'}, {n:p.conversoes,l:'Conversões'}, {n:fmt(p.receita/p.conversoes),l:'Ticket médio'}, {n:p.indicadores,l:'Indicadores'}
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');
    $id('gesEquipe').innerHTML = [
      {n:'Ana Souza',r:'Vendedor',m:'Metas 72%'},{n:'Carlos Lima',r:'SDR Loja',m:'Metas 64%'},{n:'Bia Rocha',r:'Caixa',m:'Metas 85%'},{n:'Diego Melo',r:'Supervisor',m:'Metas 90%'}
    ].map(e=>`<div class="team-row"><div><b>${e.n}</b><span class="muted"> · ${e.r}</span></div><span class="badge cliente">${e.m}</span></div>`).join('');
    $id('gesIa').innerHTML = ['📈 Sugestão: campanha de bônus 2x para clientes inativos (potencial +18%)','🕒 Melhor horário de contato: 18h–20h (conversão 2,3x)','⭐ Clientes com maior potencial: 12 contatos identificados','🔁 Clientes inativos: 9 para reativar','💡 Oportunidade: pacote família em alta na região'].map(i=>`<li>${i}</li>`).join('');
    $id('gesCampanhas').innerHTML = ['<div class="campaign"><b>Bônus de verão local</b><span class="muted"> · até 30/09 · 84 participações</span></div>','<div class="campaign"><b>Desafio de inverno</b><span class="muted"> · 128 participantes</span></div>'];
  }

  // ---------- Render: Camada 2 · Equipe Matriz ----------
  function renderEquipeMatriz(){
    if(!requireAuth()) return;
    $id('eqmPerfil').textContent = current.role;
    $id('eqmStats').innerHTML = [
      {n:PARTNERS.length,l:'Parceiros sob gestão'}, {n:23,l:'Leads pendentes'}, {n:'4h',l:'SLA médio'}, {n:11,l:'Tickets abertos'}
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');
    $id('eqmParceiros').innerHTML = PARTNERS.map(p=>`<div class="team-row"><div><b>${p.nome}</b><span class="muted"> · ${p.cidade}</span></div><span class="badge ${p.conversoes>100?'premiado':'cliente'}">${p.conversoes} conv.</span></div>`).join('');
    $id('eqmSla').innerHTML = [
      {l:'Qualificação SDR', v:'ok', p:'95%'},{l:'Ativação de indicado', v:'ok', p:'88%'},{l:'Liquidação de recompensa', v:'watch', p:'72%'},{l:'Tickets de parceiro', v:'ok', p:'91%'}
    ].map(s=>`<div class="sla-row"><span>${s.l}</span><span class="badge ${s.v==='watch'?'pendente':'premiado'}">${s.p}</span></div>`).join('');
    $id('eqmLeads').innerHTML = [
      {n:'Maria (indicada por Ana)', s:'Hot', sc:92, r:'Sul'},{n:'João (indicado por Pedro)', s:'Warm', sc:74, r:'Sudeste'},{n:'Lucas (indicado por Bia)', s:'Warm', sc:68, r:'Sul'},{n:'Fernanda (indicada por Carol)', s:'Cold', sc:41, r:'Sudeste'}
    ].map(l=>`<div class="team-row"><div><b>${l.n}</b><span class="muted"> · ${l.r}</span></div><span class="badge ${l.s==='Hot'?'premiado':l.s==='Warm'?'aprovado':'cliente'}">${l.s} · score ${l.sc}</span></div>`).join('');
  }

  // ---------- Render: Camada 1 · Admin Matriz ----------
  function renderAdmin(){
    if(!requireAuth()) return;
    const totalReceita = PARTNERS.reduce((s,p)=>s+p.receita,0);
    const totalConv = PARTNERS.reduce((s,p)=>s+p.conversoes,0);
    const totalInd = PARTNERS.reduce((s,p)=>s+p.indicadores,0);
    const k = (totalInd*0.28/totalConv).toFixed(2);
    $id('admStats').innerHTML = [
      {n:fmt(totalReceita),l:'Receita total'}, {n:totalInd,l:'Clientes indicadores'}, {n:totalConv,l:'Indicações convertidas'},
      {n:'K '+k,l:'Viral coefficient'}, {n:fmt(164),l:'CAC'}, {n:'3,8x',l:'LTV/CAC'}, {n:fmt(totalReceita*0.34),l:'ROI referral'}
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');
    $id('admRanking').innerHTML = PARTNERS.slice().sort((a,b)=>b.xp-a.xp).map((p,i)=>`<div class="team-row"><div><b>#${i+1} ${p.nome}</b><span class="muted"> · ${p.cidade}/${p.estado}</span></div><span class="badge ${i===0?'revendedor':'cliente'}">${p.xp} XP</span></div>`).join('');
    $id('admFraude').innerHTML = [
      {t:'Auto-indicação suspeita', s:'pendente', d:'2 tentativas'},
      {t:'CPF duplicado', s:'pendente', d:'1 ocorrência'},
      {t:'Padrão bot em convites', s:'pendente', d:'bloqueado'},
      {t:'Saques anômalos', s:'cliente', d:'em análise'}
    ].map(f=>`<div class="sla-row"><span>${f.t}</span><span class="badge pendente">${f.d}</span></div>`).join('');
    $id('admDestaques').innerHTML = PARTNERS.slice().sort((a,b)=>b.receita-a.receita).slice(0,3).map((p,i)=>`<div class="team-row"><div><b>⭐ ${p.nome}</b><span class="muted"> · ${fmt(p.receita)}</span></div><span class="badge revendedor">Destaque</span></div>`).join('');
    $id('admIa').innerHTML = ['📊 Previsão de crescimento: +22% no próximo trimestre (Sul lidera)','🏪 Score de parceiros: 2 candidatos a expansão de território','🎯 Score de clientes: 380 promotores identificados','💡 Recomendação: ampliar campanha nacional para região Sudeste','⚡ Insight: referral do RS tem conversão 1,8x maior que média'].map(i=>`<li>${i}</li>`).join('');

    // auditoria
    const audit = state.audit.slice(0,20);
    if(!audit.length){ $id('admAudit').innerHTML=''; }
    else $id('admAudit').innerHTML = audit.map(a=>`<tr><td class="muted">${fmtD(a.ts)}</td><td>C${LAYERS[a.layer]?LAYERS[a.layer].num:'-'}</td><td>${escapeHtml(a.ator)}</td><td>${a.acao}</td><td class="muted">${escapeHtml(a.tenant)}</td></tr>`).join('');
    renderCampanhas();
  }
  function renderCampanhas(){
    const ativas = state.campanhas.length? state.campanhas : [];
    if($id('admCampanhas')) $id('admCampanhas').innerHTML = ativas.length? ativas.map(c=>`<div class="campaign"><b>${escapeHtml(c.nome)}</b><span class="muted"> · ${c.tipo} · ${fmtD(c.ts)}</span></div>`).join('') : '<p class="muted">Nenhuma campanha ativa.</p>';
  }
  function criarCampanha(){
    if(!requireAuth()) return;
    const nome=$id('campNome').value.trim(), tipo=$id('campTipo').value;
    if(!nome){ toast('Informe o nome da campanha'); return; }
    state.campanhas.unshift({nome, tipo, ts:new Date().toISOString()});
    logAudit('matriz_admin', current.name, 'campaign.create', 'Toda a rede', {nome, tipo});
    save();
    $id('campNome').value='';
    toast('Campanha nacional criada e distribuída a todos os tenants!');
    renderAdmin();
  }

  // ---------- Regras (comum) ----------
  function renderRegras(){
    if(!requireAuth()) return;
    const s=SETTINGS;
    const nr = NIVEIS.map(l=>`<tr><td><b>${l.nome}</b></td><td>${l.min}+</td><td>${fmt(NIVEIS_BONUS[l.nome])}</td></tr>`).join('');
    $id('rulesBox').innerHTML = `
      <h4>Como funciona</h4><ul>
      <li>Indique quantas pessoas quiser.</li><li>Cada indicação válida gera recompensa.</li>
      <li>Indicação compra → você ganha <b>${fmt(s.recompensaIndicador)}</b>.</li>
      <li>Indicado recebe <b>${fmt(s.descontoIndicado)}</b> de desconto.</li>
      <li>${s.bonusCompras} compras → bônus de <b>${fmt(s.bonusCiclo)}</b>.</li></ul>
      <h4>Recompensas</h4><table class="rule-table"><tr><th>Regra</th><th>Valor</th></tr>
      <tr><td>Indicador por compra</td><td>${fmt(s.recompensaIndicador)}</td></tr>
      <tr><td>Desconto do indicado</td><td>${fmt(s.descontoIndicado)}</td></tr>
      <tr><td>Bônus a cada ${s.bonusCompras}</td><td>${fmt(s.bonusCiclo)}</td></tr></table>
      <h4>Níveis (bônus de ciclo)</h4><table class="rule-table"><tr><th>Nível</th><th>Compras</th><th>Bônus</th></tr>${nr}</table>
      <h4>Condições</h4><ul><li>Recompensa após compra confirmada.</li><li>Auto-indicação e CPF duplicado cancelam a recompensa.</li><li>Valores configuráveis pela Matriz.</li></ul>`;
  }

  // ---------- Roteamento ----------
  const PUBLIC_VIEWS = ['convidado','login'];
  // camada -> views permitidas
  const LAYER_VIEWS = {
    cliente: ['cliente','cliente_indicar','cliente_wallet'],
    equipe_parceiro: ['equipe_parceiro'],
    gestor_parceiro: ['gestor_parceiro','gestor_parceiro_campanha'],
    equipe_matriz: ['equipe_matriz','regras'],
    matriz_admin: ['matriz_admin','matriz_admin_campanhas','regras'],
  };

  function parseHash(){ const h=(location.hash||'#/login').replace(/^#\/?/,''); const p=h.split('/'); return {view:p[0],slug:p[1]||''}; }
  function showView(name){
    document.querySelectorAll('.page').forEach(p=>p.hidden=true);
    $id('view-'+name).hidden=false;
    renderNav();
    $id('topUser').hidden = !current;
    if(current){
      $id('topUserName').textContent = current.name;
      const rb=$id('roleBadge'); rb.textContent='C'+LAYERS[current.layer].num+' · '+current.role; rb.className='role-badge '+layerClass(current.layer);
      $id('tenantPill').textContent = current.layer==='cliente' ? (current.partnerId?partnerNome(current.partnerId):'Cliente') : (current.partnerId?partnerNome(current.partnerId):'Matriz iGotUp');
    }
  }
  function layerClass(l){ return l==='cliente'?'cliente':(l.startsWith('equipe_parceiro')||l==='gestor_parceiro')?'revendedor':'matriz'; }

  function renderNav(){
    const nav=$id('mainNav');
    nav.hidden = !current;
    if(!current) return;
    const links = {
      cliente: [['cliente','Dashboard'],['cliente_indicar','Indicar'],['cliente_wallet','Carteira'],['regras','Regras']],
      equipe_parceiro: [['equipe_parceiro','Painel']],
      gestor_parceiro: [['gestor_parceiro','Painel da Loja']],
      equipe_matriz: [['equipe_matriz','Operação'],['regras','Regras']],
      matriz_admin: [['matriz_admin','Executivo'],['matriz_admin_campanhas','Campanhas'],['regras','Regras']],
    }[current.layer];
    nav.innerHTML = links.map(([v,l])=>`<button class="nav-btn ${parseHash().view===v?'active':''}" data-view="${v}">${l}</button>`).join('');
  }

  function route(){
    const {view}=parseHash();
    if(PUBLIC_VIEWS.includes(view)){ if(view==='login'){ showView('login'); return; } if(view==='convidado'){ showView('convidado'); renderConvidado(parseHash().slug); return; } }
    if(!current){ showView('login'); return; }
    const allowed = LAYER_VIEWS[current.layer]||[];
    if(allowed.includes(view)){ showView(view); runRender(view); }
    else { location.hash='#/'+current.layer; }
  }
  function runRender(view){
    const map={cliente:renderCliente,cliente_indicar:renderIndicar,cliente_wallet:renderWallet,
      equipe_parceiro:renderEquipeParceiro,gestor_parceiro:renderGestor,equipe_matriz:renderEquipeMatriz,
      matriz_admin:renderAdmin,regras:renderRegras};
    if(map[view]) map[view]();
  }

  // ---------- Convidado (landing pública) ----------
  function renderConvidado(slug){
    const user = state.users.find(u=>u.slug===slug.toUpperCase());
    const indicador = user? user.name.split(' ')[0] : 'um amigo';
    $id('inviteTitle').textContent = indicador + ' te convidou para a iGotUp! 🎉';
    $id('inviteText').textContent = 'Ao comprar seu iGotUp UpWatch Pulse usando o cupom abaixo, você ganha R$200 de desconto e quem te indicou recebe uma recompensa.';
    $id('inviteCupom').textContent = user? user.cupom : 'IGOTUP-DEMO';
    $id('inviteCta').href = '#/login';
  }

  function buildLink(slug){ return location.origin + location.pathname + '#/convidado/' + slug; }
  function partner(id){ return PARTNERS.find(p=>p.id===id); }
  function partnerNome(id){ const p=partner(id); return p? p.nome : ''; }

  // ---------- Copy ----------
  function copyText(elId){ const el=$id(elId); toast('Copiado: '+(el.value||el.textContent)); }

  // ---------- Eventos ----------
  document.addEventListener('click',(e)=>{
    const nav=e.target.closest('[data-view]'); if(nav){ location.hash='#/'+nav.dataset.view; return; }
    const copy=e.target.closest('.btn-copy'); if(copy){ copyText(copy.dataset.copy); return; }
    const adv=e.target.closest('[data-advance]'); if(adv){ advance(adv.dataset.advance); return; }
    if(e.target.closest('#brandLink') && current){ location.hash='#/'+current.layer; return; }
  });
  $id('btnLogin').addEventListener('click', login);
  $id('btnLogout').addEventListener('click', logout);
  $id('btnSubmitReferral').addEventListener('click', submitReferral);
  $id('btnResgatar').addEventListener('click', resgatar);
  $id('btnCriarCampanha').addEventListener('click', criarCampanha);
  $id('loginLayer').addEventListener('change', updateLoginForm);
  ['loginName','loginEmail'].forEach(id=>$id(id).addEventListener('keydown',e=>{ if(e.key==='Enter') login(); }));
  ['refName','refContact'].forEach(id=>$id(id).addEventListener('keydown',e=>{ if(e.key==='Enter') submitReferral(); }));
  window.addEventListener('hashchange', route);

  function updateLoginForm(){
    const layer=$id('loginLayer').value;
    const layerDef=LAYERS[layer];
    const roleWrap=$id('loginRoleWrap'), partnerWrap=$id('loginPartnerWrap');
    if(layer==='cliente'||layer==='gestor_parceiro'||layer==='matriz_admin'){ roleWrap.hidden=true; }
    else { roleWrap.hidden=false; $id('loginRole').innerHTML = layerDef.perfis.map(r=>`<option>${r}</option>`).join(''); }
    // parceiro só para camadas 3 e 4 (loja)
    if(layer==='gestor_parceiro'||layer==='equipe_parceiro'){
      partnerWrap.hidden=false; $id('loginPartner').innerHTML = PARTNERS.map(p=>`<option value="${p.id}">${p.nome} · ${p.cidade}</option>`).join('');
    } else partnerWrap.hidden=true;
  }

  updateLoginForm();
  route();
})();
