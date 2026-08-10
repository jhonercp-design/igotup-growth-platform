/* =========================================================
   iGotUp · Referral Engine — VERSÃO REAL (Supabase)
   Lê a sessão do hub e as indicações reais do banco.
   ========================================================= */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $id = s => document.getElementById(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Configuração do programa (valores oficiais)
  const SETTINGS = {
    recompensaIndicador: 200,
    descontoIndicado: 200,
    bonusCiclo: 500,
    bonusCompras: 5,
  };
  // Status do funil real (enum do banco)
  const STATUS = ['nova','em_contato','test_ride','comprou','comissao_paga','nao_converteu','expirada','rejeitada'];
  const STATUS_LABEL = { nova:'Nova', em_contato:'Em contato', test_ride:'Teste ride', comprou:'Comprou', comissao_paga:'Comissão paga', nao_converteu:'Não converteu', expirada:'Expirada', rejeitada:'Rejeitada' };

  let session = null;      // usuário do hub
  let indicador = null;    // perfil de indicador no banco
  let indicacoes = [];
  let lancamentos = [];
  let dataMode = 'demo';

  function fmt(v){ return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  function fmtD(d){ try{ return new Date(d).toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
  function toast(m){ const t=$id('toast'); if(!t) return; t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,3000); }

  // ---------- Inicialização ----------
  async function init(){
    // 1) carrega a sessão do hub
    try { session = JSON.parse(localStorage.getItem('igotup_session') || 'null'); } catch(e){ session=null; }

    // 2) inicializa Supabase
    dataMode = 'demo';
    try {
      if (window.iGotUpData) {
        dataMode = window.iGotUpData.init(window.SUPABASE_CONFIG);
      }
    } catch(e) { dataMode = 'demo'; }

    if (!session) {
      // sem sessão do hub → mostra aviso (não é login próprio)
      showAviso();
      return;
    }

    // 3) busca o indicador real do usuário
    await carregarIndicador();
    await carregarDados();
    render();
  }

  async function carregarIndicador(){
    if (dataMode !== 'supabase' || !window.iGotUpData) return;
    try {
      // tenta achar por user_id; senão pelo email
      const sess = await window.iGotUpSupabase.getSession();
      if (sess && sess.user) {
        indicador = await window.iGotUpData.getIndicador(sess.user.id).catch(()=>null);
      }
    } catch(e) { console.warn('indicador não encontrado', e.message); }
  }

  async function carregarDados(){
    if (dataMode !== 'supabase' || !window.iGotUpData) return;
    const data = window.iGotUpData;
    // carrega indicações do indicador
    if (indicador && indicador.id) {
      indicacoes = await data.getIndicacoes(indicador.id).catch(()=>[]);
      lancamentos = await data.getLancamentos(indicador.id).catch(()=>[]);
    }
  }

  // ---------- Render ----------
  function showAviso(){
    const cont = $id('view-cliente');
    if (!cont) return;
    // esconde views, mostra aviso
    document.querySelectorAll('.page').forEach(p=>p.hidden=true);
    if ($id('view-cliente')) {
      $id('view-cliente').hidden = false;
      $id('cliName').textContent = 'Não autenticado';
      const box = $id("cliStats"); if (box) box.innerHTML = '<div class="panel"><p>Acesso pelo hub (login da plataforma) para ver suas indicações.</p></div>';
    }
  }

  function render(){
    document.querySelectorAll('.page').forEach(p=>p.hidden=true);
    const nome = session ? (session.name || session.email || '').split(' ')[0] : 'Cliente';
    $id('cliName').textContent = nome;

    // stats
    const ativas = indicacoes.filter(i=>['nova','em_contato','test_ride','comprou'].includes(i.status));
    const compradas = indicacoes.filter(i=>i.status==='comprou' || i.status==='comissao_paga').length;
    const comissaoTotal = lancamentos.reduce((s,l)=>s+(Number(l.valor)||0),0);
    const saldo = lancamentos.filter(l=>l.status==='pago'||l.status==='liberado').reduce((s,l)=>s+(Number(l.valor)||0),0);

    $id("cliStats").innerHTML = [
      {n:indicacoes.length, l:'Indicações'},
      {n:ativas.length, l:'Em andamento'},
      {n:compradas, l:'Compras'},
      {n:fmt(saldo), l:'Comissões'},
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');

    // nível/wallet
    $id('cliWallet').textContent = fmt(saldo);
    $id('cliLevel').textContent = nivelAtual(compradas);
    $id('cliXp').textContent = compradas + ' compras';
    $id('cliProgressLabel').textContent = 'Status das suas indicações abaixo';

    // materiais (código do indicador)
    const codigo = indicador && indicador.codigo ? indicador.codigo : '—';
    $id('cliCupom').value = codigo;
    $id('cliLink').value = 'https://igotup-growth-platform.pages.dev/?r=' + codigo;
    $id('cliHint').innerHTML = 'Você ganha <b>'+fmt(SETTINGS.recompensaIndicador)+'</b> por compra confirmada. O convidado recebe <b>'+fmt(SETTINGS.descontoIndicado)+'</b> de desconto.';

    renderRefRows();
    $id('view-cliente').hidden = false;
  }

  function nivelAtual(compras){
    if (compras >= 100) return 'Black';
    if (compras >= 40) return 'Diamante';
    if (compras >= 15) return 'Ouro';
    if (compras >= 5) return 'Prata';
    return 'Bronze';
  }

  function renderRefRows(){
    $id('cliRefCount').textContent = indicacoes.length + ' indicação(ões)';
    const tbody = $id('cliRefRows');
    if (!indicacoes.length) {
      tbody.innerHTML = '';
      $id('cliEmpty').textContent = 'Nenhuma indicação ainda. Use o botão "Indicar" para começar.';
      return;
    }
    $id('cliEmpty').textContent = '';
    tbody.innerHTML = indicacoes.map(r=>`
      <tr>
        <td>${esc(r.nome||'')}</td>
        <td class="muted">${esc(r.whatsapp_norm||'')}</td>
        <td class="muted">${fmtD(r.criado_em)}</td>
        <td><span class="badge ${r.status}">${STATUS_LABEL[r.status]||r.status}</span></td>
        <td>${r.status==='comissao_paga' ? fmt(SETTINGS.recompensaIndicador) : '—'}</td>
      </tr>`).join('');
  }

  // ---------- Indicar ----------
  async function indicar(){
    const nome = $id('refName').value.trim();
    const contato = $id('refContact').value.trim();
    if (!nome || !contato) { toast('Preencha nome e contato'); return; }
    if (!indicador) { toast('Cadastro de indicador pendente. Entre pelo hub.'); return; }

    const whats = contato.replace(/\D/g,'');
    if (dataMode === 'supabase' && window.iGotUpData) {
      await window.iGotUpData.criarIndicacao({
        indicador_id: indicador.id, nome, whatsapp_norm: whats,
        cidade: session.cidade || '', loja_id: indicador.loja_id || null,
      }).catch(e=>toast('Erro ao salvar: '+e.message));
    }
    $id('refName').value=''; $id('refContact').value='';
    $id('formMsg').hidden=false; $id('formMsg').textContent='Indicação registrada!';
    await carregarDados();
    render();
  }

  // ---------- Eventos ----------
  $id('btnSubmitReferral').addEventListener('click', indicar);
  ['refName','refContact'].forEach(id=>{ const el=$id(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') indicar(); }); });

  init();
})();
