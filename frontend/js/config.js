'use strict';
const CONFIG = {
  API_BASE: window.location.origin + '/api',
  APP_NAME: 'ConnectSphere',
  APP_TAGLINE: 'Where Connections Grow',
  VERSION: '2.0.0',
  DEFAULT_AVATAR: (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'User')}&background=4F46E5&color=fff&size=200&bold=true`,
  DEBOUNCE_DELAY: 350,
  FEED_LIMIT: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg','image/jpg','image/png','image/gif','image/webp'],
};
window.CONFIG = CONFIG;
