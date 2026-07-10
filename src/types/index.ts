export type AppRole = "aluno" | "professor" | "recepcao" | "admin";
export type StatusType = "pending" | "active" | "inactive";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  cpf?: string | null;
  phone?: string | null;
  emergency_phone?: string | null;
  birth_date?: string | null;
  role: AppRole;
  status: StatusType;
  goal?: string | null;
  current_weight?: number | null;
  height_cm?: number | null;
  diet_active?: boolean | null;
  avatar_url?: string | null;
  professor_id?: string | null;
}

export interface WorkoutPlan {
  id: string;
  student_id: string;
  professor_id?: string | null;
  name: string;
  version?: number | null;
  notes?: string | null;
  is_active?: boolean | null;
  review_at?: string | null;
}

export interface WorkoutExercise {
  id: string;
  plan_id: string;
  position?: number | null;
  name: string;
  media_url?: string | null;
  sets?: number | null;
  reps_min?: number | null;
  reps_max?: number | null;
  load_label?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
}

export interface WorkoutSession {
  id?: string;
  student_id: string;
  plan_id?: string | null;
  completed_at?: string | null;
  valid_for_ranking?: boolean | null;
  completion_percentage?: number | null;
}

export interface CardioSession {
  id?: string;
  student_id: string;
  type: string;
  duration_seconds: number;
  calories?: number | null;
  distance_km?: number | null;
  created_at?: string | null;
}

export interface ProductItem {
  id: string;
  title: string;
  category?: string | null;
  image_url?: string | null;
  active?: boolean | null;
}

export interface ClassItem {
  id: string;
  title: string;
  category?: string | null;
  weekday?: string | null;
  time_label?: string | null;
  gympass_plan?: string | null;
  active?: boolean | null;
}

export interface RecipeItem {
  id: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  calories?: number | null;
}
