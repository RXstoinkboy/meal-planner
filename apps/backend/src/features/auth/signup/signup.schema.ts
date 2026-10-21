import { z } from 'zod'

import { nullableString } from '@/core/zod/nullable-string'

const email = () => z.email().trim().max(254).toLowerCase()

const password = () => z.string().min(12).max(128)

export const signupSchema = z
  .object({
    fullName: nullableString().optional(),
    email: email(),
    password: password(),
    passwordConfirmation: password(),
  })
  .refine((body) => body.password === body.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type SignupPayload = z.infer<typeof signupSchema>
