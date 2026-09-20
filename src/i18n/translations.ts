import type { Language } from './language';

export interface TranslationDict {
  header: {
    title: string;
    subtitle: string;
    upcomingEvents: string;
    bortle: string;
  };
  locationMenu: {
    deviceLocation: string;
    ipLocation: string;
    mapSearch: string;
    detecting: string;
    limitingMagnitude: string;
    lightPollutionNote: string;
    close: string;
    sourceGps: string;
    sourceIp: string;
    sourceManual: string;
  };
  locationSearch: {
    placeholder: string;
    searching: string;
  };
  locationPicker: {
    hint: string;
    attribution: string;
  };
  dateTime: {
    liveNow: string;
    timeZone: string;
  };
  bodyEvents: {
    title: string;
    body: string;
    rise: string;
    set: string;
    transit: string;
    visibleNow: string;
  };
  constellations: {
    title: string;
    subtitle: (bortle: number, mag: string) => string;
    empty: string;
    altitude: string;
    showStars: string;
  };
  moonPhase: {
    illumination: string;
  };
  satellites: {
    title: string;
    show: string;
    loading: string;
    error: string;
    tracking: (count: number, source: string) => string;
    empty: string;
    visibleNow: string;
    altitude: string;
    sourceNetwork: string;
    sourceCache: string;
    sourceStaleCache: string;
    sourceFallback: string;
  };
  upcomingEvents: {
    title: string;
    calculating: string;
    empty: string;
    close: string;
  };
  moonApproach: {
    approach: string;
    back: string;
  };
  zoom: {
    zoomIn: string;
    zoomOut: string;
  };
  language: {
    switchTo: string;
  };
}

