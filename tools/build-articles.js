// data/articles.json -> makaleler/<slug>.html statik sayfalarını ve sitemap.xml'i üretir.
// Nav/footer/WhatsApp bileşenleri makaleler.html'den okunur; tasarım tek yerden yönetilir.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://avukatsafakyilmaz.com';
const OUT_DIR = path.join(ROOT, 'makaleler');

const shell = fs.readFileSync(path.join(ROOT, 'makaleler.html'), 'utf8');

function between(start, end, src) {
  const i = src.indexOf(start);
  const j = src.indexOf(end, i);
  if (i === -1 || j === -1) throw new Error('Şablon parçası bulunamadı: ' + start);
  return src.slice(i, j + end.length);
}

const NAV = between('<nav class="site-nav">', '</nav>', shell);
const FOOTER = between('<footer class="site-footer">', '</footer>', shell);
const WHATSAPP = between('<a class="whatsapp-float"', '</a>', shell);
const FAVICON = between('<link rel="icon"', '/>', shell);

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function trDate(iso) {
  const d = new Date(iso);
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cardHTML(a) {
  return ''
    + '<a class="article-card" href="/makaleler/' + a.slug + '">'
    +   '<div class="article-meta">'
    +     '<span class="cat-chip">' + esc(a.category) + '</span>'
    +     '<span class="dot">•</span><span>' + trDate(a.date) + '</span>'
    +     '<span class="dot">•</span><span>' + (a.readMinutes || 5) + ' dk okuma</span>'
    +   '</div>'
    +   '<h3>' + esc(a.title) + '</h3>'
    +   '<p class="excerpt">' + esc(a.summary) + '</p>'
    +   '<span class="read-more">Devamını Oku</span>'
    + '</a>';
}

function slugifyTr(s) {
  const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  return stripTags(s)
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, function (c) { return map[c]; })
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').slice(0, 60);
}

// Gövdedeki h2 başlıklarına id verir ve içindekiler listesini toplar.
function withHeadingIds(body) {
  const toc = [];
  const out = body.replace(/<h2>([\s\S]*?)<\/h2>/g, function (_, inner) {
    const id = slugifyTr(inner);
    toc.push({ id: id, text: stripTags(inner) });
    return '<h2 id="' + id + '">' + inner + '</h2>';
  });
  return { body: out, toc: toc };
}

function tocHTML(toc) {
  if (toc.length < 3) return '';
  return '<nav class="toc" aria-label="İçindekiler"><h2 class="toc-title">İçindekiler</h2><ol>'
    + toc.map(function (t) { return '<li><a href="#' + t.id + '">' + esc(t.text) + '</a></li>'; }).join('')
    + '</ol></nav>';
}

function sourcesHTML(a) {
  if (!a.sources || !a.sources.length) return '';
  return '<div class="sources-box"><h4>Faydalanılan Kaynaklar</h4><ul>'
    + a.sources.map(function (s) {
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener nofollow">'
          + esc(s.label) + '</a></li>';
      }).join('')
    + '</ul></div>';
}

// Gövdesinde zaten SSS bölümü varsa tekrar basma.
function faqHTML(a) {
  if (!a.faq || !a.faq.length) return '';
  if (/Sıkça Sorulan Sorular/i.test(a.content)) return '';
  return '<h2 id="sikca-sorulan-sorular">Sıkça Sorulan Sorular</h2><dl class="sss">'
    + a.faq.map(function (f) {
        return '<dt>' + esc(f.question) + '</dt><dd>' + esc(f.answer) + '</dd>';
      }).join('')
    + '</dl>';
}

function schemas(a, url) {
  const out = [];

  out.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Makaleler', item: SITE + '/makaleler' },
      { '@type': 'ListItem', position: 3, name: a.title, item: url }
    ]
  });

  out.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title.slice(0, 110),
    description: a.metaDescription || a.summary,
    articleSection: a.category,
    inLanguage: 'tr-TR',
    datePublished: a.date,
    dateModified: a.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Person',
      name: 'Av. Şafak Yılmaz',
      jobTitle: 'Avukat',
      url: SITE + '/hakkimizda'
    },
    publisher: {
      '@type': 'LegalService',
      name: 'Av. Şafak Yılmaz Hukuk Bürosu',
      url: SITE + '/',
      telephone: '+905451332859',
      email: 'avsafakyilmaz@gmail.com',
      areaServed: 'Gaziantep',
      address: { '@type': 'PostalAddress', addressLocality: 'Gaziantep', addressCountry: 'TR' }
    }
  });

  if (a.faq && a.faq.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: a.faq.map(function (f) {
        return {
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        };
      })
    });
  }

  return out.map(function (s) {
    return '  <script type="application/ld+json">\n' + JSON.stringify(s, null, 2) + '\n  </script>';
  }).join('\n');
}

