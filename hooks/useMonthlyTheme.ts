import { useEffect, useState } from 'react';
import { loadMonthlyThemes, resolveThemeFromList } from '@/lib/themeService';
import { getThemeForCycle, WorldTheme } from '@/lib/worldThemes';

export function useMonthlyTheme(cycle: number | null | undefined): WorldTheme {
  const initial = getThemeForCycle(cycle ?? 1);
  const [theme, setTheme] = useState<WorldTheme>(initial);

  useEffect(() => {
    let cancelled = false;
    loadMonthlyThemes().then((themes) => {
      if (cancelled) return;
      setTheme(resolveThemeFromList(themes, cycle ?? 1));
    });
    return () => {
      cancelled = true;
    };
  }, [cycle]);

  return theme;
}
