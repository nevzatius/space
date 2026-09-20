import { useMemo, useState } from 'react';
import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { getBodyName } from '../../lib/bodyNamesTr';
import { stars, constellations } from '../../lib/starCatalog';
import { altAzToCartesian } from '../../lib/coords';
import './ObjectSearch.css';
import { Body, SearchRiseSet } from 'astronomy-engine';

const normalize = (text: string) => text.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function ObjectSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const language = useAppStore((s) => s.language);
  const zone = useAppStore((s) => s.timeZone);
  const { bodyPositions, starsHorizontal, constellationLines, observer } = useAstroState();
  const tr = language === 'tr';
  const results = useMemo(() => {
    const search = normalize(query.trim());
    const bodies: Array<{ id: string; name: string; keywords: string; altitude: number; azimuth: number; constellation: string }> = bodyPositions.map((body) => ({
      id: body.body, name: getBodyName(body.body, language), keywords: `${body.body} ${getBodyName(body.body, 'tr')}`,
      altitude: body.altitude, azimuth: body.azimuth, constellation: '',
    }));
    if (!search) return bodies;
    const matching = bodies.filter((body) => normalize(body.keywords).includes(search));
    for (const constellation of constellations) {
      if (!normalize(`${constellation.nameLatin} ${constellation.nameTr} ${constellation.code}`).includes(search)) continue;
      const lines = constellationLines.find((item) => item.code === constellation.code)?.linesHorizontal ?? [];
      const vectors = lines.flatMap((line) => line.map(([azimuth, altitude]) => altAzToCartesian(altitude, azimuth)));
      if (!vectors.length) continue;
      const sum = vectors.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);
      matching.push({ id: constellation.code, name: tr ? constellation.nameTr : constellation.nameLatin, keywords: '',
        altitude: Math.atan2(sum[1], Math.hypot(sum[0], sum[2])) * 180 / Math.PI,
        azimuth: (Math.atan2(sum[0], -sum[2]) * 180 / Math.PI + 360) % 360, constellation: constellation.code });
    }
    // The bundled catalogue contains HIP identifiers, not proper star names.
    if (/^(hip\s*)?\d+$/.test(search)) {
      const hip = search.replace(/^hip\s*/, '');
      const index = stars.hip.findIndex((value) => String(value) === hip);
      if (index >= 0) matching.push({ id: `HIP ${hip}`, name: `HIP ${hip}`, keywords: '', ...starsHorizontal[index], constellation: '' });
    }
    return matching.slice(0, 10);
  }, [query, bodyPositions, starsHorizontal, constellationLines, language, tr]);

  return <div className="object-search" onWheel={(event) => event.stopPropagation()} onKeyDown={(event) => {
    if (event.key === 'Escape') { setOpen(false); event.currentTarget.querySelector('input')?.blur(); }
  }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <input type="search" value={query} aria-label={tr ? 'Gökyüzünde nesne ara' : 'Search sky objects'}
      placeholder={tr ? 'Nesne ara · Satürn, Orion, HIP…' : 'Find · Saturn, Orion, HIP…'}
      aria-expanded={open} aria-controls="sky-search-results"
      onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); setNotice(''); }} />
    {open && <div className="object-search__results" id="sky-search-results">
      {!results.length && <p>{tr ? 'Nesne bulunamadı. Yıldızlar için HIP numarası kullan.' : 'No objects found. Use a HIP number for stars.'}</p>}
      {results.map((result) => <button type="button" key={result.id} onClick={() => {
        useAppStore.getState().focusObject(result.altitude, result.azimuth);
        if (result.constellation) useAppStore.getState().setSelectedConstellation(result.constellation);
        if (result.id.startsWith('HIP')) useAppStore.getState().setShowStars(true);
        const body = bodyPositions.find((position) => position.body === result.id);
        const rise = result.altitude < 0 && body
          ? SearchRiseSet(body.body as Body, observer, 1, useAppStore.getState().dateTimeUtc, 7)?.date : null;
        const riseText = rise ? new Intl.DateTimeFormat(language, { timeZone: zone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(rise) : '';
        setNotice(result.altitude < 0
          ? `${result.name} · ${tr ? 'Ufkun altında' : 'Below horizon'}${riseText ? ` · ${tr ? 'Sonraki doğuş' : 'Next rise'} ${riseText}` : ''}`
          : `${result.name} · ${Math.round(result.altitude)}°`);
        setQuery(''); setOpen(false);
      }}><span>{result.name}</span><small>{Math.round(result.altitude)}° {result.altitude < 0 ? '↓' : '↑'}</small></button>)}
    </div>}
    {notice && !open && <div className="object-search__notice" role="status">{notice}<button type="button" aria-label={tr ? 'Kapat' : 'Dismiss'} onClick={() => setNotice('')}>×</button></div>}
  </div>;
}
