/* ============================================================
   THE WEDDING TIMES — script.js
   Matheus & Graziela · 12 de Dezembro de 2026
   Supabase + Resend + Galeria Carrossel + Mensagens em tempo real
   ============================================================ */

// ── CONFIGURAÇÃO ─────────────────────────────────────────────
const WEDDING_DATE  = new Date('2026-12-12T10:00:00');
const SUPABASE_URL  = 'https://zjkuanzzbixdnkuioecy.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa3Vhbnp6Yml4ZG5rdWlvZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODcwNjEsImV4cCI6MjA5MDM2MzA2MX0.qoR9TV1E-OwVbHFP1ZXBn8p58BTsixGkSvMlaxF0aJo';

// ── RESEND — e-mail de notificação ───────────────────────────
// IMPORTANTE: substitua YOUR_RESEND_KEY pela sua chave do Resend
// Crie em: resend.com → API Keys → Create API Key
// ATENÇÃO: use uma Netlify Function para não expor a chave (instruções no README)
// Por enquanto a chave fica aqui para testes locais
const RESEND_KEY    = 'YOUR_RESEND_KEY';
const NOTIFY_EMAIL  = 'mathuska.wanted@gmail.com';

// ── DATA NO TOPO ─────────────────────────────────────────────
(function () {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = new Date().toLocaleDateString('pt-BR', opts);
})();

// ── ALTURA DO MASTHEAD ────────────────────────────────────────
function getMastheadHeight() {
  const m = document.getElementById('masthead');
  return m ? m.offsetHeight : 80;
}

// ── COUNTDOWN ────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const diff = WEDDING_DATE - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-minutes','cd-seconds','cm-days','cm-hours','cm-mins']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '00'; });
    return;
  }
  const days    = Math.floor(diff / 864e5);
  const hours   = Math.floor((diff % 864e5) / 36e5);
  const minutes = Math.floor((diff % 36e5)  / 6e4);
  const seconds = Math.floor((diff % 6e4)   / 1e3);

  const map = { 'cd-days': days, 'cd-hours': hours, 'cd-minutes': minutes, 'cd-seconds': seconds,
                'cm-days': days, 'cm-hours': hours, 'cm-mins': minutes };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = pad(val);
  });
}
tick();
setInterval(tick, 1000);

// ── SMOOTH SCROLL ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - getMastheadHeight() - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── ACTIVE NAV ────────────────────────────────────────────────
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.masthead-nav a');
  function highlight() {
    const offset = getMastheadHeight() + 40;
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - offset) current = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }
  window.addEventListener('scroll', highlight, { passive: true });
  highlight();
})();

// ── SCROLL REVEAL ─────────────────────────────────────────────
(function () {
  if (!window.IntersectionObserver) return;
  const targets = document.querySelectorAll(
    '.article, .pull-quote, .aside-box, .ev-col, .msg-card, .gm-item, .tl-row, .gi, .log-card'
  );
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    obs.observe(el);
  });
})();

// ════════════════════════════════════════════════════════════
// GALERIA — CARROSSEL COM LIGHTBOX
// ════════════════════════════════════════════════════════════
(function initGallery() {
  const galleryEl = document.getElementById('gallery');
  if (!galleryEl) return;

  // Coleta todas as imagens do grid
  const items = Array.from(galleryEl.querySelectorAll('.g-item')).map(el => ({
    src: el.querySelector('img').src,
    alt: el.querySelector('img').alt,
    cap: el.querySelector('.g-cap-lb') ? el.querySelector('.g-cap-lb').textContent : ''
  }));

  // ── Cria o lightbox ──
  const lb = document.createElement('div');
  lb.id = 'lb';
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <div class="lb-topbar">
      <span class="lb-counter-top" id="lbCounterTop">1 / ${items.length}</span>
      <button class="lb-close" id="lbClose" aria-label="Fechar">✕</button>
    </div>
    <div class="lb-stage">
      <button class="lb-nav lb-prev" id="lbPrev" aria-label="Anterior">&#8249;</button>
      <div class="lb-img-wrap">
        <img class="lb-img" id="lbImg" src="" alt="" />
      </div>
      <button class="lb-nav lb-next" id="lbNext" aria-label="Próxima">&#8250;</button>
    </div>
    <div class="lb-footer">
      <p class="lb-cap" id="lbCap"></p>
      <div class="lb-dots" id="lbDots"></div>
    </div>`;
  document.body.appendChild(lb);

  // ── Cria os dots ──
  const dotsEl = document.getElementById('lbDots');
  items.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'lb-dot';
    d.setAttribute('aria-label', 'Foto ' + (i + 1));
    d.onclick = () => show(i);
    dotsEl.appendChild(d);
  });

  let cur = 0;
  let touchStartX = 0, touchStartY = 0;
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbCounterTop = document.getElementById('lbCounterTop');
  const dots = () => document.querySelectorAll('.lb-dot');

  function show(i) {
    cur = ((i % items.length) + items.length) % items.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = items[cur].src;
      lbImg.alt = items[cur].alt;
      lbImg.style.opacity = '1';
    }, 150);
    lbCap.textContent = items[cur].cap;
    lbCounterTop.textContent = (cur + 1) + ' / ' + items.length;
    dots().forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  function open(i) {
    show(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Clique nas fotos do grid
  galleryEl.querySelectorAll('.g-item').forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => open(i));
  });

  document.getElementById('lbClose').onclick = close;
  document.getElementById('lbPrev').onclick  = () => show(cur - 1);
  document.getElementById('lbNext').onclick  = () => show(cur + 1);

  // Fecha ao clicar fora
  lb.addEventListener('click', e => { if (e.target === lb || e.target.className === 'lb-stage') close(); });

  // Teclado
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(cur + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   show(cur - 1);
    if (e.key === 'Escape') close();
  });

  // Swipe no celular
  lb.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (Math.abs(dx) > 45 && dy < 80) {
      dx < 0 ? show(cur + 1) : show(cur - 1);
    }
  }, { passive: true });
})();

// ════════════════════════════════════════════════════════════
// SUPABASE — helpers
// ════════════════════════════════════════════════════════════
async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}`);
}

