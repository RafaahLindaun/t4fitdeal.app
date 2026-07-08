export type AppRole = "student" | "professor" | "reception" | "admin";
export type AccountStatus = "pending" | "active" | "inactive" | "blocked";
export type DietAccessStatus = "locked" | "active" | "expired";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  emergency_phone: string | null;
  birth_date: string | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string | null;
  objective: string | null;
  dietary_restrictions: string | null;
  food_preferences: string | null;
  address: string | null;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  role: AppRole;
  status: AccountStatus;
  show_in_ranking: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietAccess {
  user_id: string;
  status: DietAccessStatus;
  source: string | null;
  starts_at: string | null;
  expires_at: string | null;
}

export interface ExerciseLibraryItem {
  id: string;
  created_by: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  media_url: string | null;
  media_type: "gif" | "image" | "video";
  default_sets: number;
  default_reps_min: number;
  default_reps_max: number;
  default_rest_seconds: number;
  notes: string | null;
  visibility: "private" | "academy";
}

export interface WorkoutPlan {
  id: string;
  student_id: string;
  professor_id: string | null;
  name: string;
  focus: string | null;
  version: number;
  is_active: boolean;
  valid_from: string | null;
  review_at: string | null;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  plan_id: string;
  exercise_id: string | null;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  media_url: string | null;
  media_type: "gif" | "image" | "video";
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  initial_load_kg: number;
  notes: string | null;
  position: number;
}