function page(a, all) {
  const url = SITE + '/makaleler/' + a.slug;
  const prepared = withHeadingIds(a.content);

  const sameCat = all.filter(function (x) {
    return x.slug !== a.slug && x.category === a.category;
  }).slice(0, 2);
  const fillers = all.filter(function (x) {
    return x.slug !== a.slug && sameCat.indexOf(x) === -1;
  }).slice(0, 2 - sameCat.length);
  const related = sameCat.concat(fillers);

  const keywordsTag = a.keywords
    ? '  <meta name="keywords" content="' + esc(a.keywords) + '" />\n'
    : '';

  return '<!DOCTYPE html>\n'
    + '<html lang="tr">\n'
    + '<head>\n'
    + '  <meta charset="UTF-8" />\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    + '  <title>' + esc(a.metaTitle || (a.title + ' | Av. Şafak Yılmaz')) + '</title>\n'
    + '  <link rel="canonical" href="' + url + '" />\n'
    + '  <meta name="description" content="' + esc(a.metaDescription || a.summary) + '" />\n'
    + keywordsTag
    + '  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />\n'
    + '  <meta name="author" content="Av. Şafak Yılmaz" />\n'
    + '  <meta name="theme-color" content="#0b1d39" />\n'
    + '\n'
    + '  <meta property="og:type" content="article" />\n'
    + '  <meta property="og:locale" content="tr_TR" />\n'
    + '  <meta property="og:site_name" content="Av. Şafak Yılmaz Hukuk Bürosu" />\n'
    + '  <meta property="og:title" content="' + esc(a.metaTitle || a.title) + '" />\n'
    + '  <meta property="og:description" content="' + esc(a.metaDescription || a.summary) + '" />\n'
    + '  <meta property="og:url" content="' + url + '" />\n'
    + '  <meta property="article:published_time" content="' + a.date + '" />\n'
    + '  <meta property="article:section" content="' + esc(a.category) + '" />\n'
    + '  <meta name="twitter:card" content="summary_large_image" />\n'
    + '\n'
    + '  ' + FAVICON + '\n'
    + '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n'
    + '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
    + '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />\n'
    + '  <link rel="stylesheet" href="/css/style.css" />\n'
    + '  <link rel="stylesheet" href="/css/articles.css" />\n'
    + '\n'
    + schemas(a, url) + '\n'
    + '</head>\n'
    + '<body data-page="article-static">\n'
    + '\n'
    + '<div class="scroll-progress"></div>\n'
    + '\n'
    + NAV + '\n'
    + '\n'
    + '<section style="padding-top:2.5rem;">\n'
    + '  <div class="container">\n'
    + '    <nav class="breadcrumb article-breadcrumb" aria-label="Site haritası">\n'
    + '      <a href="/">Anasayfa</a> <span>›</span> <a href="/makaleler">Makaleler</a> <span>›</span> <span>' + esc(a.category) + '</span>\n'
    + '    </nav>\n'
    + '\n'
    + '    <article class="article-detail">\n'
    + '      <div class="article-meta">\n'
    + '        <span class="cat-chip">' + esc(a.category) + '</span>\n'
    + '        <span class="dot">•</span>\n'
    + '        <time datetime="' + a.date + '">' + trDate(a.date) + '</time>\n'
    + '        <span class="dot">•</span>\n'
    + '        <span>' + (a.readMinutes || 5) + ' dk okuma</span>\n'
    + '      </div>\n'
    + '      <h1>' + esc(a.title) + '</h1>\n'
    + '      <p class="article-byline">Yazan: <a href="/hakkimizda">Av. Şafak Yılmaz</a> · Gaziantep</p>\n'
    + '\n'
    + '      ' + tocHTML(prepared.toc) + '\n'
    + '\n'
    + '      <div class="article-body">\n'
    + prepared.body + '\n'
    + faqHTML(a) + '\n'
    + '      </div>\n'
    + '\n'
    + '      ' + sourcesHTML(a) + '\n'
    + '\n'
    + '      <div class="cta-bar">\n'
    + '        <p>Bu konuda hukuki destek almak ister misiniz? İlk değerlendirme görüşmesi için bize ulaşın.</p>\n'
    + '        <a class="btn btn-gold" href="/randevu">Randevu Talep Et</a>\n'
    + '      </div>\n'
    + '    </article>\n'
    + '\n'
    + '    <div class="related-section">\n'
    + '      <h3>İlgili Makaleler</h3>\n'
    + '      <div class="article-grid">' + related.map(cardHTML).join('') + '</div>\n'
    + '      <p style="margin-top:1.6rem; font-size:.9rem;">\n'
    + '        <a href="/makaleler" style="color:var(--gold); font-weight:600;">← Tüm makaleleri görüntüle</a>\n'
    + '      </p>\n'
    + '    </div>\n'
    + '  </div>\n'
    + '</section>\n'
    + '\n'
    + FOOTER + '\n'
    + '\n'
    + WHATSAPP + '\n'
    + '\n'
    + '<script src="/js/main.js"></script>\n'
    + '</body>\n'
    + '</html>\n';
}

