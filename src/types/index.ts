export type Role = 'siswa' | 'guru' | 'kesiswaan' | 'admin_pembina_asrama';

export type User = {
  id: number;
  created_at: string;
  nomor_induk: string;
  password?: string | null;
  name: string;
  role: Role;
  kelas?: string | null;
  angkatan?: string | null;
};

export type Semester = {
  id: number;
  created_at: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type PointCategory = {
  id: number;
  created_at: string;
  name: string;
  type: 'pelanggaran' | 'reward';
  severity: 'ringan' | 'sedang' | 'berat' | null;
  points_value: number;
};

export type PointLog = {
  id: number;
  created_at: string;
  student_id: number;
  category_id: number;
  recorded_by: number;
  semester_id: number;
  points_changed: number;
  notes?: string | null;
  
  // Joined fields
  student?: User;
  category?: PointCategory;
  recorder?: User;
  semester?: Semester;
};

export type PointStatus = 'excellent' | 'good' | 'warning' | 'critical';

export type SessionPayload = {
  id: number;
  nomor_induk: string;
  name: string;
  role: Role;
  kelas?: string | null;
  angkatan?: string | null;
};
