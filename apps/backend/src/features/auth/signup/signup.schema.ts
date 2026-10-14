import { z } from 'zod'

import { nullableString } from '@/core/zod/nullable-string'

const email = () => z.string().trim().email().max(254)

// Password fields are accepted and ignored: the mobile form still sends them, and
// there is no authentication yet. Alert when they stop being inert.
const password = () => z.string().max(72).optional()

export const signupSchema = z.object({
  fullName: nullableString().optional(),
  email: email(),
  password: password(),
  passwordConfirmation: password(),
})

export type SignupPayload = z.infer<typeof signupSchema>
