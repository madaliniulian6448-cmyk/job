import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(6).optional(),
  city: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const businessUpgradeSchema = z.object({
  businessType: z.enum(["private", "company"]),
  businessName: z.string().min(2),
  businessDescription: z.string().optional(),
  caen: z.string().optional(),
  cui: z.string().optional(),
  proofUrl: z.string().optional(),
});

export const listingSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  phone: z.string().min(6),
  city: z.string().min(2),
  categoryId: z.union([z.string(), z.number()]).optional(),
  images: z.array(z.string()).optional(),
});

export const businessRegisterSchema = z.object({
  businessType: z.enum(["private", "company"]),
  businessName: z.string().min(2),
  businessDescription: z.string().optional(),
  caen: z.string().optional(),
  cui: z.string().optional(),
  proofUrl: z.string().optional(),
  listing: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    price: z.union([z.string(), z.number()]).optional(),
    phone: z.string().min(6),
    city: z.string().min(2),
    categoryId: z.union([z.string(), z.number()]).optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const reportSchema = z.object({
  reason: z.string().min(5, "Motivul trebuie să aibă cel puțin 5 caractere"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BusinessUpgradeInput = z.infer<typeof businessUpgradeSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
