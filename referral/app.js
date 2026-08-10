/* =========================================================
   iGotUp · Minhas Indicações — VERSÃO REAL (Supabase)
   Lê a sessão do hub e as indicações reais do banco.
   ========================================================= */
(function () {
  'use strict';
  const $id = s => document.getElementById(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const SETTINGS = { recompensaIndicador: 200, descontoIndicado: 200 };
  const STATUS_LABEL = { nova:'Nova', em_contato:'Em contato', test_ride:'Teste ride', comprou:'Comprou', comissao_paga:'Comissão paga', nao_converteu:'Não converteu', expirada:'Expirada', rejeitada:'Rejeitada' };

  let session = null, indicador = null, indicacoes = [], lancamentos = [], dataMode = 'demo';

  function fmt(v){ return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  function fmtD(d){ try{ return new Date(d).toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
  function toast(m){ const t=$id('toast'); if(!t) return; t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,3000); }

  function setStatus(msg, tipo){
    const st = $id('refStatus');
    if (!st) return;
    st.hidden = false;
    st.textContent = msg;
    st.className = 'ref-status ' + (tipo || '');
  }
  function hideStatus(){ const st=$id('refStatus'); if(st) st.hidden=true; }

  // ---------- Inicialização ----------
  async function init(){
    try { session = JSON.parse(localStorage.getItem('igotup_session') || 'null'); } catch(e){ session=null; }

    dataMode = 'demo';
    try { if (window.iGotUpData) dataMode = window.iGotUpData.init(window.SUPABASE_CONFIG); } catch(e){ dataMode='demo'; }

    if (!session) { setStatus('Acesso pelo hub (login da plataforma) para ver suas indicações.', 'err'); return; }

    $id('refUser').textContent = session.name || session.email || 'Cliente';

    setStatus('Carregando suas indicações…');
    await carregarIndicador();
    await carregarDados();
    hideStatus();
    render();
  }

  async function carregarIndicador(){
    if (dataMode !== 'supabase' || !window.iGotUpData) return;
    try {
      const sess = await window.iGotUpSupabase.getSession();
      if (sess && sess.user) {
        indicador = await window.iGotUpData.getIndicador(sess.user.id).catch(()=>null);
        // fallback: buscar pelo user_id na sessão do hub
        if (!indicador && session) {
          indicador = await window.iGotUpData.getIndicador(sess.user.id).catch(()=>null);
        }
      }
    } catch(e) { console.warn('indicador não encontrado', e.message); }
  }

  async function carregarDados(){
    if (dataMode !== 'supabase' || !window.iGotUpData) return;
    const data = window.iGotUpData;
    if (indicador && indicador.id) {
      indicacoes = await data.getIndicacoes(indicador.id).catch(()=>[]);
      lancamentos = await data.getLancamentos(indicador.id).catch(()=>[]);
    }
  }

  // ---------- Render ----------
  function render(){
    const panel = $id('refPanel');
    if (!panel) return;
    panel.hidden = false;

    if (!indicador) {
      setStatus('Cadastro de indicador pendente. Entre no hub e refaça o cadastro com seus dados.', 'warn');
    } else {
      hideStatus();
    }

    const ativas = indicacoes.filter(i=>['nova','em_contato','test_ride','comprou'].includes(i.status));
    const compradas = indicacoes.filter(i=>i.status==='comprou' || i.status==='comissao_paga').length;
    const saldo = lancamentos.filter(l=>l.status==='pago'||l.status==='liberado').reduce((s,l)=>s+(Number(l.valor)||0),0);

    const cards = $id('statsCards');
    if (cards) cards.innerHTML = [
      {n:indicacoes.length, l:'Indicações'},
      {n:ativas.length, l:'Em andamento'},
      {n:compradas, l:'Compras'},
      {n:fmt(saldo), l:'Comissões'},
    ].map(c=>`<div class="stat"><div class="num">${c.n}</div><div class="lbl">${c.l}</div></div>`).join('');

    $id('cliWallet').textContent = fmt(saldo);
    $id('cliLevel').textContent = nivelAtual(compradas);
    $id('cliXp').textContent = compradas + ' compras';
    $id('cliProgressLabel').textContent = 'Acompanhe o status das suas indicações abaixo.';

    const codigo = indicador && indicador.codigo ? indicador.codigo : '—';
    $id('cliCupom').value = codigo;
    $id('cliLink').value = 'https://igotup-growth-platform.pages.dev/?r=' + codigo;
    $id('cliHint').innerHTML = 'Você ganha <b>'+fmt(SETTINGS.recompensaIndicador)+'</b> por compra confirmada. O convidado recebe <b>'+fmt(SETTINGS.descontoIndicado)+'</b> de desconto.';

    renderRefRows();
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
      $id('cliEmpty').textContent = 'Nenhuma indicação ainda. Faça sua primeira indicação acima.';
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

    let whats = contato.replace(/\D/g,'');
    if (whats.length === 13 && whats.startsWith('55')) whats = whats.slice(2);
    if (whats.length === 12 && whats.startsWith('55')) whats = whats.slice(2);
    if (whats.length < 10 || whats.length > 11) { toast('WhatsApp inválido'); return; }
    const whatsNorm = '+55' + whats;

    if (dataMode === 'supabase' && window.iGotUpData) {
      await window.iGotUpData.criarIndicacao({
        indicador_id: indicador.id, nome, whatsapp_norm: whatsNorm,
        cidade: session.cidade || '', loja_id: indicador.loja_id || null,
      }).catch(e=>toast('Erro ao salvar: '+e.message));
    }
    $id('refName').value=''; $id('refContact').value='';
    $id('formMsg').hidden=false; $id('formMsg').textContent='Indicação registrada!';
    await carregarDados();
    render();
  }

  // ---------- Copy ----------
  document.addEventListener('click', (e)=>{
    const cb = e.target.closest('.btn-copy');
    if (cb) { const el = $id(cb.dataset.copy); if (el) toast('Copiado: ' + (el.value||'')); }
  });

  // ---------- Eventos ----------
  $id('btnSubmitReferral').addEventListener('click', indicar);
  ['refName','refContact'].forEach(id=>{ const el=$id(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') indicar(); }); });

  init();
})();
