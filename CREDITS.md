# Veri Kaynakları

Bu proje, `src/data/stars.json` ve `src/data/constellations.json` dosyalarını
üretmek için aşağıdaki açık kaynaklı veri setlerini kullanır
(`scripts/build-star-catalog.mjs`):

- **HYG Database v3.8** — astronexus/HYG-Database
  (https://github.com/astronexus/HYG-Database), CC BY-SA 2.5 lisansı ile.
  Yıldızların RA/Dec (J2000), görünür parlaklık (mag) ve renk indeksi (B-V)
  bilgileri buradan alınmıştır (mag ≤ 6.0 ile filtrelenmiştir).

- **d3-celestial** — ofrohn/d3-celestial
  (https://github.com/ofrohn/d3-celestial), BSD 3-Clause lisansı ile.
  Takımyıldız çizgileri ve çok dilli takımyıldız adları (Türkçe dahil)
  buradan alınmıştır.

Astronomik hesaplamalar (Ay evresi, gezegen/Güneş/Ay konumları, doğuş-batış
saatleri) için `astronomy-engine` (MIT lisanslı) kütüphanesi kullanılmıştır.

- **Solar System Scope** (https://www.solarsystemscope.com/textures) — "Aya Yaklaş"
  yakın-yörünge kamera modunda kullanılan yüksek çözünürlüklü (2K) Ay dokusu, CC BY 4.0
  lisansı ile.

- **CelesTrak** (https://celestrak.org) — çıplak gözle görülebilen uyduların
  (ISS dahil, "visual" grubu) TLE (Two-Line Element) verileri buradan gerçek
  zamanlı olarak çekilir, tarayıcıda önbekleklenir (12-24 saatte bir yenilenir).
  SGP4/SDP4 yörünge yayılımı için `satellite.js` (MIT lisanslı) kütüphanesi
  kullanılmıştır. Ağ isteği başarısız olursa `src/data/satellites-fallback.json`
  içindeki güncelliği garanti edilmeyen bir yedek TLE setine düşülür.

`src/data/stars.json`, HYG verisinin türetilmiş bir alt kümesi olduğundan
CC BY-SA 2.5'in "aynı lisansla paylaş" şartına tabidir.
