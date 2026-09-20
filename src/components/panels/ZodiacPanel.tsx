import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { getAstronomicalZodiac, type AstronomicalZodiacResult } from '../../lib/zodiac';
import './Zodiac.css';

export function ZodiacPanel() {
  const language = useAppStore((s) => s.language);
  const tr = language === 'tr';
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<AstronomicalZodiacResult | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!birthDate) return;
    setResult(getAstronomicalZodiac(birthDate));
  }

  return (
    <section className="zodiac-panel">
      <h3>{tr ? 'Gerçek Astronomik Burcun' : 'Your Real Astronomical Sign'}</h3>
      <p className="zodiac-note">
        {tr
          ? 'Doğum tarihini gir, Güneş\'in o gün gerçekte hangi takımyıldızda olduğunu gör.'
          : "Enter your birth date to see which constellation the Sun was actually in that day."}
      </p>
      <form className="zodiac-panel__form" onSubmit={onSubmit}>
        <input
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          aria-label={tr ? 'Doğum tarihi' : 'Birth date'}
          required
        />
        <button type="submit">{tr ? 'Göster' : 'Reveal'}</button>
      </form>
      {result && (
        <div className="zodiac-panel__notice" role="status">
          <div className="zodiac-panel__row">
            <span className="zodiac-panel__label">{tr ? 'Popüler burcun' : 'Popular sign'}</span>
            <strong>
              {result.tropicalSign.symbol} {tr ? result.tropicalSign.nameTr : result.tropicalSign.nameEn}
            </strong>
          </div>
          <div className="zodiac-panel__row zodiac-panel__row--astro">
            <span className="zodiac-panel__label">{tr ? 'Astronomik gerçek' : 'Astronomical reality'}</span>
            <strong>{tr ? result.nameTr : result.nameLatin}</strong>
          </div>
          {result.isOphiuchus && (
            <p className="zodiac-panel__ophiuchus">
              {tr
                ? '13. takımyıldız! Batı astrolojisinin genelde göz ardı ettiği Yılancı (Ophiuchus).'
                : 'The 13th constellation! Ophiuchus, usually left out of Western astrology.'}
            </p>
          )}
          <p className="zodiac-note">
            {tr
              ? 'Fark, Dünya\'nın ekseninin binlerce yıldır yavaşça sallanmasından (presesyon) kaynaklanır; astroloji burçları ~2000 yıl önceki gökyüzüne göre sabitlenmiştir.'
              : "The difference comes from axial precession — Earth's slow wobble over millennia. Astrology's signs are fixed to the sky as it was ~2,000 years ago."}
          </p>
          <button
            type="button"
            className="zodiac-panel__show-in-sky"
            onClick={() => useAppStore.getState().setSelectedConstellation(result.constellationCode)}
          >
            {tr ? 'Gökyüzünde göster ↗' : 'Show in sky ↗'}
          </button>
        </div>
      )}
    </section>
  );
}
