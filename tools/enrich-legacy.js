// Eski 5 makalenin SEO alanlarını tamamlar ve başlık hiyerarşisini h2'ye çeker.
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'data', 'articles.json');
const articles = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const SEO = {
  'kira-tahliye-davasi-2026': {
    metaTitle: 'Kira Tahliye Davası 2026: İhtarname, Süreler ve Süreç | Gaziantep Avukat',
    metaDescription: 'Kira tahliye davası nasıl açılır? Tahliye sebepleri, 10 yıllık kiracı, ihtiyaç nedeniyle tahliye, ihtarname süreleri ve görevli mahkeme. Gaziantep gayrimenkul avukatı rehberi.',
    keywords: 'kira tahliye davası, tahliye ihtarnamesi, ihtiyaç nedeniyle tahliye, 10 yıllık kiracı, gaziantep kira avukatı'
  },
  'kidem-ihbar-tazminati-hesaplama': {
    metaTitle: 'Kıdem ve İhbar Tazminatı Hesaplama 2026 | Gaziantep İş Avukatı',
    metaDescription: 'Kıdem ve ihbar tazminatı nasıl hesaplanır? Hak kazanma şartları, tavan tutarı, ihbar süreleri ve dava yolu. Gaziantep iş hukuku avukatından uygulamalı rehber.',
    keywords: 'kıdem tazminatı hesaplama, ihbar tazminatı, işçi alacakları, gaziantep iş avukatı'
  },
  'trafik-kazasi-tazminat-sigorta-tahkim': {
    metaTitle: 'Trafik Kazasında Sigorta ve Tahkim Süreci | Gaziantep Tazminat Avukatı',
    metaDescription: 'Trafik kazası sonrası sigorta şirketine başvuru, Sigorta Tahkim Komisyonu ve tazminat davası süreci. Gaziantep tazminat avukatından adım adım rehber.',
    keywords: 'trafik kazası tazminatı, sigorta tahkim komisyonu, değer kaybı, gaziantep tazminat avukatı'
  },
  'bosanma-davasinda-mal-paylasimi': {
    metaTitle: 'Boşanmada Mal Paylaşımı Nasıl Yapılır? | Gaziantep Boşanma Avukatı',
    metaDescription: 'Edinilmiş mallara katılma rejimi, kişisel mallar, katılma alacağı ve mal rejiminin tasfiyesi davası. Gaziantep boşanma avukatından mal paylaşımı rehberi.',
    keywords: 'boşanmada mal paylaşımı, edinilmiş mallara katılma, mal rejimi tasfiyesi, gaziantep boşanma avukatı'
  },
  'miras-sakli-pay-tenkis-davasi': {
    metaTitle: 'Saklı Pay ve Tenkis Davası: Miras Hakkı Rehberi | Gaziantep Miras Avukatı',
    metaDescription: 'Saklı pay oranları, tenkis davası, muris muvazaası ve mirastan mal kaçırma. Gaziantep miras avukatından hak kaybı yaşamamak için pratik rehber.',
    keywords: 'saklı pay, tenkis davası, muris muvazaası, mirastan mal kaçırma, gaziantep miras avukatı'
  }
};

let changed = 0;
articles.forEach(function (a) {
  const seo = SEO[a.slug];
  if (!seo) return;
  Object.assign(a, seo);
  // Eski içerikler h3 ile başlıyor; statik sayfalarda h1 -> h2 hiyerarşisi için yükselt.
  a.content = a.content.replace(/<h3>/g, '<h2>').replace(/<\/h3>/g, '</h2>');
  changed++;
});

fs.writeFileSync(JSON_PATH, JSON.stringify(articles, null, 2) + '\n', 'utf8');
console.log('Güncellenen eski makale sayısı:', changed);
