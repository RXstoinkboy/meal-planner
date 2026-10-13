import { errorResponse, registry, USER_ID_SECURITY } from '@/openapi/registry'
import { userResponseSchema } from '@/features/auth/mappers/user.mapper'
import { loginSchema, signupSchema } from '@/features/auth/validators/user.schema'

const userSchema = registry.register('User', userResponseSchema)

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup',
  summary: 'Create a user',
  request: {
    body: { content: { 'application/json': { schema: signupSchema } } },
  },
  responses: {
    201: { description: 'Created user', content: { 'application/json': { schema: userSchema } } },
    400: errorResponse('Validation failed'),
    409: errorResponse('The email is already taken'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Look up a user by email',
  request: {
    body: { content: { 'application/json': { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: 'Existing user',
      content: { 'application/json': { schema: userSchema } },
    },
    400: errorResponse('Validation failed'),
    401: errorResponse('No user with that email'),
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/account/profile',
  summary: 'Current user',
  security: USER_ID_SECURITY,
  responses: {
    200: { description: 'Current user', content: { 'application/json': { schema: userSchema } } },
    401: errorResponse('Missing or unknown x-user-id header'),
  },
})
