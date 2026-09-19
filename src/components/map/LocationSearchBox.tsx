import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from '../../i18n/useTranslation';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationSearchBox() {
  const setLocation = useAppStore((s) => s.setLocation);
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=${language}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, language]);

  function pickResult(r: NominatimResult) {
    setLocation({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), label: r.display_name });
    setQuery('');
    setResults([]);
  }

  return (
    <div className="location-search">
      <input
        type="text"
        className="location-search__input"
        placeholder={t.locationSearch.placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div className="location-search__status">{t.locationSearch.searching}</div>}
      {results.length > 0 && (
        <ul className="location-search__results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pickResult(r)}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
