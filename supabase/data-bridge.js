/* ============================================================
   iGotUp · Data Bridge — camada unificada de persistência
   - Se o Supabase estiver configurado E as tabelas existirem → usa Supabase
   - Caso contrário → fallback para localStorage (modo demo)
   ============================================================ */
(function (global) {
  'use strict';

  const LS = {
    profiles: 'ig_ue_profiles',
    referrals: 'ig_ue_referrals',
    wallets: 'ig_ue_wallets',
    movements: 'ig_ue_movements',
    campanhas: 'ig_ue_campanhas',
  };

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(LS[k])) || []; } catch(e) { return []; } }
  function lsSet(k, v) { localStorage.setItem(LS[k], JSON.stringify(v)); }
  function uid() { return (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2,10); }

  // estado de disponibilidade do Supabase
  let supabaseReady = false;
  let supabaseClient = null;

  global.iGotUpData = {
    mode: 'demo', // 'demo' | 'supabase'

    // inicializa; retorna o modo ativo
    init(cfg) {
      if (cfg && cfg.url && cfg.anonKey && global.supabase && global.iGotUpSupabase) {
        const ok = global.iGotUpSupabase.init(cfg);
        if (ok) {
          this.client = global.iGotUpSupabase.client;
          this.mode = 'supabase';
          return this.mode;
        }
      }
      this.mode = 'demo';
      return this.mode;
    },

    // ---------- PERFIS ----------
    async getProfile(userId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('profiles').select('*').eq('id', userId).maybeSingle();
        return data;
      }
      return lsGet('profiles').find(p => p.id === userId) || null;
    },

    async saveProfile(profile) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('profiles').upsert(profile).select().single();
        return data;
      }
      const all = lsGet('profiles');
      const i = all.findIndex(p => p.id === profile.id);
      if (i >= 0) all[i] = profile; else all.push(profile);
      lsSet('profiles', all);
      return profile;
    },

    // ---------- INDICAÇÕES ----------
    async getReferrals(userId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('referrals').select('*').eq('indicador_id', userId).order('created_at', { ascending: false });
        return data || [];
      }
      return lsGet('referrals').filter(r => r.indicador_id === userId).sort((a,b)=> (b.created_at||'').localeCompare(a.created_at||''));
    },

    async createReferral(ref) {
      const rec = { id: uid(), status: 'pendente', recompensa: 0, created_at: new Date().toISOString(), ...ref };
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('referrals').insert(rec).select().single();
        return data || rec;
      }
      const all = lsGet('referrals'); all.push(rec); lsSet('referrals', all);
      return rec;
    },

    async updateReferral(id, patch) {
      if (this.mode === 'supabase') {
        await this.client.from('referrals').update(patch).eq('id', id);
        return;
      }
      const all = lsGet('referrals');
      const r = all.find(x => x.id === id);
      if (r) Object.assign(r, patch);
      lsSet('referrals', all);
    },

    // ---------- WALLET ----------
    async getWallet(userId) {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
      }
      return lsGet('wallets').find(w => w.user_id === userId) || { user_id: userId, saldo: 0 };
    },

    async creditWallet(userId, valor, descricao) {
      if (this.mode === 'supabase') {
        await global.iGotUpSupabase.creditWallet(userId, valor, descricao);
        return;
      }
      const w = await this.getWallet(userId);
      const saldo = (w.saldo || 0) + valor;
      const all = lsGet('wallets');
      const i = all.findIndex(x => x.user_id === userId);
      if (i >= 0) all[i].saldo = saldo; else all.push({ user_id: userId, saldo });
      lsSet('wallets', all);
      const mv = lsGet('movements'); mv.push({ id: uid(), user_id: userId, tipo: 'crédito', descricao, valor, created_at: new Date().toISOString() });
      lsSet('movements', mv);
    },

    // ---------- CAMPANHAS (MGH) ----------
    async createCampanha(camp) {
      const rec = { id: uid(), created_at: new Date().toISOString(), ...camp };
      if (this.mode === 'supabase') {
        await this.client.from('campanhas_criadas').insert(rec);
        return;
      }
      const all = lsGet('campanhas'); all.unshift(rec); lsSet('campanhas', all);
    },

    async getCampanhas() {
      if (this.mode === 'supabase') {
        const { data } = await this.client.from('campanhas_criadas').select('*').order('created_at', { ascending: false });
        return data || [];
      }
      return lsGet('campanhas');
    },
  };
})(window);
