import { z } from 'zod'

const email = () => z.email().trim().max(254).toLowerCase()

export const loginSchema = z.object({
  email: email(),
  password: z.string(),
})

export type LoginPayload = z.infer<typeof loginSchema>
