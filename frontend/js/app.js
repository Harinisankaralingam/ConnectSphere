'use strict';
/* ============================================================
   ConnectSphere v2 — Main Application Controller
   ============================================================ */
const App = {
  _feedPage: 1,
  _feedLoading: false,
  _feedHasMore: true,
  _storyGroups: [],
  _notifInterval: null,
  _activePostsBound: false,

  // ─── Bootstrap ──────────────────────────────────────────────
  init() {
    Auth.init();
    Toast.init();
    Router.init();

    // Restore theme
    Utils.setTheme(localStorage.getItem('cs_theme') || 'light');

    Router.define({
      '/':                  () => this.renderLanding(),
      '/login':             () => this.renderLogin(),
      '/register':          () => this.renderRegister(),
      '/home':              () => this.renderHome(),
      '/explore':           () => this.renderExplore(),
      '/notifications':     () => this.renderNotifications(),
      '/saved':             () => this.renderSaved(),
      '/analytics':         () => this.renderAnalytics(),
      '/messages':          () => this.renderMessages(),
      '/profile/:username': ({username}) => this.renderProfile(username),
      '/edit-profile':      () => this.renderEditProfile(),
    });

    Router.navigate(window.location.pathname, false);
    this._initScrollTop();
  },

  // ─── Scroll-to-top button ────────────────────────────────────
  _initScrollTop() {
    window.addEventListener('scroll', Utils.throttle(() => {
      const btn = document.getElementById('scroll-top-btn');
      if (!btn) return;
      btn.classList.toggle('visible', window.scrollY > 400);
    }, 200));
  },

  // ─── Shared layout helpers ───────────────────────────────────
  _renderLayout(html, activeNav) {
    document.getElementById('app').innerHTML = Components.appLayout(html, activeNav);
    this._activePostsBound = false;
    this._bindSidebar();
    this._bindThemeToggle();
    this._bindSearch();
    this._loadRightSidebar();
    this._pollNotifications();
    Utils.initReveal();
  },

  _bindSidebar() {
    document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => {
      Modal.confirm('Sign out of ConnectSphere?', () => Auth.logout());
    });
    document.getElementById('sidebar-create-btn')?.addEventListener('click', () => Components.openCreatePostModal());
    document.getElementById('mobile-create-btn')?.addEventListener('click', () => Components.openCreatePostModal());
  },

  _bindThemeToggle() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => Utils.toggleTheme());
  },

  // ─── LANDING ─────────────────────────────────────────────────
  renderLanding() {
    if (Auth.isLoggedIn()) return Router.navigate('/home');
    document.getElementById('app').innerHTML = Pages.landing();
    this._spawnParticles();
    document.getElementById('theme-toggle-landing')?.addEventListener('click', () => Utils.toggleTheme());
    Utils.setTheme(localStorage.getItem('cs_theme') || 'light');
    Utils.initReveal();
  },

  _spawnParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 60 + 20;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*8}s;`;
      container.appendChild(p);
    }
  },

  // ─── LOGIN ───────────────────────────────────────────────────
  renderLogin() {
    if (Auth.isLoggedIn()) return Router.navigate('/home');
    document.getElementById('app').innerHTML = Pages.login();
    this._bindLogin();
  },

  _bindLogin() {
    // Password toggle
    document.getElementById('toggle-login-pass')?.addEventListener('click', e => {
      const inp = document.getElementById('login-password');
      const icon = e.currentTarget.querySelector('i');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      icon.className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });

    // Clear errors on input
    ['login-email','login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this._clearFieldError(id));
    });

    // Submit
    document.getElementById('login-form')?.addEventListener('submit', () => this._submitLogin());

    // Demo login
    document.getElementById('demo-login-btn')?.addEventListener('click', async () => {
      const emailEl = document.getElementById('login-email');
      const passEl  = document.getElementById('login-password');
      if (emailEl) emailEl.value = 'demo@connectsphere.app';
      if (passEl)  passEl.value  = 'demo123';
      await this._submitLogin();
    });
  },

  async _submitLogin() {
    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const btn      = document.getElementById('login-btn');

    // Client-side validation
    let valid = true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      this._showFieldError('login-email', 'Please enter a valid email address');
      valid = false;
    }
    if (!password || password.length < 1) {
      this._showFieldError('login-password', 'Password is required');
      valid = false;
    }
    if (!valid) return;

    this._setLoading(btn, true, 'Signing in…');
    try {
      const data = await API.auth.login({ email, password });
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || 'Login failed — unexpected server response');
      }
      Auth.setSession(data.token, data.user);
      Toast.success(data.message || `Welcome back, ${data.user.name}!`);
      Router.navigate('/home');
    } catch (err) {
      Toast.error(err.message);
      this._setLoading(btn, false, '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In');
    }
  },

  // ─── REGISTER ────────────────────────────────────────────────
  renderRegister() {
    if (Auth.isLoggedIn()) return Router.navigate('/home');
    document.getElementById('app').innerHTML = Pages.register();
    this._bindRegister();
  },

  _bindRegister() {
    // Password visibility
    document.getElementById('toggle-reg-pass')?.addEventListener('click', e => {
      const inp = document.getElementById('reg-password');
      const icon = e.currentTarget.querySelector('i');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      icon.className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });

    // Password strength meter
    document.getElementById('reg-password')?.addEventListener('input', e => {
      const val = e.target.value;
      const strengthEl = document.getElementById('pw-strength');
      const fill = document.getElementById('pw-fill');
      const label = document.getElementById('pw-label');
      if (!val) { if (strengthEl) strengthEl.style.display = 'none'; return; }
      if (strengthEl) strengthEl.style.display = 'block';
      const s = Utils.passwordStrength(val);
      if (fill)  { fill.style.width = s.pct + '%'; fill.style.background = s.color; }
      if (label) { label.textContent = s.label; label.style.color = s.color; }
      this._clearFieldError('reg-password');
    });

    // Username real-time check
    const usernameInput = document.getElementById('reg-username');
    const checkUsername = Utils.debounce(async (val) => {
      const statusEl = document.getElementById('username-status');
      if (!statusEl) return;
      if (!val || val.length < 3) { statusEl.textContent = ''; return; }
      if (!/^[a-zA-Z0-9_.]+$/.test(val)) {
        statusEl.innerHTML = '<span style="color:var(--error)">❌ Invalid chars</span>';
        return;
      }
      statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--text-muted);"></i>';
      try {
        await API.users.getProfile(val.toLowerCase());
        statusEl.innerHTML = '<span style="color:var(--error)">❌ Taken</span>';
        this._showFieldError('reg-username', 'This username is already taken');
      } catch {
        statusEl.innerHTML = '<span style="color:var(--success)">✅ Available</span>';
        this._clearFieldError('reg-username');
      }
    }, 600);
    usernameInput?.addEventListener('input', e => {
      this._clearFieldError('reg-username');
      checkUsername(e.target.value.trim());
    });

    // Clear errors on type
    ['reg-name','reg-email','reg-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this._clearFieldError(id));
    });

    document.getElementById('register-form')?.addEventListener('submit', () => this._submitRegister());
  },

  async _submitRegister() {
    const name     = document.getElementById('reg-name')?.value.trim();
    const username = document.getElementById('reg-username')?.value.trim().toLowerCase();
    const email    = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const btn      = document.getElementById('register-btn');

    // Validation
    let valid = true;
    if (!name || name.length < 2) {
      this._showFieldError('reg-name', 'Name must be at least 2 characters'); valid = false;
    }
    if (!username || username.length < 3) {
      this._showFieldError('reg-username', 'Username must be at least 3 characters'); valid = false;
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      this._showFieldError('reg-username', 'Letters, numbers, dots, underscores only'); valid = false;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      this._showFieldError('reg-email', 'Please enter a valid email address'); valid = false;
    }
    if (!password || password.length < 6) {
      this._showFieldError('reg-password', 'Password must be at least 6 characters'); valid = false;
    }
    if (!valid) return;

    this._setLoading(btn, true, 'Creating account…');
    try {
      const data = await API.auth.register({ name, username, email, password });
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || 'Registration failed');
      }
      Auth.setSession(data.token, data.user);
      Toast.success('🎉 Welcome to ConnectSphere!');
      Router.navigate('/home');
    } catch (err) {
      Toast.error(err.message);
      this._setLoading(btn, false, '<i class="fa-solid fa-user-plus"></i> Create Account');
    }
  },

  // ─── HOME FEED ───────────────────────────────────────────────
  renderHome() {
    if (!Auth.requireAuth()) return;
    this._feedPage = 1;
    this._feedHasMore = true;
    this._renderLayout(Pages.home(), 'home');

    // Render create box
    const cpContainer = document.getElementById('create-post-container');
    if (cpContainer) cpContainer.innerHTML = Components.createPostBox();
    this.bindCreatePost(false);

    this._loadStories();
    this._loadFeed(true);
  },

  async _loadFeed(reset=false) {
    if (this._feedLoading) return;
    this._feedLoading = true;
    const container = document.getElementById('feed-container');
    if (!container) { this._feedLoading = false; return; }

    if (reset) container.innerHTML = [1,2,3].map(()=>Components.postSkeleton()).join('');

    try {
      const data = await API.posts.getFeed(this._feedPage);
      const posts = data.posts || [];
      this._feedHasMore = !!data.hasMore;

      if (reset) container.innerHTML = '';

      if (posts.length === 0 && reset) {
        document.getElementById('feed-empty')?.classList.remove('hidden');
      } else {
        const uid = Auth.getUser()?._id;
        posts.forEach(p => {
          container.insertAdjacentHTML('beforeend', Components.postCard(p, uid));
        });
      }

      const lw = document.getElementById('load-more-wrap');
      if (lw) lw.classList.toggle('hidden', !this._feedHasMore);
      document.getElementById('load-more-btn')?.addEventListener('click', () => {
        this._feedPage++;
        this._loadFeed(false);
      });

      if (!this._activePostsBound) {
        this._bindPostActions();
        this._activePostsBound = true;
      }
    } catch (err) {
      Toast.error('Could not load feed: ' + err.message);
      if (reset) container.innerHTML = '';
    } finally {
      this._feedLoading = false;
    }
  },

  // ─── STORIES ─────────────────────────────────────────────────
  async _loadStories() {
    const container = document.getElementById('stories-container');
    if (!container) return;
    try {
      const data = await API.stories.getFeed();
      this._storyGroups = data.storyGroups || [];
      container.innerHTML = `<div style="padding:16px 16px 0;">${Components.storiesBar(this._storyGroups)}</div>`;
      this._bindStories();
    } catch { container.innerHTML = ''; }
  },

  _bindStories() {
    document.getElementById('story-upload-input')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const err = Utils.validateImage(file);
      if (err) return Toast.error(err);
      const fd = new FormData();
      fd.append('media', file);
      try {
        await API.stories.create(fd);
        Toast.success('Story posted!');
        this._loadStories();
      } catch (err) { Toast.error(err.message); }
      e.target.value = '';
    });

    document.querySelectorAll('[data-action="view-story-group"]').forEach(el => {
      el.addEventListener('click', () => {
        const authorId = el.dataset.groupAuthor;
        const group = this._storyGroups.find(g => g.author._id === authorId);
        if (group?.stories?.length) {
          Components.openStoryModal(group.stories[0], group.stories, 0);
        }
      });
    });
  },

  // ─── CREATE POST ─────────────────────────────────────────────
  bindCreatePost(isModal=false) {
    const textarea   = document.getElementById('post-content-input');
    const submitBtn  = document.getElementById('submit-post-btn');
    const imageInput = document.getElementById('post-image-input');
    const previewGrid= document.getElementById('post-image-previews');
    const charCounter= document.getElementById('post-char-counter');
    let selectedFiles = [];

    if (!textarea || !submitBtn) return;

    const updateSubmit = () => {
      submitBtn.disabled = textarea.value.trim().length === 0 && selectedFiles.length === 0;
    };

    textarea.addEventListener('input', () => {
      updateSubmit();
      const len = textarea.value.length;
      if (charCounter) {
        charCounter.textContent = `${len}/2200`;
        charCounter.classList.toggle('hidden', len === 0);
        charCounter.style.color = len > 2000 ? 'var(--error)' : 'var(--text-muted)';
      }
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 220) + 'px';
    });

    imageInput?.addEventListener('change', async e => {
      for (const file of Array.from(e.target.files)) {
        const err = Utils.validateImage(file);
        if (err) { Toast.error(err); continue; }
        if (selectedFiles.length >= 5) { Toast.warning('Max 5 images per post'); break; }
        selectedFiles.push(file);
        const url = await Utils.readFileAsDataUrl(file);
        const idx = selectedFiles.length - 1;
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.dataset.idx = idx;
        item.innerHTML = `<img src="${url}" /><button class="image-preview-remove" type="button">✕</button>`;
        item.querySelector('.image-preview-remove').onclick = () => {
          selectedFiles.splice(idx, 1);
          item.remove();
          previewGrid?.classList.toggle('hidden', selectedFiles.length === 0);
          updateSubmit();
        };
        previewGrid?.appendChild(item);
      }
      previewGrid?.classList.toggle('hidden', selectedFiles.length === 0);
      updateSubmit();
      e.target.value = '';
    });

    // Hashtag shortcut
    document.getElementById('hashtag-btn')?.addEventListener('click', () => {
      textarea.value += textarea.value && !textarea.value.endsWith(' ') ? ' #' : '#';
      textarea.focus();
      updateSubmit();
    });

    submitBtn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content && selectedFiles.length === 0) return;
      this._setLoading(submitBtn, true, 'Posting…');
      const fd = new FormData();
      if (content) fd.append('content', content);
      selectedFiles.forEach(f => fd.append('images', f));
      try {
        const data = await API.posts.create(fd);
        Toast.success('Post published! 🎉');
        textarea.value = '';
        textarea.style.height = 'auto';
        selectedFiles = [];
        if (previewGrid) { previewGrid.innerHTML = ''; previewGrid.classList.add('hidden'); }
        if (charCounter) charCounter.classList.add('hidden');
        submitBtn.disabled = true;

        if (isModal) {
          Modal.close();
          Router.refresh();
        } else {
          const fc = document.getElementById('feed-container');
          if (fc) {
            const uid = Auth.getUser()?._id;
            fc.insertAdjacentHTML('afterbegin', Components.postCard(data.post, uid));
            document.getElementById('feed-empty')?.classList.add('hidden');
          }
          Auth.updateUser({ postsCount: (Auth.getUser().postsCount||0) + 1 });
        }
      } catch (err) {
        Toast.error(err.message);
      } finally {
        this._setLoading(submitBtn, false, '<i class="fa-solid fa-paper-plane"></i> Post');
        submitBtn.disabled = false;
        updateSubmit();
      }
    });
  },

  // ─── POST ACTIONS (delegated) ─────────────────────────────────
  _bindPostActions() {
    const root = document.getElementById('main-content') || document.getElementById('app');
    if (!root || root._pa) return;
    root._pa = true;

    root.addEventListener('click', async e => {

      // ── Like ──
      const likeBtn = e.target.closest('[data-action="like"]');
      if (likeBtn) {
        if (!Auth.requireAuth()) return;
        const pid = likeBtn.dataset.postId;
        const wasLiked = likeBtn.classList.contains('liked');
        likeBtn.classList.toggle('liked', !wasLiked);
        likeBtn.querySelector('.action-icon').className = `fa-${!wasLiked?'solid':'regular'} fa-heart action-icon`;
        const countEl = document.getElementById(`like-count-${pid}`);
        const oldCount = parseInt(countEl?.textContent?.replace(/[KM]/,'') || '0');
        if (countEl) countEl.textContent = Utils.formatCount(wasLiked ? Math.max(0,oldCount-1) : oldCount+1);
        try {
          const res = await API.posts.like(pid);
          if (countEl) countEl.textContent = Utils.formatCount(res.likesCount);
          // sync back if server disagrees
          likeBtn.classList.toggle('liked', res.isLiked);
          likeBtn.querySelector('.action-icon').className = `fa-${res.isLiked?'solid':'regular'} fa-heart action-icon`;
        } catch(err) {
          // revert
          likeBtn.classList.toggle('liked', wasLiked);
          likeBtn.querySelector('.action-icon').className = `fa-${wasLiked?'solid':'regular'} fa-heart action-icon`;
          if (countEl) countEl.textContent = Utils.formatCount(oldCount);
          Toast.error(err.message);
        }
        return;
      }

      // ── Toggle Comments ──
      const commentToggle = e.target.closest('[data-action="toggle-comments"]');
      if (commentToggle) {
        if (!Auth.requireAuth()) return;
        const pid = commentToggle.dataset.postId;
        const section = document.getElementById(`comments-${pid}`);
        if (!section) return;
        const isHidden = section.classList.toggle('hidden');
        if (!isHidden) {
          const list = document.getElementById(`comments-list-${pid}`);
          if (list && !list.dataset.loaded) {
            list.dataset.loaded = '1';
            this._loadComments(pid);
          }
        }
        return;
      }

      // ── Submit comment ──
      const submitComment = e.target.closest('[data-action="submit-comment"]');
      if (submitComment) {
        const pid = submitComment.dataset.postId;
        const input = document.getElementById(`comment-input-${pid}`);
        if (!input?.value.trim()) return;
        const content = input.value.trim();
        input.value = '';
        await this._submitComment(pid, content);
        return;
      }

      // ── Save ──
      const saveBtn = e.target.closest('[data-action="save"]');
      if (saveBtn) {
        if (!Auth.requireAuth()) return;
        const pid = saveBtn.dataset.postId;
        const wasSaved = saveBtn.classList.contains('saved');
        saveBtn.classList.toggle('saved', !wasSaved);
        saveBtn.querySelector('.action-icon').className = `fa-${!wasSaved?'solid':'regular'} fa-bookmark action-icon`;
        try {
          const res = await API.posts.save(pid);
          Toast.info(res.isSaved ? '🔖 Post saved!' : 'Removed from saved');
          saveBtn.classList.toggle('saved', res.isSaved);
          saveBtn.querySelector('.action-icon').className = `fa-${res.isSaved?'solid':'regular'} fa-bookmark action-icon`;
        } catch(err) {
          saveBtn.classList.toggle('saved', wasSaved);
          saveBtn.querySelector('.action-icon').className = `fa-${wasSaved?'solid':'regular'} fa-bookmark action-icon`;
          Toast.error(err.message);
        }
        return;
      }

      // ── Post menu toggle ──
      const menuBtn = e.target.closest('.post-menu-btn');
      if (menuBtn) {
        e.stopPropagation();
        const pid = menuBtn.dataset.postId;
        document.querySelectorAll('.dropdown-menu').forEach(m => {
          if (m.id !== `post-menu-${pid}`) m.classList.add('hidden');
        });
        document.getElementById(`post-menu-${pid}`)?.classList.toggle('hidden');
        return;
      }

      // ── Close all dropdowns ──
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
      }

      // ── Edit post ──
      const editBtn = e.target.closest('[data-action="edit-post"]');
      if (editBtn) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
        const pid = editBtn.dataset.postId;
        try {
          const res = await API.posts.getPost(pid);
          Components.openEditPostModal(res.post);
        } catch(err) { Toast.error(err.message); }
        return;
      }

      // ── Delete post ──
      const delBtn = e.target.closest('[data-action="delete-post"]');
      if (delBtn) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
        Modal.confirm('Delete this post? This cannot be undone.', async () => {
          try {
            await API.posts.delete(delBtn.dataset.postId);
            delBtn.closest('.post-card')?.remove();
            Toast.success('Post deleted');
          } catch(err) { Toast.error(err.message); }
        });
        return;
      }

      // ── Share / copy link ──
      const shareBtn = e.target.closest('[data-action="share-post"],[data-action="copy-link"]');
      if (shareBtn) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
        const url = Utils.shareUrl(shareBtn.dataset.postId);
        if (navigator.share) {
          navigator.share({ url }).catch(()=>{});
        } else {
          const ok = await Utils.copyToClipboard(url);
          Toast.info(ok ? '🔗 Link copied to clipboard!' : url);
        }
        return;
      }

      // ── Like comment ──
      const likeComment = e.target.closest('[data-action="like-comment"]');
      if (likeComment) {
        if (!Auth.requireAuth()) return;
        const cid = likeComment.dataset.commentId;
        try {
          const res = await API.comments.like(cid);
          likeComment.innerHTML = `<i class="fa-${res.isLiked?'solid':'regular'} fa-heart"></i> ${res.likesCount}`;
        } catch {}
        return;
      }

      // ── Delete comment ──
      const delComment = e.target.closest('[data-action="delete-comment"]');
      if (delComment) {
        const cid = delComment.dataset.commentId;
        Modal.confirm('Delete this comment?', async () => {
          try {
            await API.comments.delete(cid);
            delComment.closest('.comment-item')?.remove();
            Toast.success('Comment deleted');
          } catch(err) { Toast.error(err.message); }
        });
        return;
      }

      // ── Hashtag click ──
      const hashtag = e.target.closest('.hashtag');
      if (hashtag) {
        Router.navigate(`/explore?tag=${encodeURIComponent(hashtag.dataset.tag||hashtag.textContent.replace('#',''))}`);
        return;
      }
    });

    // Comment input — Enter key
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.classList.contains('comment-input') && !e.shiftKey) {
        e.preventDefault();
        const pid = e.target.dataset.postId;
        const val = e.target.value.trim();
        if (val) { e.target.value = ''; this._submitComment(pid, val); }
      }
    });
  },

  async _loadComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    if (!list) return;
    list.innerHTML = `<div style="padding:12px 0;display:flex;justify-content:center;">${Utils.spinner()}</div>`;
    try {
      const data = await API.comments.get(postId);
      const comments = data.comments || [];
      list.innerHTML = comments.length
        ? comments.map(c => Components.commentItem(c)).join('')
        : `<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0;">No comments yet — be the first!</div>`;
    } catch {
      list.innerHTML = `<div style="color:var(--error);font-size:0.85rem;">Failed to load comments</div>`;
    }
  },

  async _submitComment(postId, content) {
    try {
      const data = await API.comments.create(postId, { content });
      const list = document.getElementById(`comments-list-${postId}`);
      if (list) {
        const empty = list.querySelector('div:not([data-comment-id])');
        if (empty) empty.remove();
        list.insertAdjacentHTML('afterbegin', Components.commentItem(data.comment));
      }
      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl) countEl.textContent = Utils.formatCount((parseInt(countEl.textContent)||0) + 1);
    } catch(err) { Toast.error(err.message); }
  },

  // ─── RIGHT SIDEBAR ───────────────────────────────────────────
  async _loadRightSidebar() {
    this._loadSuggested();
    this._loadTrending();
  },

  async _loadSuggested() {
    const el = document.getElementById('suggested-users');
    if (!el) return;
    try {
      const data = await API.users.getSuggested();
      el.innerHTML = Components.suggestedUsersHtml(data.users);
      el.querySelectorAll('[data-action="follow-suggested"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const res = await API.users.follow(btn.dataset.userId);
            btn.textContent = res.isFollowing ? 'Following' : 'Follow';
            btn.classList.toggle('following', res.isFollowing);
            Toast.info(res.message);
          } catch(err) { Toast.error(err.message); }
        });
      });
    } catch {}
  },

  async _loadTrending() {
    const el = document.getElementById('trending-tags');
    if (!el) return;
    try {
      const data = await API.posts.trending();
      el.innerHTML = Components.trendingTagsHtml(data.hashtags);
      el.querySelectorAll('[data-action="nav-tag"]').forEach(el => {
        el.addEventListener('click', () => Router.navigate(`/explore?tag=${el.dataset.tag}`));
      });
    } catch {}
  },

  // ─── NOTIFICATIONS POLLING ────────────────────────────────────
  async _pollNotifications() {
    clearInterval(this._notifInterval);
    const update = async () => {
      try {
        const data = await API.notifications.unreadCount();
        const count = data.count || 0;
        ['notif-badge','notif-badge-mobile'].forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.textContent = count > 99 ? '99+' : count;
          el.classList.toggle('hidden', count === 0);
        });
      } catch {}
    };
    await update();
    this._notifInterval = setInterval(update, 30000);
  },

  // ─── SEARCH ──────────────────────────────────────────────────
  _bindSearch() {
    const input    = document.getElementById('global-search');
    const dropdown = document.getElementById('search-dropdown');
    if (!input || !dropdown) return;

    const doSearch = Utils.debounce(async q => {
      q = q.trim();
      if (!q) { dropdown.classList.add('hidden'); return; }
      dropdown.innerHTML = `<div style="padding:16px;text-align:center;">${Utils.spinner()}</div>`;
      dropdown.classList.remove('hidden');
      try {
        const data = await API.search.query(q);
        const users = data.results?.users || [];
        const posts = data.results?.posts || [];
        if (!users.length && !posts.length) {
          dropdown.innerHTML = `<div style="padding:16px;color:var(--text-muted);text-align:center;font-size:0.9rem;">No results for "${Utils.escapeHtml(q)}"</div>`;
          return;
        }
        let html = '';
        if (users.length) {
          html += `<div style="padding:8px 16px 2px;font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;">People</div>`;
          html += users.slice(0,4).map(u => `
            <div class="search-result-item" data-route="/profile/${u.username}">
              ${Utils.avatarHtml(u,'sm')}
              <div>
                <div class="search-result-name">${Utils.escapeHtml(u.name)} ${Utils.verifiedBadge(u.isVerified)}</div>
                <div class="search-result-meta">@${Utils.escapeHtml(u.username)} · ${Utils.formatCount(u.followersCount)} followers</div>
              </div>
            </div>`).join('');
        }
        if (posts.length) {
          html += `<div style="padding:8px 16px 2px;font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;">Posts</div>`;
          html += posts.slice(0,3).map(p => `
            <div class="search-result-item" style="cursor:pointer;" onclick="Router.navigate('/explore')">
              <i class="fa-regular fa-file-lines" style="font-size:1.1rem;color:var(--text-muted);width:28px;text-align:center;flex-shrink:0;"></i>
              <div>
                <div class="search-result-name">${Utils.escapeHtml((p.content||'').slice(0,60))}${p.content?.length>60?'…':''}</div>
                <div class="search-result-meta">by @${Utils.escapeHtml(p.author?.username||'')}</div>
              </div>
            </div>`).join('');
        }
        dropdown.innerHTML = html;
      } catch { dropdown.innerHTML = `<div style="padding:16px;color:var(--error);font-size:0.85rem;">Search failed</div>`; }
    }, 350);

    input.addEventListener('input', () => doSearch(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        Router.navigate(`/explore?q=${encodeURIComponent(input.value.trim())}`);
        dropdown.classList.add('hidden');
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-bar')) dropdown.classList.add('hidden');
    });
  },

  // ─── EXPLORE ─────────────────────────────────────────────────
  renderExplore() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.explore(), 'explore');
    this._bindPostActions();
    this._bindExplore();

    const q = Router.getQuery();
    if (q.q || q.tag) {
      const inp = document.getElementById('explore-search-input');
      if (inp) { inp.value = q.q || '#' + q.tag; }
    }
    this._loadExplorePosts();
  },

  _bindExplore() {
    document.querySelectorAll('.explore-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.explore-tab').forEach(t => {
          t.className = 'btn btn-secondary btn-sm explore-tab';
        });
        tab.className = 'btn btn-primary btn-sm explore-tab';
        const t = tab.dataset.tab;
        ['posts','people','trending','reels'].forEach(name => {
          document.getElementById(`explore-${name}`)?.classList.toggle('hidden', name !== t);
        });
        if (t === 'people')   this._loadExplorePeople();
        if (t === 'trending') this._loadExploreTrending();
        if (t === 'reels')    this._loadExploreReels();
      });
    });

    const inp = document.getElementById('explore-search-input');
    const searchDropdown = document.getElementById('explore-search-dropdown');
    const doSearch = Utils.debounce(async q => {
      q = q.trim();
      if (!q) { searchDropdown?.classList.add('hidden'); return; }
      searchDropdown?.classList.remove('hidden');
      searchDropdown.innerHTML = `<div style="padding:12px;text-align:center;">${Utils.spinner()}</div>`;
      try {
        const data = await API.search.query(q);
        const users = data.results?.users || [];
        const posts = data.results?.posts || [];
        let html = '';
        if (users.length) {
          html += `<div style="padding:8px 16px 2px;font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">People</div>`;
          html += users.slice(0,3).map(u=>`
            <div class="search-result-item" data-route="/profile/${u.username}">
              ${Utils.avatarHtml(u,'sm')}
              <div><div class="search-result-name">${Utils.escapeHtml(u.name)}</div>
              <div class="search-result-meta">@${Utils.escapeHtml(u.username)}</div></div>
            </div>`).join('');
        }
        if (posts.length) {
          html += `<div style="padding:8px 16px 2px;font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Posts</div>`;
          const grid = document.getElementById('explore-posts-grid');
          if (grid) grid.innerHTML = posts.map(p => Components.postCard(p, Auth.getUser()?._id)).join('');
        }
        if (!html) html = `<div style="padding:12px 16px;color:var(--text-muted);font-size:0.85rem;">No results for "${Utils.escapeHtml(q)}"</div>`;
        searchDropdown.innerHTML = html;
      } catch { searchDropdown.innerHTML = `<div style="padding:12px;color:var(--error);">Search failed</div>`; }
    }, 400);

    inp?.addEventListener('input', () => doSearch(inp.value));
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-bar')) searchDropdown?.classList.add('hidden');
    });
  },

  async _loadExplorePosts() {
    const grid = document.getElementById('explore-posts-grid');
    if (!grid) return;
    grid.innerHTML = [1,2,3].map(()=>Components.postSkeleton()).join('');
    try {
      const data = await API.posts.getExplore();
      const posts = data.posts || [];
      const uid = Auth.getUser()?._id;
      grid.innerHTML = posts.length
        ? posts.map(p => Components.postCard(p, uid)).join('')
        : `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No posts yet</div></div>`;
    } catch(err) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load posts</div></div>`;
    }
  },

  async _loadExplorePeople() {
    const el = document.getElementById('explore-people');
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    el.innerHTML = `<div class="page-loader">${Utils.spinner()}</div>`;
    try {
      const data = await API.users.getSuggested();
      const users = data.users || [];
      el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">
        ${users.map(u=>`
          <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;">
            <a href="/profile/${u.username}" data-route="/profile/${u.username}">${Utils.avatarHtml(u,'lg')}</a>
            <div style="flex:1;min-width:0;">
              <a href="/profile/${u.username}" data-route="/profile/${u.username}" style="font-weight:700;font-size:0.95rem;">${Utils.escapeHtml(u.name)} ${Utils.verifiedBadge(u.isVerified)}</a>
              <div style="color:var(--text-muted);font-size:0.82rem;">@${Utils.escapeHtml(u.username)} · ${Utils.formatCount(u.followersCount)} followers</div>
              ${u.bio?`<div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${Utils.escapeHtml(u.bio.slice(0,80))}</div>`:''}
            </div>
            <button class="follow-btn-small" data-action="follow-ep" data-user-id="${u._id}">Follow</button>
          </div>`).join('')}
      </div>`;
      el.querySelectorAll('[data-action="follow-ep"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const res = await API.users.follow(btn.dataset.userId);
            btn.textContent = res.isFollowing ? 'Following' : 'Follow';
            btn.classList.toggle('following', res.isFollowing);
            Toast.info(res.message);
          } catch(err) { Toast.error(err.message); }
        });
      });
    } catch { el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div></div>`; }
  },

  async _loadExploreTrending() {
    const el = document.getElementById('explore-trending');
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    el.innerHTML = `<div class="page-loader">${Utils.spinner()}</div>`;
    try {
      const data = await API.posts.trending();
      const tags = data.hashtags || [];
      el.innerHTML = tags.length
        ? tags.map((tag,i)=>`
          <div class="trending-card" data-route="/explore?tag=${tag._id}">
            <span class="trending-rank">#${i+1}</span>
            <div style="flex:1;">
              <div style="font-weight:700;">#${Utils.escapeHtml(tag._id)}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${Utils.formatCount(tag.count)} posts</div>
            </div>
            <i class="fa-solid fa-arrow-trend-up" style="color:var(--primary);"></i>
          </div>`).join('')
        : `<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-title">No trending topics yet</div></div>`;
    } catch { el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div></div>`; }
  },

  _loadExploreReels() {
    const el = document.getElementById('explore-reels');
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎬</div>
      <div class="empty-state-title">Reels Coming Soon</div>
      <div class="empty-state-text">Short video reels are in development. Stay tuned!</div>
    </div>`;
  },

  // ─── PROFILE ──────────────────────────────────────────────────
  renderProfile(username) {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.profile(username), 'profile');
    this._bindPostActions();
    this._loadProfile(username);
  },

  async _loadProfile(username) {
    try {
      const [profileRes, postsRes] = await Promise.all([
        API.users.getProfile(username),
        API.posts.getUserPosts(username),
      ]);
      const user  = profileRes.user;
      const posts = postsRes.posts || [];

      // Cover
      const coverEl = document.getElementById('profile-cover');
      if (coverEl) {
        if (user.coverImage) {
          coverEl.outerHTML = `<div class="profile-cover" style="border-radius:var(--radius-lg) var(--radius-lg) 0 0;"><img src="${user.coverImage}" alt="Cover" /></div>`;
        } else {
          coverEl.className = 'profile-cover';
          coverEl.style.cssText = 'background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:var(--radius-lg) var(--radius-lg) 0 0;height:210px;';
        }
      }

      // Avatar
      const avatarEl = document.getElementById('profile-avatar-el');
      if (avatarEl) {
        avatarEl.className = 'avatar avatar-2xl';
        avatarEl.style.cssText = 'border:4px solid var(--bg-card);box-shadow:var(--shadow-md);';
        const src = user.avatar || user.avatarUrl || CONFIG.DEFAULT_AVATAR(user.name);
        avatarEl.innerHTML = `<img src="${src}" alt="${Utils.escapeHtml(user.name)}" onerror="this.parentElement.innerHTML='<span style=\'font-weight:700;color:white;font-size:2rem;\'>${(user.name||'U')[0]}</span>'" />`;
      }

      // Action buttons
      const actionsEl = document.getElementById('profile-action-btns');
      if (actionsEl) {
        if (user.isOwnProfile) {
          actionsEl.innerHTML = `
            <a href="/edit-profile" class="btn btn-secondary btn-sm" data-route="/edit-profile"><i class="fa-solid fa-pen"></i> Edit Profile</a>
            <a href="/analytics" class="btn btn-secondary btn-sm" data-route="/analytics"><i class="fa-solid fa-chart-bar"></i></a>`;
        } else {
          actionsEl.innerHTML = `
            <button class="btn ${user.isFollowing?'btn-secondary':'btn-primary'} btn-sm ripple" id="follow-profile-btn" data-user-id="${user._id}" data-following="${user.isFollowing}">
              ${user.isFollowing?'<i class="fa-solid fa-user-check"></i> Following':'<i class="fa-solid fa-user-plus"></i> Follow'}
            </button>
            <button class="btn btn-secondary btn-sm" id="message-profile-btn" data-username="${user.username}">
              <i class="fa-regular fa-comment-dots"></i>
            </button>
            <button class="btn btn-secondary btn-sm" id="share-profile-btn"><i class="fa-solid fa-share-nodes"></i></button>`;
          this._bindProfileFollowBtn(user);
        }
      }

      // Details
      const detailsEl = document.getElementById('profile-details');
      if (detailsEl) {
        detailsEl.innerHTML = `
          <div class="profile-name">${Utils.escapeHtml(user.name)} ${Utils.verifiedBadge(user.isVerified)}</div>
          <div class="profile-username">@${Utils.escapeHtml(user.username)}</div>
          ${user.bio?`<p class="profile-bio">${Utils.escapeHtml(user.bio)}</p>`:''}
          <div class="profile-meta">
            ${user.location?`<span class="profile-meta-item"><i class="fa-solid fa-location-dot"></i> ${Utils.escapeHtml(user.location)}</span>`:''}
            ${user.website?`<span class="profile-meta-item"><i class="fa-solid fa-link"></i> <a href="${Utils.escapeHtml(user.website)}" target="_blank" rel="noopener" style="color:var(--primary);">${Utils.escapeHtml(user.website)}</a></span>`:''}
            <span class="profile-meta-item"><i class="fa-regular fa-calendar"></i> Joined ${new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
          </div>
          <div class="profile-stats" style="margin:14px 0 8px;">
            <div class="stat-item"><span class="stat-number" id="ps-posts">${Utils.formatCount(user.postsCount)}</span><span class="stat-label">Posts</span></div>
            <div class="stat-item" id="ps-followers-wrap" style="cursor:pointer;"><span class="stat-number" id="ps-followers">${Utils.formatCount(user.followersCount)}</span><span class="stat-label">Followers</span></div>
            <div class="stat-item" id="ps-following-wrap" style="cursor:pointer;"><span class="stat-number" id="ps-following">${Utils.formatCount(user.followingCount)}</span><span class="stat-label">Following</span></div>
          </div>`;
      }

      // Social links
      document.getElementById('ps-followers-wrap')?.addEventListener('click', () => this._showFollowModal(user.username, 'followers'));
      document.getElementById('ps-following-wrap')?.addEventListener('click', () => this._showFollowModal(user.username, 'following'));

      // Tabs
      document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this._renderProfileTab(tab.dataset.tab, user, posts);
        });
      });

      // Default tab
      this._renderProfileTab('posts', user, posts);

    } catch(err) {
      Toast.error('Could not load profile: ' + err.message);
    }
  },

  _renderProfileTab(tab, user, posts) {
    const el = document.getElementById('profile-tab-content');
    if (!el) return;
    const uid = Auth.getUser()?._id;

    if (tab === 'posts') {
      if (!posts.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📷</div><div class="empty-state-title">No posts yet</div></div>`;
        return;
      }
      // Grid for image posts, list for text
      const imgPosts = posts.filter(p=>p.images?.length);
      if (imgPosts.length >= 3) {
        el.innerHTML = `<div class="profile-posts-grid">${posts.map(p=>`
          <div class="profile-post-thumb" data-post-id="${p._id}" title="${Utils.escapeHtml((p.content||'').slice(0,60))}">
            ${p.images?.[0]
              ? `<img src="${p.images[0]}" loading="lazy" alt="post" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-input);padding:12px;font-size:0.8rem;color:var(--text-secondary);overflow:hidden;">${Utils.escapeHtml((p.content||'').slice(0,80))}</div>`}
            <div class="post-thumb-overlay">
              <span><i class="fa-solid fa-heart"></i> ${Utils.formatCount(p.likesCount)}</span>
              <span><i class="fa-solid fa-comment"></i> ${Utils.formatCount(p.commentsCount)}</span>
            </div>
          </div>`).join('')}</div>`;
        el.querySelectorAll('.profile-post-thumb').forEach(thumb => {
          thumb.addEventListener('click', async () => {
            try {
              const res = await API.posts.getPost(thumb.dataset.postId);
              const ov = Modal.open(`<div class="modal" style="max-width:640px;">
                <div class="modal-header"><h3 class="modal-title">Post</h3>
                  <button class="modal-close" onclick="Modal.close()">✕</button>
                </div>
                <div class="modal-body" style="padding-top:0;">${Components.postCard(res.post,uid)}</div>
              </div>`);
            } catch(err) { Toast.error(err.message); }
          });
        });
      } else {
        el.innerHTML = posts.map(p => Components.postCard(p, uid)).join('');
      }
    } else if (tab === 'media') {
      const mediaPosts = posts.filter(p=>p.images?.length);
      if (!mediaPosts.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-title">No media yet</div></div>`;
        return;
      }
      el.innerHTML = `<div class="profile-posts-grid">${mediaPosts.map(p=>`
        <div class="profile-post-thumb">
          <img src="${p.images[0]}" loading="lazy" onclick="Components.openImageModal('${p.images[0]}')" />
          <div class="post-thumb-overlay">
            <span><i class="fa-solid fa-heart"></i> ${Utils.formatCount(p.likesCount)}</span>
          </div>
        </div>`).join('')}</div>`;
    } else if (tab === 'about') {
      el.innerHTML = `<div class="card" style="padding:24px;margin-top:2px;">
        <h4 style="margin-bottom:16px;">About</h4>
        <div style="display:flex;flex-direction:column;gap:12px;color:var(--text-secondary);font-size:0.9rem;">
          ${user.bio?`<div><strong style="color:var(--text);">Bio</strong><p style="margin-top:4px;">${Utils.escapeHtml(user.bio)}</p></div>`:''}
          ${user.location?`<div style="display:flex;gap:8px;align-items:center;"><i class="fa-solid fa-location-dot" style="color:var(--primary);width:18px;"></i> ${Utils.escapeHtml(user.location)}</div>`:''}
          ${user.website?`<div style="display:flex;gap:8px;align-items:center;"><i class="fa-solid fa-link" style="color:var(--primary);width:18px;"></i> <a href="${Utils.escapeHtml(user.website)}" target="_blank" rel="noopener" style="color:var(--primary);">${Utils.escapeHtml(user.website)}</a></div>`:''}
          <div style="display:flex;gap:8px;align-items:center;"><i class="fa-regular fa-calendar" style="color:var(--primary);width:18px;"></i> Joined ${new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
          ${user.skills?.length?`<div><strong style="color:var(--text);">Skills</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${user.skills.map(s=>`<span class="hashtag-pill">${Utils.escapeHtml(s)}</span>`).join('')}</div></div>`:''}
        </div>
      </div>`;
    }
  },

  _bindProfileFollowBtn(user) {
    document.getElementById('follow-profile-btn')?.addEventListener('click', async function() {
      const btn = this;
      const isFollowing = btn.dataset.following === 'true';
      btn.disabled = true;
      try {
        const res = await API.users.follow(user._id);
        btn.dataset.following = res.isFollowing;
        btn.className = `btn ${res.isFollowing?'btn-secondary':'btn-primary'} btn-sm ripple`;
        btn.innerHTML = res.isFollowing ? '<i class="fa-solid fa-user-check"></i> Following' : '<i class="fa-solid fa-user-plus"></i> Follow';
        const followerEl = document.getElementById('ps-followers');
        if (followerEl) {
          const cur = parseInt(followerEl.textContent.replace(/[KM]/,'')) || user.followersCount || 0;
          followerEl.textContent = Utils.formatCount(res.isFollowing ? cur+1 : Math.max(0,cur-1));
          followerEl.classList.add('count-bump');
          setTimeout(()=>followerEl.classList.remove('count-bump'),500);
        }
        Toast.info(res.message);
      } catch(err) { Toast.error(err.message); }
      finally { btn.disabled = false; }
    });

    document.getElementById('share-profile-btn')?.addEventListener('click', async () => {
      const ok = await Utils.copyToClipboard(window.location.href);
      Toast.info(ok ? '🔗 Profile link copied!' : window.location.href);
    });

    document.getElementById('message-profile-btn')?.addEventListener('click', () => {
      Router.navigate('/messages');
    });
  },

  async _showFollowModal(username, type) {
    const ov = Modal.open(`<div class="modal" style="max-width:400px;">
      <div class="modal-header">
        <h3 class="modal-title">${type==='followers'?'Followers':'Following'}</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body" style="padding-top:0;max-height:400px;overflow-y:auto;">
        <div id="follow-modal-list"><div class="page-loader">${Utils.spinner()}</div></div>
      </div>
    </div>`);
    try {
      const fn = type==='followers' ? API.users.getFollowers : API.users.getFollowing;
      const data = await fn(username);
      const list = data.followers || data.following || [];
      const el = ov.querySelector('#follow-modal-list');
      if (!list.length) { el.innerHTML = `<div class="empty-state" style="padding:24px;"><div class="empty-state-icon">👤</div><div class="empty-state-title">No ${type} yet</div></div>`; return; }
      el.innerHTML = list.map(u=>`
        <div class="suggested-user" style="padding:12px 0;">
          <a href="/profile/${u.username}" data-route="/profile/${u.username}" onclick="Modal.close()">${Utils.avatarHtml(u,'md')}</a>
          <div class="suggested-user-info">
            <a href="/profile/${u.username}" data-route="/profile/${u.username}" class="suggested-user-name" onclick="Modal.close()">${Utils.escapeHtml(u.name)} ${Utils.verifiedBadge(u.isVerified)}</a>
            <div class="suggested-user-handle">@${Utils.escapeHtml(u.username)}</div>
          </div>
        </div>`).join('');
    } catch(err) { Toast.error(err.message); }
  },

  // ─── EDIT PROFILE ─────────────────────────────────────────────
  renderEditProfile() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.editProfile(), 'profile');
    this._bindEditProfile();
  },

  _bindEditProfile() {
    const bioInput = document.getElementById('edit-bio');
    const bioCounter = document.getElementById('bio-counter');
    bioInput?.addEventListener('input', () => {
      if (bioCounter) bioCounter.textContent = `${bioInput.value.length}/160`;
    });

    document.getElementById('avatar-file')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const err = Utils.validateImage(file);
      if (err) return Toast.error(err);
      const url = await Utils.readFileAsDataUrl(file);
      const prev = document.getElementById('edit-avatar-preview');
      if (prev) prev.innerHTML = `<img src="${url}" alt="preview" />`;
      const fd = new FormData();
      fd.append('avatar', file);
      try {
        const data = await API.users.uploadAvatar(fd);
        Auth.updateUser({ avatar: data.avatar });
        Toast.success('Profile photo updated!');
      } catch(err) { Toast.error(err.message); }
      e.target.value = '';
    });

    document.getElementById('cover-file')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const err = Utils.validateImage(file);
      if (err) return Toast.error(err);
      const fd = new FormData();
      fd.append('cover', file);
      try {
        const data = await API.users.uploadCover(fd);
        Auth.updateUser({ coverImage: data.coverImage });
        Toast.success('Cover photo updated!');
      } catch(err) { Toast.error(err.message); }
      e.target.value = '';
    });

    document.getElementById('edit-profile-form')?.addEventListener('submit', async () => {
      const btn = document.getElementById('save-profile-btn');
      this._setLoading(btn, true, 'Saving…');
      const updates = {
        name:     document.getElementById('edit-name')?.value.trim(),
        bio:      document.getElementById('edit-bio')?.value.trim(),
        website:  document.getElementById('edit-website')?.value.trim(),
        location: document.getElementById('edit-location')?.value.trim(),
        socialLinks: {
          twitter:  document.getElementById('edit-twitter')?.value.trim(),
          github:   document.getElementById('edit-github')?.value.trim(),
          linkedin: document.getElementById('edit-linkedin')?.value.trim(),
        },
      };
      try {
        const data = await API.users.updateProfile(updates);
        Auth.updateUser(data.user);
        Toast.success('Profile updated!');
        Router.navigate(`/profile/${Auth.getUser().username}`);
      } catch(err) {
        Toast.error(err.message);
        this._setLoading(btn, false, '<i class="fa-solid fa-check"></i> Save Changes');
      }
    });
  },

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  renderNotifications() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.notifications(), 'notifications');
    this._loadNotifications();
  },

  async _loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    try {
      const data = await API.notifications.get();
      const notifs = data.notifications || [];
      if (!notifs.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-title">All caught up!</div><div class="empty-state-text">You have no notifications right now.</div></div>`;
        return;
      }
      list.innerHTML = notifs.map(n => Components.notificationItem(n)).join('');
      list.querySelectorAll('.notification-item').forEach(el => {
        el.addEventListener('click', () => {
          API.notifications.markRead(el.dataset.notifId).catch(()=>{});
          el.classList.remove('unread');
          el.querySelector('span[style*="background"]')?.remove();
        });
      });
    } catch { list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div></div>`; }

    document.getElementById('mark-all-read-btn')?.addEventListener('click', async () => {
      try {
        await API.notifications.markAllRead();
        document.querySelectorAll('.notification-item.unread').forEach(el => el.classList.remove('unread'));
        ['notif-badge','notif-badge-mobile'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        Toast.success('All marked as read');
      } catch(err) { Toast.error(err.message); }
    });
  },

  // ─── SAVED ────────────────────────────────────────────────────
  renderSaved() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.saved(), 'saved');
    this._bindPostActions();
    this._loadSavedPosts();
  },

  async _loadSavedPosts() {
    const el = document.getElementById('saved-posts-container');
    if (!el) return;
    try {
      const data = await API.users.getSaved();
      const posts = data.posts || [];
      if (!posts.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔖</div><div class="empty-state-title">No saved posts</div><div class="empty-state-text">Bookmark posts to read them later.</div></div>`;
        return;
      }
      const uid = Auth.getUser()?._id;
      el.innerHTML = posts.map(p => Components.postCard({...p, isSaved:true}, uid)).join('');
    } catch { el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div></div>`; }
  },

  // ─── ANALYTICS ────────────────────────────────────────────────
  renderAnalytics() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.analytics(), 'analytics');
    this._loadAnalytics();
  },

  async _loadAnalytics() {
    try {
      const data = await API.users.getAnalytics();
      const a = data.analytics;
      const statData = [
        {id:'stat-0', value:a.profileViews,   icon:'👁️', change:'+12%'},
        {id:'stat-1', value:a.totalLikes,      icon:'❤️', change:'+8%'},
        {id:'stat-2', value:a.totalComments,   icon:'💬', change:'+5%'},
        {id:'stat-3', value:a.postsCount,      icon:'📝', change:''},
      ];
      statData.forEach(s => {
        const el = document.getElementById(s.id);
        if (!el) return;
        el.className = 'analytics-number';
        el.textContent = '0';
        Utils.animateNumber(el, s.value, 1200);
        if (s.change) {
          el.insertAdjacentHTML('afterend', `<div class="analytics-change up" style="font-size:0.75rem;margin-top:3px;">${s.icon} ${s.change} this week</div>`);
        }
      });

      document.getElementById('audience-stats').innerHTML = `
        <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
          <div class="stat-item"><span class="stat-number" style="font-size:1.8rem;">${Utils.formatCount(a.followersCount)}</span><span class="stat-label">Followers</span></div>
          <div class="stat-item"><span class="stat-number" style="font-size:1.8rem;">${Utils.formatCount(a.followingCount)}</span><span class="stat-label">Following</span></div>
          <div style="margin-left:auto;font-size:0.85rem;color:var(--text-muted);">
            Ratio: <strong style="color:${a.followersCount>a.followingCount?'var(--success)':'var(--text)'}">
              ${a.followingCount ? (a.followersCount/a.followingCount).toFixed(2) : 'N/A'}
            </strong>
          </div>
        </div>`;

      const timeline = [
        {icon:'📝', bg:'rgba(79,70,229,.1)', color:'var(--primary)',  text:`${Utils.formatCount(a.postsCount)} posts published`},
        {icon:'❤️', bg:'rgba(239,68,68,.1)', color:'#EF4444',         text:`${Utils.formatCount(a.totalLikes)} total likes received`},
        {icon:'💬', bg:'rgba(6,182,212,.1)',  color:'var(--secondary)',text:`${Utils.formatCount(a.totalComments)} comments on posts`},
        {icon:'👥', bg:'rgba(16,185,129,.1)', color:'var(--success)',  text:`${Utils.formatCount(a.followersCount)} people following you`},
        {icon:'👁️', bg:'rgba(245,158,11,.1)', color:'var(--warning)',  text:`${Utils.formatCount(a.profileViews)} profile views`},
      ];
      document.getElementById('activity-timeline').innerHTML = timeline.map(t=>`
        <div class="timeline-item">
          <div class="timeline-dot" style="background:${t.bg};color:${t.color};">${t.icon}</div>
          <div class="timeline-content">
            <div class="timeline-text">${t.text}</div>
            <div class="timeline-time">All time</div>
          </div>
        </div>`).join('');
    } catch(err) { Toast.error('Failed to load analytics: ' + err.message); }
  },

  // ─── MESSAGES ─────────────────────────────────────────────────
  renderMessages() {
    if (!Auth.requireAuth()) return;
    this._renderLayout(Pages.messages(), 'messages');
    this._loadConversations();
  },

  async _loadConversations() {
    const list = document.getElementById('conversations-list');
    if (!list) return;
    try {
      const data = await API.messages.getConversations();
      const convs = data.conversations || [];
      if (!convs.length) {
        list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.9rem;">No conversations yet.<br>Follow people and start chatting!</div>`;
        return;
      }
      list.innerHTML = convs.map(c => {
        const other = c._id;
        const msg = c.lastMessage;
        return `<div class="chat-conversation-item" data-user-id="${other?._id}" data-username="${other?.username}">
          <div style="position:relative;">${Utils.avatarHtml(other||{name:'?'},'md')}
            ${other?.isOnline?`<span class="online-dot" style="position:absolute;bottom:0;right:-1px;"></span>`:''}
          </div>
          <div class="chat-conversation-meta">
            <div class="chat-conversation-name">${Utils.escapeHtml(other?.name||'?')}</div>
            <div class="chat-conversation-preview">${Utils.escapeHtml((msg?.content||'').slice(0,40))}</div>
          </div>
          ${c.unreadCount?`<span class="chat-unread-badge">${c.unreadCount}</span>`:''}
        </div>`;
      }).join('');
      list.querySelectorAll('.chat-conversation-item').forEach(el => {
        el.addEventListener('click', () => {
          list.querySelectorAll('.chat-conversation-item').forEach(i=>i.classList.remove('active'));
          el.classList.add('active');
          const userId = el.dataset.userId;
          const username = el.dataset.username;
          if (userId) this._openChat(userId, username);
        });
      });
    } catch(err) {
      list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--error);font-size:0.85rem;">${err.message}</div>`;
    }
  },

  async _openChat(userId, username) {
    const main = document.getElementById('chat-main');
    if (!main) return;
    const otherUser = { _id: userId, name: username, username };

    main.innerHTML = `
      <div class="chat-messages-header">
        ${Utils.avatarHtml(otherUser,'md')}
        <div style="flex:1;">
          <div style="font-weight:700;">@${Utils.escapeHtml(username)}</div>
          <div style="font-size:0.78rem;color:var(--success);"><i class="fa-solid fa-circle" style="font-size:0.5rem;"></i> Active</div>
        </div>
        <a href="/profile/${username}" class="btn btn-ghost btn-sm" data-route="/profile/${username}">
          <i class="fa-solid fa-user"></i>
        </a>
      </div>
      <div class="chat-messages-area" id="chat-messages-area">
        <div class="page-loader">${Utils.spinner()}</div>
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-message-input" placeholder="Type a message…" maxlength="2000" autocomplete="off" />
        <button class="btn btn-primary btn-sm ripple" id="send-message-btn">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>`;

    try {
      const data = await API.messages.getMessages(userId);
      const messages = data.messages || [];
      const area = document.getElementById('chat-messages-area');
      const myId = Auth.getUser()?._id;
      area.innerHTML = messages.length
        ? messages.map(msg => this._messageBubble(msg, myId)).join('')
        : `<div style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.9rem;">No messages yet. Say hello! 👋</div>`;
      area.scrollTop = area.scrollHeight;
    } catch {}

    const sendBtn = document.getElementById('send-message-btn');
    const input   = document.getElementById('chat-message-input');
    const send = async () => {
      const content = input.value.trim();
      if (!content) return;
      input.value = '';
      try {
        const res = await API.messages.send(userId, { content });
        const area = document.getElementById('chat-messages-area');
        const myId = Auth.getUser()?._id;
        area.insertAdjacentHTML('beforeend', this._messageBubble(res.message, myId));
        area.scrollTop = area.scrollHeight;
      } catch(err) { Toast.error(err.message); }
    };
    sendBtn?.addEventListener('click', send);
    input?.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  },

  _messageBubble(msg, myId) {
    const isOwn = msg.sender?._id?.toString()===myId?.toString() || msg.sender?.toString()===myId?.toString();
    return `<div class="message-bubble ${isOwn?'own':''}">
      ${!isOwn?Utils.avatarHtml(msg.sender||{name:'?'},'xs'):''}
      <div>
        <div class="message-text">${Utils.escapeHtml(msg.content)}</div>
        <div class="message-time">${Utils.timeAgo(msg.createdAt)}</div>
      </div>
    </div>`;
  },

  // ─── Field validation helpers ─────────────────────────────────
  _showFieldError(inputId, message) {
    const inp = document.getElementById(inputId);
    if (inp) inp.classList.add('error');
    const errEl = document.getElementById(`err-${inputId.replace('reg-','').replace('login-','')}`);
    if (errEl) {
      errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${Utils.escapeHtml(message)}`;
      errEl.classList.remove('hidden');
    }
  },

  _clearFieldError(inputId) {
    const inp = document.getElementById(inputId);
    if (inp) inp.classList.remove('error');
    const key = inputId.replace('reg-','').replace('login-','');
    const errEl = document.getElementById(`err-${key}`);
    if (errEl) errEl.classList.add('hidden');
  },

  _setLoading(btn, loading, label='') {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `${Utils.spinner()} ${label}`;
    } else {
      btn.innerHTML = label || btn.dataset.original || label;
    }
  },
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
