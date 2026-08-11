/* =========================================================
   iGotUp · Marketing Growth Hub (MGH)
   Domain 13 — transforma a rede em canais ativos de aquisição
   Diferencial: Marketing Performance Score (MPS)
   ========================================================= */
(function () {
  'use strict';

  // Detecta se o MGH está carregado dentro do hub (iframe) → modo integrado
  try {
    if (window.self !== window.top && (window.location.pathname || '').includes('/mgh/')) {
      document.documentElement.classList.add('in-hub');
      document.body.classList.add('in-hub');
    }
  } catch(e) { /* cross-origin */ }

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const $id = s => document.getElementById(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function fmt(v, d) { return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:d??0}); }
  function fmtN(v) { return (v||0).toLocaleString('pt-BR'); }

  // ---------- MPS do usuário ----------
  const USER = {
    nome: 'Marina L.', nivel: 'Ambassador', link: 'igotup.com/r/MARINA24',
    mps: 812, alcance: 48200, leads: 214, conversoes: 87, receita: 123400, comissao: 24680,
    fatores: [
      { l: 'Consistência de publicações', v: 92 }, { l: 'Qualidade do conteúdo', v: 88 },
      { l: 'Taxa de engajamento', v: 79 }, { l: 'Cliques gerados', v: 85 },
      { l: 'Leads originados', v: 81 }, { l: 'Conversão em vendas', v: 90 },
      { l: 'Retenção dos indicados', v: 76 }, { l: 'Conclusão da Academy', v: 83 },
      { l: 'Participação em campanhas', v: 78 },
    ],
  };

  const NIVEIS = ['Explorer','Creator','Influencer','Ambassador','Elite','Legend'];
  const idxNivel = NIVEIS.indexOf(USER.nivel);

  // ---------- Dados ----------
  const campanhas = [
    { nome:'Promoção Outubro', tipo:'Promoções', periodo:'01–31 Out', alcance:120000, conversao:412, roi:3.4, material:['Post','Story','Reel'], hashtags:['#iGotUp','#Mobilidade'], cta:'Compre com desconto' },
    { nome:'Cashback Verão', tipo:'Cashback', periodo:'15–30 Nov', alcance:96000, conversao:338, roi:4.1, material:['Reel','Banner','Carrossel'], hashtags:['#Cashback','#iGotUp'], cta:'Ganhe cashback' },
    { nome:'Indique e Ganhe', tipo:'Indicação', periodo:'permanente', alcance:210000, conversao:1140, roi:6.2, material:['Story','Post','WhatsApp'], hashtags:['#IndiqueEGanhe'], cta:'Indique e ganhe R$200' },
    { nome:'Black Friday', tipo:'Datas comemorativas', periodo:'25–29 Nov', alcance:340000, conversao:890, roi:5.0, material:['Banner','Reel','Stories'], hashtags:['#BlackFriday','#iGotUp'], cta:'Ofertas exclusivas' },
    { nome:'Lançamento Scooter E3', tipo:'Lançamentos', periodo:'01 Dez', alcance:150000, conversao:512, roi:3.8, material:['Reel','Teaser','Carrossel'], hashtags:['#ScooterE3'], cta:'Conheça a nova' },
  ];

  const biblioteca = [
    { cat:'Produtos', tipo:'Scooters elétricas', ic:'🛴', tit:'Scooter E3 · Mobilidade urbana', fmt:'Reel', dur:'28s' },
    { cat:'Produtos', tipo:'Motos elétricas', ic:'🏍️', tit:'Moto elétrica · 150km de autonomia', fmt:'Vídeo', dur:'1min' },
    { cat:'Produtos', tipo:'Bicicletas elétricas', ic:'🚲', tit:'Bike elétrica · pedale sem suar', fmt:'Carrossel', dur:'5 posts' },
    { cat:'Campanhas', tipo:'Indicação', ic:'🎁', tit:'Indique e ganhe R$200', fmt:'Story', dur:'15s' },
    { cat:'Campanhas', tipo:'Cashback', ic:'💵', tit:'Cashback na compra', fmt:'Reel', dur:'30s' },
    { cat:'Educativo', tipo:'Economia', ic:'💡', tit:'Economia por km rodado', fmt:'Carrossel', dur:'4 posts' },
    { cat:'Educativo', tipo:'Sustentabilidade', ic:'🌱', tit:'Menos CO2 na sua cidade', fmt:'Reel', dur:'25s' },
    { cat:'Prova Social', tipo:'Depoimentos', ic:'⭐', tit:'Case: economizei R$800/mês', fmt:'Vídeo', dur:'45s' },
    { cat:'Institucional', tipo:'Marca', ic:'🏛️', tit:'Propósito iGotUp', fmt:'Vídeo', dur:'1min' },
    { cat:'Produtos', tipo:'Acessórios', ic:'🎧', tit:'Kit acessórios · coleção', fmt:'Carrossel', dur:'6 posts' },
  ];

  const copyLib = [
    { canal:'Instagram', titulo:'Nova scooter que cabe no seu bolso 🛴', legenda:'Chega de trânsito e de gastar com combustível. A Scooter E3 da iGotUp percorre até 60km por carga, com economia de 90% comparada ao carro. 🌱', cta:'Deslize para ver os modelos', hashtags:'#iGotUp #Mobilidade #Sustentabilidade', tom:'Casual' },
    { canal:'WhatsApp', titulo:'Oi! Ganhe R$200 de desconto 😉', legenda:'Indiquei a iGotUp e você ganha R$200 na primeira compra. E eu também ganho! Quer o link?', cta:'Responder', hashtags:'—', tom:'Pessoal' },
    { canal:'LinkedIn', titulo:'Mobilidade elétrica: o futuro já chegou', legenda:'Investir em mobilidade elétrica reduz custos operacionais e fortalece a sustentabilidade. Conheça a rede iGotUp.', cta:'Saiba mais', hashtags:'#Inovacao #MobilidadeEletrica', tom:'Profissional' },
    { canal:'TikTok', titulo:'POV: você economiza R$800 por mês 💸', legenda:'Assim que funciona ter uma scooter elétrica. Curtiu? Comenta e marca um amigo!', cta:'Comentar', hashtags:'#FYP #Economia', tom:'Descontraído' },
  ];

  const embaixadores = [
    { n:'Marina L.', lv:'Ambassador', pts:8120, alcance:48200 }, { n:'Felipe T.', lv:'Elite', pts:9240, alcance:61000 },
    { n:'Ana C.', lv:'Influencer', pts:6340, alcance:38800 }, { n:'Rafael M.', lv:'Creator', pts:4100, alcance:24100 },
    { n:'Bruna S.', lv:'Explorer', pts:2900, alcance:15300 }, { n:'Diego M.', lv:'Legend', pts:12100, alcance:88000 },
  ];

  const cursos = [
    { ic:'🎥', t:'Criação de conteúdo', d:'Fundamentos para postar com qualidade', mins:18 },
    { ic:'📱', t:'Gravação com smartphone', d:'Técnicas de luz, áudio e enquadramento', mins:22 },
    { ic:'📷', t:'Fotografia de produto', d:'Faça fotos que vendem', mins:15 },
    { ic:'📖', t:'Storytelling', d:'Conte histórias que conectam', mins:25 },
    { ic:'✍️', t:'Copywriting', d:'Textos que convertem', mins:30 },
    { ic:'💬', t:'Social Selling', d:'Venda pelo relacionamento', mins:27 },
    { ic:'🔁', t:'Técnicas de indicação', d:'Aumente suas indicações', mins:20 },
    { ic:'🚀', t:'Marketing digital', d:'Estratégias para crescer', mins:35 },
  ];

  const calendario = { labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], eventos:{
    '1':[{t:'Promoção Outubro',c:'accent'}], '3':[{t:'Reel Scooter E3',c:'violet'}], '5':[{t:'Story Indique e Ganhe',c:'blue'}],
    '8':[{t:'Post educativo economia',c:'violet'}], '12':[{t:'Black Friday teaser',c:'accent'}], '15':[{t:'Cashback Verão',c:'accent'}],
    '18':[{t:'Depoimento cliente',c:'blue'}], '22':[{t:'Carrossel acessórios',c:'violet'}], '25':[{t:'Black Friday',c:'accent'}], '29':[{t:'Encerramento BF',c:'accent'}],
  }};

  // ---------- Widgets ----------
  function kpi(o){ return `<div class="kpi ${o.cls||''}"><div class="k-label">${esc(o.l)}</div><div class="k-val">${o.v}</div>${o.delta!==undefined?`<div class="k-delta ${o.delta>=0?'up':'down'}">${o.delta>=0?'▲':'▼'} ${Math.abs(o.delta)}%</div>`:''}${o.sub?`<div class="k-sub">${esc(o.sub)}</div>`:''}<div class="k-bar" style="width:${o.bar||0}%;background:${o.color||'var(--accent)'}"></div></div>`; }
  function panel(o){ return `<div class="panel ${o.full?'full':''}"><div class="panel-h"><h3>${esc(o.t)}</h3><span class="ph-sub">${o.s||''}</span></div>${o.body||''}</div>`; }
  function rankRows(it){ return it.map((x,i)=>`<div class="rank-row"><div class="rank-pos" style="${i===0?'background:var(--gold);color:#241c05':''}">${i+1}</div><div class="rr-name">${x.n}<div class="rr-sub">${x.s||''}</div></div><div class="rr-val">${x.v}</div></div>`).join(''); }
  function table(headers,rows){ return `<div style="overflow-x:auto"><table class="tbl"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }

  function ringMPS(){
    const v = USER.mps, r = 62, c = 2*Math.PI*r;
    return `<div class="mps-ring"><svg width="150" height="150">
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--panel3)" stroke-width="13"/>
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="url(#grad)" stroke-width="13" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-v/1000)}"/>
      <defs><linearGradient id="grad"><stop offset="0%" stop-color="var(--violet)"/><stop offset="100%" stop-color="var(--accent)"/></linearGradient></defs>
    </svg><div class="mps-center"><div><b>${v}</b><span>MPS / 1000</span></div></div></div>`;
  }

  // ---------- SEÇÕES ----------
  function sDashboard(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>Marketing Performance Score</h2><p>Seu índice proprietário de contribuição à rede iGotUp.</p></div>
      <div class="dash-actions"><button class="btn btn-violet" data-open="gen">✨ Criar conteúdo com IA</button></div></div>
      <div class="panel">
        <div class="mps-hero">
          ${ringMPS()}
          <div style="flex:1;min-width:240px">
            <h3 style="margin:0 0 6px">${USER.nome} · <span style="color:var(--violet)">${USER.nivel}</span></h3>
            <p style="margin:0 0 12px;color:var(--dim);font-size:12px">Nível ${idxNivel+1} de ${NIVEIS.length} · ${NIVEIS[idxNivel+1]?`próximo: <b style="color:var(--text)">${NIVEIS[idxNivel+1]}</b>`:'máximo nível'}</p>
            <div class="mps-levels">${NIVEIS.map((n,i)=>`<span class="lv-pill ${i===idxNivel?'cur':i>idxNivel?'lock':''}">${n}</span>`).join('')}</div>
            <div class="grid g-kpi" style="margin-top:14px">
              ${kpi({l:'Alcance estimado', v:fmtN(USER.alcance), cls:'blue'})}
              ${kpi({l:'Leads gerados', v:fmtN(USER.leads), cls:'accent'})}
              ${kpi({l:'Conversões', v:fmtN(USER.conversoes), cls:'violet'})}
              ${kpi({l:'Receita gerada', v:fmt(USER.receita), cls:'accent'})}
              ${kpi({l:'Comissão acumulada', v:fmt(USER.comissao), cls:'gold'})}
            </div>
          </div>
        </div>
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Fatores do MPS', s:'o que compõe seu score', body: USER.fatores.map(f=>`
          <div class="factor-row"><span class="f-l">${f.l}</span><b>${f.v}</b></div>
          <div class="meter"><div style="width:${f.v}%"></div></div>`).join('')})}
        ${panel({t:'Ranking de criadores', s:'comunidade iGotUp', body: rankRows(embaixadores.map(e=>({n:e.n,s:e.lv+' · '+fmtN(e.alcance)+' alcance',v:e.pts+' pts'})))})}
      </div>
      <div class="grid g-kpi" style="margin-top:12px">
        ${kpi({l:'Conteúdos publicados', v:'42', delta:18, cls:'violet'})}
        ${kpi({l:'Conteúdos compartilhados', v:'126', delta:24})}
        ${kpi({l:'Engajamento', v:'8.4k', delta:12, cls:'blue'})}
        ${kpi({l:'Cliques', v:'3.1k', delta:15})}
        ${kpi({l:'ROI campanhas', v:'4,8x', delta:22, cls:'accent'})}
      </div>
      ${panel({t:'Receita por campanha', s:'sua performance', full:true, body: table(
        ['Campanha','Alcance','Leads','Conversões','Receita','Comissão'],
        campanhas.map(c=>[c.nome,fmtN(c.alcance),fmtN(Math.round(c.conversao*0.3)),c.conversao,fmt(Math.round(c.conversao*USER.receita/1140)),fmt(Math.round(c.conversao*USER.comissao/1140))])
      )})}
    `;
  }

  function sBiblioteca(){
    const cats = ['Todos','Produtos','Campanhas','Educativo','Prova Social','Institucional'];
    return `
      <div class="dash-head"><div class="dash-title"><h2>Biblioteca Inteligente de Conteúdo</h2><p>Materiais prontos organizados por categoria.</p></div></div>
      <div class="filter-bar" id="bibChips">${cats.map((c,i)=>`<span class="chip ${i===0?'active':''}" data-filtro="${c}">${c}</span>`).join('')}</div>
      <div class="media-grid" id="bibGrid">
        ${biblioteca.map(b=>`<div class="media-card" data-cat="${b.cat}">
          <div class="media-thumb">${b.ic}</div>
          <div class="media-info"><b>${b.tit}</b><span>${b.fmt} · ${b.dur} · ${b.tipo}</span></div>
        </div>`).join('')}
      </div>
    `;
  }

  function sCampanhas(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>Central de Campanhas</h2><p>Campanhas prontas para você aderir e compartilhar.</p></div></div>
      ${panel({t:'Campanhas ativas', full:true, s:'adesão + materiais', body: table(
        ['Campanha','Tipo','Período','Alcance','Conversões','ROI','Materiais','CTAs','Hashtags'],
        campanhas.map(c=>[`<b>${c.nome}</b>`,c.tipo,c.periodo,fmtN(c.alcance),c.conversao,c.roi+'x',c.material.join(', '),`<span class="copy-cta">${c.cta}</span>`,c.hashtags.join(' ')])
      )})}
      ${panel({t:'Detalhe da campanha de indicação', s:'permanente · principal', full:true, body:`
        <div class="grid g-2">
          <div>
            <h4 style="margin-top:0">🎯 Objetivo</h4><p style="color:var(--dim);font-size:12.5px">Transformar clientes em indicadores ativos.</p>
            <h4>👥 Público-alvo</h4><p style="color:var(--dim);font-size:12.5px">Clientes ativos, parceiros e afiliados da rede.</p>
            <h4>📅 Período</h4><p style="color:var(--dim);font-size:12.5px">Permanente.</p>
            <h4>📢 Canais recomendados</h4><p style="color:var(--dim);font-size:12.5px">WhatsApp, Stories, Reels, comunidades.</p>
          </div>
          <div>
            <h4 style="margin-top:0">📏 Métricas esperadas</h4><p style="color:var(--dim);font-size:12.5px">Conversão ≥ 25% · ROI ≥ 4x · K ≥ 1,0</p>
            <h4>📋 Regras de uso</h4><p style="color:var(--dim);font-size:12.5px">Sempre usar link/QR/código próprio com UTM. Respeitar a identidade da marca.</p>
            <h4># Hashtags</h4><p style="color:var(--dim);font-size:12.5px">#iGotUp #IndiqueEGanhe #Mobilidade</p>
          </div>
        </div>`})}
    `;
  }

  function sMidias(){
    const tipos=['Todos','Vídeos curtos','Reels','Stories','Imagens','Carrosséis','Banners','Templates'];
    return `
      <div class="dash-head"><div class="dash-title"><h2>Central de Mídias</h2><p>Biblioteca com filtros por formato, produto, cidade e campanha.</p></div></div>
      <div class="filter-bar">${tipos.map((c,i)=>`<span class="chip ${i===0?'active':''}">${c}</span>`).join('')}</div>
      <div class="grid g-4">
        ${['🎬','📱','🖼️','🛍️','📝','🎨'].map((ic,i)=>`
          <div class="media-card"><div class="media-thumb">${ic}</div><div class="media-info"><b>${['Reel Scooter','Story cashback','Banner BF','Template post','GIF produto','Áudio jingle'][i]}</b><span>${['30s','15s','1080x1080','editável','—','—'][i]} · produto/campanha</span></div></div>`).join('')}
        <div class="media-card" style="display:grid;place-items:center;min-height:140px;border:1px dashed var(--line2);background:transparent"><div style="text-align:center;color:var(--dim)"><div style="font-size:26px">➕</div><b style="font-size:12px">Enviar material</b></div></div>
      </div>
    `;
  }

  function sCopy(){
    const canais=['Todos','Instagram','Facebook','TikTok','LinkedIn','WhatsApp','Telegram','E-mail'];
    return `
      <div class="dash-head"><div class="dash-title"><h2>Copy Library</h2><p>Textos prontos com variações A/B para cada canal.</p></div></div>
      <div class="filter-bar">${canais.map((c,i)=>`<span class="chip ${i===0?'active':''}">${c}</span>`).join('')}</div>
      ${copyLib.map(c=>`
        <div class="copy-card">
          <div class="cc-head"><b>${c.canal} · ${c.titulo}</b><span class="badge violet">${c.tom}</span></div>
          <div class="copy-line"><span>Legenda</span>${esc(c.legenda)}</div>
          <div class="copy-line"><span>CTA</span><span class="copy-cta">${c.cta}</span></div>
          <div class="copy-line"><span>Hashtags</span>${c.hashtags}</div>
          <div style="margin-top:8px;display:flex;gap:8px"><button class="btn btn-sm" data-copiar>Copiar</button><button class="btn btn-ghost btn-sm">Ver variação B</button></div>
        </div>`).join('')}
    `;
  }

  function sIA(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>IA para Criação de Conteúdo</h2><p>Gere legendas, roteiros, anúncios e adapte para cada rede.</p></div></div>
      <div class="ai-gen">
        <div class="grid g-3">
          <label>O que gerar
            <select id="genTipo"><option>Legenda Instagram</option><option>Roteiro de vídeo</option><option>Mensagem WhatsApp</option><option>E-mail</option><option>Anúncio (Meta)</option><option>Ideias de conteúdo</option><option>Resposta a comentário</option></select></label>
          <label>Tema
            <select id="genTema"><option>Scooter E3</option><option>Cashback</option><option>Indicação R$200</option><option>Sustentabilidade</option><option>Black Friday</option></select></label>
          <label>Tom
            <select id="genTom"><option>Casual</option><option>Descontraído</option><option>Profissional</option><option>Energético</option></select></label>
        </div>
        <div class="grid g-2">
          <label style="margin-top:4px">Contexto / instruções
            <textarea id="genCtx" rows="3" placeholder="Ex.: falar do desconto, chamada para WhatsApp…"></textarea></label>
          <label style="margin-top:4px">Incluir link de indicação?<select id="genLink"><option>Sim, com UTM da campanha</option><option>Sem link</option></select></label>
        </div>
        <button class="btn btn-violet" id="genBtn" style="width:100%;padding:12px">✨ Gerar com IA</button>
        <div class="gen-out" id="genOut">Clique em "Gerar com IA" para criar o conteúdo.</div>
        <div class="gen-btns"><button class="btn btn-accent" data-copiar>Copiar</button><button class="btn" data-open="pub">Publicar agora</button><button class="btn btn-ghost">Agendar</button></div>
      </div>
    `;
  }

  function sCalendario(){
    const dias = calendario.labels;
    let html = `<div class="dash-head"><div class="dash-title"><h2>Calendário de Marketing</h2><p>Visão mensal com campanhas, conteúdos e datas.</p></div>
      <button class="btn btn-accent" data-open="agenda">+ Novo agendamento</button></div>
      <div class="cal"><div style="grid-column:1/-1;display:flex;justify-content:space-between;color:var(--dim);font-size:11px;margin-bottom:4px"><span>◀ Novembro 2026</span><span>Hoje</span></div>`;
    // headers
    dias.forEach(d=>html+=`<div style="text-align:center;color:var(--dim);font-size:10px;font-weight:700;text-transform:uppercase">${d}</div>`);
    for(let d=1; d<=30; d++){
      const evs = calendario.eventos[d]||[];
      html+=`<div class="cal-day ${d===12?'today':''}"><b>${d}</b>${evs.map(e=>`<div class="cal-ev ${e.c}">${e.t}</div>`).join('')}${d===5?'<div class="cal-ev violet">Desafio semanal</div>':''}${d===20?'<div class="cal-ev blue">Lançamento</div>':''}</div>`;
    }
    return html+`</div>`;
  }

  function sSelling(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>Social Selling Center</h2><p>Seu painel de performance de vendas sociais.</p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Publicações', v:'42', delta:18, cls:'violet'})}
        ${kpi({l:'Alcance estimado', v:fmtN(USER.alcance), delta:12, cls:'blue'})}
        ${kpi({l:'Cliques', v:'3.1k', delta:15})}
        ${kpi({l:'Leads originados', v:fmtN(USER.leads), delta:9, cls:'accent'})}
        ${kpi({l:'Indicações convertidas', v:fmtN(USER.conversoes), cls:'violet'})}
        ${kpi({l:'Vendas atribuídas', v:fmtN(USER.conversoes), delta:11})}
        ${kpi({l:'Taxa de conversão', v:'40%', delta:6, cls:'accent'})}
        ${kpi({l:'Receita gerada', v:fmt(USER.receita), cls:'accent'})}
        ${kpi({l:'Comissão acumulada', v:fmt(USER.comissao), cls:'gold'})}
      </div>
      ${panel({t:'Seus materiais de indicação (integração automática)', full:true, body:`
        <div class="grid g-3">
          <div class="copy-card" style="margin:0"><div class="cc-head"><b>Link exclusivo</b></div><div class="copy-line"><span>URL</span>${USER.link}?utm=referral</div><button class="btn btn-sm" data-copiar>Copiar</button></div>
          <div class="copy-card" style="margin:0"><div class="cc-head"><b>Código</b></div><div class="copy-line"><span>Cupom</span><b style="color:var(--gold)">MARINA24</b></div><button class="btn btn-sm" data-copiar>Copiar</button></div>
          <div class="copy-card" style="margin:0"><div class="cc-head"><b>QR Code</b></div><div style="width:90px;height:90px;background:#fff;border-radius:8px;display:grid;place-items:center;color:#000;font-size:11px">QR</div></div>
        </div>
        <div style="margin-top:14px;color:var(--dim);font-size:12px">✅ UTM automáticas · ✅ atribuição por conteúdo · ✅ identificação de campanha</div>`})}
    `;
  }

  function sEmbaixadores(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>Programa de Embaixadores</h2><p>Classificação por desempenho com benefícios crescentes.</p></div></div>
      <div class="grid g-4">
        ${NIVEIS.map((n,i)=>`
          <div class="kpi ${i===idxNivel?'violet':''}" style="${i===idxNivel?'border:1px solid rgba(167,139,250,.5)':''}">
            <div class="k-label">Nível ${i+1}</div>
            <div class="k-val" style="font-size:17px">${i===idxNivel?'⭐ ':''}${n}</div>
            <div class="k-sub">${['Início','1000 pts','2500 pts','5000 pts','8000 pts','12000 pts'][i]}</div>
            ${i<=idxNivel?'<div class="k-bar" style="width:100%;background:var(--violet)"></div>':''}
          </div>`).join('')}
      </div>
      ${panel({t:'Benefícios por nível', full:true, body: table(
        ['Nível','Benefícios','Campanhas exclusivas'],
        [['Explorer','Acesso à biblioteca','Básicas'],
         ['Creator','+ templates editáveis','Sazonais'],
         ['Influencer','+ treinamentos avançados','Lançamentos'],
         ['Ambassador','+ comissão 12% · suporte','De alta performance'],
         ['Elite','+ eventos e co-branding','Exclusivas'],
         ['Legend','+ condições especiais vitalícias','Todas + prioridade']]
      )})}
      ${panel({t:'Ranking de embaixadores', full:true, body: rankRows(embaixadores.sort((a,b)=>b.pts-a.pts).map(e=>({n:e.n,s:e.lv+' · '+fmtN(e.alcance)+' alcance',v:e.pts+' pts'})))})}
    `;
  }

  function sAcademy(){
    return `
      <div class="dash-head"><div class="dash-title"><h2>Marketing Academy</h2><p>Treinamentos rápidos para aumentar sua performance.</p></div></div>
      <div class="grid g-4">
        ${cursos.map(c=>`
          <div class="course-card"><div class="cc-ico">${c.ic}</div><b>${c.t}</b><p>${c.d}</p>
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="badge violet">${c.mins} min</span><button class="btn btn-sm" data-open="curso">Iniciar</button></div></div>`).join('')}
      </div>
      <div class="panel" style="margin-top:12px"><div class="panel-h"><h3>Seu progresso</h3><span class="ph-sub">6 de 8 cursos</span></div>
        <div class="meter"><div style="width:75%"></div></div>
        <div style="margin-top:8px;color:var(--dim);font-size:12px">Concluir cursos aumenta seu MPS em até 15 pontos.</div></div>
    `;
  }

  // ---------- Mapa de seções ----------
  const SECOES = {
    dashboard: {label:'Dashboard', ic:'📊', grupo:'Visão Geral', render:sDashboard},
    biblioteca: {label:'Biblioteca de Conteúdo', ic:'📚', grupo:'Conteúdo', render:sBiblioteca},
    campanhas: {label:'Central de Campanhas', ic:'📣', grupo:'Conteúdo', render:sCampanhas},
    midias: {label:'Central de Mídias', ic:'🎬', grupo:'Conteúdo', render:sMidias},
    copy: {label:'Copy Library', ic:'✍️', grupo:'Conteúdo', render:sCopy},
    ia: {label:'IA de Criação', ic:'✨', grupo:'Criação', render:sIA},
    calendario: {label:'Calendário', ic:'📅', grupo:'Criação', render:sCalendario},
    publicacao: {label:'Publicação Assistida', ic:'📤', grupo:'Criação', render:sSelling},
    selling: {label:'Social Selling', ic:'💼', grupo:'Performance', render:sSelling},
    embaixadores: {label:'Embaixadores', ic:'🏆', grupo:'Performance', render:sEmbaixadores},
    academia: {label:'Marketing Academy', ic:'🎓', grupo:'Performance', render:sAcademy},
  };

  let current = 'dashboard';

  function renderNav(){
    const g={};
    Object.values(SECOES).forEach(s=>{(g[s.grupo]=g[s.grupo]||[]).push(s)});
    $id('sideNav').innerHTML = Object.keys(g).map(gr=>`<div class="nav-group"><div class="nav-group-label">${gr}</div>${g[gr].map(s=>`<div class="nav-item ${Object.keys(SECOES).find(k=>SECOES[k]===s)===current?'active':''}" data-view="${Object.keys(SECOES).find(k=>SECOES[k]===s)}"><span class="ic">${s.ic}</span>${s.label}</div>`).join('')}</div>`).join('');
  }

  function render(){
    $id('crumb').textContent = SECOES[current].label;
    $id('content').innerHTML = SECOES[current].render();
    $id('mpsVal').textContent = USER.mps;
    bindPostRender();
  }

  function go(view){ current = SECOES[view]?view:'dashboard'; renderNav(); render(); }

  // filtros da biblioteca
  function bindPostRender(){
    const chips = $id('bibChips');
    if(chips) chips.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
      chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); c.classList.add('active');
      const f=c.dataset.filtro;
      document.querySelectorAll('#bibGrid .media-card').forEach(m=>{ m.style.display = (f==='Todos'||m.dataset.cat===f)?'':'none'; });
    }));
    const genBtn = $id('genBtn');
    if(genBtn) genBtn.addEventListener('click', gerarIA);
  }

  function gerarIA(){
    const tipo = $id('genTipo').value, tema = $id('genTema').value, tom = $id('genTom').value, link = USER.link;
    const out = $id('genOut');
    const textos = {
      'Legenda Instagram': `💚 ${tema} — mobilidade que cabe na sua rotina!\n\nChegou a hora de economizar e andar com estilo. A iGotUp facilita tudo:\n\n✅ Entrega rápida\n✅ Garantia de 12 meses\n✅ Suporte dedicado\n\n📲 Garanta o seu com ${link}\n\n#iGotUp #${tema.replace(/\s/g,'')} #Mobilidade #Sustentabilidade`,
      'Roteiro de vídeo': `ROTEIRO · ${tema} (${tom})\n\nCENA 1 (0-3s): Gancho — "Quanto você gasta por mês de combustível?"\nCENA 2 (3-12s): Apresenta o produto em uso\nCENA 3 (12-22s): Mostra o desconto/cashback na tela\nCENA 4 (22-28s): CTA — "Link na bio" + ${link}\n\n🎥 B-roll: close do produto, ambiente urbano, tela do app`,
      'Mensagem WhatsApp': `Oi! 😊 Fiquei sabendo que você está pensando em mobilidade elétrica. O ${tema} da iGotUp está com condição especial agora!\n\n💰 Bônus de ${'R$200'} para você\n📦 Entrega e garantia inclusas\n\nPosso te mandar o link com desconto? ${link}`,
      'E-mail': `Assunto: Oportunidade ${tema} 🔥\n\nOlá!\n\nSó uma chance rápida: o ${tema} está com uma condição que combina economia e inovação.\n\n👉 Confira: ${link}\n\nAbraços,\n${USER.nome}`,
      'Anúncio (Meta)': `🔗 Título: ${tema} — Oferta por tempo limitado\n🔗 Headline: Mobilidade elétrica com desconto\n🔗 Descrição: Garanta o ${tema} da iGotUp e aproveite cashback + frete grátis.\n🔗 CTA: Saiba mais\n🔗 URL: ${link}\n\nPúblico: 18-45, interesse em mobilidade urbana\nOrçamento sugerido: R$ 50/dia`,
      'Ideias de conteúdo': `IDEIAS · ${tema}\n\n1. 📹 Reel: "3 motivos para ter um ${tema}"\n2. 📸 Carrossel: "Antes vs Depois na sua rotina"\n3. 💬 Story enquetes: "Qual você prefere?"\n4. 🎓 Post educativo: "Quanto você economiza/ano?"\n5. 🏆 Desafio: marque um amigo e ganhe bônus`,
      'Resposta a comentário': `Oi! 💚 Que bom que você gostou! Falei com o pessoal e o desconto do ${tema} está ativo.\n\n👉 Garanta aqui: ${link}\n\nQualquer dúvida, é só chamar!`,
    };
    out.textContent = textos[tipo] || textos['Legenda Instagram'];
    toast('Conteúdo gerado pela IA ✨');
  }

  // modal
  function openModal(titulo, body){
    $id('modal').hidden = false;
    $id('modal').innerHTML = `<div class="modal-box"><h3>${titulo}</h3>${body}
      <div class="modal-actions"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-accent" data-close>Confirmar</button></div></div>`;
  }

  function toast(msg){ const t=$id('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2400); }

  function bindEvents(){
    document.addEventListener('click', e=>{
      const nav=e.target.closest('.nav-item'); if(nav){ go(nav.dataset.view); return; }
      if(e.target.closest('#toggleSide')){ $id('side').classList.toggle('collapsed'); return; }
      if(e.target.closest('[data-copiar]')){ toast('Copiado!'); return; }
      if(e.target.closest('[data-close]')){ $id('modal').hidden=true; return; }
      if(e.target.closest('#createBtn')){ openModal('Criar conteúdo', `<p style="color:var(--dim)">Inicie pelo assistente de IA ou escolha um material da biblioteca.</p><div style="display:flex;gap:8px"><button class="btn btn-violet" data-open="ia">✨ Assistente IA</button><button class="btn" data-open="biblioteca">📚 Biblioteca</button></div>`); return; }
      const abrir = e.target.closest('[data-open]');
      if(abrir){
        const alvo = abrir.dataset.open;
        if(alvo==='gen'){ go('ia'); return; }
        if(alvo==='pub'){ toast('Fluxo de publicação iniciado'); return; }
        if(alvo==='agenda'){ toast('Agendamento criado'); return; }
        if(alvo==='curso'){ toast('Curso iniciado — bom estudo! 🎓'); return; }
        if(alvo==='ia'){ go('ia'); return; }
        if(alvo==='biblioteca'){ go('biblioteca'); return; }
        $id('modal').hidden=true; return;
      }
    });
  }

  bindEvents();
  renderNav();
  render();
})();
