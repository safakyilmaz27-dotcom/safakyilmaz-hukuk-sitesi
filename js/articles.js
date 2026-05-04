// Loads data/articles.json and renders list / detail / home-latest based on body[data-page]

(function () {
  'use strict';

  const utils = window.SiteUtils;
  let allArticles = [];
  let currentFilter = 'Tümü';
  let currentSearch = '';

  function fetchArticles() {
    return fetch('data/articles.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('JSON load failed: ' + r.status);
        return r.json();
      });
  }

  function articleCardHTML(a) {
    return ''
      + '<a class="article-card" href="makale.html?id=' + encodeURIComponent(a.id) + '">'
      +   '<div class="article-meta">'
      +     '<span class="cat-chip">' + utils.escapeHtml(a.category) + '</span>'
      +     '<span class="dot">•</span>'
      +     '<span>' + utils.formatDate(a.date) + '</span>'
      +     '<span class="dot">•</span>'
      +     '<span>' + (a.readMinutes || 5) + ' dk okuma</span>'
      +   '</div>'
      +   '<h3>' + utils.escapeHtml(a.title) + '</h3>'
      +   '<p class="excerpt">' + utils.escapeHtml(a.summary) + '</p>'
      +   '<span class="read-more">Devamını Oku</span>'
      + '</a>';
  }

  function renderHomeLatest(articles) {
    const container = document.getElementById('home-latest');
    if (!container) return;
    const sorted = articles.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 3);
    container.innerHTML = sorted.map(articleCardHTML).join('');
  }

  function applyFilters() {
    const container = document.getElementById('articles-grid');
    if (!container) return;
    const q = currentSearch.trim().toLocaleLowerCase('tr-TR');
    const filtered = allArticles
      .filter(function (a) {
        if (currentFilter !== 'Tümü' && a.category !== currentFilter) return false;
        if (!q) return true;
        const hay = (a.title + ' ' + a.summary + ' ' + a.category)
          .toLocaleLowerCase('tr-TR');
        return hay.indexOf(q) !== -1;
      })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">Aramanızla eşleşen makale bulunamadı.</div>';
    } else {
      container.innerHTML = filtered.map(articleCardHTML).join('');
    }
  }

  function renderList(articles) {
    const filterBar = document.getElementById('filter-bar');
    const search = document.getElementById('search-input');
    const grid = document.getElementById('articles-grid');
    if (!grid) return;

    const cats = ['Tümü'].concat(
      articles.reduce(function (acc, a) {
        if (acc.indexOf(a.category) === -1) acc.push(a.category);
        return acc;
      }, [])
    );

    if (filterBar) {
      filterBar.innerHTML = cats.map(function (c) {
        const active = c === currentFilter ? ' active' : '';
        return '<button class="chip' + active + '" data-cat="' + utils.escapeHtml(c) + '">'
          + utils.escapeHtml(c) + '</button>';
      }).join('');

      filterBar.addEventListener('click', function (e) {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        currentFilter = btn.getAttribute('data-cat');
        filterBar.querySelectorAll('.chip').forEach(function (c) {
          c.classList.toggle('active', c === btn);
        });
        applyFilters();
      });
    }

    if (search) {
      search.addEventListener('input', function (e) {
        currentSearch = e.target.value || '';
        applyFilters();
      });
    }

    applyFilters();
  }

  function renderDetail(articles) {
    const root = document.getElementById('article-root');
    if (!root) return;
    const id = utils.qs('id');
    const article = articles.find(function (a) { return a.id === id; });

    if (!article) {
      root.innerHTML =
        '<div class="empty-state">'
        + '<h3 style="color:var(--navy); margin-bottom:.6rem;">Makale Bulunamadı</h3>'
        + '<p>Aradığınız makale mevcut değil veya kaldırılmış olabilir.</p>'
        + '<p style="margin-top:1rem;"><a class="btn btn-ghost" href="makaleler.html">Tüm Makaleler</a></p>'
        + '</div>';
      document.title = 'Makale bulunamadı | Av. Şafak Yılmaz';
      return;
    }

    document.title = article.title + ' | Av. Şafak Yılmaz';

    let sourcesHTML = '';
    if (article.sources && article.sources.length) {
      sourcesHTML =
        '<div class="sources-box">'
        + '<h4>Faydalanılan Kaynaklar</h4>'
        + '<ul>'
        + article.sources.map(function (s) {
            return '<li><a href="' + utils.escapeHtml(s.url)
              + '" target="_blank" rel="noopener nofollow">'
              + utils.escapeHtml(s.label) + '</a></li>';
          }).join('')
        + '</ul></div>';
    }

    root.innerHTML =
      '<article class="article-detail">'
      +   '<div class="article-meta">'
      +     '<span class="cat-chip">' + utils.escapeHtml(article.category) + '</span>'
      +     '<span class="dot">•</span>'
      +     '<span>' + utils.formatDate(article.date) + '</span>'
      +     '<span class="dot">•</span>'
      +     '<span>' + (article.readMinutes || 5) + ' dk okuma</span>'
      +   '</div>'
      +   '<h1>' + utils.escapeHtml(article.title) + '</h1>'
      +   '<div class="article-body">' + article.content + '</div>'
      +   sourcesHTML
      +   '<div class="cta-bar">'
      +     '<p>Bu konuda hukuki destek almak ister misiniz?</p>'
      +     '<a class="btn btn-gold" href="randevu.html">Randevu Talep Et</a>'
      +   '</div>'
      + '</article>';

    const relatedRoot = document.getElementById('related-root');
    if (relatedRoot) {
      const related = articles
        .filter(function (a) { return a.id !== article.id && a.category === article.category; })
        .slice(0, 2);
      if (related.length) {
        relatedRoot.innerHTML =
          '<div class="related-section">'
          + '<h3>İlgili Makaleler</h3>'
          + '<div class="article-grid">' + related.map(articleCardHTML).join('') + '</div>'
          + '</div>';
      }
    }
  }

  function init() {
    const page = document.body.getAttribute('data-page');
    if (!page) return;
    if (page !== 'home' && page !== 'articles-list' && page !== 'article-detail') return;

    fetchArticles()
      .then(function (data) {
        allArticles = data;
        if (page === 'home') renderHomeLatest(data);
        else if (page === 'articles-list') renderList(data);
        else if (page === 'article-detail') renderDetail(data);
      })
      .catch(function (err) {
        console.error(err);
        const target = document.getElementById('home-latest')
          || document.getElementById('articles-grid')
          || document.getElementById('article-root');
        if (target) {
          target.innerHTML = '<div class="empty-state">Makaleler yüklenemedi. Lütfen sayfayı yenileyin.</div>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
