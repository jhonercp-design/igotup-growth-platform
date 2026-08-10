/* ============================================================
   iGotUp · Data Bridge — camada unificada de persistência
   CAMINHO A: integrado ao modelo existente
   - Supabase disponível + tabelas reais → usa Supabase
   - Caso contrário → fallback demo (localStorage)
   Tabelas reais: lojas · indicadores · indicacoes · lancamentos · eventos
   ============================================================ */
(function (global) {
  'use strict';

  const LS = {
    lojas: 'ig_demo_lojas',
    indicadores: 'ig_demo_indicadores',
    indicacoes: 'ig_demo_indicacoes',
    lancamentos: 'ig_demo_lancamentos',
  };

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(LS[k])) || []; } catch(e) { return []; } }
  function lsSet(k, v) { localStorage.setItem(LS[k], JSON.stringify(v)); }
  function uid() { return (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2,10); }

  let supabaseClient = null;

  // lista fixa de fallback (caso o Supabase não carregue no navegador)
  const LOJAS_FALLBACK = [
    { id:'demo-1', nome:'Alexandro Montadora Novo Hamburgo' },
    { id:'demo-2', nome:'Business Company LTDA' },
    { id:'demo-3', nome:'iGotUp - Online Porto Alegre/RS' },
    { id:'demo-4', nome:'iGotUp - Bagé/RS' },
    { id:'demo-5', nome:'iGotUp - Barra Porto Alegre/RS' },
    { id:'demo-6', nome:'iGotUp - Campo Bom/RS' },
    { id:'demo-7', nome:'iGotUp - Canoas/RS Loja' },
    { id:'demo-8', nome:'iGotUp - Canoas/RS Quiosque' },
    { id:'demo-9', nome:'iGotUp - Estância Velha/RS' },
    { id:'demo-10', nome:'iGotUp - Gravataí/RS' },
    { id:'demo-11', nome:'iGotUp - iGuatemi Porto Alegre/RS' },
    { id:'demo-12', nome:'iGotUp - Jequié/BA' },
    { id:'demo-13', nome:'iGotUp - Parobé/RS' },
    { id:'demo-14', nome:'iGotUp - São Leopoldo' },
    { id:'demo-15', nome:'iGotUp Cachoeirinha' },
    { id:'demo-16', nome:'iGotUp Capão' },
    { id:'demo-17', nome:'iGotUp Central - Doca 5 Santa Catarina' },
    { id:'demo-18', nome:'iGotUp Central - Sede Rio Grande' },
    { id:'demo-19', nome:'iGotUp Penha/SC' },
    { id:'demo-20', nome:'iGotUp RS - Portão' },
    { id:'demo-21', nome:'iGotUp Santa Cruz Do Sul' },
  ];

  global.iGotUpData = {
    mode: 'demo', // 'demo' | 'supabase'

    init(cfg) {
      if (cfg && cfg.url && cfg.anonKey && global.supabase && global.iGotUpSupabase) {
        if (global.iGotUpSupabase.init(cfg)) {
          this.client = global.iGotUpSupabase.client;
          this.mode = 'supabase';
          return this.mode;
        }
      }
      this.mode = 'demo';
      return this.mode;
    },

    // ---------- LOJAS (26 unidades reais) ----------
    async getLojas() {
      try {
        if (this.mode === 'supabase') {
          const { data } = await this.client.from('lojas').select('id,nome,cidade').eq('ativa', true).order('nome');
          if (data && data.length) return data;
        }
      } catch(e) { console.warn('getLojas supabase falhou, usando fallback:', e.message); }
      return LOJAS_FALLBACK;
    },

    // ---------- INDICADOR (perfil de quem indica) ----------
    // Cria um indicador vinculado ao usuário autenticado
    async criarIndicador(perfil) {
      const rec = { id: uid(), criado_em: new Date().toISOString(), ...perfil };
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicadores').insert(rec).select().single();
        return data || rec;
      }
      const all = lsGet('indicadores'); all.push(rec); lsSet('indicadores', all);
      return rec;
    },

    async getIndicador(userId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicadores').select('*').eq('user_id', userId).maybeSingle();
        return data;
      }
      return lsGet('indicadores').find(i => i.user_id === userId) || null;
    },

    async getIndicadorByCodigo(codigo) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicadores').select('*').eq('codigo', codigo).maybeSingle();
        return data;
      }
      return lsGet('indicadores').find(i => i.codigo === codigo) || null;
    },

    async getIndicadorByWhats(whats) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicadores').select('*').eq('whatsapp_norm', whats).maybeSingle();
        return data;
      }
      return lsGet('indicadores').find(i => i.whatsapp_norm === whats) || null;
    },

    // ---------- INDICAÇÕES (funil real) ----------
    // status enum: nova | em_contato | test_ride | comprou | comissao_paga | nao_converteu | expirada | rejeitada
    async getIndicacoes(indicadorId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicacoes').select('*').eq('indicador_id', indicadorId).order('criado_em', { ascending: false });
        return data || [];
      }
      return lsGet('indicacoes').filter(i => i.indicador_id === indicadorId);
    },

    async criarIndicacao(indicacao) {
      const rec = { id: uid(), status: 'nova', criado_em: new Date().toISOString(), ...indicacao };
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('indicacoes').insert(rec).select().single();
        // registra evento de status inicial
        await this.registrarEvento(rec.id, null, 'nova');
        return data || rec;
      }
      const all = lsGet('indicacoes'); all.push(rec); lsSet('indicacoes', all);
      return rec;
    },

    async atualizarStatus(indicacaoId, novoStatus, por) {
      if (this.mode === 'supabase') {
        const { data: atual } = await this.client.from('indicacoes').select('status').eq('id', indicacaoId).maybeSingle();
        const deStatus = atual ? atual.status : null;
        await this.client.from('indicacoes').update({ status: novoStatus }).eq('id', indicacaoId);
        await this.registrarEvento(indicacaoId, deStatus, novoStatus, por);
        return;
      }
      const all = lsGet('indicacoes');
      const r = all.find(x => x.id === indicacaoId);
      if (r) { r.status = novoStatus; }
      lsSet('indicacoes', all);
    },

    // ---------- EVENTOS (trilha do funil) ----------
    async registrarEvento(indicacaoId, deStatus, paraStatus, por) {
      if (this.mode !== 'supabase') return;
      await this.client.from('eventos').insert({
        indicacao_id: indicacaoId, de_status: deStatus, para_status: paraStatus, por: por || 'sistema', em: new Date().toISOString(),
      });
    },

    // ---------- LANÇAMENTOS (comissões / carteira) ----------
    async getLancamentos(indicadorId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('lancamentos').select('*').eq('indicador_id', indicadorId).order('criado_em', { ascending: false });
        return data || [];
      }
      return lsGet('lancamentos').filter(l => l.indicador_id === indicadorId);
    },

    // saldo = soma dos lançamentos liberados/pagos
    async getSaldo(indicadorId) {
      const lancs = await this.getLancamentos(indicadorId);
      return lancs.filter(l => l.status === 'pago' || l.status === 'liberado').reduce((s, l) => s + (Number(l.valor) || 0), 0);
    },

    async creditar(indicadorId, valor, tipo, descricao) {
      // normaliza o tipo para os valores aceitos pela check constraint (venda | bonus_ciclo)
      const tipoNorm = (tipo === 'bonus_ciclo' || tipo === 'bônus' || tipo === 'bonus') ? 'bonus_ciclo' : 'venda';
      const rec = { id: uid(), indicador_id: indicadorId, indicacao_id: null, tipo: tipoNorm, valor, status: 'liberado', criado_em: new Date().toISOString(), descricao: descricao || '' };
      if (this.mode === 'supabase') {
        await this.client.from('lancamentos').insert(rec);
        return;
      }
      const all = lsGet('lancamentos'); all.push(rec); lsSet('lancamentos', all);
    },
  };
})(window);