const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'articles.json'), 'utf8'));
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

articles.forEach(function (a) {
  fs.writeFileSync(path.join(OUT_DIR, a.slug + '.html'), page(a, articles), 'utf8');
  console.log('yazıldı: makaleler/' + a.slug + '.html');
});

// --- Liste sayfası ve anasayfa: kartları HTML'e göm (JS beklemeden indekslensin) ---
// Tekrar çalıştırılabilir olması için üretilen blok bir sentinel yorumuyla kapatılır.
function injectGrid(file, marker, cards) {
  const full = path.join(ROOT, file);
  let src = fs.readFileSync(full, 'utf8');
  const sentinel = '<!--/' + marker + '-->';
  const re = src.indexOf(sentinel) !== -1
    ? new RegExp('(<div id="' + marker + '"[^>]*>)[\\s\\S]*?' + sentinel + '</div>')
    : new RegExp('(<div id="' + marker + '"[^>]*>)[\\s\\S]*?</div>');
  if (!re.test(src)) throw new Error(marker + ' bloğu bulunamadı: ' + file);
  src = src.replace(re, '$1' + cards + sentinel + '</div>');
  fs.writeFileSync(full, src, 'utf8');
  console.log('gömüldü: ' + file + ' -> #' + marker);
}

const byDate = articles.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
injectGrid('makaleler.html', 'articles-grid', byDate.map(cardHTML).join(''));
injectGrid('index.html', 'home-latest', byDate.slice(0, 3).map(cardHTML).join(''));

// Liste sayfası için ItemList şeması (arama sonucunda makale listesi olarak tanınsın)
(function injectListSchema() {
  const full = path.join(ROOT, 'makaleler.html');
  let src = fs.readFileSync(full, 'utf8');
  const schema = '  <script type="application/ld+json" data-generated="itemlist">\n'
    + JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Hukuk Makaleleri',
        url: SITE + '/makaleler',
        inLanguage: 'tr-TR',
        about: 'Gaziantep avukatı tarafından hazırlanan hukuki rehberler',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: byDate.map(function (a, i) {
            return {
              '@type': 'ListItem',
              position: i + 1,
              url: SITE + '/makaleler/' + a.slug,
              name: a.title
            };
          })
        }
      }, null, 2)
    + '\n  </script>\n';

  src = src.replace(/\s*<script type="application\/ld\+json" data-generated="itemlist">[\s\S]*?<\/script>\n/, '\n');
  src = src.replace('</head>', schema + '</head>');
  fs.writeFileSync(full, src, 'utf8');
  console.log('gömüldü: makaleler.html -> ItemList şeması');
})();

// --- sitemap.xml ---
const today = new Date().toISOString().slice(0, 10);
const staticPages = [
  { loc: '/', pri: '1.0', freq: 'weekly' },
  { loc: '/hizmetler', pri: '0.9', freq: 'monthly' },
  { loc: '/makaleler', pri: '0.9', freq: 'weekly' },
  { loc: '/hakkimizda', pri: '0.8', freq: 'monthly' },
  { loc: '/randevu', pri: '0.8', freq: 'monthly' },
  { loc: '/iletisim', pri: '0.7', freq: 'monthly' }
];

const urls = staticPages.map(function (p) {
  return '  <url>\n    <loc>' + SITE + p.loc + '</loc>\n    <lastmod>' + today
    + '</lastmod>\n    <changefreq>' + p.freq + '</changefreq>\n    <priority>' + p.pri + '</priority>\n  </url>';
}).concat(articles.map(function (a) {
  return '  <url>\n    <loc>' + SITE + '/makaleler/' + a.slug + '</loc>\n    <lastmod>' + a.date
    + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>';
}));

fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.join('\n') + '\n</urlset>\n',
  'utf8'
);
console.log('sitemap.xml güncellendi (' + urls.length + ' URL)');
