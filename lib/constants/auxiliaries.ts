export const WARD_AUXILIARIES = [
  "Relief Society",
  "Elders Quorum",
  "Young Men",
  "Young Women",
  "Primary",
  "Sunday School",
  "Bishopric",
  "Ward Council",
  "Missionary",
  "Temple & Family History",
] as const;

export type WardAuxiliary = (typeof WARD_AUXILIARIES)[number];

export const AUXILIARY_COLORS: Record<string, string> = {
  "Relief Society": "#9333ea",
  "Elders Quorum": "#2563eb",
  "Young Men": "#0ea5e9",
  "Young Women": "#ec4899",
  "Primary": "#f59e0b",
  "Sunday School": "#10b981",
  "Bishopric": "#1a365d",
  "Ward Council": "#64748b",
  "Missionary": "#dc2626",
  "Temple & Family History": "#8b5cf6",
};
