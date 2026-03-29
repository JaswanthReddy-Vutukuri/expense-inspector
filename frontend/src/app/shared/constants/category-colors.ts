export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Food:          { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  Transport:     { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  Entertainment: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  Shopping:      { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  Bills:         { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  Health:        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Other:         { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
};

export const CHART_COLORS = [
  '#ef4444', // Food - red
  '#3b82f6', // Transport - blue
  '#8b5cf6', // Entertainment - violet
  '#f59e0b', // Shopping - amber
  '#6366f1', // Bills - indigo
  '#10b981', // Health - emerald
  '#94a3b8', // Other - slate
];

export function getCategoryColor(name: string) {
  return CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'];
}
