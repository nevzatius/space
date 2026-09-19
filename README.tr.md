<div align="center">

# 🌌 Gece Gökyüzü Simülatörü

**Konum, tarih ve saat seçerek tarayıcınızda gerçek zamanlı, 3 boyutlu gece gökyüzünü keşfedin.**

[🇬🇧 English](README.md) · [🇹🇷 Türkçe](README.tr.md)

[![Canlı Demo](https://img.shields.io/badge/demo-canl%C4%B1-4c9aff)](https://nevzatius.github.io/space/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black)](https://threejs.org/)

**[▶ Canlı olarak deneyin](https://nevzatius.github.io/space/)**

</div>

---

## Genel Bakış

Gece Gökyüzü Simülatörü, statik bir yıldız haritası değil — gerçek yörünge mekaniğine dayanan, astronomik olarak doğru bir gökyüzü görselleştirmesidir. Dünya üzerinde herhangi bir konum ve herhangi bir tarih/saat (geçmiş, şimdi veya gelecek) seçin; uygulama [astronomy-engine](https://github.com/cosinekitty/astronomy) kullanarak her yıldızın, gezegenin ve Ay'ın gerçek zamanlı olarak nerede olduğunu hesaplar.

## Özellikler

- **3B etkileşimli gökyüzü** — sürükleyerek etrafa bakın; canlı pusula HUD'u yönünüzü takip eder.
- **Gerçek yıldız kataloğu** — HYG kataloğundan, gerçek parlaklık ve renge göre render edilen binlerce yıldız.
- **Takımyıldızlar** — doğru çizgi grafikleri ve yerelleştirilmiş isimler (İngilizce/Türkçe), tıklanarak detay gösterir.
- **Güneş, Ay ve gezegenler** — anlık evre, aydınlanma, doğuş/batış/tepe noktası saatleri ve gerçek gökyüzü konumu; yüksek çözünürlüklü Ay dokusuyla yakın-yörünge "Aya Yaklaş" kamera modu.
- **Uydu takibi** — ISS dahil çıplak gözle görülebilen uydular için gerçek zamanlı TLE verisi, SGP4/SDP4 ile yörünge yayılımı.
- **Gök olayları** — yaklaşan kavuşumlar, tutulmalar, meteor yağmurları ve aurora uyarıları.
- **Konum araçları** — cihaz GPS'i, IP tabanlı tespit veya haritadan seçim/arama, ayrıca gökyüzünüz için ışık kirliliği (Bortle ölçeği) tahmini.
- **Zamanda yolculuk** — geçmiş veya gelecekteki gökyüzünü önizlemek için istediğiniz tarih/saate geçin.
- **Çift dilli arayüz** — çalışma zamanında değiştirilebilen tam İngilizce/Türkçe arayüz.

## Teknoloji Yığını

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — geliştirme sunucusu ve derleme
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [@react-three/drei](https://github.com/pmndrs/drei) ile [Three.js](https://threejs.org/)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) — Güneş/Ay/gezegen konumları ve gök olayı hesaplamaları
- [satellite.js](https://github.com/shashwatak/satellite-js) — uydu yörünge hesabı
- [react-leaflet](https://react-leaflet.js.org/) — konum haritası
- [zustand](https://github.com/pmndrs/zustand) — uygulama durumu
- [luxon](https://moment.github.io/luxon/) / [tz-lookup](https://www.npmjs.com/package/tz-lookup) — tarih, saat ve saat dilimi işlemleri

## Başlarken

### Gereksinimler

- [Node.js](https://nodejs.org/) 20 veya üzeri
- npm

### Kurulum ve çalıştırma

```bash
npm install
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

Yıldız/takımyıldız kataloğu ve ışık kirliliği haritası ham açık veri setlerinden üretilir. Normal geliştirme akışında buna gerek yoktur, yalnızca ham veriler değiştiğinde çalıştırılır:

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
  i18n/         İngilizce/Türkçe çeviri sözlükleri ve dil durumu
  lib/          Astronomik hesaplama ve yardımcı fonksiyonlar
  state/        Zustand ile global uygulama durumu
  types/        Paylaşılan TypeScript tipleri
scripts/        Ham veri setlerinden katalog üreten build script'leri
```

## Veri Kaynakları ve Lisanslar

Kullanılan açık kaynaklı veri setleri, kütüphaneler ve lisans bilgileri için [CREDITS.md](CREDITS.md) dosyasına bakın (HYG kataloğu, d3-celestial, astronomy-engine, satellite.js, CelesTrak, Solar System Scope dokuları).

## Dağıtım (Deployment)

`master` dalına yapılan push'lar, [.github/workflows/deploy.yml](.github/workflows/deploy.yml) üzerinden otomatik olarak derlenip GitHub Pages'e yayınlanır.
