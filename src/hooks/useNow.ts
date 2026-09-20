import { useEffect } from 'react';
import { useAppStore } from '../state/appStore';

/** Keeps `dateTimeUtc` ticking forward once a minute while "Şimdi" (live) mode is on. */
export function useNow() {
  const useLiveNow = useAppStore((s) => s.useLiveNow);
  const playing = useAppStore((s) => s.playing);
  const playbackRate = useAppStore((s) => s.playbackRate);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = now - previous;
      if (elapsed >= 33) {
        // Do not jump across hours after returning from a background tab.
        const delta = document.hidden ? 0 : Math.min(elapsed, 100) * playbackRate;
        previous = now;
        const current = useAppStore.getState().dateTimeUtc.getTime();
        useAppStore.setState({ dateTimeUtc: new Date(current + delta) });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, playbackRate]);

  useEffect(() => {
    if (!useLiveNow) return;
    const id = setInterval(() => {
      useAppStore.setState({ dateTimeUtc: new Date() });
    }, 60_000);
    return () => clearInterval(id);
  }, [useLiveNow]);
}
