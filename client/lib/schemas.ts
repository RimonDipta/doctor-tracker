import { z } from "zod";

const required = (label: string, min = 1, max = 120) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .regex(/^[^<>]*$/, `${label} can't contain < or >`);

const email = z.string().trim().email("Enter a valid email address");
const phone = z.string().trim().regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number");

const pastDate = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => new Date(value) <= new Date(), `${label} can't be in the future`)
    .refine((value) => new Date(value) >= new Date("1900-01-01"), `${label} is too far in the past`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const doctorSchema = z.object({
  name: required("Name", 2, 80),
  specialization: required("Specialization", 2, 80),
  hospital: required("Hospital", 2, 120),
  phone,
  email,
  status: z.enum(["active", "on_leave", "inactive"]),
});

export const patientSchema = z.object({
  fullName: required("Full name", 2, 100),
  dateOfBirth: pastDate("Date of birth"),
  gender: z.enum(["female", "male", "other", "undisclosed"], { error: "Choose a gender" }),
  phone,
  email: z.literal("").or(email),
  address: required("Address", 5, 200),
  condition: required("Condition", 2, 100),
  status: z.enum(["active", "follow_up", "discharged"]),
  registeredAt: pastDate("Registration date"),
  doctor: z.string().min(1, "Choose a doctor"),
});

export const profileSchema = z.object({
  name: required("Name", 2, 80),
  email,
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(10, "Use at least 10 characters").max(72, "Use at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type DoctorValues = z.infer<typeof doctorSchema>;
export type PatientValues = z.infer<typeof patientSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
