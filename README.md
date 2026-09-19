# 🌌 Gece Gökyüzü Simülatörü

Konumunuza ve seçtiğiniz tarih/saate göre gerçek zamanlı, 3 boyutlu gece gökyüzünü
tarayıcınızda canlandıran bir web uygulaması. Yıldızlar, takımyıldızlar, Ay, Güneş,
gezegenler ve yapay uydular gerçek astronomik hesaplamalarla konumlandırılır.

## Özellikler

- **3B gökyüzü görünümü** — Three.js tabanlı, pusula yönü ve yatay/dikey açıya göre
  gezinilebilen etkileşimli gök küresi.
- **Gerçek yıldız kataloğu** — HYG veri setinden türetilmiş, parlaklık ve renge göre
  render edilen binlerce yıldız.
- **Takımyıldızlar** — çizgiler ve çok dilli (Türkçe dahil) isimlendirme.
- **Ay, Güneş ve gezegenler** — anlık evre, doğuş/batış saatleri ve gökyüzündeki
  konumlarıyla birlikte; Ay için yakın-yörünge "Aya Yaklaş" kamera modu.
- **Uydu takibi** — ISS dahil çıplak gözle görülebilen uyduların gerçek zamanlı TLE
  verileriyle SGP4/SDP4 yörünge yayılımı.
- **Gök olayları** — kavuşumlar, tutulmalar ve meteor yağmurları için yaklaşan olay
  bildirimleri.
- **Konum seçimi** — harita üzerinden konum seçme, arama kutusu ve otomatik konum
  algılama; ışık kirliliği haritasıyla gökyüzü görünürlüğü tahmini.
- **Tarih/saat kontrolü** — istenilen tarih ve saate ışınlanarak geçmiş/gelecek
  gökyüzünü inceleme.

## Teknoloji Yığını

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — geliştirme sunucusu ve derleme
- [Three.js](https://threejs.org/) / [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [@react-three/drei](https://github.com/pmndrs/drei)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) — Güneş, Ay, gezegen
  konumları ve gök olayı hesaplamaları
- [satellite.js](https://github.com/shashwatak/satellite-js) — uydu yörünge hesabı
- [react-leaflet](https://react-leaflet.js.org/) — konum haritası
- [zustand](https://github.com/pmndrs/zustand) — uygulama durum yönetimi
- [luxon](https://moment.github.io/luxon/) / [tz-lookup](https://www.npmjs.com/package/tz-lookup) — tarih, saat ve saat dilimi işlemleri

## Başlarken

### Gereksinimler

- [Node.js](https://nodejs.org/) 20 veya üzeri
- npm

### Kurulum

```bash
npm install
```

### Geliştirme sunucusu

```bash
npm run dev
```

### Prodüksiyon derlemesi

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

### Veri kataloglarını yeniden üretme

Yıldız/takımyıldız kataloğu ve ışık kirliliği haritası ham veri setlerinden
üretilir; normal geliştirme akışında bu adımlara gerek yoktur, yalnızca ham veriler
güncellendiğinde çalıştırılır:

```bash
npm run build:catalog
npm run build:lightpollution
```

## Proje Yapısı

```
src/
  components/   UI bileşenleri (gökyüzü görünümü, panel, harita, menü, tarih/saat)
  data/         Üretilmiş yıldız/takımyıldız/uydu veri dosyaları
  hooks/        React hook'ları (canlı saat, uydu, gök olayları vb.)
  lib/          Astronomik hesaplama ve yardımcı fonksiyonlar
  state/        Zustand ile global uygulama durumu
  types/        Paylaşılan TypeScript tipleri
scripts/        Ham veri setlerinden katalog üreten build script'leri
```

## Veri Kaynakları ve Lisanslar

Kullanılan açık kaynaklı veri setleri, kütüphaneler ve lisans bilgileri için
[CREDITS.md](CREDITS.md) dosyasına bakın.