async function sbSelect(table, order = 'created_at', limit = 50) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}.desc&limit=${limit}`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase error ${res.status}`);
  return res.json();
}

// ════════════════════════════════════════════════════════════
// MENSAGENS — carrega do Supabase ao abrir a página
// ════════════════════════════════════════════════════════════
async function loadMessages() {
  const feed = document.getElementById('msgFeed');
  if (!feed) return;
  try {
    const msgs = await sbSelect('messages');
    if (!msgs || msgs.length === 0) return;
    // Remove as mensagens de exemplo (as 3 primeiras estáticas)
    const statics = feed.querySelectorAll('.gm-item.static-msg');
    statics.forEach(el => el.remove());
    // Adiciona as mensagens do banco
    msgs.forEach(m => {
      const item = buildMsgEl(m.name, m.message, m.created_at);
      feed.appendChild(item);
    });
  } catch (err) {
    console.warn('Não foi possível carregar mensagens:', err.message);
  }
}

function buildMsgEl(name, msg, dateStr) {
  const item = document.createElement('div');
  item.className = 'gm-item';
  const date = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) : '';
  item.innerHTML = `
    <p class="gm-txt">"${esc(msg)}"</p>
    <span class="gm-by">— ${esc(name)}${date ? ' · ' + date : ''}</span>
  `;
  return item;
}

loadMessages();

// ════════════════════════════════════════════════════════════
// RSVP FORM — salva no Supabase + envia e-mail via Netlify Function
// ════════════════════════════════════════════════════════════
const form      = document.getElementById('rsvpForm');
const formOk    = document.getElementById('formOk');
const submitBtn = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name     = document.getElementById('f-name').value.trim();
    const email    = document.getElementById('f-email').value.trim();
    const attending = form.querySelector('input[name="attending"]:checked');

    if (!name || !email || !attending) {
      showFormError('Por favor, preencha nome, e-mail e confirmação de presença.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando… <span class="b-orn">✦</span>';

    const payload = {
      name,
      email,
      attending: attending.value,
      guests:   parseInt(document.getElementById('f-guests').value) || 0,
      message:  document.getElementById('f-message').value.trim(),
      dietary:  document.getElementById('f-dietary').value.trim(),
      created_at: new Date().toISOString()
    };

    let saved = false;
    let emailSent = false;

    // 1. Salva no Supabase
    try {
      await sbInsert('rsvp', payload);
      saved = true;
    } catch (err) {
      console.error('Erro ao salvar RSVP:', err);
    }

    // 2. Salva mensagem separada se existir
    if (payload.message && saved) {
      try {
        await sbInsert('messages', {
          name: payload.name,
          message: payload.message,
          created_at: payload.created_at
        });
      } catch (err) {
        console.warn('Erro ao salvar mensagem:', err);
      }
    }

    // 3. Envia e-mail via Netlify Function (/api/notify)
    try {
      const emailRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (emailRes.ok) emailSent = true;
    } catch (err) {
      console.warn('E-mail não enviado (Netlify Function não configurada ainda):', err.message);
    }

    showSuccess(payload);
    console.log('RSVP salvo:', saved, '| E-mail enviado:', emailSent);
  });
}

function showFormError(msg) {
  let err = document.getElementById('formError');
  if (!err) {
    err = document.createElement('p');
    err.id = 'formError';
    err.style.cssText = 'color:#c0392b; font-family:var(--f-sans); font-size:13px; margin-top:8px; text-align:center;';
    submitBtn.parentNode.insertBefore(err, submitBtn);
  }
  err.textContent = msg;
}

function showSuccess(data) {
  form.style.transition = 'opacity .35s';
  form.style.opacity = '0';
  setTimeout(() => {
    form.style.display = 'none';
    formOk.style.display = 'block';

    // Injeta mensagem no feed em tempo real se tiver mensagem
    if (data.message) {
      const feed = document.getElementById('msgFeed');
      if (feed) {
        const item = buildMsgEl(data.name, data.message, data.created_at);
        item.style.cssText = 'opacity:0; transform:translateY(8px); transition:opacity .5s, transform .5s';
        feed.insertBefore(item, feed.firstChild);
        requestAnimationFrame(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        });
      }
    }
  }, 380);
}

// ── COPIAR PIX ───────────────────────────────────────────────
function copyPix() {
  const key  = document.getElementById('pixKey');
  const done = document.getElementById('pixCopied');
  if (!key) return;
  const text = key.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    if (done) { done.style.display = 'block'; setTimeout(() => { done.style.display = 'none'; }, 2500); }
  }).catch(() => {
    const r = document.createRange();
    r.selectNode(key);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    if (done) { done.style.display = 'block'; setTimeout(() => { done.style.display = 'none'; }, 2500); }
  });
}

function scrollToPix() {
  const el = document.querySelector('.pix-panel');
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.pageYOffset - getMastheadHeight() - 20;
  window.scrollTo({ top, behavior: 'smooth' });
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

console.log('%c✦ The Wedding Times ✦', 'font-family:Georgia,serif;font-size:18px;color:#5b8db8;');
console.log('%cMatheus & Graziela · 12/12/2026', 'font-family:Georgia,serif;font-size:12px;color:#333;');
