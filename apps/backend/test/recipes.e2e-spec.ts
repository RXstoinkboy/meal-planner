import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { bearer, createApp, httpServer, type SessionBody, signup } from './helpers'

type RecipeBody = { id: number; title: string; ingredients: { name: string }[] }

const VALID_RECIPE = {
  title: 'Pasta',
  servings: 4,
  ingredients: [{ name: 'makaron', quantity: 200, unit: 'g' }, { name: 'sól' }],
  steps: [{ text: 'Ugotuj makaron', durationMinutes: 8 }],
}

describe('recipes', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates, reads, patches and soft deletes a recipe', async () => {
    const session = await signup(app, 'owner@example.com')

    const created = await request(httpServer(app))
      .post('/api/v1/recipes')
      .set(bearer(session))
      .send(VALID_RECIPE)
      .expect(201)

    const recipe = created.body as RecipeBody
    expect(recipe.title).toBe('Pasta')

    const patched = await request(httpServer(app))
      .patch(`/api/v1/recipes/${recipe.id}`)
      .set(bearer(session))
      .send({ title: 'Pesto', ingredients: [{ name: 'bazylia' }] })
      .expect(200)

    const patchedRecipe = patched.body as RecipeBody
    expect(patchedRecipe.ingredients.map((ingredient) => ingredient.name)).toEqual(['bazylia'])

    await request(httpServer(app))
      .delete(`/api/v1/recipes/${recipe.id}`)
      .set(bearer(session))
      .expect(204)

    await request(httpServer(app))
      .get(`/api/v1/recipes/${recipe.id}`)
      .set(bearer(session))
      .expect(404)
  })

  it('keeps another user’s recipe out of every route', async () => {
    const owner = await signup(app, 'owner@example.com')
    const stranger = await signup(app, 'stranger@example.com')

    const created = await request(httpServer(app))
      .post('/api/v1/recipes')
      .set(bearer(owner))
      .send(VALID_RECIPE)
      .expect(201)

    const recipeId = (created.body as RecipeBody).id

    const list = await request(httpServer(app))
      .get('/api/v1/recipes')
      .set(bearer(stranger))
      .expect(200)

    expect(list.body).toEqual([])

    await request(httpServer(app))
      .get(`/api/v1/recipes/${recipeId}`)
      .set(bearer(stranger))
      .expect(404)

    await request(httpServer(app))
      .patch(`/api/v1/recipes/${recipeId}`)
      .set(bearer(stranger))
      .send({ title: 'Stolen' })
      .expect(404)

    await request(httpServer(app))
      .delete(`/api/v1/recipes/${recipeId}`)
      .set(bearer(stranger))
      .expect(404)
  })

  it('rejects a malformed id with 404', async () => {
    const session = await signup(app, 'owner@example.com')

    await request(httpServer(app))
      .get('/api/v1/recipes/not-a-number')
      .set(bearer(session))
      .expect(404)
  })

  it('rejects unknown keys and empty patches with a 400 field error', async () => {
    const session = await signup(app, 'owner@example.com')

    const invalid = await request(httpServer(app))
      .post('/api/v1/recipes')
      .set(bearer(session))
      .send({ ...VALID_RECIPE, userId: 1 })
      .expect(400)

    expect(invalid.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: [{ message: 'Unrecognized key: "userId"' }],
    })

    const emptyPatch = await request(httpServer(app))
      .patch('/api/v1/recipes/1')
      .set(bearer(session))
      .send({})
      .expect(400)

    expect(emptyPatch.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: [{ message: 'At least one field is required' }],
    })
  })

  it('requires a bearer token: no token, a garbage token and the old header are all 401', async () => {
    const session: SessionBody = await signup(app, 'owner@example.com')

    await request(httpServer(app)).get('/api/v1/recipes').expect(401)

    await request(httpServer(app))
      .get('/api/v1/recipes')
      .set('Authorization', 'Bearer not.a.jwt')
      .expect(401)

    await request(httpServer(app))
      .get('/api/v1/recipes')
      .set('x-user-id', String(session.user.id))
      .expect(401)
  })
})
