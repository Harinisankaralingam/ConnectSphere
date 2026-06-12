'use strict';

const Utils = {
  timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 5)   return 'just now';
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s/60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h/24);
    if (d < 7)   return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  },

  formatCount(n) {
    if (!n || isNaN(n)) return '0';
    n = parseInt(n);
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return String(n);
  },

  processContent(text) {
    if (!text) return '';
    return this.escapeHtml(text)
      .replace(/#([a-zA-Z0-9_]+)/g, '<span class="hashtag hashtag-pill" data-tag="$1">#$1</span>')
      .replace(/@([a-zA-Z0-9_.]+)/g, '<a href="/profile/$1" data-route="/profile/$1" class="mention" style="color:var(--secondary);font-weight:500;">@$1</a>')
      .replace(/\n/g,'<br>');
  },

  avatarHtml(user, size='md') {
    if (!user) user = {name:'User'};
    const src = user.avatar || user.avatarUrl || CONFIG.DEFAULT_AVATAR(user.name||'User');
    const initial = (user.name||'U')[0].toUpperCase();
    return `<div class="avatar avatar-${size}" title="${this.escapeHtml(user.name||'User')}">
      <img src="${src}" alt="${this.escapeHtml(user.name||'')}"
           onerror="this.style.display='none';this.parentElement.dataset.init='${initial}';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';this.parentElement.innerHTML='<span style=\'font-weight:700;color:white;\'>${initial}</span>';" />
    </div>`;
  },

  verifiedBadge(isVerified) {
    if (!isVerified) return '';
    return `<span class="verified-badge" title="Verified Account" style="color:#4F46E5;font-size:0.85em;"><i class="fa-solid fa-circle-check"></i></span>`;
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  },

  debounce(fn, delay=CONFIG.DEBOUNCE_DELAY) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
  },

  throttle(fn, limit=200) {
    let last=0;
    return (...args) => {
      const now = Date.now();
      if (now-last >= limit) { last=now; return fn(...args); }
    };
  },

  validateImage(file) {
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF, WebP images allowed';
    if (file.size > CONFIG.MAX_FILE_SIZE) return 'Image must be under 5MB';
    return null;
  },

  readFileAsDataUrl(file) {
    return new Promise((res,rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  },

  getTheme()  { return document.documentElement.getAttribute('data-theme') || 'light'; },
  setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('cs_theme', t);
    // Update all theme icons
    document.querySelectorAll('.theme-icon').forEach(el => {
      el.className = `theme-icon fa-solid ${t==='dark'?'fa-sun':'fa-moon'}`;
    });
    document.querySelectorAll('.theme-label').forEach(el => {
      el.textContent = t==='dark' ? 'Light Mode' : 'Dark Mode';
    });
  },
  toggleTheme() {
    const t = this.getTheme()==='light' ? 'dark' : 'light';
    this.setTheme(t);
    return t;
  },

  async copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  },

  shareUrl(postId) { return `${window.location.origin}/post/${postId}`; },

  skeleton(w='100%', h='14px', circle=false) {
    return `<div class="skeleton ${circle?'skeleton-avatar':''}" style="width:${w};height:${h};${circle?'border-radius:50%':''}"></div>`;
  },

  spinner(size='') {
    return `<div class="spinner${size?' spinner-'+size:''}"></div>`;
  },

  // Animate number counting up
  animateNumber(el, target, duration=1000) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = this.formatCount(Math.floor(start + range * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  // Validate password strength
  passwordStrength(password) {
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = ['','Weak','Fair','Good','Strong','Very Strong'];
    const colors = ['','#EF4444','#F59E0B','#06B6D4','#10B981','#4F46E5'];
    return { score, label: levels[score]||'', color: colors[score]||'', pct: (score/5)*100 };
  },

  // Scroll reveal observer
  initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  },
};

// ── Toast System ──────────────────────────────────────────────────────────────
const Toast = {
  _container: null,
  init() { this._container = document.getElementById('toast-container'); },
  show(msg, type='info', duration=3500) {
    if (!this._container) this._container = document.getElementById('toast-container');
    if (!this._container) return;
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type]||'ℹ️'}</span>
      <span class="toast-message">${Utils.escapeHtml(msg)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0 0 0 8px;">✕</button>`;
    this._container.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(()=>el.remove(), 350); }, duration);
    return el;
  },
  success: (m,d) => Toast.show(m,'success',d),
  error:   (m,d) => Toast.show(m,'error',d),
  info:    (m,d) => Toast.show(m,'info',d),
  warning: (m,d) => Toast.show(m,'warning',d),
};

// ── Modal System ─────────────────────────────────────────────────────────────
const Modal = {
  _stack: [],
  open(html, opts={}) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    if (opts.closeOnBackdrop !== false) {
      overlay.addEventListener('click', e => { if (e.target===overlay) this.close(overlay); });
    }
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    this._stack.push(overlay);
    return overlay;
  },
  close(el) {
    const target = el || this._stack[this._stack.length-1];
    if (!target) return;
    target.remove();
    this._stack = this._stack.filter(o=>o!==target);
    if (!this._stack.length) document.body.style.overflow = '';
  },
  closeAll() { this._stack.forEach(o=>o.remove()); this._stack=[]; document.body.style.overflow=''; },
  confirm(msg, onOk, onCancel) {
    const ov = this.open(`
      <div class="modal" style="max-width:380px;">
        <div class="modal-header">
          <h3 class="modal-title">Confirm</h3>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:20px;line-height:1.6;">${Utils.escapeHtml(msg)}</p>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancel</button>
            <button class="btn btn-danger btn-sm" id="mc-confirm">Confirm</button>
          </div>
        </div>
      </div>`);
    ov.querySelector('#mc-cancel').onclick  = () => { this.close(ov); onCancel?.(); };
    ov.querySelector('#mc-confirm').onclick = () => { this.close(ov); onOk?.(); };
  },
};

window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
