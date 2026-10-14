import { z } from 'zod'

const email = () => z.string().trim().email().max(254)

// Password field is accepted and ignored: the mobile form still sends it, and
// there is no authentication yet. Alert when it stops being inert.
const password = () => z.string().max(72).optional()

export const loginSchema = z.object({
  email: email(),
  password: password(),
})

export type LoginPayload = z.infer<typeof loginSchema>
