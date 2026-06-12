'use strict';
const Router = {
  _routes: {},
  _current: null,

  define(routes) { this._routes = routes; },

  navigate(path, pushState=true) {
    if (pushState && window.location.pathname !== path) {
      history.pushState(null, '', path);
    }
    this._render(path);
  },

  refresh() { this._render(window.location.pathname); },

  _render(path) {
    const app = document.getElementById('app');
    if (!app) return;

    // Strip query string for route matching
    const cleanPath = path.split('?')[0];

    for (const [pattern, handler] of Object.entries(this._routes)) {
      const { match, params } = this._match(pattern, cleanPath);
      if (match) {
        this._current = { path: cleanPath, params };
        // Cancel any pending notification polls
        if (App._notifInterval) clearInterval(App._notifInterval);
        handler(params);
        return;
      }
    }
    // 404
    app.innerHTML = Components.appLayout ? Components.appLayout(Pages.notFound(), '') : Pages.notFound();
  },

  _match(pattern, path) {
    const pp = pattern.split('/').filter(Boolean);
    const rp = path.split('/').filter(Boolean);
    if (pp.length !== rp.length) return { match: false };
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(rp[i]);
      else if (pp[i] !== rp[i]) return { match: false };
    }
    return { match: true, params };
  },

  getQuery() {
    const p = new URLSearchParams(window.location.search);
    const o = {};
    p.forEach((v,k) => o[k] = v);
    return o;
  },

  init() {
    window.addEventListener('popstate', () => this._render(window.location.pathname));
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) this.navigate(route);
      }
    });
  },
};
window.Router = Router;
