'use strict';
const Components = {

  appLayout(mainContent, activeNav='') {
    const user = Auth.getUser();
    if (!user) return mainContent;
    return `
    <div class="app-layout">
      ${this.sidebar(activeNav)}
      <main class="main-content page-enter" id="main-content">${mainContent}</main>
      ${this.rightSidebar()}
    </div>
    ${this.mobileNav(activeNav)}
    <button id="scroll-top-btn" title="Back to top" onclick="Utils.scrollToTop()">
      <i class="fa-solid fa-chevron-up"></i>
    </button>`;
  },

  sidebar(active) {
    const user = Auth.getUser();
    const items = [
      {icon:'fa-house',       label:'Home',         route:'/home',                    key:'home'},
      {icon:'fa-compass',     label:'Explore',      route:'/explore',                 key:'explore'},
      {icon:'fa-bell',        label:'Notifications',route:'/notifications',           key:'notifications', badge:true},
      {icon:'fa-comment-dots',label:'Messages',     route:'/messages',                key:'messages', badge2:true},
      {icon:'fa-bookmark',    label:'Saved',        route:'/saved',                   key:'saved'},
      {icon:'fa-user',        label:'Profile',      route:`/profile/${user.username}`,key:'profile'},
      {icon:'fa-chart-bar',   label:'Analytics',    route:'/analytics',               key:'analytics'},
    ];
    return `<nav class="sidebar" id="sidebar">
      <a href="/home" class="sidebar-logo" data-route="/home">
        <div class="logo-icon">C</div>
        <span class="logo-text">ConnectSphere</span>
      </a>
      <div class="nav-section">
        ${items.map(item=>`
          <a href="${item.route}" class="nav-item ${active===item.key?'active':''}" data-route="${item.route}" title="${item.label}">
            <i class="fa-solid ${item.icon} nav-icon"></i>
            <span>${item.label}</span>
            ${item.badge  ? `<span class="nav-badge hidden" id="notif-badge">0</span>` : ''}
            ${item.badge2 ? `<span class="nav-badge hidden" id="msg-badge" style="background:var(--secondary);">0</span>` : ''}
          </a>
        `).join('')}
      </div>
      <div class="nav-section" style="margin-top:auto;padding-bottom:8px;">
        <button class="nav-item ripple" id="sidebar-create-btn">
          <i class="fa-solid fa-plus nav-icon"></i><span>Create Post</span>
        </button>
        <button class="nav-item" id="theme-toggle-btn">
          <i class="theme-icon fa-solid fa-moon nav-icon"></i>
          <span class="theme-label">Dark Mode</span>
        </button>
        <button class="nav-item" id="sidebar-logout-btn" style="color:var(--error);">
          <i class="fa-solid fa-right-from-bracket nav-icon"></i><span>Log Out</span>
        </button>
      </div>
      <a href="/profile/${user.username}" class="sidebar-user" data-route="/profile/${user.username}">
        <div style="position:relative;">
          ${Utils.avatarHtml(user,'sm')}
          <span class="online-dot" style="position:absolute;bottom:0;right:-1px;"></span>
        </div>
        <div>
          <div class="user-name">${Utils.escapeHtml(user.name)}</div>
          <div class="user-handle">@${Utils.escapeHtml(user.username)}</div>
        </div>
      </a>
    </nav>`;
  },

  mobileNav(active) {
    const user = Auth.getUser();
    return `<nav class="mobile-nav">
      <a class="mobile-nav-item ${active==='home'?'active':''}" href="/home" data-route="/home"><i class="fa-solid fa-house"></i></a>
      <a class="mobile-nav-item ${active==='explore'?'active':''}" href="/explore" data-route="/explore"><i class="fa-solid fa-compass"></i></a>
      <button class="mobile-nav-item" id="mobile-create-btn"><i class="fa-solid fa-square-plus" style="font-size:1.7rem;color:var(--primary)"></i></button>
      <a class="mobile-nav-item ${active==='notifications'?'active':''}" href="/notifications" data-route="/notifications" style="position:relative;">
        <i class="fa-solid fa-bell"></i>
        <span class="nav-badge hidden" id="notif-badge-mobile" style="position:absolute;top:4px;right:4px;font-size:0.55rem;padding:1px 4px;"></span>
      </a>
      <a class="mobile-nav-item ${active==='profile'?'active':''}" href="/profile/${user.username}" data-route="/profile/${user.username}">
        ${Utils.avatarHtml(user,'xs')}
      </a>
    </nav>`;
  },

  rightSidebar() {
    return `<aside class="right-sidebar" id="right-sidebar">
      <div class="search-bar" style="margin-bottom:20px;">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" class="search-input" id="global-search" placeholder="Search ConnectSphere…" autocomplete="off" />
        <div class="search-results-dropdown hidden" id="search-dropdown"></div>
      </div>
      <div class="widget">
        <div class="widget-title">Who to Follow</div>
        <div id="suggested-users">${[1,2,3].map(()=>`
          <div class="suggested-user">
            ${Utils.skeleton('36px','36px',true)}
            <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
              ${Utils.skeleton('110px','12px')} ${Utils.skeleton('75px','10px')}
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="widget">
        <div class="widget-title">Trending</div>
        <div id="trending-tags">${[1,2,3,4].map(()=>`
          <div class="trending-tag">${Utils.skeleton('90px','12px')} ${Utils.skeleton('36px','10px')}</div>`).join('')}
        </div>
      </div>
      <div style="font-size:0.73rem;color:var(--text-muted);padding:4px;line-height:2.2;">
        <a href="#" style="margin-right:8px;">About</a><a href="#" style="margin-right:8px;">Privacy</a><a href="#" style="margin-right:8px;">Terms</a><br>
        © ${new Date().getFullYear()} ConnectSphere
      </div>
    </aside>`;
  },

  postCard(post, currentUserId) {
    const isOwn = currentUserId && post.author?._id?.toString() === currentUserId?.toString();
    const imgs = post.images || [];
    const imgClass = imgs.length===1?'single':imgs.length===2?'two':'three';
    const isLiked = post.isLiked||false;
    const isSaved = post.isSaved||false;

    return `<article class="post-card fade-in" data-post-id="${post._id}">
      <div class="post-header">
        <div class="post-author">
          <a href="/profile/${post.author?.username}" data-route="/profile/${post.author?.username}">
            ${Utils.avatarHtml(post.author||{name:'?'},'md')}
          </a>
          <div class="post-author-info">
            <a href="/profile/${post.author?.username}" class="post-author-name" data-route="/profile/${post.author?.username}">
              ${Utils.escapeHtml(post.author?.name||'Unknown')} ${Utils.verifiedBadge(post.author?.isVerified)}
            </a>
            <span class="post-author-handle">@${Utils.escapeHtml(post.author?.username||'user')}</span>
            <span class="post-time">${Utils.timeAgo(post.createdAt)}${post.isEdited?' · <em>edited</em>':''}</span>
          </div>
        </div>
        <div class="dropdown">
          <button class="btn btn-ghost btn-icon-sm post-menu-btn" data-post-id="${post._id}" aria-label="Post options">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
          <div class="dropdown-menu hidden" id="post-menu-${post._id}">
            ${isOwn?`
              <button class="dropdown-item" data-action="edit-post" data-post-id="${post._id}"><i class="fa-solid fa-pen"></i> Edit Post</button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" data-action="delete-post" data-post-id="${post._id}"><i class="fa-solid fa-trash"></i> Delete Post</button>
            `:`
              <a href="/profile/${post.author?.username}" class="dropdown-item" data-route="/profile/${post.author?.username}"><i class="fa-solid fa-user"></i> View Profile</a>
            `}
            <button class="dropdown-item" data-action="copy-link" data-post-id="${post._id}"><i class="fa-solid fa-link"></i> Copy Link</button>
            <button class="dropdown-item" data-action="share-post" data-post-id="${post._id}"><i class="fa-solid fa-share-nodes"></i> Share</button>
          </div>
        </div>
      </div>
      ${post.content?`<div class="post-content">${Utils.processContent(post.content)}</div>`:''}
      ${imgs.length?`<div class="post-images ${imgClass}">${imgs.map(img=>`
        <img src="${img}" alt="Post image" loading="lazy" onclick="Components.openImageModal('${img}')" />`).join('')}</div>`:''}
      <div class="post-actions">
        <button class="post-action-btn ${isLiked?'liked':''}" data-action="like" data-post-id="${post._id}" id="like-btn-${post._id}">
          <i class="fa-${isLiked?'solid':'regular'} fa-heart action-icon"></i>
          <span class="action-count" id="like-count-${post._id}">${Utils.formatCount(post.likesCount||0)}</span>
        </button>
        <button class="post-action-btn" data-action="toggle-comments" data-post-id="${post._id}">
          <i class="fa-regular fa-comment action-icon"></i>
          <span class="action-count" id="comment-count-${post._id}">${Utils.formatCount(post.commentsCount||0)}</span>
        </button>
        <button class="post-action-btn" data-action="share-post" data-post-id="${post._id}">
          <i class="fa-regular fa-share-from-square action-icon"></i>
        </button>
        <div class="post-actions-right">
          <button class="post-action-btn ${isSaved?'saved':''}" data-action="save" data-post-id="${post._id}" id="save-btn-${post._id}">
            <i class="fa-${isSaved?'solid':'regular'} fa-bookmark action-icon"></i>
          </button>
        </div>
      </div>
      <div class="comments-section hidden" id="comments-${post._id}">
        <div class="comment-input-wrapper">
          ${Utils.avatarHtml(Auth.getUser()||{name:'?'},'sm')}
          <input type="text" class="comment-input" placeholder="Write a comment…"
            data-post-id="${post._id}" id="comment-input-${post._id}" maxlength="500" />
          <button class="btn btn-primary btn-sm ripple" data-action="submit-comment" data-post-id="${post._id}">Post</button>
        </div>
        <div id="comments-list-${post._id}" style="margin-top:12px;"></div>
      </div>
    </article>`;
  },

  commentItem(comment) {
    const isOwn = Auth.getUser()?._id?.toString() === comment.author?._id?.toString();
    return `<div class="comment-item" data-comment-id="${comment._id}">
      <a href="/profile/${comment.author?.username}" data-route="/profile/${comment.author?.username}">
        ${Utils.avatarHtml(comment.author||{name:'?'},'sm')}
      </a>
      <div class="comment-body">
        <a href="/profile/${comment.author?.username}" class="comment-author" data-route="/profile/${comment.author?.username}">
          ${Utils.escapeHtml(comment.author?.name||'User')}
        </a>
        <p class="comment-text">${Utils.processContent(comment.content)}</p>
        <div class="comment-meta">
          <span class="comment-time">${Utils.timeAgo(comment.createdAt)}</span>
          <button class="comment-like-btn" data-action="like-comment" data-comment-id="${comment._id}">
            <i class="fa-regular fa-heart"></i> ${comment.likesCount||0}
          </button>
          ${isOwn?`<button class="comment-like-btn" style="color:var(--error);" data-action="delete-comment" data-comment-id="${comment._id}">
            <i class="fa-solid fa-trash"></i>
          </button>`:''}
        </div>
      </div>
    </div>`;
  },

  createPostBox() {
    const user = Auth.getUser();
    return `<div class="create-post card" id="create-post-box">
      <div class="create-post-row">
        ${Utils.avatarHtml(user,'md')}
        <textarea class="create-post-input" id="post-content-input"
          placeholder="What's happening, ${(user?.name||'').split(' ')[0]||'there'}?"
          rows="1" maxlength="2200"></textarea>
      </div>
      <div id="post-image-previews" class="image-preview-grid hidden"></div>
      <div class="create-post-actions">
        <div class="create-post-tools">
          <label class="create-post-tool" title="Add Photo">
            <i class="fa-regular fa-image"></i>
            <input type="file" id="post-image-input" accept="image/*" multiple style="display:none;" />
          </label>
          <button class="create-post-tool" id="emoji-btn" title="Emoji" type="button">
            <i class="fa-regular fa-face-smile"></i>
          </button>
          <button class="create-post-tool" id="hashtag-btn" title="Hashtag" type="button">
            <i class="fa-solid fa-hashtag"></i>
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="post-char-counter" class="hidden" style="font-size:0.78rem;color:var(--text-muted);"></span>
          <button class="btn btn-primary btn-sm ripple" id="submit-post-btn" disabled>
            <i class="fa-solid fa-paper-plane"></i> Post
          </button>
        </div>
      </div>
    </div>`;
  },

  storiesBar(groups=[]) {
    const user = Auth.getUser();
    return `<div class="stories-bar">
      <div class="story-item story-add">
        <div class="story-ring viewed">
          ${Utils.avatarHtml(user,'lg')}
        </div>
        <label class="story-add-btn" style="cursor:pointer;" title="Add story">+
          <input type="file" id="story-upload-input" accept="image/*" style="display:none;" />
        </label>
        <span class="story-username">Your Story</span>
      </div>
      ${groups.map(g=>`
        <div class="story-item" data-action="view-story-group" data-group-author="${g.author._id}" style="cursor:pointer;">
          <div class="story-ring ${g.stories.every(s=>s.isViewed)?'viewed':''}">
            ${Utils.avatarHtml(g.author,'lg')}
          </div>
          <span class="story-username">${Utils.escapeHtml(g.author.username)}</span>
        </div>
      `).join('')}
    </div>`;
  },

  suggestedUsersHtml(users) {
    if (!users?.length) return `<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 4px;">No suggestions right now.</div>`;
    return users.map(u=>`
      <div class="suggested-user">
        <a href="/profile/${u.username}" data-route="/profile/${u.username}">${Utils.avatarHtml(u,'sm')}</a>
        <div class="suggested-user-info">
          <a href="/profile/${u.username}" class="suggested-user-name" data-route="/profile/${u.username}">
            ${Utils.escapeHtml(u.name)} ${Utils.verifiedBadge(u.isVerified)}
          </a>
          <div class="suggested-user-handle">@${Utils.escapeHtml(u.username)}</div>
        </div>
        <button class="follow-btn-small" data-action="follow-suggested" data-user-id="${u._id}">Follow</button>
      </div>`).join('');
  },

  trendingTagsHtml(tags) {
    if (!tags?.length) return `<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 4px;">No trending topics yet.</div>`;
    return tags.map(tag=>`
      <div class="trending-tag" data-action="nav-tag" data-tag="${tag._id}" style="cursor:pointer;">
        <span class="trending-tag-name">#${Utils.escapeHtml(tag._id)}</span>
        <span class="trending-tag-count">${Utils.formatCount(tag.count)} posts</span>
      </div>`).join('');
  },

  notificationItem(n) {
    const icons = {like:'❤️',comment:'💬',follow:'👤',mention:'📣',reply:'↩️'};
    return `<div class="notification-item ${n.isRead?'':'unread'}" data-notif-id="${n._id}">
      ${!n.isRead?`<span style="width:7px;height:7px;background:var(--primary);border-radius:50%;flex-shrink:0;margin-top:6px;display:inline-block;"></span>`:'<span style="width:7px;"></span>'}
      <div class="notification-icon ${n.type}">${icons[n.type]||'🔔'}</div>
      <a href="/profile/${n.sender?.username}" data-route="/profile/${n.sender?.username}">
        ${Utils.avatarHtml(n.sender||{name:'?'},'sm')}
      </a>
      <div style="flex:1;min-width:0;">
        <div class="notification-text">${Utils.escapeHtml(n.message)}</div>
        <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
      </div>
      ${n.post?.images?.[0]?`<img src="${n.post.images[0]}" class="notification-post-thumb" />`:''}
    </div>`;
  },

  postSkeleton() {
    return `<div class="post-card" style="padding:16px;">
      <div style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
        ${Utils.skeleton('44px','44px',true)}
        <div style="flex:1;display:flex;flex-direction:column;gap:6px;padding-top:2px;">
          ${Utils.skeleton('140px','13px')} ${Utils.skeleton('90px','11px')}
        </div>
      </div>
      ${Utils.skeleton('100%','13px')}
      <div style="margin-top:6px;">${Utils.skeleton('75%','13px')}</div>
      <div style="margin-top:12px;">${Utils.skeleton('100%','180px')}</div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        ${Utils.skeleton('60px','28px')} ${Utils.skeleton('60px','28px')} ${Utils.skeleton('40px','28px')}
      </div>
    </div>`;
  },

  openImageModal(src) {
    Modal.open(`<div class="modal" style="max-width:92vw;max-height:92vh;background:#000;border-radius:var(--radius-xl);overflow:hidden;padding:0;">
      <button onclick="Modal.close()" style="position:absolute;top:12px;right:12px;z-index:3;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
      <img src="${src}" style="max-width:100%;max-height:90vh;object-fit:contain;display:block;margin:auto;" />
    </div>`);
  },

  openCreatePostModal() {
    if (!Auth.requireAuth()) return;
    const ov = Modal.open(`<div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Create Post</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">${this.createPostBox()}</div>
    </div>`);
    App.bindCreatePost(true);
    return ov;
  },

  openEditPostModal(post) {
    const ov = Modal.open(`<div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Edit Post</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <textarea class="textarea" id="edit-post-content" rows="5" maxlength="2200">${Utils.escapeHtml(post.content||'')}</textarea>
          <span class="form-hint" id="edit-char-count">${(post.content||'').length}/2200</span>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary ripple" id="save-edit-post-btn" data-post-id="${post._id}">
            <i class="fa-solid fa-check"></i> Save
          </button>
        </div>
      </div>
    </div>`);
    ov.querySelector('#edit-post-content').addEventListener('input', function() {
      const c = ov.querySelector('#edit-char-count');
      if(c) c.textContent = `${this.value.length}/2200`;
    });
    ov.querySelector('#save-edit-post-btn').addEventListener('click', async () => {
      const content = ov.querySelector('#edit-post-content').value.trim();
      if (!content) return Toast.error('Post cannot be empty');
      try {
        await API.posts.update(post._id, { content });
        Modal.close(ov);
        Toast.success('Post updated!');
        // Update the DOM in place
        const contentEl = document.querySelector(`[data-post-id="${post._id}"] .post-content`);
        if (contentEl) contentEl.innerHTML = Utils.processContent(content);
      } catch(e) { Toast.error(e.message); }
    });
  },

  openStoryModal(story, allStories, idx=0) {
    API.stories.view(story._id).catch(()=>{});
    const ov = Modal.open(`<div class="story-modal" style="position:relative;">
      <div class="story-progress-container">
        ${allStories.map((_,i)=>`<div class="story-progress-bar">
          ${i===idx?'<div class="story-progress-fill"></div>':''}
        </div>`).join('')}
      </div>
      <div style="position:absolute;top:24px;left:12px;display:flex;align-items:center;gap:8px;z-index:2;">
        ${Utils.avatarHtml(story.author,'sm')}
        <div>
          <div style="color:white;font-weight:600;font-size:0.9rem;">${Utils.escapeHtml(story.author.name)}</div>
          <div style="color:rgba(255,255,255,.7);font-size:0.74rem;">${Utils.timeAgo(story.createdAt)}</div>
        </div>
      </div>
      <button onclick="Modal.close()" style="position:absolute;top:12px;right:12px;z-index:3;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
      <img src="${story.media}" alt="Story" style="width:100%;max-height:80vh;object-fit:contain;" />
      ${story.text?`<div class="story-modal-text">${Utils.escapeHtml(story.text)}</div>`:''}
    </div>`, {closeOnBackdrop:true});

    // Auto-advance after 5s
    const timer = setTimeout(() => {
      Modal.close(ov);
      if (idx + 1 < allStories.length) {
        this.openStoryModal(allStories[idx+1], allStories, idx+1);
      }
    }, 5000);
    ov.addEventListener('click', (e) => { if (e.target === ov) clearTimeout(timer); });
  },
};
window.Components = Components;
