import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import User from '#models/user'
import Recipe from '#features/recipes/models/recipe'

const VALID_RECIPE = {
  title: 'Pasta',
  servings: 4,
  ingredients: [{ name: 'makaron', quantity: 200, unit: 'g' }, { name: 'sól' }],
  steps: [{ text: 'Ugotuj makaron', durationMinutes: 8 }],
}

// Japa infers one response union per URL pattern, so the shared recipe URL is `single | list`
type RecipeData = { id: number; title: string }

function makeUser(email: string) {
  return User.create({ fullName: 'Test User', email, password: 'password' })
}

async function makeOwnerAndStranger() {
  const owner = await makeUser('owner@example.com')
  const stranger = await makeUser('stranger@example.com')

  return { owner, stranger }
}

async function createOwnersRecipe(client: ApiClient, owner: User) {
  const createRecipeResponse = await client
    .post('/api/v1/recipes')
    .loginAs(owner)
    .json(VALID_RECIPE)
  createRecipeResponse.assertStatus(200)

  return (createRecipeResponse.body().data as RecipeData).id
}

test.group('Recipes', () => {
  test('index does not list another user’s recipe', async ({ client, assert }) => {
    const { owner, stranger } = await makeOwnerAndStranger()
    await createOwnersRecipe(client, owner)

    const strangerIndexResponse = await client.get('/api/v1/recipes').loginAs(stranger)
    strangerIndexResponse.assertStatus(200)
    assert.deepEqual(strangerIndexResponse.body().data, [])
  })

  test('show returns 404 for another user’s recipe', async ({ client }) => {
    const { owner, stranger } = await makeOwnerAndStranger()
    const ownersRecipeId = await createOwnersRecipe(client, owner)

    const strangerShowResponse = await client
      .get(`/api/v1/recipes/${ownersRecipeId}`)
      .loginAs(stranger)
    strangerShowResponse.assertStatus(404)
  })

  test('show returns 404 for a non-numeric id', async ({ client }) => {
    const stranger = await makeUser('stranger@example.com')

    const strangerShowInvalidIdResponse = await client
      .get('/api/v1/recipes/not-a-number')
      .loginAs(stranger)
    strangerShowInvalidIdResponse.assertStatus(404)
  })

  test('update returns 404 for another user’s recipe', async ({ client }) => {
    const { owner, stranger } = await makeOwnerAndStranger()
    const ownersRecipeId = await createOwnersRecipe(client, owner)

    const strangerUpdateResponse = await client
      .patch(`/api/v1/recipes/${ownersRecipeId}`)
      .loginAs(stranger)
      .json({ title: 'Stolen' })
    strangerUpdateResponse.assertStatus(404)
  })

  test('destroy returns 404 for another user’s recipe', async ({ client }) => {
    const { owner, stranger } = await makeOwnerAndStranger()
    const ownersRecipeId = await createOwnersRecipe(client, owner)

    const strangerDestroyResponse = await client
      .delete(`/api/v1/recipes/${ownersRecipeId}`)
      .loginAs(stranger)
    strangerDestroyResponse.assertStatus(404)

    const ownerShowResponse = await client.get(`/api/v1/recipes/${ownersRecipeId}`).loginAs(owner)
    ownerShowResponse.assertStatus(200)
  })

  test('owner updates scalars and replaces the ingredient list', async ({ client, assert }) => {
    const { owner } = await makeOwnerAndStranger()
    const createdRecipeId = await createOwnersRecipe(client, owner)

    const updateRecipeResponse = await client
      .patch(`/api/v1/recipes/${createdRecipeId}`)
      .loginAs(owner)
      .json({ title: 'Pesto', ingredients: [{ name: 'bazylia' }] })
    updateRecipeResponse.assertStatus(200)

    const updatedRecipeResponse = updateRecipeResponse.body().data as {
      title: string
      ingredients: { name: string }[]
    }
    assert.equal(updatedRecipeResponse.title, 'Pesto')
    assert.deepEqual(
      updatedRecipeResponse.ingredients.map((ingredient) => ingredient.name),
      ['bazylia']
    )
  })

  test('destroy soft-deletes: reads 404 afterwards but the row keeps deletedAt', async ({
    client,
    assert,
  }) => {
    const { owner } = await makeOwnerAndStranger()
    const createdRecipeId = await createOwnersRecipe(client, owner)

    const destroyRecipeResponse = await client
      .delete(`/api/v1/recipes/${createdRecipeId}`)
      .loginAs(owner)
    destroyRecipeResponse.assertStatus(204)

    const showRecipeResponse = await client.get(`/api/v1/recipes/${createdRecipeId}`).loginAs(owner)
    showRecipeResponse.assertStatus(404)

    const destroyedRecipeRow = await Recipe.find(createdRecipeId)
    assert.isNotNull(destroyedRecipeRow?.deletedAt)
  })
})
