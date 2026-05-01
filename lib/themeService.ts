import { supabase } from './supabase';
import { WorldTheme, getThemeForCycle as fallbackForCycle } from './worldThemes';

interface MonthlyThemeRow {
  id: string;
  name_en: string;
  name_he: string;
  cycle_position: number;
  background_colors: string[];
  path_color: string;
  path_stroke: string;
  node_color: string;
  node_stroke: string;
  locked_node_color: string;
  locked_node_stroke: string;
  current_glow: string;
  decoration: { primary: string; secondary: string; accent: string };
}

let cache: WorldTheme[] | null = null;
let cachePromise: Promise<WorldTheme[]> | null = null;

function rowToTheme(row: MonthlyThemeRow): WorldTheme {
  const bg = row.background_colors;
  return {
    id: row.id,
    backgroundColors: [bg[0], bg[1], bg[2]] as [string, string, string],
    pathColor: row.path_color,
    pathStroke: row.path_stroke,
    nodeColor: row.node_color,
    nodeStroke: row.node_stroke,
    lockedNodeColor: row.locked_node_color,
    lockedNodeStroke: row.locked_node_stroke,
    currentGlow: row.current_glow,
    decoration: row.decoration,
  };
}

export async function loadMonthlyThemes(): Promise<WorldTheme[]> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('monthly_themes')
        .select('*')
        .order('cycle_position', { ascending: true });

      if (error || !data || data.length === 0) {
        cache = [];
        return cache;
      }

      cache = (data as unknown as MonthlyThemeRow[]).map(rowToTheme);
      return cache;
    } catch {
      cache = [];
      return cache;
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
}

export function resolveThemeFromList(themes: WorldTheme[], cycle: number): WorldTheme {
  if (themes.length === 0) return fallbackForCycle(cycle);
  const index = Math.max(0, (cycle - 1)) % themes.length;
  return themes[index];
}

export function clearThemeCache() {
  cache = null;
  cachePromise = null;
}
