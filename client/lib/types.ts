export type DoctorStatus = "active" | "on_leave" | "inactive";
export type PatientStatus = "active" | "follow_up" | "discharged";
export type Gender = "female" | "male" | "other" | "undisclosed";

export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
  status: DoctorStatus;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  condition: string;
  status: PatientStatus;
  registeredAt: string;
  doctor: { id: string; name: string; specialization: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ActivityEntry {
  id: string;
  action: "created" | "updated" | "deleted" | "reassigned";
  entityType: "doctor" | "patient";
  entityId: string;
  label: string;
  detail: string | null;
  actorName: string;
  createdAt: string;
}

export interface DashboardStats {
  metrics: {
    totalDoctors: { value: number; addedThisMonth: number };
    totalPatients: { value: number; addedThisMonth: number; changePct: number | null };
    activeDoctors: { value: number; sharePct: number };
    newPatients: { value: number; previous: number; changePct: number | null };
  };
  patientsPerDoctor: { id: string; name: string; specialization: string; count: number }[];
  registrations: { month: string; count: number }[];
  conditions: { name: string; count: number }[];
  recentPatients: {
    id: string;
    fullName: string;
    condition: string;
    registeredAt: string;
    doctorName: string | null;
  }[];
  recentDoctors: { id: string; name: string; specialization: string; createdAt: string }[];
  activity: ActivityEntry[];
}

export interface SearchResults {
  doctors: { id: string; name: string; subtitle: string }[];
  patients: { id: string; name: string; subtitle: string }[];
}
