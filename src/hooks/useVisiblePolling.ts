import { useEffect, useState } from 'react';

/**
 * Returns the given polling interval only while the tab is actually visible.
 * When the tab is hidden the hook returns `false`, which react-query treats as
 * "no polling" — this avoids burning API quota on background tabs.
 */
export function useVisibleInterval(ms: number): number | false {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible'
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible ? ms : false;
}
