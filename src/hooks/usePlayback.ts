import { useEffect, useRef, useState } from "react";

export function usePlayback(total: number, frameMs: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafId = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const acc = useRef(0);

  useEffect(() => {
    if (!playing) {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      last.current = null;
      return;
    }
    const loop = (t: number) => {
      if (last.current == null) { last.current = t; }
      else {
        const dt = t - last.current; last.current = t; acc.current += dt;
        while (acc.current >= frameMs) {
          acc.current -= frameMs;
          setIndex((i) => (total ? (i + 1) % total : 0));
        }
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => { if (rafId.current != null) cancelAnimationFrame(rafId.current); };
  }, [playing, total, frameMs]);

  const start = () => total && setPlaying(true);
  const stop = () => setPlaying(false);
  const reset = () => { stop(); setIndex(0); acc.current = 0; last.current = null; };

  return { index, setIndex, playing, start, stop, reset };
}
