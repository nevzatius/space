import { useEffect } from 'react';
import { useAppStore } from '../state/appStore';

/** Keeps `dateTimeUtc` ticking forward once a minute while "Şimdi" (live) mode is on. */
export function useNow() {
  const useLiveNow = useAppStore((s) => s.useLiveNow);

  useEffect(() => {
    if (!useLiveNow) return;
    const id = setInterval(() => {
      useAppStore.setState({ dateTimeUtc: new Date() });
    }, 60_000);
    return () => clearInterval(id);
  }, [useLiveNow]);
}
