'use strict';
const Auth = {
  _user: null,
  _token: null,
  _listeners: [],

  init() {
    const token = localStorage.getItem('cs_token');
    const userStr = localStorage.getItem('cs_user');
    if (token && token !== 'null' && userStr && userStr !== 'null') {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed && parsed._id) {
          this._token = token;
          this._user = parsed;
        } else {
          this.clearSession();
        }
      } catch { this.clearSession(); }
    }
  },

  getToken()   { return this._token; },
  getUser()    { return this._user; },
  isLoggedIn() { return !!(this._token && this._user && this._user._id); },

  setSession(token, user) {
    if (!token || !user || !user._id) {
      console.error('setSession: invalid token or user', { token: !!token, user });
      return;
    }
    this._token = token;
    this._user  = user;
    localStorage.setItem('cs_token', token);
    localStorage.setItem('cs_user', JSON.stringify(user));
    console.log('✅ Session saved for @' + user.username);
    this._notify();
  },

  updateUser(updates) {
    if (!this._user) return;
    this._user = { ...this._user, ...updates };
    localStorage.setItem('cs_user', JSON.stringify(this._user));
    this._notify();
  },

  clearSession() {
    this._token = null;
    this._user  = null;
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    this._notify();
  },

  async logout() {
    try { await API.auth.logout(); } catch {}
    this.clearSession();
    Toast.info('Signed out. See you soon!');
    Router.navigate('/');
  },

  async refreshUser() {
    if (!this._token) return;
    try {
      const data = await API.auth.me();
      if (data?.user) this.updateUser(data.user);
    } catch { this.clearSession(); }
  },

  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l=>l!==fn); };
  },
  _notify() { this._listeners.forEach(fn => fn(this._user)); },

  requireAuth() {
    if (!this.isLoggedIn()) {
      Toast.warning('Please sign in to continue');
      Router.navigate('/login');
      return false;
    }
    return true;
  },
};
window.Auth = Auth;
