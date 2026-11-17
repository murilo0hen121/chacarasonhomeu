/* Site público: lê o conteúdo do Supabase, atualiza em tempo real, registra visitas e pedidos. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = window.SB_CONFIG || {};
  let sb = null;
  try { if (/^https:\/\/.+\.supabase\.co/.test(C.url || '') && window.supabase) sb = supabase.createClient(C.url, C.key); } catch (e) {}
  const clone = o => JSON.parse(JSON.stringify(o));
  let D = clone(DEFAULTS), FOT = DEFAULT_FOTOS.slice();
  const mescla = x => { const o = clone(DEFAULTS); for (const k in x) { if (Array.isArray(x[k])) o[k] = x[k]; else if (x[k] && typeof x[k] === 'object') o[k] = Object.assign({}, o[k], x[k]); } return o; };
  const T = (sel, txt) => { const e = document.querySelector(sel); if (e && txt != null) e.textContent = txt; };
  const tel = n => { n = String(n || '').replace(/\D/g, '').replace(/^55/, ''); return n.length >= 10 ? '(' + n.slice(0, 2) + ') ' + n.slice(2, -4) + '-' + n.slice(-4) : n; };
  const escurece = (hex, f) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * f).toString(16).padStart(2, '0')).join('');
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const VAZIO = 'Os feedbacks de quem já passou por aqui vão aparecer neste espaço.';

  function aplicar() {
    T('.hero h1', D.hero.titulo); T('.hero .w p', D.hero.texto);
    T('.about h2', D.video.titulo); T('.about .t p', D.video.texto);
    T('#p-sobre .ctr p:nth-of-type(1)', D.sobre.p1); T('#p-sobre .ctr p:nth-of-type(2)', D.sobre.p2);
    const c = D.contato;
    ZAP = String(c.whatsapp || '').replace(/\D/g, '') || ZAP;
    document.querySelectorAll('[data-wa]').forEach(a => a.href = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent('Olá! Gostaria de consultar a disponibilidade da Chácara Sonho Meu.'));
    document.querySelectorAll('[data-fb]').forEach(a => a.href = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent('Olá! Gostaria de deixar meu feedback sobre a Chácara Sonho Meu:'));
    T('.foot a[data-wa]', 'WhatsApp ' + tel(ZAP));
    const ad = document.querySelector('.loc address'); ad.textContent = ''; ad.append(c.linha1 || '', document.createElement('br'), c.linha2 || '');
    document.querySelectorAll('a[href*="google.com/maps"]').forEach(a => a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.mapa || 'Osvaldo Cruz SP'));
    const ig = $('igl'); if (c.instagram) { ig.href = c.instagram; ig.hidden = false; } else ig.hidden = true;
    const r = document.documentElement.style, k = D.cores;
    if (k.marrom) { r.setProperty('--brown', k.marrom); r.setProperty('--brown2', escurece(k.marrom, .82)); }
    if (k.fundo) { r.setProperty('--bg', k.fundo); r.setProperty('--alt', escurece(k.fundo, .96)); }
    if (k.texto) { r.setProperty('--ink', k.texto); r.setProperty('--forest', k.texto); }
    const vd = $('vid');
    if (D.video.url && vd.getAttribute('src') !== D.video.url) { vd.setAttribute('src', D.video.url); if (D.video.poster) vd.setAttribute('poster', D.video.poster); vd.load(); }
    const rg = document.querySelector('.regras'); rg.textContent = '';
    D.regras.forEach((x, i) => { const a = el('article'); a.append(el('span', null, 'Regra ' + (i + 1)), el('h3', null, x.t), el('p', null, x.d)); rg.appendChild(a); });
    const fb = $('fbl'); fb.textContent = '';
    (D.feedbacks || []).forEach(f => { const b = el('blockquote'); b.append(el('p', null, '“' + f.t + '”'), el('cite', null, f.n + (f.e ? ', ' + f.e : ''))); fb.appendChild(b); });
    if (!fb.children.length) fb.appendChild(el('p', 'vz', VAZIO));
  }
  function galeria() {
    const g = $('gal'); g.textContent = '';
    FOT.forEach(f => {
      const b = el('button', 'g rv in'); b.dataset.cat = f.cat; b.setAttribute('aria-label', 'Ampliar: ' + (f.alt || 'foto'));
      const im = document.createElement('img'); im.src = f.url; im.alt = f.alt || 'Foto da chácara'; im.loading = 'lazy'; b.appendChild(im);
      b.onclick = () => { show(vis().indexOf(b)); lb.classList.add('open'); $('lc').focus(); };
      g.appendChild(b);
    });
    const on = document.querySelector('#tabs .on');
    if (on && on.dataset.f !== 'all') g.querySelectorAll('.g').forEach(x => x.hidden = x.dataset.cat !== on.dataset.f);
  }
  async function carregar() {
    if (sb) {
      try {
        const [a, b, c] = await Promise.all([
          sb.from('site_content').select('data').eq('id', 1).maybeSingle(),
          sb.from('photos').select('url,alt,cat').order('pos').order('id'),
          sb.from('reserved_dates').select('day')]);
        if (a.data && a.data.data) D = mescla(a.data.data);
        if (!b.error && b.data) FOT = b.data;
        if (!c.error && c.data) { RESERVADAS.length = 0; c.data.forEach(r => RESERVADAS.push(r.day)); }
      } catch (e) {}
    }
    aplicar(); galeria();
    if ($('ov').classList.contains('open')) desenhar();
  }
  carregar();
  if (sb) {
    let tm; const dq = () => { clearTimeout(tm); tm = setTimeout(carregar, 400); };
    sb.channel('site-publico')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, dq)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, dq)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reserved_dates' }, dq)
      .subscribe();
  }
  /* visitas */
  let vid = ''; try { vid = localStorage.sm_v || (localStorage.sm_v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now())); } catch (e) { vid = 'anon' + Math.random().toString(36).slice(2); }
  const dono = () => { try { return !!localStorage.sm_admin; } catch (e) { return false; } };
  const pagina = () => { const h = (location.hash || '#inicio').slice(1); return ['inicio', 'sobre', 'galeria', 'regras'].includes(h) ? h : 'inicio'; };
  function rastrear() {
    if (!sb || dono()) return;
    let origem = 'direto'; try { if (document.referrer) origem = new URL(document.referrer).hostname; } catch (e) {}
    sb.from('visits').insert({ visitor: vid, page: pagina(), dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? 'celular' : 'computador', origem }).then(() => {}, () => {});
  }
  rastrear(); addEventListener('hashchange', rastrear);
  /* pedidos de orçamento (CRM) */
  window.saveLead = l => {
    if (!sb) return;
    sb.from('leads').insert({ nome: l.nome, nascimento: l.nasc, inicio: l.ini, fim: l.fim, motivo: l.mot === 'Outros' ? l.out : l.mot, pessoas: +l.qtd }).then(() => {}, () => {});
  };
})();
