/* =========================================================
   iGotUp · Decision Intelligence Center (DIC)
   Filosofia: cada tela responde às 4 perguntas
   1) O que aconteceu? 2) Por quê? 3) O que acontecerá? 4) O que fazer?
   ========================================================= */
(function () {
  'use strict';

  // Detecta se o DIC está carregado dentro do hub (iframe) → modo integrado
  try {
    if (window.self !== window.top && (window.location.pathname || '').includes('/dic/')) {
      document.documentElement.classList.add('in-hub');
      document.body.classList.add('in-hub');
    }
  } catch(e) { /* cross-origin: ignora */ }

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const $id = s => document.getElementById(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function fmt(v, dec) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: dec ?? 0 }); }
  function fmtN(v) { return (v || 0).toLocaleString('pt-BR'); }
  function pct(v) { return (v || 0).toFixed(1).replace('.', ',') + '%'; }

  // ---------- DADOS DEMO ----------
  const dados = {
    receita: { hoje: 182450, mes: 3241000, ano: 28400000, meta: 3800000, projetado: 3970000 },
    custos: { cacs: 164, bonificacoes: 486000, mkt: 960000 },
    cac: 164, ltv: 623, roi: 3.8, mrr: 1180000, arr: 14160000, lucro: 624000, margem: 0.23,
    conversao: 0.27, ticket: 1420, tempoVenda: 4.2, nps: 68, referralRate: 0.19, churn: 0.033, lifetime: 30,
    promovidos: 3800, ativos: 21200, inativos: 6400,
    viralK: 1.12,
    indicacoes: { hoje: 412, semana: 2890, mes: 11840, convTaxa: 0.31, valorPago: 948000, valorPendente: 624000 },
  };

  const parceiros = [
    { nome: 'Voltz Distribuidora', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste', receita: 908000, conv: 176, xp: 11100, vendedores: 12 },
    { nome: 'Carga Elétrica Center', cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul', receita: 615000, conv: 112, xp: 7340, vendedores: 9 },
    { nome: 'Mobilidade Vale', cidade: 'Caxias do Sul', estado: 'RS', regiao: 'Sul', receita: 482000, conv: 86, xp: 5120, vendedores: 7 },
    { nome: 'Energia Move', cidade: 'Curitiba', estado: 'PR', regiao: 'Sul', receita: 392000, conv: 61, xp: 4300, vendedores: 6 },
    { nome: 'BateriaMax', cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste', receita: 548000, conv: 97, xp: 6010, vendedores: 8 },
    { nome: 'Eco Volta', cidade: 'Florianópolis', estado: 'SC', regiao: 'Sul', receita: 458000, conv: 78, xp: 4900, vendedores: 7 },
    { nome: 'Canoas II', cidade: 'Canoas', estado: 'RS', regiao: 'Sul', receita: 289000, conv: 41, xp: 3120, vendedores: 5 },
    { nome: 'Recife Volt', cidade: 'Recife', estado: 'PE', regiao: 'Nordeste', receita: 264000, conv: 38, xp: 2500, vendedores: 5 },
  ];

  const estados = [
    { uf: 'SP', cidade: 'São Paulo', lat: 0.78, lon: 0.30, v: 0.95 },
    { uf: 'RS', cidade: 'Porto Alegre', lat: 0.72, lon: 0.78, v: 0.85 },
    { uf: 'RS', cidade: 'Caxias do Sul', lat: 0.70, lon: 0.77, v: 0.62 },
    { uf: 'PR', cidade: 'Curitiba', lat: 0.68, lon: 0.72, v: 0.55 },
    { uf: 'MG', cidade: 'Belo Horizonte', lat: 0.50, lon: 0.44, v: 0.70 },
    { uf: 'SC', cidade: 'Florianópolis', lat: 0.73, lon: 0.70, v: 0.58 },
    { uf: 'PE', cidade: 'Recife', lat: 0.26, lon: 0.48, v: 0.40 },
    { uf: 'RJ', cidade: 'Rio de Janeiro', lat: 0.55, lon: 0.38, v: 0.45 },
    { uf: 'BA', cidade: 'Salvador', lat: 0.33, lon: 0.47, v: 0.35 },
    { uf: 'CE', cidade: 'Fortaleza', lat: 0.18, lon: 0.50, v: 0.32 },
    { uf: 'GO', cidade: 'Goiânia', lat: 0.52, lon: 0.62, v: 0.30 },
    { uf: 'AM', cidade: 'Manaus', lat: 0.22, lon: 0.95, v: 0.22 },
  ];

  // ---------- Helpers de gráfico SVG ----------
  function sparkline(values, w, h, color) {
    const max = Math.max(...values), min = Math.min(...values), range = (max - min) || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return [x, y];
    });
    const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = path + ` L${w},${h} L0,${h} Z`;
    const g = color || '#3de29b';
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="${area}" fill="${g}" opacity=".12"></path>
      <path d="${path}" fill="none" stroke="${g}" stroke-width="2" stroke-linecap="round"></path>
    </svg>`;
  }

  function barSeries(data, color) {
    const max = Math.max(...data.map(d => d.v));
    return data.map((d, i) => {
      const h = Math.round((d.v / max) * 90);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
        <span style="font-size:10px;color:var(--dim)">${fmtN(d.v)}</span>
        <div style="width:70%;height:${h}px;background:linear-gradient(180deg,${color||'var(--accent)'},${color||'var(--accent)'}aa);border-radius:5px 5px 2px 2px"></div>
        <span style="font-size:10px;color:var(--faint)">${d.l}</span>
      </div>`;
    }).join('');
  }

  // ---------- Widgets ----------
  function kpi(o) {
    const drill = o.drill ? ` data-drill="${o.drill}"` : '';
    return `<div class="kpi ${o.cls||''}"${drill} style="cursor:${o.drill?'pointer':'default'}">
      <div class="k-label">${esc(o.l)}</div>
      <div class="k-val ${o.anim?'anim':''}" ${o.anim!==undefined?`data-val="${o.anim}" data-fmt="${o.fmt||'int'}">${o.v}`:`>${o.v}`}</div>
      ${o.delta!==undefined?`<div class="k-delta ${o.delta>=0?'up':'down'}">${o.delta>=0?'▲':'▼'} ${Math.abs(o.delta)}%</div>`:''}
      ${o.sub?`<div class="k-sub">${esc(o.sub)}</div>`:''}
      <div class="k-bar" style="width:${o.bar||0}%;background:${o.color||'var(--accent)'}"></div>
    </div>`;
  }

  // gráfico de linha interativo com tooltip
  function lineChart(series, w, h) {
    const max = Math.max(...series.map(s => s.v)), min = Math.min(...series.map(s => s.v));
    const range = (max - min) || 1, pad = 14;
    const pw = w - 16, ph = h - 24;
    const pts = series.map((s, i) => ({
      x: 8 + (i / (series.length - 1)) * pw,
      y: h - 14 - ((s.v - min) / range) * ph,
      s
    }));
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    const area = path + ` L${pts[pts.length-1].x},${h-14} L${pts[0].x},${h-14} Z`;
    return `<svg class="linechart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="width:100%;display:block">
      ${series.map((_, i) => { const y = h - 14 - (i/(series.length-1))*ph; return `<line x1="8" y1="${y}" x2="${w-8}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`; }).join('')}
      <path d="${area}" fill="url(#lg)" stroke="none"/>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--blue)" stop-opacity=".35"/><stop offset="100%" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>
      <path d="${path}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linecap="round"/>
      ${pts.map(p => `<circle class="lc-dot" data-x="${p.s.l}" data-v="${p.s.v}" cx="${p.x}" cy="${p.y}" r="4" fill="var(--blue)" stroke="var(--bg)" stroke-width="2" style="cursor:pointer"/>`).join('')}
    </svg>`;
  }

  function panel(o) {
    return `<div class="panel ${o.full?'full':''}">
      <div class="panel-h"><h3>${esc(o.t)}</h3><span class="ph-sub">${o.s||''}</span></div>
      ${o.body||''}
    </div>`;
  }

  function rankRows(items) {
    return items.map((it, i) => `
      <div class="rank-row">
        <div class="rank-pos" style="${i===0?'background:var(--gold);color:#241c05':''}">${i+1}</div>
        <div class="rr-name">${it.n}<div class="rr-sub">${it.s||''}</div></div>
        <div class="rr-val">${it.v}</div>
      </div>`).join('');
  }

  function aiInsights(items) {
    return items.map(it => `
      <div class="ai-insight"><div class="ai-ic">${it.ic||'🤖'}</div><div><b>${it.t}</b> ${it.d}
        ${it.a?`<span class="ai-action">→ ${it.a}</span>`:''}</div></div>`).join('');
  }

  function table(headers, rows) {
    return `<div style="overflow-x:auto"><table class="tbl"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function funnel(steps) {
    const max = steps[0].v;
    return `<div class="funnel">${steps.map(s => {
      const w = Math.round((s.v/max)*100);
      return `<div class="fn-row"><div class="fn-label">${s.l}</div>
        <div class="fn-bar" style="width:${w}%">${fmtN(s.v)}</div>
        <div class="fn-pct">${pct(s.p)}</div></div>`;
    }).join('')}</div>`;
  }

  function brMap(items, metric) {
    const max = Math.max(...items.map(i => i.v));
    return `<div class="map-heat">
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="max-height:230px">
        <g transform="translate(4,6)">
        <path d="M45 88 C20 78 6 60 12 44 C16 34 22 30 30 22 C36 16 40 10 42 4 C60 2 74 6 84 16 C92 24 94 34 90 46 C86 60 76 76 62 86 C58 90 50 90 45 88 Z"
          fill="var(--panel3)" stroke="var(--line2)" stroke-width=".4"/>
        ${items.map(c => {
          const r = (0.5 + c.v/max*2.2);
          const op = 0.25 + c.v/max*0.75;
          const payload = JSON.stringify({cidade:c.cidade,uf:c.uf,v:c.v}).replace(/"/g,'&quot;');
          return `<circle class="map-dot" data-c="${payload}" cx="${c.lon*100}" cy="${c.lat*100}" r="${r}" fill="var(--accent)" fill-opacity="${op}" stroke="#04230f" stroke-width=".3" style="cursor:pointer">
            <title>${c.cidade} · ${c.uf} · ${metric}: ${fmtN(fval(c.v*3000))} (clique p/ detalhe)</title></circle>`;
        }).join('')}
        </g>
      </svg>
      <div class="heat-legend">
        <span class="heat-swatch" style="background:rgba(61,226,155,.25)"></span>
        <span class="heat-swatch" style="background:rgba(61,226,155,.55)"></span>
        <span class="heat-swatch" style="background:rgba(61,226,155,.9)"></span>
        <span>Baixa</span> → <b>Alta</b>
      </div>
    </div>`;
  }

  function aiSide(cards) {
    return cards.map(c => `
      <div class="ai-card">
        <div class="ai-c-head">${c.ic||'🤖'} ${c.t} ${c.tag?`<span class="badge ${c.tagCls||'ok'}">${c.tag}</span>`:''}</div>
        <p>${c.d}</p>
        ${c.btn?`<div class="ai-btn">${c.btn}</div>`:''}
      </div>`).join('');
  }

  // ---------- FILOSOFIA 4 PERGUNTAS ----------
  function qStrip() {
    const items = [
      ['1 · O que aconteceu?', 'Descritivo'],
      ['2 · Por que aconteceu?', 'Diagnóstico'],
      ['3 · O que acontecerá?', 'Predição'],
      ['4 · O que devemos fazer?', 'Prescrição IA'],
    ];
    $id('qStrip').innerHTML = items.map(i => `<div class="q-chip"><b>${i[0]}</b><span>${i[1]}</span></div>`).join('');
  }

  // ---------- DASHBOARD 01 · EXECUTIVE COMMAND CENTER ----------
  function dashExecutivo() {
    const d = dados;
    const f = factor();
    const receitaPeriodo = d.receita.mes * f;
    const receitaRealizado = (receitaPeriodo / (d.receita.meta * f)) * 100;
    const proj = d.receita.projetado * f;
    const content = `
      <div class="dash-head">
        <div class="dash-title"><h2>Executive Command Center</h2><p>Entenda a empresa em menos de 30 segundos · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div>
        <div class="dash-actions"><button class="btn btn-ghost" data-export>Exportar</button><button class="btn btn-accent" data-goto="financeiro">Ver Financeiro</button></div>
      </div>

      <div class="grid g-kpi">
        ${kpi({l:'Receita', v:fmt(receitaPeriodo), anim:receitaPeriodo, fmt:'brl', delta:12, cls:'accent', drill:'receita'})}
        ${kpi({l:'Realizado da meta', v:pct(receitaRealizado/100), sub:'meta '+fmt(d.receita.meta*f), bar:receitaRealizado, cls:'warn'})}
        ${kpi({l:'Projeção IA', v:fmt(proj), delta:9, cls:'violet'})}
        ${kpi({l:'CAC', v:fmt(fval(d.cac)), delta:-11, cls:'blue', drill:'cac'})}
        ${kpi({l:'LTV', v:fmt(fval(d.ltv)), delta:14})}
        ${kpi({l:'ROI', v:(d.roi*f).toFixed(1)+'x', delta:22, cls:'accent'})}
      </div>
      <div class="grid g-kpi">
        ${kpi({l:'MRR', v:fmt(d.mrr), sub:'recorrente'})}
        ${kpi({l:'Lucro', v:fmt(fval(d.lucro)), delta:18, cls:'accent'})}
        ${kpi({l:'Margem', v:pct(d.margem)})}
        ${kpi({l:'Conversão', v:pct(d.conversao), delta:6, cls:'blue'})}
        ${kpi({l:'Ticket Médio', v:fmt(d.ticket)})}
        ${kpi({l:'Tempo Médio Venda', v:d.tempoVenda+'d', delta:-8})}
      </div>
      <div class="grid g-kpi">
        ${kpi({l:'NPS', v:d.nps, delta:5, cls:'blue'})}
        ${kpi({l:'Referral Rate', v:pct(d.referralRate), delta:9, cls:'accent'})}
        ${kpi({l:'Viral Coef. (K)', v:d.viralK, delta:6, cls:'violet'})}
        ${kpi({l:'Churn', v:pct(d.churn), delta:-4, cls:'warn'})}
        ${kpi({l:'Lifetime', v:d.lifetime+'m', delta:11})}
        ${kpi({l:'Clientes Promotores', v:fmtN(fval(d.promovidos)), sub:'de '+fmtN(fval(d.ativos))+' ativos', cls:'accent', drill:'promotores'})}
      </div>

      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Mapa Inteligente · Calor de vendas/indicações', s:'clique nas cidades para drill-down', full:false, body: brMap(estados, 'indicadores')})}
        ${panel({t:'Funil de conversão (30d)', s:'indicações', body: funnel([
          {l:'Convites', v:21400, p:100}, {l:'Aceite', v:14200, p:66},
          {l:'Leads', v:11840, p:55}, {l:'Conversões', v:3670, p:31},
          {l:'Ativados', v:2980, p:25}
        ])})}
      </div>

      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Ranking Nacional', s:'Top parceiros', body: rankRows(
          parceiros.slice().sort((a,b)=>b.xp-a.xp).slice(0,5).map(p=>({n:p.nome, s:p.cidade+' · '+p.estado, v:fmtN(p.xp)+' XP'}))
        )})}
        ${panel({t:'Top Indicadores', s:'clientes destaque', body: rankRows([
          {n:'Marina L.', s:'Caxias do Sul', v:'142 indic.'}, {n:'Felipe T.', s:'Porto Alegre', v:'98 indic.'},
          {n:'Ana C.', s:'São Paulo', v:'87 indic.'}, {n:'Rafael M.', s:'Curitiba', v:'76 indic.'},
          {n:'Bruna S.', s:'Belo Horizonte', v:'64 indic.'}
        ])})}
      </div>

      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Evolução da receita', s:'descritivo + predição IA · clique nos pontos', body: lineChart(seriesReceita(), 560, 220)})}
        ${panel({t:'IA Executiva · Insights e prescrição', s:'atualizado em tempo real', body: aiInsights([
          {ic:'📈', t:'Porto Alegre cresceu 17%', d:'nesta semana, acima da média nacional.', a:'Investir R$50k em tráfego local'},
          {ic:'⚠️', t:'Parceiro Canoas II perdeu 23%', d:'da conversão nos últimos 7 dias.', a:'Agendar call com o gestor'},
          {ic:'💵', t:'Campanha cashback gerou ROI de 412%', d:'no período.', a:'Ampliar público em 30%'},
          {ic:'🔁', t:fval(38)+' clientes com alta probabilidade', d:'de realizar novas indicações.', a:'Ativar campanha de convite'}
        ])})}
      </div>
      <div class="grid g-3" style="margin-top:12px">
        ${panel({t:'Receita por região', s:'distribuição', body: hbars([
          {l:'Sudeste', v:38, c:'var(--blue)'},{l:'Sul', v:33, c:'var(--accent)'},{l:'Nordeste', v:15, c:'var(--gold)'},{l:'Centro-Oeste', v:9, c:'var(--violet)'},{l:'Norte', v:5, c:'var(--red)'}
        ])})}
        ${panel({t:'Parceiros em destaque', body: rankRows(parceiros.slice().sort((a,b)=>b.receita-a.receita).slice(0,3).map((p,i)=>({n:'⭐ '+p.nome, s:p.cidade+' · '+p.estado, v:fmt(fval(p.receita))})))})}
        ${panel({t:'IA · Recomendações estratégicas', body: aiInsights([
          {ic:'📊', t:'Previsão de crescimento +22%', d:'no próximo trimestre (Sul lidera).'},
          {ic:'🏪', t:'2 parceiros candidatos', d:'a expansão de território.'},
          {ic:'🎯', t:'380 promotores identificados', d:'com alta propensão a indicar.'}
        ])})}
      </div>
    `;
    return content;
  }

  // série de receita conforme período
  function seriesReceita() {
    const f = factor();
    if (periodo === 'hoje' || periodo === '7d') {
      return ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((l,i)=>({ l, v: Math.round(26000*f*(0.8+i*0.12)) }));
    }
    if (periodo === '30d') {
      return Array.from({length:7}, (_,i)=>({ l:['S1','S2','S3','S4','S5','S6','S7'][i], v: Math.round(420000*(0.82+i*0.06)) }));
    }
    if (periodo === '90d') {
      return ['Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun'].map((l,i)=>({ l, v: Math.round(1.9e6*(0.75+i*0.05)) }));
    }
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((l,i)=>({ l, v: Math.round(2.2e6*(0.7+i*0.06)) }));
  }

  // barras horizontais
  function hbars(items) {
    const max = Math.max(...items.map(i=>i.v));
    return items.map(i => `<div class="hbar"><div class="hb-label">${i.l}</div>
      <div class="hb-track"><div class="hb-fill" style="width:${(i.v/max)*100}%;background:${i.c}"></div></div>
      <div class="hb-val">${i.v}%</div></div>`).join('');
  }

  // ---------- REFERRAL ----------
  function dashReferral() {
    const d = dados.indicacoes;
    const f = factor();
    return `
      <div class="dash-head"><div class="dash-title"><h2>Dashboard Referral</h2><p>Coração do sistema de crescimento · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div>
      <div class="dash-actions"><button class="btn btn-accent" data-goto="gamificacao">Abrir Gamificação</button></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Indicações', v:fmtN(fval(d.mes)), anim:fval(d.mes), delta:21, cls:'accent', drill:'indicacoes'})}
        ${kpi({l:'Taxa Conversão', v:pct(d.convTaxa), delta:5, cls:'blue'})}
        ${kpi({l:'Valor Pago', v:fmt(fval(d.valorPago)), anim:fval(d.valorPago), fmt:'brl', cls:'accent'})}
        ${kpi({l:'Valor Pendente', v:fmt(fval(d.valorPendente)), cls:'warn'})}
        ${kpi({l:'Coef. Viral (K)', v:dados.viralK, delta:6, cls:'violet'})}
        ${kpi({l:'ROI Referral', v:(4.1*f).toFixed(1)+'x', delta:22, cls:'accent'})}
      </div>
      <div class="grid g-kpi">
        ${kpi({l:'Clientes Ativos', v:fmtN(fval(dados.ativos)), anim:fval(dados.ativos)})}
        ${kpi({l:'Clientes Promotores', v:fmtN(fval(dados.promovidos)), anim:fval(dados.promovidos), cls:'accent', drill:'promotores'})}
        ${kpi({l:'Clientes Inativos', v:fmtN(fval(dados.inativos)), cls:'warn'})}
        ${kpi({l:'NPS', v:dados.nps, cls:'blue'})}
        ${kpi({l:'Visualizações de convite', v:'24.1k', delta:17})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Funil de indicações', s:'convite → conversão · ' + PERIOD_LABEL[periodo], body: funnel([
          {l:'Convites enviados', v:fval(21400), p:100}, {l:'Links abertos', v:fval(15200), p:71},
          {l:'Cadastros', v:fval(11840), p:55}, {l:'Compras (referral)', v:fval(3670), p:17},
          {l:'Viral (indicou de novo)', v:fval(980), p:27}
        ])})}
        ${panel({t:'Rede de indicações · árvore', s:'clique nos nós para detalhe', body: redeArvore()})}
      </div>
      <div class="grid g-3" style="margin-top:12px">
        ${panel({t:'Top Indicadores', body: rankRows([
          {n:'Marina L.', s:'Caxias do Sul', v:'142'}, {n:'Felipe T.', s:'Porto Alegre', v:'98'}, {n:'Ana C.', s:'São Paulo', v:'87'}
        ])})}
        ${panel({t:'Por Estado', s:'distribuição', body: hbars([
          {l:'São Paulo', v:38, c:'var(--blue)'},{l:'Rio Grande do Sul', v:27, c:'var(--accent)'},{l:'Paraná', v:15, c:'var(--violet)'},{l:'Santa Catarina', v:11, c:'var(--gold)'},{l:'Outros', v:9, c:'var(--red)'}
        ])})}
        ${panel({t:'IA · Recomendações', s:'prescrição', body: aiInsights([
          {ic:'🔁', t:'980 clientes ativados', d:'não indicaram ainda.', a:'Campanha de convite'},
          {ic:'🎯', t:'Melhor horário', d:'18h–20h converte 2,3x mais.', a:'Agendar envios'},
          {ic:'📈', t:'Evolução semanal', d:'+21% de indicações no período.', a:'Manter campanhas'}
        ])})}
      </div>
    `;
  }

  // rede de indicações em árvore (clicável)
  function redeArvore() {
    const nos = [
      { id:'c', nome:'Cliente', v:142, x:50, y:12, raiz:true },
      { id:'c1', nome:'João P.', v:38, x:22, y:38 }, { id:'c2', nome:'Maria', v:44, x:50, y:40 }, { id:'c3', nome:'Lucas', v:31, x:78, y:38 },
      { id:'c11', nome:'Ana', v:12, x:12, y:64 }, { id:'c12', nome:'Bia', v:9, x:30, y:66 },
      { id:'c21', nome:'Caio', v:15, x:44, y:64 }, { id:'c22', nome:'Duda', v:11, x:58, y:66 },
      { id:'c31', nome:'Eva', v:8, x:72, y:64 }, { id:'c32', nome:'Fábio', v:6, x:86, y:66 },
    ];
    const links = [
      ['c','c1'],['c','c2'],['c','c3'],['c1','c11'],['c1','c12'],['c2','c21'],['c2','c22'],['c3','c31'],['c3','c32']
    ];
    const linksSvg = links.map(([a,b])=>{
      const A=nos.find(n=>n.id===a), B=nos.find(n=>n.id===b);
      return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="var(--line2)" stroke-width="1"/>`;
    }).join('');
    const nodesSvg = nos.map(n=>{
      const r = n.raiz?7:5;
      const payload = JSON.stringify({nome:n.nome,v:n.v}).replace(/"/g,'&quot;');
      return `<circle class="rede-node" data-c="${payload}" cx="${n.x}" cy="${n.y}" r="${r}" fill="${n.raiz?'var(--accent)':'var(--blue)'}" stroke="#04230f" stroke-width="1" style="cursor:pointer">
        <title>${n.nome} · ${n.v} indicações (clique p/ detalhe)</title></circle>`;
    }).join('');
    return `<svg viewBox="0 0 100 88" width="100%" height="200" preserveAspectRatio="xMidYMid meet">
      ${linksSvg}${nodesSvg}
    </svg>`;
  }

  // ---------- COMERCIAL ----------
  function dashComercial() {
    const f = factor();
    const pipeline = 4.8e6 * f, leads = fval(2340), fechados = fval(632), forecast = 3.9e6 * f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Dashboard Comercial</h2><p>Pipeline e equipe de vendas · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Pipeline', v:fmt(pipeline), anim:pipeline, fmt:'brl', delta:16, cls:'accent', drill:'pipeline'})}
        ${kpi({l:'Leads', v:fmtN(leads), anim:leads, delta:9})}
        ${kpi({l:'Conversão', v:pct(dados.conversao), delta:5, cls:'blue'})}
        ${kpi({l:'Tempo Médio', v:dados.tempoVenda+'d', delta:-8})}
        ${kpi({l:'Forecast', v:fmt(forecast), anim:forecast, fmt:'brl', cls:'violet'})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Funil de vendas', s:'lead → fechado · ' + PERIOD_LABEL[periodo], body: funnel([
          {l:'Leads', v:fval(2340), p:100}, {l:'Qualificados', v:fval(1490), p:64}, {l:'Proposta', v:fval(890), p:38}, {l:'Fechados', v:fval(632), p:27}
        ])})}
        ${panel({t:'Receita por vendedor', s:'ranking interno', body: rankRows([
          {n:'Vendedor #1 · Voltz', v:'R$ 214k'}, {n:'Vendedor #2 · Carga Elétrica', v:'R$ 198k'}, {n:'Vendedor #3 · BateriaMax', v:'R$ 176k'}
        ])})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Evolução do pipeline', s:'clique nos pontos', body: lineChart(seriesPipeline(), 560, 200)})}
        ${panel({t:'IA Comercial · Diagnóstico e prescrição', s:'4 perguntas', body: aiInsights([
          {ic:'🧊', t:fval(38)+' clientes esquecidos', d:'sem contato há 30+ dias.', a:'Ativar sequência de reativação'},
          {ic:'🔥', t:fval(112)+' leads quentes', d:'com alta probabilidade de fechar.', a:'Priorizar SDR nas próximas 2h'},
          {ic:'👑', t:'24 clientes VIP', d:'candidatos a up-sell.', a:'Enviar oferta exclusiva'},
          {ic:'⚠️', t:'Risco de perda', d:'6 contas com churn alto.', a:'Acionar CS imediatamente'}
        ])})}
      </div>
    `;
  }

  // série do pipeline conforme período
  function seriesPipeline() {
    const f = factor();
    if (periodo === 'hoje' || periodo === '7d') return ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((l,i)=>({ l, v: Math.round(420000*f*(0.75+i*0.1)) }));
    if (periodo === '30d') return Array.from({length:7},(_,i)=>({ l:['S1','S2','S3','S4','S5','S6','S7'][i], v: Math.round(680000*(0.7+i*0.09)) }));
    if (periodo === '90d') return ['Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun'].map((l,i)=>({ l, v: Math.round(2.8e6*(0.72+i*0.05)) }));
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((l,i)=>({ l, v: Math.round(3.4e6*(0.7+i*0.06)) }));
  }

  // ---------- FINANCEIRO ----------
  function dashFinanceiro() {
    const d = dados;
    const f = factor();
    const receita = d.receita.mes * f, bonif = d.custos.bonificacoes * f, custos = (d.custos.cacs + d.custos.bonificacoes + d.custos.mkt) * f;
    const ebitda = d.lucro * 1.3 * f, fluxo = 412000 * f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Dashboard Financeiro</h2><p>Receitas, custos e liquidez · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Receita', v:fmt(receita), anim:receita, fmt:'brl', delta:12, cls:'accent', drill:'receita'})}
        ${kpi({l:'Custos', v:fmt(custos), anim:custos, fmt:'brl', delta:4})}
        ${kpi({l:'Bonificações', v:fmt(bonif), anim:bonif, fmt:'brl', cls:'warn', drill:'bonificacoes'})}
        ${kpi({l:'Margem', v:pct(d.margem), delta:6, cls:'accent'})}
        ${kpi({l:'EBITDA', v:fmt(ebitda), anim:ebitda, fmt:'brl', delta:15, cls:'blue'})}
        ${kpi({l:'ROI', v:(d.roi*f).toFixed(1)+'x', delta:22, cls:'accent'})}
        ${kpi({l:'Fluxo de Caixa', v:'+'+fmt(fluxo), anim:fluxo, fmt:'brl', delta:8})}
        ${kpi({l:'Bonificações pendentes', v:fmt(fval(d.indicacoes.valorPendente)), cls:'warn'})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Composição de custos', s:PERIOD_LABEL[periodo], body: barSeries(
          [{l:'CAC',v:fval(384)},{l:'Marketing',v:fval(960)},{l:'Bonificação',v:fval(486)},{l:'Wallet',v:fval(310)},{l:'Op. SDR',v:fval(205)},{l:'Infra',v:fval(120)}],'var(--gold)')})}
        ${panel({t:'Fluxo de caixa', s:'entradas x saídas · clique nos pontos', body: lineChart(seriesFluxo(), 560, 200)})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Wallet · PIX · Liquidação', s:'operacional', body: table(
          ['Operação','Qtd','Valor','Status'],
          [['PIX pagos', '1.240', fmt(fval(948000)), '<span class="badge ok">ok</span>'],
           ['PIX pendentes', '412', fmt(fval(624000)), '<span class="badge warn">pendente</span>'],
           ['Bonificação ciclo', '196', fmt(fval(98000)), '<span class="badge ok">ok</span>'],
           ['Cashback', '1.480', fmt(fval(185000)), '<span class="badge ok">ok</span>']]
        )})}
        ${panel({t:'IA Financeira · Prescrição', body: aiInsights([
          {ic:'💵', t:'Margem saudável', d:'bonificações dentro do orçamento de CAC.', a:'Manter política'},
          {ic:'⚠️', t:'PIX pendentes', d:'R$ 624k a liquidar.', a:'Priorizar liquidação'},
          {ic:'📈', t:'ROI referral', d:(d.roi*f).toFixed(1)+'x no período.', a:'Ampliar investimento'}
        ])})}
      </div>
    `;
  }

  // série de fluxo de caixa
  function seriesFluxo() {
    const f = factor();
    if (periodo === 'hoje' || periodo === '7d') return ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((l,i)=>({ l, v: Math.round(180000*f*(0.7+i*0.12)) }));
    if (periodo === '30d') return Array.from({length:7},(_,i)=>({ l:['S1','S2','S3','S4','S5','S6','S7'][i], v: Math.round(460000*(0.78+i*0.07)) }));
    if (periodo === '90d') return ['Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun'].map((l,i)=>({ l, v: Math.round(1.9e6*(0.74+i*0.05)) }));
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((l,i)=>({ l, v: Math.round(2.3e6*(0.72+i*0.06)) }));
  }

  // ---------- MARKETING ----------
  function dashMarketing() {
    const f = factor();
    return `
      <div class="dash-head"><div class="dash-title"><h2>Dashboard Marketing</h2><p>Campanhas, mídia paga e ROAS · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'ROI', v:(3.2*f).toFixed(1)+'x', delta:14, cls:'accent'})}
        ${kpi({l:'ROAS', v:(4.4*f).toFixed(1)+'x', delta:18, cls:'accent'})}
        ${kpi({l:'CTR', v:pct(0.028), delta:6, cls:'blue'})}
        ${kpi({l:'CPL', v:fmt(fval(38)), delta:-9})}
        ${kpi({l:'CPA', v:fmt(fval(164)), delta:-11})}
        ${kpi({l:'CAC', v:fmt(fval(dados.cac)), delta:-11, cls:'blue', drill:'cac'})}
        ${kpi({l:'Conversão', v:pct(dados.conversao), delta:5})}
        ${kpi({l:'Investimento', v:fmt(fval(960000)), anim:fval(960000), fmt:'brl', delta:22})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Performance por canal', s:'Meta Ads · Google Ads · ' + PERIOD_LABEL[periodo], body: table(
          ['Canal','Gasto','Receita','ROAS','CTR'],
          [['Meta Ads', fmt(fval(420000)), fmt(fval(1900000)), (4.5*f).toFixed(1)+'x', '3,1%'],
           ['Google Ads', fmt(fval(340000)), fmt(fval(1400000)), (4.1*f).toFixed(1)+'x', '2,4%'],
           ['Referral', fmt(fval(200000)), fmt(fval(3400000)), (17*f).toFixed(0)+'x', '—']]
        )})}
        ${panel({t:'IA · Otimização', s:'criativos e público', body: aiInsights([
          {ic:'🏆', t:'Criativo campeão', d:'variante B gerou +34% CTR.', a:'Distribuir para todos os públicos'},
          {ic:'👥', t:'Melhor público', d:'18-34 · Sul · interesse em mobilidade.', a:'Aumentar investimento em 25%'},
          {ic:'🕒', t:'Melhor horário', d:'18h-21h tem ROAS 2x maior.', a:'Agendar campanhas'},
          {ic:'📍', t:'Melhor cidade', d:'Porto Alegre ROAS 6,1x.', a:'Expandir região metropolitana'}
        ])})}
      </div>
    `;
  }

  // ---------- IA ----------
  function dashIA() {
    return `
      <div class="dash-head"><div class="dash-title"><h2>Dashboard IA</h2><p>Scores, previsões, anomalias e alertas · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-6">
        ${[['Lead', 92, 'accent'],['Fraude', 8, 'red'],['Growth', 81, 'blue'],['Partner', 76, 'violet'],['Churn', 14, 'warn'],['Upsell', 68, 'gold']].map(([n,v,c])=>`
          <div class="kpi ${c==='accent'?'accent':c==='red'?'warn':c==='blue'?'blue':'violet'}">
            <div class="k-label">${n} Score</div>
            <div class="k-val">${v}</div>
            <div class="meter" style="margin-top:8px"><div style="width:${v}%"></div></div>
          </div>`).join('')}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Previsões (forecast)', s:'IA · próximos 30 dias', body: barSeries(
          [{l:'Vendas',v:'+18%'},{l:'Indicações',v:'+22%'},{l:'Receita',v:'+14%'},{l:'Churn',v:'-9%'},{l:'Conversão',v:'+6%'},{l:'LTV',v:'+11%'}],'var(--violet)')})}
        ${panel({t:'Anomalias e alertas', s:'deteção automática', body: aiInsights([
          {ic:'🚨', t:'Pico de fraude em Canoas II', d:'+340% bloqueios nas últimas 24h.', a:'Auditar tenant'},
          {ic:'📉', t:'Queda de conversão', d:'em Recife Volt (-23%).', a:'Investigar campanha'},
          {ic:'📈', t:'Crescimento anômalo', d:'em Porto Alegre (+17%).', a:'Identificar causa para replicar'}
        ])})}
      </div>
    `;
  }

  // ---------- ANALYTICS ----------
  function dashAnalytics() {
    const f = factor();
    const sessoes = fval(48200), cadastrou = fval(11840), comprou = fval(3670), ativou = fval(2980);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Analytics</h2><p>Funil, coortes, retenção e jornada · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Sessões', v:fmtN(sessoes), anim:sessoes, delta:12, cls:'blue', drill:'analytics'})}
        ${kpi({l:'Conversão Geral', v:'3,4%', delta:6})}
        ${kpi({l:'Retenção D30', v:'64%', delta:8, cls:'accent'})}
        ${kpi({l:'Lifetime', v:'30m', delta:11})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Coortes de retenção', s:'por mês de aquisição', body: table(
          ['Coorte','M1','M2','M3','M4'],
          [['Jan','100%','72%','61%','54%'],['Fev','100%','74%','63%','—'],['Mar','100%','76%','—','—'],['Abr','100%','—','—','—']]
        )})}
        ${panel({t:'Jornada do cliente', s:'estágios · ' + PERIOD_LABEL[periodo], body: funnel([
          {l:'Visitou', v:sessoes, p:100}, {l:'Cadastrou', v:cadastrou, p:25}, {l:'Comprou', v:comprou, p:31}, {l:'Ativou', v:ativou, p:25}, {l:'Indicou', v:fval(980), p:33}
        ])})}
      </div>
      ${panel({t:'Eventos de produto', s:'tracking · ' + PERIOD_LABEL[periodo], full:true, body: table(
        ['Evento','Volume','Fonte'],
        [['referral.created', fmtN(fval(11840)), 'App/WhatsApp'],['payment.confirmed', fmtN(fval(3670)), 'Checkout'],['user.activated', fmtN(fval(2980)), 'Onboarding'],['invite.opened', fmtN(fval(15200)), 'Link']]
      )})}
    `;
  }

  // ---------- WALLET / GAMIFICAÇÃO / AUDITORIA / PARCEIROS / SDR / ACADEMIA ----------
  function dashWallet() {
    const f = factor();
    const saldo = 1280000*f, pix = 86000*f, cashback = 185000*f, bonif = 98000*f, recomp = 948000*f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Wallet · Carteira Digital</h2><p>Saldo, extrato, cashback e recompensas · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Saldo Total', v:fmt(saldo), anim:saldo, fmt:'brl', cls:'accent', drill:'wallet'})}
        ${kpi({l:'PIX', v:fmt(pix), anim:pix, fmt:'brl', delta:15})}
        ${kpi({l:'Cashback emitido', v:fmt(cashback), anim:cashback, fmt:'brl'})}
        ${kpi({l:'Bonificações', v:fmt(bonif), anim:bonif, fmt:'brl', cls:'warn', drill:'bonificacoes'})}
        ${kpi({l:'Recompensas', v:fmt(recomp), anim:recomp, fmt:'brl', cls:'blue', drill:'indicacoes'})}
      </div>
      ${panel({t:'Extrato agregado', s:'últimas movimentações · ' + PERIOD_LABEL[periodo], full:true, body: table(
        ['Data','Cliente','Tipo','Valor','Status'],
        [['hoje','Marina L.','PIX resgate','R$ 200','<span class="badge ok">ok</span>'],
         ['hoje','João P.','Bonificação ciclo','R$ 500','<span class="badge ok">ok</span>'],
         ['ontem','Ana C.','Recompensa referral','R$ 200','<span class="badge ok">ok</span>'],
         ['ontem','Voltz','Cashback','R$ 1.200','<span class="badge warn">pendente</span>']]
      )})}
    `;
  }

  function dashGamificacao() {
    const f = factor();
    return `
      <div class="dash-head"><div class="dash-title"><h2>Gamificação</h2><p>XP, temporadas, ranking e conquistas · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Temporada Atual', v:'S3'})}
        ${kpi({l:'Jogadores ativos', v:fmtN(fval(8400)), anim:fval(8400), delta:18, cls:'accent', drill:'gamificacao'})}
        ${kpi({l:'XP emitido', v:fmtN(fval(2100000))+' XP', anim:fval(2100000), delta:12})}
        ${kpi({l:'Passe Premium', v:fval(1940), anim:fval(1940), delta:24, cls:'violet'})}
        ${kpi({l:'Conquistas liberadas', v:fmtN(fval(12400)), anim:fval(12400), delta:9})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Ranking Global', s:'top players', body: rankRows([
          {n:'Marina L.', s:'Lv 47 · Ouro', v:'12.4k XP'}, {n:'Felipe T.', s:'Lv 42 · Ouro', v:'11.1k XP'},
          {n:'Ana C.', s:'Lv 38 · Prata', v:'9.8k XP'}, {n:'Rafael M.', s:'Lv 35 · Prata', v:'8.6k XP'}
        ])})}
        ${panel({t:'Missões & conquistas', s:'mais recentes', body: aiInsights([
          {ic:'🎯', t:'Missão "Maratona 30 dias"', d:'84% de conclusão.', a:'Faltam 2 dias'},
          {ic:'🏅', t:'Badge "Guru de Indicação"', d:'liberada para 96 jogadores.'},
          {ic:'⚡', t:'Boost 2x XP', d:'ativo neste fim de semana.'}
        ])})}
      </div>
    `;
  }

  function dashAuditoria() {
    const f = factor();
    const eventos = fval(48200), tentativas = fval(312), bloqueadas = fval(47), fraudes = fval(3);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Auditoria & Segurança</h2><p>Logs, permissões, tentativas e trilha · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Eventos logados', v:fmtN(eventos), anim:eventos, cls:'blue'})}
        ${kpi({l:'Tentativas de acesso', v:fmtN(tentativas), anim:tentativas, drill:'auditoria'})}
        ${kpi({l:'Tentativas bloqueadas', v:bloqueadas, anim:bloqueadas, cls:'warn'})}
        ${kpi({l:'Alertas de fraude', v:fraudes, anim:fraudes, cls:'red'})}
      </div>
      ${panel({t:'Trilha de auditoria', s:'append-only · imutável · ' + PERIOD_LABEL[periodo], full:true, body: table(
        ['Hora','Camada','Ator','Ação','Tenant'],
        [['13:32','C1','Paula','campaign.create','Toda a rede'],
         ['13:28','C3','Carlos','goal.update','Mobilidade Vale'],
         ['13:15','C4','Maria','referral.staff_created','Carga Elétrica'],
         ['13:02','C5','Marina','wallet.withdrawn','—'],
         ['12:58','C2','Ana','lead.qualified','Sul']]
      )})}
    `;
  }

  function dashParceiros() {
    const f = factor();
    const receitaTotal = parceiros.reduce((s,p)=>s+p.receita,0) * f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Parceiros</h2><p>BI por parceiro, ranking e performance · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Parceiros ativos', v:fval(128), anim:fval(128), delta:14, cls:'accent'})}
        ${kpi({l:'Receita parceiros', v:fmt(receitaTotal), anim:receitaTotal, fmt:'brl', delta:17, drill:'receita'})}
        ${kpi({l:'Ticket médio', v:fmt(dados.ticket)})}
        ${kpi({l:'Média conversão', v:pct(dados.conversao), cls:'blue'})}
      </div>
      ${panel({t:'Ranking de parceiros', s:'por receita · ' + PERIOD_LABEL[periodo], full:true, body: table(
        ['#','Parceiro','Cidade','Receita','Conv.','XP'],
        parceiros.slice().sort((a,b)=>b.receita-a.receita).map((p,i)=>[i+1,p.nome,p.cidade,fmt(fval(p.receita)),fval(p.conv),p.xp])
      )})}
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Receita por região', s:'distribuição', body: hbars([
          {l:'Sudeste', v:44, c:'var(--blue)'},{l:'Sul', v:36, c:'var(--accent)'},{l:'Nordeste', v:12, c:'var(--gold)'},{l:'Outros', v:8, c:'var(--violet)'}
        ])})}
        ${panel({t:'IA · Por parceiro', s:'prescrição', body: aiInsights([
          {ic:'💡', t:'Como vender mais', d:'Voltz: up-sell para 240 clientes ativos.'},
          {ic:'🚀', t:'Qual campanha lançar', d:'BateriaMax: cashback na região Sudeste.'},
          {ic:'👤', t:'Quem pode indicar', d:'Carga Elétrica: 88 clientes promotores.'},
          {ic:'🕓', t:'Quem está inativo', d:'Canoas II: 41 clientes a reativar.'}
        ])})}
      </div>
    `;
  }

  function dashSDR() {
    const f = factor();
    const fila = fval(312);
    return `
      <div class="dash-head"><div class="dash-title"><h2>SDR · Fila Inteligente</h2><p>Priorização por IA e SLA · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Fila de leads', v:fmtN(fila), anim:fila, cls:'accent', drill:'sdr_fila'})}
        ${kpi({l:'Score médio', v:'68', cls:'blue'})}
        ${kpi({l:'Tempo espera', v:'4min', delta:-9})}
        ${kpi({l:'SLA cumprido', v:'94%', cls:'accent'})}
      </div>
      ${panel({t:'Fila inteligente', s:'ordem por score IA · prioridade', full:true, body: table(
        ['Lead','Origem','Score','Prioridade','Ação'],
        [['Maria (ind. Ana)','Referral','92','<span class="badge red">Alta</span>','WhatsApp'],
         ['João (ind. Pedro)','Referral','84','<span class="badge warn">Alta</span>','Ligação'],
         ['Lucas','Meta Ads','71','<span class="badge blue">Média</span>','WhatsApp'],
         ['Fernanda','Google','54','<span class="badge">Baixa</span>','E-mail']]
      )})}
      ${panel({t:'IA · Prescrição SDR', s:'quem, quando e como', full:true, body: aiInsights([
        {ic:'📞', t:'Quem ligar primeiro', d:'Maria tem 92% de chance de fechar.', a:'Ligar agora'},
        {ic:'🕒', t:'Melhor horário', d:'18h-20h (conversão 2,3x).', a:'Agendar follow-ups'},
        {ic:'💬', t:'Script recomendado', d:'mencionar quem indicou aumenta confiança.'}
      ])})}
    `;
  }

  function dashAcademia() {
    const f = factor();
    const alunos = fval(2140), horas = fval(1800), certif = fval(1020);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Academia iGotUp</h2><p>Treinamentos, certificações e performance · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Alunos', v:fmtN(alunos), anim:alunos, delta:16, cls:'accent'})}
        ${kpi({l:'Cursos', v:'24'})}
        ${kpi({l:'Horas de treino', v:'1.8k', delta:12})}
        ${kpi({l:'Certificações', v:fmtN(certif), anim:certif, cls:'blue'})}
      </div>
      <div class="grid g-2" style="margin-top:12px">
        ${panel({t:'Performance por curso', s:'inscrições no período', body: table(
          ['Curso','Inscritos','Conclusão'],
          [['Como indicar', fmtN(fval(1200)), '82%'],['Vendas consultivas', fmtN(fval(840)), '71%'],['Uso da plataforma', fmtN(fval(980)), '88%'],['Atendimento ao cliente', fmtN(fval(620)), '65%']]
        )})}
        ${panel({t:'Ranking de aprendizado', body: rankRows([
          {n:'Maria', s:'Voltz', v:'12 cursos'}, {n:'Carlos', s:'Carga Elétrica', v:'10 cursos'}, {n:'Bia', s:'BateriaMax', v:'9 cursos'}
        ])})}
      </div>
    `;
  }

  // ---------- PRODUTOS / OPERAÇÕES / CS / AFILIADOS / PERFORMANCE / SEGURANÇA / CRM ----------
  function dashProdutos() {
    const f = factor();
    const gmv = 3200000*f, upwatch = 2140000*f, bateria = 392000*f, kit = 438000*f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Produtos</h2><p>Catálogo, venda e marketplace · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Produtos', v:'38'})}
        ${kpi({l:'Mais vendido', v:'UpWatch Pulse', cls:'accent'})}
        ${kpi({l:'GMV', v:fmt(gmv), anim:gmv, fmt:'brl', delta:15, drill:'produtos'})}
        ${kpi({l:'Ticket médio', v:fmt(dados.ticket), cls:'blue'})}
      </div>
      ${panel({t:'Performance de produtos', s:PERIOD_LABEL[periodo], full:true, body: table(
        ['Produto','Unid.','Receita','Margem'],
        [['UpWatch Pulse', fmtN(fval(2140)), fmt(upwatch), '42%'],['Bateria externa Pro', fmtN(fval(980)), fmt(bateria), '38%'],['Kit acessórios', fmtN(fval(1460)), fmt(kit), '51%']]
      )})}
    `;
  }

  function dashOperacoes() {
    const f = factor();
    const tickets = fval(118), incidentes = fval(4);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Operações</h2><p>SLA, incidentes e escala · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'SLA cumprido', v:'96%', cls:'accent'})}
        ${kpi({l:'Incidentes', v:incidentes, anim:incidentes, delta:-5})}
        ${kpi({l:'Tickets', v:fmtN(tickets), anim:tickets, cls:'blue', drill:'operacoes'})}
        ${kpi({l:'Tempo resposta', v:'1,8h', delta:-12})}
      </div>
      ${panel({t:'Status de processos', s:PERIOD_LABEL[periodo], full:true, body: table(
        ['Processo','SLA','Cumprido'],
        [['Qualificação SDR','< 4h','<span class="badge ok">Sim</span>'],['Liquidação recompensa','≤ 7d','<span class="badge ok">Sim</span>'],['Onboarding parceiro','≤ 5d','<span class="badge warn">2 em atraso</span>']]
      )})}
    `;
  }

  function dashCS() {
    const f = factor();
    const inativos = fval(6400), promotores = fval(3800);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Customer Success</h2><p>Ativação, retenção e NPS · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'NPS', v:dados.nps, delta:5, cls:'blue'})}
        ${kpi({l:'Ativação', v:'78%', delta:7, cls:'accent'})}
        ${kpi({l:'Churn', v:pct(dados.churn), delta:-4, cls:'warn'})}
        ${kpi({l:'Recompra', v:'34%', delta:9})}
      </div>
      ${panel({t:'IA · Retenção', s:'diagnóstico e prescrição · ' + PERIOD_LABEL[periodo], full:true, body: aiInsights([
        {ic:'⚠️', t:fmtN(inativos)+' clientes inativos', d:'há 45+ dias.', a:'Campanha de reativação'},
        {ic:'💬', t:'NPS baixo', d:'em Recife Volt (42).', a:'Plano de retenção local'},
        {ic:'🌟', t:fmtN(promotores)+' promotores', d:'clientes com NPS 9-10.', a:'Convidar para embaixadores'}
      ])})}
    `;
  }

  function dashAfiliados() {
    const f = factor();
    const afiliados = fval(412), receita = 640000*f, comissoes = 52000*f;
    return `
      <div class="dash-head"><div class="dash-title"><h2>Afiliados</h2><p>Programa de afiliados e influenciadores · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Afiliados ativos', v:fmtN(afiliados), anim:afiliados, delta:21, cls:'accent'})}
        ${kpi({l:'Receita afiliados', v:fmt(receita), anim:receita, fmt:'brl', delta:19, drill:'afiliados'})}
        ${kpi({l:'ROAS', v:(6.2*f).toFixed(1)+'x', cls:'accent'})}
        ${kpi({l:'Comissões', v:fmt(comissoes), anim:comissoes, fmt:'brl'})}
      </div>
      ${panel({t:'Top afiliados', s:PERIOD_LABEL[periodo], full:true, body: table(
        ['Afiliado','Canal','Conversões','Comissão'],
        [['Influencer A','Instagram', fmtN(fval(214)), fmt(fval(16000))],['Criador B','YouTube', fmtN(fval(178)), fmt(fval(13000))],['Blog C','Blog', fmtN(fval(142)), fmt(fval(11000))]]
      )})}
    `;
  }

  function dashPerformance() {
    const f = factor();
    const erros = fval(400);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Performance & Infra</h2><p>APIs, banco, filas, cache e recursos · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Uptime', v:'99,98%', cls:'accent'})}
        ${kpi({l:'Latência API', v:'218ms', cls:'blue'})}
        ${kpi({l:'Erros', v:(0.4*f).toFixed(1)+'%', delta:-2, drill:'performance'})}
        ${kpi({l:'CPU', v:'42%'})}
        ${kpi({l:'Memória', v:'58%'})}
      </div>
      ${panel({t:'Microserviços', s:'saúde por serviço · ' + PERIOD_LABEL[periodo], full:true, body: table(
        ['Serviço','Latência','Erros','Status'],
        [['referral','140ms','0,2%','<span class="badge ok">ok</span>'],['wallet','95ms','0,1%','<span class="badge ok">ok</span>'],['gamification','220ms','0,3%','<span class="badge ok">ok</span>'],['ai-scoring','1.1s','0,8%','<span class="badge warn">lento</span>']]
      )})}
    `;
  }

  function dashSeguranca() {
    const f = factor();
    const sessoes = fval(3200), ip = fval(1900), ameacas = fval(47);
    return `
      <div class="dash-head"><div class="dash-title"><h2>Segurança</h2><p>Autenticação, permissões e ameaças · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Sessões ativas', v:fmtN(sessoes), anim:sessoes, drill:'seguranca'})}
        ${kpi({l:'IPs únicos', v:fmtN(ip), anim:ip, cls:'blue'})}
        ${kpi({l:'Ameaças bloqueadas', v:ameacas, anim:ameacas, cls:'warn'})}
        ${kpi({l:'MFA habilitado', v:'98%', cls:'accent'})}
      </div>
      ${panel({t:'Controle de acesso', s:PERIOD_LABEL[periodo], full:true, body: table(
        ['Usuário','Camada','Permissão','Última ação'],
        [['Paula','C1','Admin total','hoje 13:32'],['Carlos','C3','Gestor loja','hoje 13:28'],['Maria','C4','Vendedor','hoje 13:15']]
      )})}
    `;
  }

  function dashCRM() {
    const f = factor();
    const contatos = fval(86000), leads = fval(2340), oportunidades = fval(890), clientes = fval(21200);
    return `
      <div class="dash-head"><div class="dash-title"><h2>CRM</h2><p>Contatos, pipelines e lifecycle · período: <b style="color:var(--accent)">${PERIOD_LABEL[periodo]}</b></p></div></div>
      <div class="grid g-kpi">
        ${kpi({l:'Contatos', v:fmtN(contatos), anim:contatos, cls:'blue'})}
        ${kpi({l:'Leads', v:fmtN(leads), anim:leads, cls:'accent', drill:'crm_leads'})}
        ${kpi({l:'Oportunidades', v:fmtN(oportunidades), anim:oportunidades, cls:'blue'})}
        ${kpi({l:'Clientes', v:fmtN(clientes), anim:clientes})}
      </div>
      ${panel({t:'Pipeline de vendas', s:PERIOD_LABEL[periodo], full:true, body: funnel([
        {l:'Novo', v:leads, p:100}, {l:'Qualificado', v:fval(1490), p:64}, {l:'Proposta', v:oportunidades, p:38}, {l:'Ganho', v:fval(632), p:27}
      ])})}
    `;
  }

  // ---------- Mapa de dashboards ----------
  const DASHBOARDS = {
    executivo: { label: 'Executive Command Center', ic: '🏛️', grupo: 'Visão Geral', render: dashExecutivo },
    comercial: { label: 'Comercial', ic: '📈', grupo: 'Visão Geral', render: dashComercial },
    growth: { label: 'Growth', ic: '🚀', grupo: 'Visão Geral', render: dashExecutivo },
    referral: { label: 'Referral', ic: '🔁', grupo: 'Growth', render: dashReferral },
    parceiros: { label: 'Parceiros', ic: '🏪', grupo: 'Growth', render: dashParceiros },
    crm: { label: 'CRM', ic: '🗂️', grupo: 'Growth', render: dashCRM },
    sdr: { label: 'SDR', ic: '📞', grupo: 'Vendas', render: dashSDR },
    marketing: { label: 'Marketing', ic: '📣', grupo: 'Vendas', render: dashMarketing },
    financeiro: { label: 'Financeiro', ic: '💰', grupo: 'Operações', render: dashFinanceiro },
    operacoes: { label: 'Operações', ic: '⚙️', grupo: 'Operações', render: dashOperacoes },
    cs: { label: 'Customer Success', ic: '🤝', grupo: 'Operações', render: dashCS },
    ia: { label: 'IA', ic: '🧠', grupo: 'Dados & IA', render: dashIA },
    academia: { label: 'Academia', ic: '🎓', grupo: 'Dados & IA', render: dashAcademia },
    afiliados: { label: 'Afiliados', ic: '🤳', grupo: 'Dados & IA', render: dashAfiliados },
    gamificacao: { label: 'Gamificação', ic: '🎮', grupo: 'Dados & IA', render: dashGamificacao },
    produtos: { label: 'Produtos', ic: '📦', grupo: 'Dados & IA', render: dashProdutos },
    wallet: { label: 'Wallet', ic: '👛', grupo: 'Financeiro', render: dashWallet },
    auditoria: { label: 'Auditoria', ic: '📜', grupo: 'Financeiro', render: dashAuditoria },
    seguranca: { label: 'Segurança', ic: '🛡️', grupo: 'Financeiro', render: dashSeguranca },
    performance: { label: 'Performance', ic: '⚡', grupo: 'Financeiro', render: dashPerformance },
    analytics: { label: 'Analytics', ic: '📊', grupo: 'Financeiro', render: dashAnalytics },
  };

  // ---------- IA por dashboard (painel lateral) ----------
  const AI_PANEL = {
    executivo: [
      { t:'Receita', tag:'+12%', tagCls:'ok', d:'Receita de hoje 12% acima da média diária do mês.', btn:'Ver diagnóstico', ic:'💰' },
      { t:'Previsão IA', tag:'R$3,9mi', tagCls:'violet', d:'Projeção do mês supera a meta em 4,5%.', btn:'Explorar forecast', ic:'🔮' },
      { t:'Ação recomendada', tag:'Prioridade', tagCls:'warn', d:'Porto Alegre cresce 17% — expandir investimento local.', btn:'Aplicar', ic:'🎯' },
    ],
    referral: [
      { t:'Viral K = 1,12', tag:'Saudável', tagCls:'ok', d:'Crescimento autossustentável. Recomenda-se manter o ritmo.', ic:'🔁' },
      { t:'Conversão', tag:'31%', tagCls:'ok', d:'Acima da meta (25%). Bônus de ciclo impulsionou a alta.', ic:'📈' },
      { t:'Prescrição', tag:'IA', tagCls:'violet', d:'980 ativados ainda não indicaram. Ativar campanha de convite.', btn:'Criar campanha', ic:'🚀' },
    ],
    comercial: [
      { t:'Leads quentes', tag:'112', tagCls:'red', d:'Alta chance de fechar. Priorizar SDR.', btn:'Ver fila', ic:'🔥' },
      { t:'Risco de perda', tag:'6 contas', tagCls:'warn', d:'Acionar CS imediatamente.', ic:'⚠️' },
    ],
    financeiro: [
      { t:'Margem', tag:'23%', tagCls:'ok', d:'Bonificações dentro do orçamento de CAC.', ic:'💰' },
      { t:'Liquidez', tag:'+R$412k', tagCls:'ok', d:'Fluxo positivo no mês.', ic:'💵' },
    ],
    ia: [
      { t:'Pico de fraude', tag:'Canoas II', tagCls:'red', d:'+340% bloqueios. Auditar tenant.', btn:'Auditar', ic:'🚨' },
    ],
  };

  function aiPanelFor(view) {
    const items = AI_PANEL[view] || AI_PANEL.executivo;
    $id('aiBody').innerHTML = `
      <div class="ai-section">Resumo executivo</div>
      ${aiSide(items)}
      <div class="ai-section">Scores</div>
      <div class="ai-card ai-score">
        ${[['Lead',92],['Growth',81],['Fraude',8],['Partner',76]].map(([n,v])=>`
          <div class="ai-score-row"><div class="row-top"><span>${n}</span><b>${v}</b></div>
          <div class="meter"><div style="width:${v}%"></div></div></div>`).join('')}
      </div>
      <div class="ai-section">Anomalias</div>
      <div class="ai-card"><p>📉 Queda de conversão em Recife Volt (-23%).</p></div>
    `;
  }

  // ---------- Renderização ----------
  let currentView = 'executivo';

  // ---------- MOTOR DE PERÍODO ----------
  let periodo = '30d';
  // fatores que escalam os dados demo por período
  const PERIOD_FACTOR = { hoje: 0.035, '7d': 0.24, '30d': 1, '90d': 2.9, '12m': 11 };
  const PERIOD_LABEL = { hoje: 'Hoje', '7d': 'últimos 7 dias', '30d': 'últimos 30 dias', '90d': 'últimos 90 dias', '12m': 'últimos 12 meses' };

  function factor() { return PERIOD_FACTOR[periodo] || 1; }
  function fval(v) { return Math.round(v * factor()); }

  // ---------- ANIMAÇÃO DE CONTAGEM ----------
  function animateCount(el, target, formatter) {
    const dur = 650, start = performance.now();
    const from = 0;
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * eased;
      el.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- TOOLTIP ----------
  const tip = $id('tooltip');
  function showTip(html, ev) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 12, y = ev.clientY + 12;
    if (x + r.width > innerWidth) x = ev.clientX - r.width - 12;
    if (y + r.height > innerHeight) y = ev.clientY - r.height - 12;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }

  function renderNav() {
    const groups = {};
    Object.values(DASHBOARDS).forEach(d => { (groups[d.grupo] = groups[d.grupo] || []).push(d); });
    $id('sideNav').innerHTML = Object.keys(groups).map(g => `
      <div class="nav-group">
        <div class="nav-group-label">${g}</div>
        ${groups[g].map(d => `<div class="nav-item" data-view="${Object.keys(DASHBOARDS).find(k=>DASHBOARDS[k]===d)}">
          <span class="ic">${d.ic}</span> ${d.label}</div>`).join('')}
      </div>`).join('');
    $$('.nav-item').forEach(it => it.classList.toggle('active', it.dataset.view === currentView));
  }

  function render() {
    const d = DASHBOARDS[currentView];
    $id('crumb').textContent = d.label;
    $id('content').innerHTML = d.render();
    aiPanelFor(currentView);
    $$('[data-goto]').forEach(b => b.addEventListener('click', () => go(b.dataset.goto)));
    // animar KPIs numéricos
    $$('#content .anim').forEach(el => {
      const target = Number(el.dataset.val);
      const fmtType = el.dataset.fmt;
      animateCount(el, target, fmtType === 'brl' ? v => fmt(v) : v => Math.round(v).toLocaleString('pt-BR'));
    });
  }

  function go(view) {
    if (!DASHBOARDS[view]) view = 'executivo';
    currentView = view;
    renderNav();
    render();
    $id('content').scrollTop = 0;
  }

  // ---------- Alertas ----------
  const ALERTS = [
    { ic: '🚨', t: 'Pico de fraude em Canoas II', d: '+340% bloqueios nas últimas 24h.' },
    { ic: '📉', t: 'Conversão caiu em Recife Volt', d: '-23% nos últimos 7 dias.' },
    { ic: '📈', t: 'Crescimento em Porto Alegre', d: '+17% na semana.' },
  ];
  function toggleAlerts() {
    const el = $id('alerts');
    el.hidden = !el.hidden;
    if (!el.hidden) el.innerHTML = `<h4>🔔 Alertas críticos</h4>${ALERTS.map(a=>`<div class="alert-item"><span>${a.ic}</span><div><b>${a.t}</b><div style="color:var(--dim);font-size:11.5px">${a.d}</div></div></div>`).join('')}`;
  }

  // ---------- Busca global ----------
  function bindSearch() {
    const input = $id('globalSearch');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      // match em parceiros
      const p = parceiros.find(p => p.nome.toLowerCase().includes(q));
      if (p) { toast('Parceiro: ' + p.nome + ' · ' + p.cidade); go('parceiros'); }
      else if (['referral','indicação','indicacao'].some(k=>q.includes(k))) go('referral');
      else if (['financeiro','receita','cac','ltv','roi'].some(k=>q.includes(k))) go('financeiro');
    });
  }

  function toast(msg) { const t=$id('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2400); }

  // ---------- Eventos globais ----------
  function bindEvents() {
    document.addEventListener('click', e => {
      const nav = e.target.closest('.nav-item');
      if (nav) { go(nav.dataset.view); return; }

      // seletor de período
      const pBtn = e.target.closest('#periodSeg button');
      if (pBtn) { periodo = pBtn.dataset.p; $$('#periodSeg button').forEach(b=>b.classList.remove('active')); pBtn.classList.add('active'); render(); toast('Período: ' + PERIOD_LABEL[periodo]); return; }

      // exportar
      if (e.target.closest('[data-export]')) { toast('Exportação iniciada (CSV) — demo'); return; }

      // drill-down de KPI
      const kp = e.target.closest('[data-drill]');
      if (kp) { openDrill(kp.dataset.drill); return; }

      // drill do mapa
      const mdot = e.target.closest('.map-dot');
      if (mdot) { const c = JSON.parse(mdot.dataset.c); openCidadeDrill(c); return; }

      // nó da rede de indicações
      const rn = e.target.closest('.rede-node');
      if (rn) { const c = JSON.parse(rn.dataset.c); openRedeDrill(c); return; }

      if (e.target.closest('.drill-close')) { $id('drill').hidden = true; return; }
      if (e.target.closest('.drill-modal') && e.target.classList.contains('drill-modal')) { $id('drill').hidden = true; return; }
    });

    // tooltip nos pontos do gráfico
    document.addEventListener('mousemove', e => {
      const dot = e.target.closest('.lc-dot');
      if (dot) { showTip(`<div class="t-l">${dot.dataset.x}</div><div class="t-v">${fmt(Number(dot.dataset.v)*factor())}</div>`, e); }
      else hideTip();
    });

    $id('toggleSide').addEventListener('click', () => $id('side').classList.toggle('collapsed'));
    $id('aiToggle').addEventListener('click', () => $id('aiPanel').classList.toggle('collapsed'));
    $id('alertsBtn').addEventListener('click', toggleAlerts);
    $id('layerSel').addEventListener('change', e => {
      const map = { 'C1 · Admin Matriz':'C1','C2 · Equipe Matriz':'C2','C3 · Gestor Parceiro':'C3','C4 · Equipe Parceiro':'C4','C5 · Cliente':'C5' };
      toast('Camada ' + map[e.target.value] + ' — dados restritos ao nível de acesso');
    });
  }

  // ---------- Drill-down de KPIs ----------
  function openDrill(tipo) {
    const f = factor();
    const map = {
      receita: { t:'Detalhamento de Receita', sub:'por parceiro e região · ' + PERIOD_LABEL[periodo], rows:[
        ['Parceiro','Cidade','Receita'], ...parceiros.slice().sort((a,b)=>b.receita-a.receita).map(p=>[p.nome,p.cidade,fmt(fval(p.receita))])
      ]},
      cac: { t:'Análise de CAC', sub:'custo de aquisição por canal · ' + PERIOD_LABEL[periodo], rows:[
        ['Canal','CAC','Investimento'],
        ['Referral', fmt(fval(52)), fmt(fval(200000))],
        ['Tráfego pago', fmt(fval(164)), fmt(fval(960000))],
        ['Afiliados', fmt(fval(89)), fmt(fval(420000))],
        ['Orgânico', fmt(fval(38)), fmt(fval(110000))]
      ]},
      promotores: { t:'Clientes Promotores', sub:'defensores da marca', rows:[
        ['Grupo','Clientes','NPS'],
        ['Promotores', fmtN(fval(3800)), '84'],
        ['Neutros', fmtN(fval(11200)), '62'],
        ['Detratores', fmtN(fval(6200)), '21']
      ]},
      indicacoes: { t:'Detalhamento de Indicações', sub:'por canal e status · ' + PERIOD_LABEL[periodo], rows:[
        ['Origem','Indicações','Conversão'],
        ['App/WhatsApp', fmtN(fval(6400)), '34%'],
        ['Lojas parceiras', fmtN(fval(3100)), '29%'],
        ['Afiliados', fmtN(fval(1500)), '26%'],
        ['E-mail', fmtN(fval(840)), '19%']
      ]},
      pipeline: { t:'Detalhamento do Pipeline', sub:'por estágio · ' + PERIOD_LABEL[periodo], rows:[
        ['Estágio','Oportunidades','Valor'],
        ['Novo', fval(2340), fmt(fval(4800000))],
        ['Qualificado', fval(1490), fmt(fval(3100000))],
        ['Proposta', fval(890), fmt(fval(1900000))],
        ['Ganho', fval(632), fmt(fval(1400000))]
      ]},
      bonificacoes: { t:'Detalhamento de Bonificações', sub:'por tipo · ' + PERIOD_LABEL[periodo], rows:[
        ['Tipo','Valor','Qtd'],
        ['Recompensa indicação', fmt(fval(948000)), fval(11840)],
        ['Bônus de ciclo', fmt(fval(98000)), fval(196)],
        ['Cashback', fmt(fval(185000)), fval(1480)],
        ['Wallet PIX', fmt(fval(624000)), fval(412)]
      ]},
      wallet: { t:'Detalhamento da Carteira', sub:'composição do saldo · ' + PERIOD_LABEL[periodo], rows:[
        ['Tipo','Valor'],
        ['Recompensas referral', fmt(fval(948000))],
        ['Bonificações de ciclo', fmt(fval(98000))],
        ['Cashback', fmt(fval(185000))],
        ['Resgates PIX em processamento', fmt(fval(624000))]
      ]},
      gamificacao: { t:'Detalhamento da Gamificação', sub:'mecânicas ativas · ' + PERIOD_LABEL[periodo], rows:[
        ['Mecânica','Participantes'],
        ['Passe Premium', fval(1940)],
        ['Missões semanais', fval(4200)],
        ['Clãs ativos', fval(380)],
        ['Desafios concluídos', fval(8900)]
      ]},
      sdr_fila: { t:'Detalhamento da Fila SDR', sub:'por prioridade · ' + PERIOD_LABEL[periodo], rows:[
        ['Prioridade','Leads','Score médio'],
        ['Alta', fval(96), 88],
        ['Média', fval(128), 71],
        ['Baixa', fval(88), 54]
      ]},
      analytics: { t:'Detalhamento Analytics', sub:'funil por origem · ' + PERIOD_LABEL[periodo], rows:[
        ['Origem','Sessões','Conversão'],
        ['Referral', fmtN(fval(21400)), '31%'],
        ['Tráfego pago', fmtN(fval(16800)), '18%'],
        ['Orgânico', fmtN(fval(10000)), '22%']
      ]},
      produtos: { t:'Detalhamento de Produtos', sub:'vendas por SKU · ' + PERIOD_LABEL[periodo], rows:[
        ['Produto','Unid.','Receita'],
        ['UpWatch Pulse', fmtN(fval(2140)), fmt(fval(2140000))],
        ['Bateria Pro', fmtN(fval(980)), fmt(fval(392000))],
        ['Kit acessórios', fmtN(fval(1460)), fmt(fval(438000))]
      ]},
      operacoes: { t:'Detalhamento de Operações', sub:'tickets por categoria · ' + PERIOD_LABEL[periodo], rows:[
        ['Categoria','Tickets'],
        ['Suporte', fval(52)],
        ['Parceiros', fval(34)],
        ['Financeiro', fval(22)],
        ['Técnico', fval(10)]
      ]},
      afiliados: { t:'Detalhamento de Afiliados', sub:'performance por canal · ' + PERIOD_LABEL[periodo], rows:[
        ['Canal','Afiliados','Receita'],
        ['Instagram', fval(180), fmt(fval(280000))],
        ['YouTube', fval(120), fmt(fval(220000))],
        ['Blogs', fval(70), fmt(fval(100000))]
      ]},
      performance: { t:'Detalhamento de Performance', sub:'erros por serviço · ' + PERIOD_LABEL[periodo], rows:[
        ['Serviço','Erros','Latência'],
        ['referral', '0,2%', '140ms'],
        ['wallet', '0,1%', '95ms'],
        ['gamification', '0,3%', '220ms'],
        ['ai-scoring', '0,8%', '1.1s']
      ]},
      seguranca: { t:'Detalhamento de Segurança', sub:'eventos por tipo · ' + PERIOD_LABEL[periodo], rows:[
        ['Tipo','Eventos'],
        ['Logins', fval(2100)],
        ['Tentativas falhas', fval(312)],
        ['Bloqueios', fval(47)],
        ['Alertas fraude', fval(3)]
      ]},
      crm_leads: { t:'Detalhamento de Leads', sub:'por origem · ' + PERIOD_LABEL[periodo], rows:[
        ['Origem','Leads'],
        ['Referral', fval(1140)],
        ['Tráfego pago', fval(760)],
        ['Orgânico', fval(340)],
        ['Afiliados', fval(100)]
      ]},
      auditoria: { t:'Detalhamento de Auditoria', sub:'ações por camada · ' + PERIOD_LABEL[periodo], rows:[
        ['Camada','Ações'],
        ['C1 · Admin', fval(8400)],
        ['C2 · Equipe Matriz', fval(16400)],
        ['C3 · Gestor', fval(11200)],
        ['C4 · Equipe', fval(7200)],
        ['C5 · Cliente', fval(5000)]
      ]}
    };
    const d = map[tipo];
    if (!d) return;
    $id('drill').hidden = false;
    $id('drill').innerHTML = `<div class="drill-box"><button class="drill-close">✕</button><h3>${d.t}</h3><div class="d-sub">${d.sub}</div>
      <table class="tbl"><thead><tr>${d.rows[0].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${d.rows.slice(1).map(r=>`<tr>${r.map(c=>`<td class="num">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- Drill-down de cidade ----------
  function openCidadeDrill(c) {
    const f = factor();
    const pars = parceiros.filter(p => p.estado === c.uf || p.cidade === c.cidade);
    $id('drill').hidden = false;
    $id('drill').innerHTML = `<div class="drill-box"><button class="drill-close">✕</button>
      <h3>${c.cidade} · ${c.uf}</h3><div class="d-sub">Indicadores de vendas e indicações · ${PERIOD_LABEL[periodo]}</div>
      <div class="grid g-kpi" style="margin-bottom:12px">
        <div class="kpi"><div class="k-label">Indicadores</div><div class="k-val">${fmtN(fval(Math.round(c.v*3000)))}</div></div>
        <div class="kpi accent"><div class="k-label">Conversões</div><div class="k-val">${fmtN(fval(Math.round(c.v*900)))}</div></div>
        <div class="kpi blue"><div class="k-label">Receita</div><div class="k-val">${fmt(fval(Math.round(c.v*2200000)))}</div></div>
      </div>
      ${pars.length?`<div class="d-sub">Parceiros locais</div><table class="tbl"><thead><tr><th>Parceiro</th><th>Receita</th></tr></thead><tbody>${pars.map(p=>`<tr><td class="num">${p.nome}</td><td class="num">${fmt(fval(p.receita))}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Sem parceiro registrado para este ponto.</p>'}
    </div>`;
  }

  // ---------- Drill-down do nó da rede ----------
  function openRedeDrill(c) {
    const f = factor();
    $id('drill').hidden = false;
    $id('drill').innerHTML = `<div class="drill-box"><button class="drill-close">✕</button>
      <h3>${c.nome} · Indicador</h3><div class="d-sub">Rede de indicações · ${PERIOD_LABEL[periodo]}</div>
      <div class="grid g-kpi" style="margin-bottom:12px">
        <div class="kpi"><div class="k-label">Indicações</div><div class="k-val">${fmtN(fval(c.v))}</div></div>
        <div class="kpi accent"><div class="k-label">Conversões</div><div class="k-val">${fmtN(fval(Math.round(c.v*0.31)))}</div></div>
        <div class="kpi violet"><div class="k-label">Nível</div><div class="k-val">${c.v>100?'Ouro':c.v>50?'Prata':'Bronze'}</div></div>
      </div>
      <div class="d-sub">IA · diagnóstico</div>
      <div class="ai-card"><p>🎯 ${c.nome} tem alta propensão a indicar novamente (score ${Math.min(99, 55+c.v)}). Sugestão: ativar missão "Maratona".</p></div>
    </div>`;
  }

  // ---------- Init ----------
  qStrip();
  renderNav();
  render();
  bindEvents();
  bindSearch();
  // animar KPIs após render
  document.addEventListener('DOMContentLoaded', () => {});
  document.addEventListener('click', e => { if (e.target.closest('.ai-btn')) { const b=e.target.closest('.ai-btn'); toast('IA: ' + b.textContent.trim()); } });
})();
