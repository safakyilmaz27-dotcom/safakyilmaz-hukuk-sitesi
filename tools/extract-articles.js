// Masaüstündeki hazır makale HTML dosyalarını okuyup data/articles.json'a aktarır.
// Tek seferlik / tekrar çalıştırılabilir: aynı slug varsa üzerine yazar.
const fs = require('fs');
const path = require('path');

const SRC_DIR = process.argv[2];
const JSON_PATH = path.join(__dirname, '..', 'data', 'articles.json');

const FILES = [
  { file: '1-bosanma-avukati.html',          category: 'Aile Hukuku',     date: '2026-09-09', readMinutes: 11 },
  { file: '2-bosanma-davasi.html',           category: 'Aile Hukuku',     date: '2026-09-09', readMinutes: 9 },
  { file: '3-is-davasi.html',                category: 'İş Hukuku',       date: '2026-09-09', readMinutes: 9 },
  { file: '4-trafik-kazasi-tazminati.html',  category: 'Tazminat Hukuku', date: '2026-09-09', readMinutes: 9 },
  { file: '5-ceza-davasi.html',              category: 'Ceza Hukuku',     date: '2026-09-09', readMinutes: 9 },
];

function pick(re, html) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function ldJsonBlocks(html) {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1])); } catch (e) { console.warn('LD-JSON parse hatası:', e.message); }
  }
  return out;
}

const articles = FILES.map(function (cfg) {
  const html = fs.readFileSync(path.join(SRC_DIR, cfg.file), 'utf8');

  const canonical = pick(/<link rel="canonical" href="([^"]+)"/, html);
  const slug = canonical.split('/').filter(Boolean).pop();

  const metaTitle = pick(/<title>([\s\S]*?)<\/title>/, html);
  const metaDescription = pick(/<meta name="description" content="([^"]*)"/, html);
  const keywords = pick(/<meta name="keywords" content="([^"]*)"/, html);

  const h1 = pick(/<h1>([\s\S]*?)<\/h1>/, html).replace(/\s+/g, ' ');

  // Özet kutusundaki metni summary olarak kullan (etiketleri temizleyerek)
  const ozetRaw = pick(/<div class="ozet">([\s\S]*?)<\/div>/, html);
  const summary = ozetRaw
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*Kısa Özet:\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // <article> içeriği: h1 ve meta satırı çıkarılır (şablon bunları kendisi basar)
  let body = pick(/<article>([\s\S]*?)<\/article>/, html);
  body = body
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<div class="meta-line">[\s\S]*?<\/div>/, '')
    .replace(/https:\/\/avukatsafakyilmaz\.com\/?/g, '/')   // dahili linkler göreli olsun
    .trim();

  const faqLd = ldJsonBlocks(html).find(function (b) { return b['@type'] === 'FAQPage'; });
  const faq = faqLd ? faqLd.mainEntity.map(function (q) {
    return { question: q.name, answer: q.acceptedAnswer.text };
  }) : [];

  return {
    id: slug,
    slug: slug,
    title: h1,
    metaTitle: metaTitle,
    metaDescription: metaDescription,
    keywords: keywords,
    category: cfg.category,
    date: cfg.date,
    readMinutes: cfg.readMinutes,
    summary: summary,
    content: body,
    faq: faq,
  };
});

const existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Eski kayıtlara slug alanı ekle (id zaten slug biçiminde)
existing.forEach(function (a) { if (!a.slug) a.slug = a.id; });

const bySlug = new Map(existing.map(function (a) { return [a.slug, a]; }));
articles.forEach(function (a) { bySlug.set(a.slug, Object.assign({}, bySlug.get(a.slug) || {}, a)); });

const merged = Array.from(bySlug.values())
  .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

fs.writeFileSync(JSON_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('Toplam makale:', merged.length);
merged.forEach(function (a) {
  console.log(' -', a.slug, '|', a.category, '|', a.content.length, 'krkt', '| SSS:', (a.faq || []).length);
});
