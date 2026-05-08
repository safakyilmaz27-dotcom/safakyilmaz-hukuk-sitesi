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

  function initScrollEffects() {
    const nav = document.querySelector('.site-nav');
    const progress = document.querySelector('.scroll-progress');

    function onScroll() {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 20);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const pct = h > 0 ? (y / h) * 100 : 0;
        progress.style.width = pct + '%';
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  function initFAQ() {
    // Allow only one FAQ open at a time
    const items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item && other.open) other.open = false;
          });
        }
      });
    });
  }

  window.SiteUtils = {
    formatDate: function (iso) {
      try {
        return new Intl.DateTimeFormat('tr-TR', {
          day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(iso));
      } catch (e) { return iso; }
    },
    formatDateShort: function (iso) {
      try {
        return new Intl.DateTimeFormat('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(new Date(iso));
      } catch (e) { return iso; }
    },
    qs: function (key) {
      const params = new URLSearchParams(location.search);
      return params.get(key);
    },
    escapeHtml: function (str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }
  ready(function () {
    initNav();
    initScrollEffects();
    initReveal();
    initFAQ();
  });
})();
