import { z } from "zod";

import { UserSecretType } from "./enum";

// Base schema for secret name
export const baseSchema = z
  .object({
    name: z
      .string({ required_error: "Please enter the name" })
      .min(1, "Please enter a name for your secret")
      .max(100, "Please enter less than 100 characters")
  })
  .strip();

// Common data structures
export const loginDataSchema = z
  .object({
    loginURL: z.string().url().optional(),
    username: z.string().min(1, { message: "Please enter a username" }),
    password: z
      .string({ required_error: "Please enter a password" })
      .min(1, { message: "Please enter a password" })
  })
  .strip();

export const creditCardDataSchema = z
  .object({
    cardNumber: z
      .string({ required_error: "Please enter a card number" })
      .regex(/^\d{13,19}$/, "Please enter a valid card number"),
    cardExpiry: z
      .string({ required_error: "Please enter expiry date" })
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date format. Use MM/YY format."),
    cardCvv: z
      .union([z.string().regex(/^\d{3,4}$/, "Please enter a valid cvv"), z.literal("")])
      .optional()
  })
  .strip();

export const secureNoteDataSchema = z
  .object({
    secureNote: z.string().min(1, { message: "Please enter a note" })
  })
  .strip();

export const wifiDataSchema = z
  .object({
    wifiPassword: z.string().min(1, { message: "Please enter the password" })
  })
  .strip();

// Main schema with discriminated union
export const userSecretSchema = z.discriminatedUnion("secretType", [
  baseSchema.merge(
    z.object({
      secretType: z.literal(UserSecretType.WEB_LOGIN),
      data: loginDataSchema
    })
  ),
  baseSchema.merge(
    z.object({
      secretType: z.literal(UserSecretType.CREDIT_CARD),
      data: creditCardDataSchema
    })
  ),
  baseSchema.merge(
    z.object({
      secretType: z.literal(UserSecretType.SECURE_NOTE),
      data: secureNoteDataSchema
    })
  ),
  baseSchema.merge(
    z.object({
      secretType: z.literal(UserSecretType.WIFI),
      data: wifiDataSchema
    })
  )
]);
