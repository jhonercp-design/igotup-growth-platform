/* ============================================================
   iGotUp · Supabase Client + Helpers reutilizáveis
   Carrega o SDK via CDN e expõe helpers para os 3 módulos.
   ============================================================ */
(function (global) {
  'use strict';

  global.iGotUpSupabase = {
    client: null,
    ready: false,

    init(config) {
      if (!config || !config.url || !config.anonKey) {
        console.warn('[supabase] config incompleta. Rodando em modo demo.');
        return false;
      }
      const supabase = window.supabase;
      if (!supabase) {
        console.warn('[supabase] SDK não carregado.');
        return false;
      }
      this.client = supabase.createClient(config.url, config.anonKey);
      this.ready = true;
      return true;
    },

    // ---------- CONSTANTES DE ACL ----------
    ADM_MASTER_EMAIL: 'jhonercp@gmail.com',

    // Retorna true apenas se o usuário autenticado é o ADM Master
    async isAdminMaster() {
      const session = await this.getSession();
      if (!session) return false;
      const { data } = await this.client.from('profiles').select('email').eq('id', session.user.id).single();
      return data && data.email && data.email.toLowerCase() === this.ADM_MASTER_EMAIL.toLowerCase();
    },

    // ---------- AUTH ----------
    // perfil = { full_name, email, layer, role, loja, whats, cpf, slug, cupom }
    // Regra: se o autenticado NÃO é ADM Master, layer é forçado para 'cliente'
    async signUp(email, password, perfil) {
      const isAdmin = await this.isAdminMaster();
      const layerFinal = isAdmin ? (perfil.layer || 'cliente') : 'cliente';
      const { data, error } = await this.client.auth.signUp({
        email, password,
        options: { data: { full_name: perfil.full_name, layer: layerFinal, role: perfil.role || 'Cliente' } },
      });
      if (error) return { error };
      // cria perfil na tabela (campos obrigatórios)
      if (data.user) {
        const { error: perr } = await this.client.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: perfil.full_name,
          layer: layerFinal,
          role: perfil.role || 'Cliente',
          loja: perfil.loja,
          whats: perfil.whats,
          cpf: perfil.cpf,
          slug: perfil.slug || '',
          cupom: perfil.cupom || '',
        });
        if (perr) return { error: perr };
      }
      return { data, layer: layerFinal };
    },

    async signIn(email, password) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      return { data, error };
    },

    async signOut() {
      return this.client.auth.signOut();
    },

    async getSession() {
      const { data } = await this.client.auth.getSession();
      return data.session;
    },

    async getProfile() {
      const session = await this.getSession();
      if (!session) return null;
      const { data } = await this.client.from('profiles').select('*').eq('id', session.user.id).single();
      return data;
    },
  };
})(window);
