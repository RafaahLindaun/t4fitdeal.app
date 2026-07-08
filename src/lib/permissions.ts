import type { AppRole } from "./types";

export const isStaffRole = (role?: AppRole | null) =>
  role === "professor" || role === "reception" || role === "admin";

export const canManageStudents = (role?: AppRole | null) => isStaffRole(role);
export const canApproveStudents = (role?: AppRole | null) =>
  role === "reception" || role === "admin";
export const canManageWorkouts = (role?: AppRole | null) => isStaffRole(role);
export const canManageDiet = (role?: AppRole | null) => isStaffRole(role);
export const canManageStore = (role?: AppRole | null) =>
  role === "reception" || role === "admin";
export const canManageClasses = (role?: AppRole | null) =>
  role === "reception" || role === "admin";
export const canManageStaff = (role?: AppRole | null) => role === "admin";

export function roleLabel(role?: AppRole | null) {
  if (role === "professor") return "Professor";
  if (role === "reception") return "Recepção";
  if (role === "admin") return "Administrador";
  return "Aluno";
}
