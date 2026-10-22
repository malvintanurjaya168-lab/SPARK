export const POINT_BASE = 100;

export const STATUS_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 75,
  WARNING: 60,
};

export const ROLES = {
  SISWA: 'siswa',
  GURU: 'guru',
  KESISWAAN: 'kesiswaan',
  ADMIN_PEMBINA_ASRAMA: 'admin_pembina_asrama',
} as const;

export const JWT_SECRET = 'spark-secret-key-sma-presiden-2026';
export const COOKIE_NAME = 'spark-session';
