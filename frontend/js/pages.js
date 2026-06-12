'use strict';
const Pages = {

  landing() {
    return `<div class="page-enter" id="landing-page">
    <nav class="landing-nav" id="landing-nav">
      <div class="sidebar-logo" style="position:static;">
        <div class="logo-icon" style="width:36px;height:36px;font-size:1rem;">C</div>
        <span class="logo-text">ConnectSphere</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="theme-toggle-landing" title="Toggle theme">
          <i class="theme-icon fa-solid fa-moon"></i>
        </button>
        <a href="/login" class="btn btn-secondary btn-sm" data-route="/login">Sign In</a>
        <a href="/register" class="btn btn-primary btn-sm" data-route="/register">Get Started</a>
      </div>
    </nav>
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div id="particles-container" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;"></div>
      <div class="hero-content">
        <div class="hero-badge"><i class="fa-solid fa-bolt"></i> The next-gen social platform is here</div>
        <h1 class="hero-title display">
          Connect, Create &<br><span class="gradient-text">Grow Together</span>
        </h1>
        <p class="hero-subtitle">
          ConnectSphere is the modern social platform built for creators, professionals, and communities.
          Share your story. Build real connections. Discover what matters.
        </p>
        <div class="hero-actions">
          <a href="/register" class="btn btn-primary btn-lg ripple" data-route="/register">
            <i class="fa-solid fa-rocket"></i> Start for Free
          </a>
          <a href="/login" class="btn btn-secondary btn-lg" data-route="/login">Sign In</a>
        </div>
        <div style="margin-top:36px;color:var(--text-muted);font-size:0.82rem;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">
          <span><i class="fa-solid fa-shield-halved" style="color:var(--success)"></i> Secure & Private</span>
          <span><i class="fa-solid fa-bolt" style="color:var(--warning)"></i> Lightning Fast</span>
          <span><i class="fa-solid fa-heart" style="color:#EF4444"></i> Built with Love</span>
        </div>
      </div>
    </section>
    <section style="padding:80px 0;background:var(--bg);">
      <div style="text-align:center;margin-bottom:48px;padding:0 40px;">
        <h2 style="font-family:var(--font-display);margin-bottom:12px;">Everything you need to connect</h2>
        <p style="color:var(--text-secondary);max-width:480px;margin:0 auto;font-size:1rem;">Built for people who want to build real connections and grow authentic communities.</p>
      </div>
      <div class="features-grid">
        ${[
          {icon:'📸',c:'rgba(79,70,229,.1)',t:'Posts & Stories',d:'Share photos, thoughts and 24-hour stories with your audience.'},
          {icon:'❤️',c:'rgba(239,68,68,.1)',t:'Likes & Comments',d:'Engage with content you love through reactions and discussions.'},
          {icon:'💬',c:'rgba(6,182,212,.1)',t:'Direct Messages',d:'Private real-time conversations with anyone on the platform.'},
          {icon:'🔍',c:'rgba(16,185,129,.1)',t:'Smart Search',d:'Find people, posts, and trending topics in an instant.'},
          {icon:'🔔',c:'rgba(245,158,11,.1)',t:'Notifications',d:'Stay updated on every like, comment, follow, and mention.'},
          {icon:'📊',c:'rgba(139,92,246,.1)',t:'Analytics',d:'Track your growth with detailed engagement insights.'},
        ].map(f=>`
          <div class="feature-card reveal">
            <div class="feature-icon" style="background:${f.c};">${f.icon}</div>
            <h3 class="feature-title">${f.t}</h3>
            <p class="feature-text">${f.d}</p>
          </div>
        `).join('')}
      </div>
    </section>
    <section style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,rgba(79,70,229,.06),rgba(139,92,246,.06));">
      <h2 style="font-family:var(--font-display);margin-bottom:12px;">Ready to join?</h2>
      <p style="color:var(--text-secondary);margin-bottom:28px;">Create your free account in seconds.</p>
      <a href="/register" class="btn btn-primary btn-lg ripple" data-route="/register">
        <i class="fa-solid fa-user-plus"></i> Create Free Account
      </a>
    </section>
    </div>`;
  },

  login() {
    return `<div class="auth-page page-enter">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <a href="/" class="auth-logo" data-route="/">
        <div class="logo-icon" style="width:42px;height:42px;font-size:1.2rem;">C</div>
        <span class="logo-text" style="font-size:1.3rem;">ConnectSphere</span>
      </a>
      <h2 class="auth-title">Welcome back</h2>
      <p class="auth-subtitle">Sign in to your account to continue</p>
      <form class="auth-form" id="login-form" onsubmit="return false;" novalidate>
        <div class="form-group">
          <label class="form-label" for="login-email">Email Address</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-envelope input-icon"></i>
            <input type="email" class="input" id="login-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="field-error hidden" id="err-login-email"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-lock input-icon"></i>
            <input type="password" class="input" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
            <button type="button" id="toggle-login-pass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
          <div class="field-error hidden" id="err-login-pass"></div>
        </div>
        <button type="submit" class="btn btn-primary w-full btn-lg ripple" id="login-btn" style="margin-top:4px;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
        </button>
      </form>
      <div class="auth-divider">or</div>
      <button class="btn btn-secondary w-full" id="demo-login-btn">
        <i class="fa-solid fa-play"></i> Try Demo Account
      </button>
      <div class="auth-footer">Don't have an account? <a href="/register" data-route="/register">Create one free</a></div>
    </div>
    </div>`;
  },

  register() {
    return `<div class="auth-page page-enter">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <a href="/" class="auth-logo" data-route="/">
        <div class="logo-icon" style="width:42px;height:42px;font-size:1.2rem;">C</div>
        <span class="logo-text" style="font-size:1.3rem;">ConnectSphere</span>
      </a>
      <h2 class="auth-title">Create your account</h2>
      <p class="auth-subtitle">Join thousands of creators and professionals</p>
      <form class="auth-form" id="register-form" onsubmit="return false;" novalidate>
        <div class="form-group">
          <label class="form-label" for="reg-name">Full Name</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-user input-icon"></i>
            <input type="text" class="input" id="reg-name" placeholder="Jane Smith" autocomplete="name" required />
          </div>
          <div class="field-error hidden" id="err-name"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-username">Username</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-at input-icon"></i>
            <input type="text" class="input" id="reg-username" placeholder="janesmith" autocomplete="username" required />
            <span id="username-status" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:0.85rem;"></span>
          </div>
          <div class="field-error hidden" id="err-username"></div>
          <span class="form-hint">Letters, numbers, dots, underscores only</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Email Address</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-envelope input-icon"></i>
            <input type="email" class="input" id="reg-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="field-error hidden" id="err-email"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Password</label>
          <div class="input-icon-wrapper">
            <i class="fa-solid fa-lock input-icon"></i>
            <input type="password" class="input" id="reg-password" placeholder="Min. 6 characters" autocomplete="new-password" required />
            <button type="button" id="toggle-reg-pass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
          <div class="password-strength" id="pw-strength" style="display:none;">
            <div class="strength-bar"><div class="strength-fill" id="pw-fill"></div></div>
            <span class="strength-label" id="pw-label"></span>
          </div>
          <div class="field-error hidden" id="err-password"></div>
        </div>
        <button type="submit" class="btn btn-primary w-full btn-lg ripple" id="register-btn">
          <i class="fa-solid fa-user-plus"></i> Create Account
        </button>
      </form>
      <div class="auth-footer">Already have an account? <a href="/login" data-route="/login">Sign in</a></div>
    </div>
    </div>`;
  },

  home() {
    return `<div id="home-page" class="page-enter">
      <div id="stories-container" class="card" style="padding:16px 16px 0;margin-bottom:16px;overflow:hidden;">
        <div class="stories-bar">${[1,2,3,4,5].map(()=>`<div class="story-item">
          ${Utils.skeleton('56px','56px',true)}<div style="margin-top:5px;">${Utils.skeleton('52px','9px')}</div>
        </div>`).join('')}</div>
      </div>
      <div id="create-post-container"></div>
      <div id="feed-container">${[1,2,3].map(()=>Components.postSkeleton()).join('')}</div>
      <div class="load-more hidden" id="load-more-wrap">
        <button class="btn btn-secondary" id="load-more-btn"><i class="fa-solid fa-rotate"></i> Load More</button>
      </div>
      <div class="empty-state hidden" id="feed-empty">
        <div class="empty-state-icon">🌐</div>
        <div class="empty-state-title">Your feed is quiet</div>
        <div class="empty-state-text">Follow people to see their posts, or explore the community.</div>
        <a href="/explore" class="btn btn-primary btn-sm mt-12" data-route="/explore">
          <i class="fa-solid fa-compass"></i> Explore
        </a>
      </div>
    </div>`;
  },

  explore() {
    return `<div id="explore-page" class="page-enter">
      <div class="page-header">
        <h2 class="page-title"><i class="fa-solid fa-compass" style="color:var(--primary);margin-right:8px;"></i>Explore</h2>
      </div>
      <div class="search-bar" style="margin-bottom:20px;">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" class="search-input" id="explore-search-input" placeholder="Search posts, people, hashtags…" autocomplete="off" />
        <div class="search-results-dropdown hidden" id="explore-search-dropdown"></div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
        <button class="btn btn-primary btn-sm explore-tab" data-tab="posts"><i class="fa-regular fa-file-image"></i> Posts</button>
        <button class="btn btn-secondary btn-sm explore-tab" data-tab="people"><i class="fa-solid fa-users"></i> People</button>
        <button class="btn btn-secondary btn-sm explore-tab" data-tab="trending"><i class="fa-solid fa-fire"></i> Trending</button>
        <button class="btn btn-secondary btn-sm explore-tab" data-tab="reels"><i class="fa-solid fa-film"></i> Reels</button>
      </div>
      <div id="explore-posts"><div id="explore-posts-grid" style="display:flex;flex-direction:column;gap:16px;">
        ${[1,2,3].map(()=>Components.postSkeleton()).join('')}
      </div></div>
      <div id="explore-people" class="hidden"></div>
      <div id="explore-trending" class="hidden"></div>
      <div id="explore-reels" class="hidden"></div>
    </div>`;
  },

  profile(username) {
    return `<div id="profile-page" data-username="${username}" class="page-enter">
      <div class="card" style="border-radius:var(--radius-lg) var(--radius-lg) 0 0;overflow:visible;margin-bottom:2px;">
        <div class="profile-cover skeleton" id="profile-cover" style="height:210px;border-radius:var(--radius-lg) var(--radius-lg) 0 0;"></div>
        <div class="profile-info-area" id="profile-info-area">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div class="profile-avatar-wrapper">
              <div class="avatar avatar-2xl skeleton" id="profile-avatar-el" style="border:4px solid var(--bg-card);box-shadow:var(--shadow-md);"></div>
            </div>
            <div id="profile-action-btns" style="padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;"></div>
          </div>
          <div id="profile-details" style="margin-top:4px;">
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${Utils.skeleton('160px','22px')}
              ${Utils.skeleton('100px','14px')}
              <div style="margin-top:4px;">${Utils.skeleton('280px','14px')}</div>
            </div>
          </div>
        </div>
        <div class="profile-tabs" id="profile-tabs">
          <button class="profile-tab active" data-tab="posts"><i class="fa-solid fa-grid-2" style="font-size:0.8rem;"></i> Posts</button>
          <button class="profile-tab" data-tab="media"><i class="fa-regular fa-image" style="font-size:0.8rem;"></i> Media</button>
          <button class="profile-tab" data-tab="about"><i class="fa-solid fa-circle-info" style="font-size:0.8rem;"></i> About</button>
        </div>
      </div>
      <div id="profile-tab-content" style="min-height:200px;">
        <div class="page-loader">${Utils.spinner()}</div>
      </div>
    </div>`;
  },

  editProfile() {
    const u = Auth.getUser() || {};
    return `<div class="edit-profile-page page-enter">
      <div class="page-header">
        <h2 class="page-title">Edit Profile</h2>
        <a href="/profile/${u.username}" class="btn btn-secondary btn-sm" data-route="/profile/${u.username}">Cancel</a>
      </div>
      <div class="edit-profile-avatar-section">
        <div class="profile-avatar-wrapper" style="margin-top:0;">
          <div class="avatar avatar-xl" id="edit-avatar-preview">
            <img src="${u.avatar||CONFIG.DEFAULT_AVATAR(u.name||'User')}" alt="avatar"
              onerror="this.parentElement.innerHTML='<span style=\'font-weight:700;color:white;font-size:1.5rem;\'>${(u.name||'U')[0]}</span>'" />
          </div>
          <label class="profile-avatar-edit" title="Change photo" style="cursor:pointer;">
            <i class="fa-solid fa-camera"></i>
            <input type="file" id="avatar-file" accept="image/*" style="display:none;" />
          </label>
        </div>
        <div>
          <div class="fw-700" style="font-size:1.05rem;">${Utils.escapeHtml(u.name||'')}</div>
          <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">@${Utils.escapeHtml(u.username||'')}</div>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-image"></i> Change Cover
            <input type="file" id="cover-file" accept="image/*" style="display:none;" />
          </label>
        </div>
      </div>
      <form id="edit-profile-form" onsubmit="return false;">
        <div class="edit-form-card">
          <h4>Personal Info</h4>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input type="text" class="input" id="edit-name" value="${Utils.escapeHtml(u.name||'')}" maxlength="50" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label class="form-label">Bio <span style="color:var(--text-muted);font-weight:400;font-size:0.8rem;">(${(u.bio||'').length}/160)</span></label>
              <textarea class="textarea" id="edit-bio" maxlength="160" rows="3" placeholder="Tell people about yourself…">${Utils.escapeHtml(u.bio||'')}</textarea>
              <span class="form-hint" id="bio-counter">${(u.bio||'').length}/160</span>
            </div>
            <div class="form-group">
              <label class="form-label">Website</label>
              <div class="input-icon-wrapper">
                <i class="fa-solid fa-link input-icon"></i>
                <input type="url" class="input" id="edit-website" value="${Utils.escapeHtml(u.website||'')}" placeholder="https://yoursite.com" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <div class="input-icon-wrapper">
                <i class="fa-solid fa-location-dot input-icon"></i>
                <input type="text" class="input" id="edit-location" value="${Utils.escapeHtml(u.location||'')}" placeholder="City, Country" />
              </div>
            </div>
          </div>
        </div>
        <div class="edit-form-card">
          <h4>Social Links</h4>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${[
              {id:'edit-twitter', icon:'fa-brands fa-x-twitter', placeholder:'twitter.com/username', key:'twitter'},
              {id:'edit-github',  icon:'fa-brands fa-github',    placeholder:'github.com/username',  key:'github'},
              {id:'edit-linkedin',icon:'fa-brands fa-linkedin',  placeholder:'linkedin.com/in/user', key:'linkedin'},
            ].map(s=>`
              <div class="form-group">
                <label class="form-label" style="text-transform:capitalize;">${s.key}</label>
                <div class="input-icon-wrapper">
                  <i class="${s.icon} input-icon"></i>
                  <input type="url" class="input" id="${s.id}" value="${Utils.escapeHtml((u.socialLinks||{})[s.key]||'')}" placeholder="${s.placeholder}" />
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <button type="submit" class="btn btn-primary w-full btn-lg ripple" id="save-profile-btn">
          <i class="fa-solid fa-check"></i> Save Changes
        </button>
      </form>
    </div>`;
  },

  notifications() {
    return `<div id="notifications-page" class="page-enter">
      <div class="page-header">
        <h2 class="page-title"><i class="fa-solid fa-bell" style="color:var(--primary);margin-right:8px;"></i>Notifications</h2>
        <button class="btn btn-secondary btn-sm" id="mark-all-read-btn">
          <i class="fa-solid fa-check-double"></i> Mark all read
        </button>
      </div>
      <div class="card" id="notifications-list">
        <div class="page-loader">${Utils.spinner()}</div>
      </div>
    </div>`;
  },

  saved() {
    return `<div id="saved-page" class="page-enter">
      <div class="page-header">
        <h2 class="page-title"><i class="fa-solid fa-bookmark" style="color:var(--primary);margin-right:8px;"></i>Saved Posts</h2>
      </div>
      <div id="saved-posts-container">
        <div class="page-loader">${Utils.spinner()}</div>
      </div>
    </div>`;
  },

  analytics() {
    return `<div id="analytics-page" class="page-enter">
      <div class="page-header">
        <h2 class="page-title"><i class="fa-solid fa-chart-line" style="color:var(--primary);margin-right:8px;"></i>Analytics</h2>
      </div>
      <div class="analytics-grid" id="analytics-grid">
        ${['Profile Views','Total Likes','Comments','Posts'].map((l,i)=>`
          <div class="analytics-card">
            <span class="analytics-number skeleton" id="stat-${i}" style="height:2.2rem;width:80px;display:block;margin:0 auto 6px;">
            </span>
            <div class="analytics-label">${l}</div>
          </div>
        `).join('')}
      </div>
      <div class="card" style="padding:20px;margin-bottom:16px;">
        <h4 style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-users" style="color:var(--primary);"></i> Audience
        </h4>
        <div id="audience-stats"></div>
      </div>
      <div class="card" style="padding:20px;">
        <h4 style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-timeline" style="color:var(--accent);"></i> Activity Timeline
        </h4>
        <div id="activity-timeline"></div>
      </div>
    </div>`;
  },

  messages() {
    return `<div id="messages-page" class="page-enter" style="padding:0;">
      <div class="chat-layout">
        <div class="chat-sidebar">
          <div class="chat-header">
            <span>Messages</span>
            <button class="btn btn-ghost btn-icon-sm" id="new-message-btn" title="New message">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
          <div id="conversations-list">
            ${[1,2,3,4].map(()=>`
              <div class="chat-conversation-item">
                ${Utils.skeleton('40px','40px',true)}
                <div style="flex:1;display:flex;flex-direction:column;gap:5px;">
                  ${Utils.skeleton('110px','12px')} ${Utils.skeleton('160px','10px')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chat-main" id="chat-main">
          <div class="flex-center" style="height:100%;flex-direction:column;gap:12px;color:var(--text-muted);">
            <i class="fa-regular fa-comment-dots" style="font-size:3rem;opacity:0.3;"></i>
            <p>Select a conversation or start a new one</p>
          </div>
        </div>
      </div>
    </div>`;
  },

  notFound() {
    return `<div class="empty-state page-enter" style="min-height:70vh;">
      <div style="font-size:5rem;">🔭</div>
      <h2>Page Not Found</h2>
      <p class="empty-state-text">The page you're looking for doesn't exist.</p>
      <a href="/home" class="btn btn-primary mt-12" data-route="/home">
        <i class="fa-solid fa-house"></i> Go Home
      </a>
    </div>`;
  },
};
window.Pages = Pages;
