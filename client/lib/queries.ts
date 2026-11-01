"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api, apiPage } from "./api";
import type { DoctorValues, PatientValues } from "./schemas";
import type {
  ActivityEntry,
  DashboardStats,
  Doctor,
  DoctorOption,
  Paginated,
  Patient,
  PatientStatus,
  SearchResults,
} from "./types";

type ListQuery = Record<string, string>;

export const keys = {
  doctors: ["doctors"] as const,
  doctorList: (query: ListQuery) => ["doctors", "list", query] as const,
  doctor: (id: string) => ["doctors", "detail", id] as const,
  doctorPatients: (id: string, query: ListQuery) => ["patients", "byDoctor", id, query] as const,
  doctorFilters: ["doctors", "filters"] as const,
  doctorOptions: ["doctors", "options"] as const,
  patients: ["patients"] as const,
  patientList: (query: ListQuery) => ["patients", "list", query] as const,
  patient: (id: string) => ["patients", "detail", id] as const,
  patientFilters: ["patients", "filters"] as const,
  dashboard: ["dashboard"] as const,
  activity: (limit: number) => ["activity", limit] as const,
  search: (term: string) => ["search", term] as const,
};

/** Every write can move counts and charts, so all derived views refresh together. */
function invalidateAll(client: QueryClient) {
  return Promise.all(
    [keys.doctors, keys.patients, keys.dashboard, ["activity"], ["search"]].map((queryKey) =>
      client.invalidateQueries({ queryKey }),
    ),
  );
}

export const useDoctors = (query: ListQuery) =>
  useQuery({
    queryKey: keys.doctorList(query),
    queryFn: () => apiPage<Paginated<Doctor>>("/doctors", query),
    placeholderData: keepPreviousData,
  });

export const useDoctor = (id: string) =>
  useQuery({ queryKey: keys.doctor(id), queryFn: () => api<Doctor>(`/doctors/${id}`) });

export const useDoctorFilters = () =>
  useQuery({
    queryKey: keys.doctorFilters,
    queryFn: () => api<{ specializations: string[]; hospitals: string[] }>("/doctors/filters"),
  });

export const useDoctorOptions = (enabled = true) =>
  useQuery({
    queryKey: keys.doctorOptions,
    queryFn: () => api<DoctorOption[]>("/doctors/options"),
    enabled,
  });

export const useDoctorPatients = (id: string, query: ListQuery) =>
  useQuery({
    queryKey: keys.doctorPatients(id, query),
    queryFn: () => apiPage<Paginated<Patient>>(`/doctors/${id}/patients`, query),
    placeholderData: keepPreviousData,
  });

export const usePatients = (query: ListQuery) =>
  useQuery({
    queryKey: keys.patientList(query),
    queryFn: () => apiPage<Paginated<Patient>>("/patients", query),
    placeholderData: keepPreviousData,
  });

export const usePatient = (id: string) =>
  useQuery({ queryKey: keys.patient(id), queryFn: () => api<Patient>(`/patients/${id}`) });

export const usePatientFilters = () =>
  useQuery({
    queryKey: keys.patientFilters,
    queryFn: () => api<{ conditions: string[] }>("/patients/filters"),
  });

export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: () => api<DashboardStats>("/dashboard/stats") });

export const useActivity = (limit: number) =>
  useQuery({
    queryKey: keys.activity(limit),
    queryFn: () => api<ActivityEntry[]>("/activity", { query: { limit } }),
  });

export const useGlobalSearch = (term: string) =>
  useQuery({
    queryKey: keys.search(term),
    queryFn: () => api<SearchResults>("/search", { query: { q: term } }),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
  });

export function useSaveDoctor(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: DoctorValues) =>
      id
        ? api<Doctor>(`/doctors/${id}`, { method: "PATCH", body: values })
        : api<Doctor>("/doctors", { method: "POST", body: values }),
    onSuccess: () => invalidateAll(client),
  });
}

export function useDeleteDoctor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      api<void>(`/doctors/${id}`, { method: "DELETE", query: { reassignTo } }),
    onSuccess: () => invalidateAll(client),
  });
}

export function useSavePatient(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ doctor, ...values }: PatientValues) =>
      id
        ? api<Patient>(`/patients/${id}`, { method: "PATCH", body: { ...values, doctor } })
        : api<Patient>(`/doctors/${doctor}/patients`, { method: "POST", body: values }),
    onSuccess: () => invalidateAll(client),
  });
}

export function useDeletePatient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateAll(client),
  });
}

/**
 * The one optimistic write: a status change is a single reversible field with no
 * derived totals on the patient page, so it's safe to show before the server confirms.
 */
export function useUpdatePatientStatus(id: string) {
  const client = useQueryClient();
  const queryKey = keys.patient(id);
  return useMutation({
    mutationFn: (status: PatientStatus) =>
      api<Patient>(`/patients/${id}`, { method: "PATCH", body: { status } }),
    onMutate: async (status) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<Patient>(queryKey);
      if (previous) client.setQueryData<Patient>(queryKey, { ...previous, status });
      return { previous };
    },
    onError: (_error, _status, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
    },
    onSettled: () => invalidateAll(client),
  });
}
