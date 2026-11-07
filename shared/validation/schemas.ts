import { z } from "zod";

export const PHONE_REGEX = /^(?:\+?250|0)7[2389]\d{7}$/;
export const NID_REGEX = /^\d{16}$/;

const optionalEmail = z
  .string()
  .trim()
  .max(160, "Email is too long")
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address",
  });

const optionalNationalId = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || NID_REGEX.test(value), {
    message: "National ID must be exactly 16 digits",
  });

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(120, "Full name is too long")
    .regex(/^[A-Za-zÀ-ÿ'.\- ]+$/, "Use letters only in the visitor name"),
  phone: z
    .string()
    .trim()
    .min(9, "Phone number is required")
    .max(16, "Phone number is too long")
    .refine((value) => PHONE_REGEX.test(value.replace(/\s+/g, "")), {
      message: "Enter a valid Rwandan phone number (e.g. 0788 123 456)",
    }),
  email: optionalEmail,
  nationalId: optionalNationalId,
  relationship: z.enum(["parent", "guardian", "relative", "other"], {
    message: "Select the visitor relationship",
  }),
  studentFullName: z
    .string()
    .trim()
    .min(3, "Student full name must be at least 3 characters")
    .max(120, "Student name is too long")
    .regex(/^[A-Za-zÀ-ÿ'.\- ]+$/, "Use letters only in the student name"),
  studentRegistrationNumber: z
    .string()
    .trim()
    .min(3, "Student registration number is required")
    .max(40, "Registration number is too long")
    .regex(/^[A-Za-z0-9/\-_.]+$/, "Use letters, numbers, / or - only"),
  trade: z.enum(["SOD", "MMP", "CSA", "NIT"], { message: "Select the student trade" }),
  level: z.enum(["L3", "L4", "L5"], { message: "Select the student level" }),
  className: z
    .string()
    .trim()
    .min(1, "Student class is required")
    .max(40, "Class name is too long"),
  visitDayId: z.string().trim().min(1, "Select a valid visit date"),
  purpose: z.enum(
    ["academic", "discipline", "financial", "welfare", "consultation", "other"],
    { message: "Select the purpose of the visit" },
  ),
  message: z.string().trim().max(1000, "Message must be 1000 characters or fewer").optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(6, "Enter your registration reference")
    .max(40, "Invalid registration reference")
    .transform((value) => value.toUpperCase()),
  phone: z
    .string()
    .trim()
    .min(9, "Enter the phone number used during registration")
    .max(16, "Invalid phone number"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const prefectSignupSchema = z
  .object({
    full_name: z.string().trim().min(3, "Full name must be at least 3 characters").max(120),
    email: z.string().trim().email("Enter a valid school email address").max(160),
    phone_number: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(24, "Phone number is too long")
      .regex(/^\+?[0-9][0-9\s().-]{5,22}$/, "Enter a valid phone number"),
    password: z.string().min(10, "Password must be at least 10 characters").max(72),
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type PrefectSignupInput = z.infer<typeof prefectSignupSchema>;

export const visitDaySchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(120, "Title is too long"),
    visit_date: z.string().trim().min(1, "Visit date is required"),
    registration_open: z.string().trim().min(1, "Opening date/time is required"),
    registration_close: z.string().trim().min(1, "Closing date/time is required"),
    is_active: z.boolean(),
    instructions: z.string().trim().max(2000, "Instructions are too long").optional(),
  })
  .refine(
    (data) => new Date(data.registration_close).getTime() > new Date(data.registration_open).getTime(),
    { message: "Closing date must be after the opening date", path: ["registration_close"] },
  );

export type VisitDayInput = z.infer<typeof visitDaySchema>;

export const staffSchema = z.object({
  full_name: z.string().trim().min(3, "Full name is required").max(120, "Full name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.string().trim().min(1, "Select a role"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type StaffInput = z.infer<typeof staffSchema>;

export const userUpdateSchema = z.object({
  full_name: z.string().trim().min(3, "Full name is required").max(120, "Full name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const passwordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const userStatusSchema = z.object({
  status: z.enum(["active", "suspended", "disabled"]),
});

export const roleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Role key is required")
    .max(40, "Role key is too long")
    .regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers and underscores"),
  name: z.string().trim().min(2, "Role name is required").max(80, "Role name is too long"),
  description: z.string().trim().max(240, "Description is too long").optional(),
});

export const emailSettingsSchema = z.object({
  dean_name: z.string().trim().min(2, "Dean name is required").max(120),
  dean_email: z.string().trim().email("Enter a valid Dean email address"),
  cc_email: z
    .string()
    .trim()
    .max(500, "CC list is too long")
    .optional()
    .refine(
      (value) =>
        !value ||
        value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .every((entry) => z.string().email().safeParse(entry).success),
      { message: "Enter valid comma-separated email addresses" },
    ),
  email_enabled: z.boolean(),
  default_format: z.enum(["pdf", "docx"]),
  auto_enabled: z.boolean(),
  auto_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Use a 24-hour time such as 17:00"),
  auto_format: z.enum(["pdf", "docx"]),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

export const registrationUpdateSchema = z.object({
  full_name: z.string().trim().min(3, "Visitor name is required").max(120),
  phone: z
    .string()
    .trim()
    .refine((value) => PHONE_REGEX.test(value.replace(/\s+/g, "")), {
      message: "Enter a valid Rwandan phone number",
    }),
  email: optionalEmail,
  national_id: optionalNationalId,
  relationship: z.enum(["parent", "guardian", "relative", "other"]),
  student_full_name: z.string().trim().min(3, "Student name is required").max(120),
  registration_number: z.string().trim().min(3, "Student registration number is required").max(40),
  trade: z.enum(["SOD", "MMP", "CSA", "NIT"]),
  level: z.enum(["L3", "L4", "L5"]),
  class_name: z.string().trim().min(1, "Class is required").max(40),
  purpose: z.enum(["academic", "discipline", "financial", "welfare", "consultation", "other"]),
  message: z.string().trim().max(1000).optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export type RegistrationUpdateInput = z.infer<typeof registrationUpdateSchema>;

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the information provided.";
}

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  data?: Record<string, unknown>;
};
