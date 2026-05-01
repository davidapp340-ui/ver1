export interface DecorationColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface WorldTheme {
  id: string;
  backgroundColors: [string, string, string];
  pathColor: string;
  pathStroke: string;
  nodeColor: string;
  nodeStroke: string;
  lockedNodeColor: string;
  lockedNodeStroke: string;
  currentGlow: string;
  decoration: DecorationColors;
}

const THEMES: Record<string, WorldTheme> = {
  forest: {
    id: 'forest',
    backgroundColors: ['#0F2A1D', '#1A4731', '#1E5A3A'],
    pathColor: '#2D6B45',
    pathStroke: '#3E8E5E',
    nodeColor: '#10B981',
    nodeStroke: '#059669',
    lockedNodeColor: '#1F3D2D',
    lockedNodeStroke: '#2A5240',
    currentGlow: '#FFD700',
    decoration: {
      primary: '#2E7D32',
      secondary: '#1B5E20',
      accent: '#4CAF50',
    },
  },
  ocean: {
    id: 'ocean',
    backgroundColors: ['#0A1929', '#0D2847', '#133E68'],
    pathColor: '#1A4B7A',
    pathStroke: '#2563EB',
    nodeColor: '#3B82F6',
    nodeStroke: '#2563EB',
    lockedNodeColor: '#1E3A5F',
    lockedNodeStroke: '#2A4A6F',
    currentGlow: '#FFD700',
    decoration: {
      primary: '#1565C0',
      secondary: '#0D47A1',
      accent: '#42A5F5',
    },
  },
};

const CYCLE_ORDER = ['forest', 'ocean'];

export function getThemeForCycle(cycle: number): WorldTheme {
  const index = ((cycle - 1) % CYCLE_ORDER.length);
  return THEMES[CYCLE_ORDER[index]] || THEMES.forest;
}

export function getThemeById(themeId: string): WorldTheme {
  return THEMES[themeId] || THEMES.forest;
}
