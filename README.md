# Av. Şafak Yılmaz Hukuk Bürosu — Web Sitesi

Saf HTML / CSS / JavaScript ile hazırlanmış çok sayfalı avukat bürosu sitesi. Backend yok; tüm veri tarayıcıda çalışır, randevu durumu `localStorage`'da tutulur.

## Özellikler

- **7 sayfa:** Anasayfa, Hizmetler, Makaleler, Makale detay, Hakkımızda, Randevu, İletişim
- **Makaleler:** `data/articles.json`'dan render edilir; kategori filtre + arama desteği. Türkiye'de en çok aranan 5 hukuki konu işlenmiştir (boşanma mal paylaşımı, kıdem-ihbar tazminatı, kira tahliye 2026, trafik kazası tazminat, miras saklı pay).
- **Randevu sistemi:** 4 adımlı akış — alan → takvim (hafta sonu/geçmiş kapalı) → saat slotu → bilgi formu → onay özeti. `randevu.html?alan=ticaret` gibi derin link adım atlatır.
- **Responsive:** Hamburger menü, akışkan grid'ler, mobile-first kırılımlar.

## Klasör Yapısı

```
.
├── index.html              # Anasayfa
├── hizmetler.html          # 9 hukuk dalı
├── makaleler.html          # Makale listesi (filtre + arama)
├── makale.html             # Tek makale (?id=... ile)
├── hakkimizda.html
├── randevu.html
├── iletisim.html
├── css/
│   ├── style.css           # Ortak: nav/hero/kart/footer
│   ├── articles.css        # Makale liste/detay
│   └── appointment.css     # Takvim/slot/step UI
├── js/
│   ├── main.js             # Nav toggle + ortak yardımcılar
│   ├── articles.js         # JSON fetch + render
│   └── appointment.js      # Takvim + slot + form akışı
├── data/
│   └── articles.json       # Makale verisi
└── .server.js              # Yerel geliştirme için minimal HTTP server
```

## Çalıştırma

`fetch()` ile JSON yüklendiği için yerel HTTP server gerekir.

**Seçenek 1 — birlikte gelen mini server (Node.js gerekli):**

```powershell
node .server.js
# http://127.0.0.1:8765/
```

**Seçenek 2 — `http-server`:**

```powershell
npx --yes http-server -p 8765 -c-1
```

**Seçenek 3 — Python:**

```powershell
python -m http.server 8765
```

## Yeni Makale Eklemek

`data/articles.json` dosyasına aşağıdaki şemada yeni bir kayıt ekleyin:

```json
{
  "id": "kisa-slug",
  "title": "Başlık",
  "category": "Aile Hukuku",
  "date": "2026-05-04",
  "readMinutes": 6,
  "summary": "1-2 cümle özet.",
  "content": "<p>HTML içerik. <h3>, <ul>, <strong>, <blockquote> kullanılabilir.</p>",
  "sources": [{ "label": "Kaynak adı", "url": "https://..." }]
}
```

Site otomatik olarak yeni makaleyi tarihe göre sıralar, kategori filtre çiplerine ekler ve anasayfada en yeni 3'ü gösterir.

## Notlar

- Randevu durumu `localStorage` anahtarı `sy_booked` altında tutulur — yalnızca tarayıcı düzeyinde çakışma engeli sağlar. Gerçek çoklu kullanıcı senaryosu için backend gerekir.
- İletişim formu `localStorage['sy_messages']`'a yazar; production'da bir API'ye yönlendirilmesi önerilir.
- Tasarım: Georgia + sans-serif tipografi, navy `#0f1e35` + gold `#b8973a` paleti.
