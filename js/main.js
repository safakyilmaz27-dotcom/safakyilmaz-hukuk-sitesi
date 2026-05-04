// Shared utilities for all pages

(function () {
  'use strict';

  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      const isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (links.classList.contains('open')) {
          links.classList.remove('open');
          toggle.classList.remove('open');
        }
      });
    });

    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    links.querySelectorAll('a').forEach(function (a) {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  window.SiteUtils = {
    formatDate: function (iso) {
      try {
        return new Intl.DateTimeFormat('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date(iso));
      } catch (e) {
        return iso;
      }
    },

    formatDateShort: function (iso) {
      try {
        return new Intl.DateTimeFormat('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(new Date(iso));
      } catch (e) {
        return iso;
      }
    },

    qs: function (key) {
      const params = new URLSearchParams(location.search);
      return params.get(key);
    },

    escapeHtml: function (str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
