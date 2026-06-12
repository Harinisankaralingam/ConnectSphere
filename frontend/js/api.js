'use strict';
const API = {
  base: CONFIG.API_BASE,

  async request(method, endpoint, data = null, isFormData = false) {
    const url = `${this.base}${endpoint}`;
    const token = Auth.getToken();
    const options = { method, headers: {} };

    if (token && token !== 'null' && token !== 'undefined') {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    try {
      const res = await fetch(url, options);
      let json;
      try { json = await res.json(); }
      catch { throw new Error(`Server error (${res.status})`); }

      if (!res.ok) {
        if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
          Auth.clearSession();
          if (typeof Router !== 'undefined') Router.navigate('/login');
        }
        throw new Error(json.message || `Request failed (${res.status})`);
      }
      return json;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot reach server. Check your connection.');
      }
      throw err;
    }
  },

  get:    (ep) => API.request('GET', ep),
  post:   (ep, d, f) => API.request('POST', ep, d, f),
  put:    (ep, d) => API.request('PUT', ep, d),
  patch:  (ep, d) => API.request('PATCH', ep, d),
  delete: (ep) => API.request('DELETE', ep),

  auth: {
    register: (d) => API.post('/auth/register', d),
    login:    (d) => API.post('/auth/login', d),
    me:       ()  => API.get('/auth/me'),
    logout:   ()  => API.post('/auth/logout'),
    changePassword: (d) => API.put('/auth/change-password', d),
  },
  users: {
    getProfile:   (u)    => API.get(`/users/${u}`),
    updateProfile:(d)    => API.put('/users/profile/update', d),
    uploadAvatar: (fd)   => API.post('/users/profile/avatar', fd, true),
    uploadCover:  (fd)   => API.post('/users/profile/cover', fd, true),
    follow:       (id)   => API.post(`/users/${id}/follow`),
    getFollowers: (u)    => API.get(`/users/${u}/followers`),
    getFollowing: (u)    => API.get(`/users/${u}/following`),
    getSuggested: ()     => API.get('/users/suggested'),
    getAnalytics: ()     => API.get('/users/analytics'),
    getSaved:     ()     => API.get('/users/saved'),
  },
  posts: {
    getFeed:      (p=1)  => API.get(`/posts/feed?page=${p}&limit=${CONFIG.FEED_LIMIT}`),
    getExplore:   (p=1)  => API.get(`/posts/explore?page=${p}&limit=12`),
    getUserPosts: (u,p=1)=> API.get(`/posts/user/${u}?page=${p}&limit=12`),
    getPost:      (id)   => API.get(`/posts/${id}`),
    create:       (fd)   => API.post('/posts', fd, true),
    update:       (id,d) => API.put(`/posts/${id}`, d),
    delete:       (id)   => API.delete(`/posts/${id}`),
    like:         (id)   => API.post(`/posts/${id}/like`),
    save:         (id)   => API.post(`/posts/${id}/save`),
    trending:     ()     => API.get('/posts/trending'),
  },
  comments: {
    get:    (pid)      => API.get(`/comments/${pid}`),
    create: (pid, d)   => API.post(`/comments/${pid}`, d),
    delete: (id)       => API.delete(`/comments/${id}`),
    like:   (id)       => API.post(`/comments/${id}/like`),
  },
  notifications: {
    get:         (p=1)  => API.get(`/notifications?page=${p}`),
    markRead:    (id)   => API.put(`/notifications/${id}/read`),
    markAllRead: ()     => API.put('/notifications/mark-all-read'),
    unreadCount: ()     => API.get('/notifications/unread-count'),
  },
  stories: {
    getFeed:  ()   => API.get('/stories/feed'),
    create:   (fd) => API.post('/stories', fd, true),
    view:     (id) => API.post(`/stories/${id}/view`),
    delete:   (id) => API.delete(`/stories/${id}`),
  },
  messages: {
    getConversations: ()    => API.get('/messages/conversations'),
    getMessages:      (uid) => API.get(`/messages/${uid}`),
    send:             (uid, d) => API.post(`/messages/${uid}`, d),
  },
  search: {
    query: (q, type='all') => API.get(`/search?q=${encodeURIComponent(q)}&type=${type}`),
  },
};
window.API = API;
