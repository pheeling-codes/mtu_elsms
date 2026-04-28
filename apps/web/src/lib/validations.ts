import { z } from "zod"

// Matric number format: MAT/XX/XXXX (e.g., MAT/19/1234)
const matricNumberRegex = /^MAT\/\d{2}\/\d{4}$/i

// Password requirements: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["STUDENT", "ADMIN"]),
})

export const studentSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  matricNumber: z
    .string()
    .regex(
      matricNumberRegex,
      "Matric number must be in format MAT/XX/XXXX (e.g., MAT/19/1234)"
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const adminSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type StudentSignupInput = z.infer<typeof studentSignupSchema>
export type AdminSignupInput = z.infer<typeof adminSignupSchema>