const translations: Record<Language, TranslationDict> = {
  tr: {
    header: {
      title: 'Gece Gökyüzü Simülatörü',
      subtitle: 'Konum ve tarih/saat seçerek gökyüzünü keşfedin.',
      upcomingEvents: 'Yaklaşan Olaylar',
      bortle: 'Bortle',
    },
    locationMenu: {
      deviceLocation: 'Cihaz Konumu',
      ipLocation: 'İnternet Konumu',
      mapSearch: 'Harita / Arama',
      detecting: 'Konum tespit ediliyor…',
      limitingMagnitude: 'sınır kadir',
      lightPollutionNote:
        'Işık kirliliği tahmini, yakındaki yerleşim yerlerinin nüfusuna dayalı kaba bir yaklaşımdır; gerçek ölçüm verisi değildir.',
      close: 'Kapat',
      sourceGps: 'Cihaz konumu',
      sourceIp: 'İnternet konumu (yaklaşık)',
      sourceManual: 'Elle seçildi',
    },
    locationSearch: {
      placeholder: 'Şehir veya yer ara…',
      searching: 'Aranıyor…',
    },
    locationPicker: {
      hint: 'Konum seçmek için haritaya tıklayın. Seçili konum:',
      attribution: 'katkıda bulunanlar',
    },
    dateTime: {
      liveNow: 'Şimdi (canlı)',
      timeZone: 'Saat dilimi:',
    },
    bodyEvents: {
      title: 'Doğuş / Batış',
      body: 'Cisim',
      rise: 'Doğuş',
      set: 'Batış',
      transit: 'Tepe noktası',
      visibleNow: 'Şu an bu ışık kirliliğinde görünür',
    },
    constellations: {
      title: 'Şu an görünen takımyıldızlar',
      subtitle: (bortle: number, mag: string) =>
        `Bortle ${bortle} ışık kirliliğinde, ~${mag} kadre kadar çıplak gözle görülebilecekler`,
      empty: 'Şu an ufkun üzerinde belirgin bir takımyıldız yok.',
      altitude: 'yükseklik',
      showStars: 'Yıldızları göster',
    },
    moonPhase: {
      illumination: 'aydınlanma',
    },
    satellites: {
      title: 'Uydular',
      show: 'Göster',
      loading: 'Uydu verisi yükleniyor…',
      error: 'Uydu verisi yüklenemedi.',
      tracking: (count: number, source: string) => `${count} uydu takip ediliyor (${source})`,
      empty: 'Şu an çıplak gözle görülebilecek bir uydu yok.',
      visibleNow: 'Şu an çıplak gözle görünür',
      altitude: 'yükseklik',
      sourceNetwork: 'canlı veri',
      sourceCache: 'önbellek',
      sourceStaleCache: 'eski önbellek (yenilenemedi)',
      sourceFallback: 'yedek veri (çevrimdışı)',
    },
    upcomingEvents: {
      title: 'Yaklaşan Gökyüzü Olayları',
      calculating: 'Hesaplanıyor…',
      empty: 'Yakın zamanda dikkat çekici bir olay yok.',
      close: 'Kapat',
    },
    moonApproach: {
      approach: 'Aya Yaklaş',
      back: 'Geri Dön',
    },
    zoom: {
      zoomIn: 'Yakınlaştır',
      zoomOut: 'Uzaklaştır',
    },
    language: {
      switchTo: 'Switch to English',
    },
  },
  en: {
    header: {
      title: 'Night Sky Simulator',
      subtitle: 'Explore the sky by choosing a location and date/time.',
      upcomingEvents: 'Upcoming Events',
      bortle: 'Bortle',
    },
    locationMenu: {
      deviceLocation: 'Device Location',
      ipLocation: 'Internet Location',
      mapSearch: 'Map / Search',
      detecting: 'Detecting location…',
      limitingMagnitude: 'limiting magnitude',
      lightPollutionNote:
        'The light pollution estimate is a rough approximation based on the population of nearby settlements; it is not real measured data.',
      close: 'Close',
      sourceGps: 'Device location',
      sourceIp: 'Internet location (approximate)',
      sourceManual: 'Manually selected',
    },
    locationSearch: {
      placeholder: 'Search for a city or place…',
      searching: 'Searching…',
    },
    locationPicker: {
      hint: 'Click the map to choose a location. Selected location:',
      attribution: 'contributors',
    },
    dateTime: {
      liveNow: 'Now (live)',
      timeZone: 'Time zone:',
    },
    bodyEvents: {
      title: 'Rise / Set',
      body: 'Body',
      rise: 'Rise',
      set: 'Set',
      transit: 'Transit',
      visibleNow: 'Currently visible under this light pollution',
    },
    constellations: {
      title: 'Currently visible constellations',
      subtitle: (bortle: number, mag: string) =>
        `Under Bortle ${bortle} light pollution, visible down to magnitude ~${mag} with the naked eye`,
      empty: 'No prominent constellation is above the horizon right now.',
      altitude: 'altitude',
      showStars: 'Show stars',
    },
    moonPhase: {
      illumination: 'illuminated',
    },
    satellites: {
      title: 'Satellites',
      show: 'Show',
      loading: 'Loading satellite data…',
      error: 'Failed to load satellite data.',
      tracking: (count: number, source: string) => `Tracking ${count} satellites (${source})`,
      empty: 'No satellite is currently visible to the naked eye.',
      visibleNow: 'Currently visible to the naked eye',
      altitude: 'altitude',
      sourceNetwork: 'live data',
      sourceCache: 'cached',
      sourceStaleCache: 'stale cache (could not refresh)',
      sourceFallback: 'fallback data (offline)',
    },
    upcomingEvents: {
      title: 'Upcoming Sky Events',
      calculating: 'Calculating…',
      empty: 'No notable event coming up soon.',
      close: 'Close',
    },
    moonApproach: {
      approach: 'Approach Moon',
      back: 'Back Away',
    },
    zoom: {
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
    },
    language: {
      switchTo: 'Türkçe\'ye geç',
    },
  },
};

export function getTranslations(language: Language): TranslationDict {
  return translations[language];
}
