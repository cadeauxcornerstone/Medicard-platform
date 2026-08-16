import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable();

export const createPatientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters")
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must contain at least 2 characters")
    .max(100),

  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Invalid date of birth"
    ),

  gender: z
    .enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"])
    .optional(),

  phone: optionalString,

  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
});

export const updatePatientSchema = createPatientSchema.partial();