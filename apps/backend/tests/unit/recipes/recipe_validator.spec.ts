import { test } from '@japa/runner'

import {
  createRecipeValidator,
  updateRecipeValidator,
  EMPTY_PATCH_RULE,
  UNKNOWN_KEY_RULE,
} from '#features/recipes/validators/recipe'

type ValidationMessage = { field: string; rule: string; message: string }

function hasField(error: { messages: ValidationMessage[] } | null, field: string) {
  return error?.messages.some((message) => message.field === field) ?? false
}

function hasRule(error: { messages: ValidationMessage[] } | null, rule: string) {
  return error?.messages.some((message) => message.rule === rule) ?? false
}

function hasUnknownKey(error: { messages: ValidationMessage[] } | null, key: string) {
  return (
    error?.messages.some(
      (message) => message.rule === UNKNOWN_KEY_RULE && message.message.includes(`"${key}"`)
    ) ?? false
  )
}

const VALID_RECIPE = {
  title: 'Pasta',
  servings: 4,
  ingredients: [{ name: 'makaron' }],
}

test.group('Recipes validator', () => {
  test('accepts a full payload', async ({ assert }) => {
    const result = await createRecipeValidator.validate({
      ...VALID_RECIPE,
      description: 'Szybka kolacja',
      prepMinutes: 10,
      cookMinutes: 25,
      cuisine: 'włoska',
      tags: ['quick'],
      tools: ['garnek'],
      notes: 'mniej soli',
      ingredients: [
        {
          name: 'makaron',
          rawText: '200 g makaronu',
          quantity: 200,
          unit: 'g',
          category: 'pantry',
          optional: false,
        },
      ],
      steps: [{ text: 'Ugotuj makaron', durationMinutes: 8 }],
    })

    assert.equal(result.title, 'Pasta')
    assert.lengthOf(result.ingredients, 1)
  })

  test('accepts the minimal payload', async ({ assert }) => {
    const result = await createRecipeValidator.validate(VALID_RECIPE)
    assert.equal(result.servings, 4)
    assert.lengthOf(result.ingredients, 1)
  })

  test('accepts a free-form category', async ({ assert }) => {
    const result = await createRecipeValidator.validate({
      ...VALID_RECIPE,
      ingredients: [{ name: 'makaron', category: 'anything-at-all' }],
    })
    assert.equal(result.ingredients[0].category, 'anything-at-all')
  })

  test('rejects a missing title', async ({ assert }) => {
    const [error, result] = await createRecipeValidator.tryValidate({
      servings: 4,
      ingredients: [{ name: 'makaron' }],
    })
    assert.isNull(result)
    assert.isTrue(hasField(error, 'title'))
  })

  test('rejects an empty ingredients array', async ({ assert }) => {
    const [error, result] = await createRecipeValidator.tryValidate({
      title: 'Pasta',
      servings: 4,
      ingredients: [],
    })
    assert.isNull(result)
    assert.isTrue(hasField(error, 'ingredients'))
  })

  test('rejects an ingredient without a name', async ({ assert }) => {
    const [error, result] = await createRecipeValidator.tryValidate({
      title: 'Pasta',
      servings: 4,
      ingredients: [{}],
    })
    assert.isNull(result)
    assert.isTrue(hasField(error, 'ingredients.0.name'))
  })

  test('rejects wrong types', async ({ assert }) => {
    const [titleError] = await createRecipeValidator.tryValidate({ ...VALID_RECIPE, title: 123 })
    assert.isTrue(hasField(titleError, 'title'))

    const [servingsError] = await createRecipeValidator.tryValidate({
      ...VALID_RECIPE,
      servings: 'four',
    })
    assert.isTrue(hasField(servingsError, 'servings'))

    const [optionalError] = await createRecipeValidator.tryValidate({
      ...VALID_RECIPE,
      ingredients: [{ name: 'makaron', optional: 'yes' }],
    })
    assert.isTrue(hasField(optionalError, 'ingredients.0.optional'))
  })

  test('rejects unknown keys', async ({ assert }) => {
    const [userIdError] = await createRecipeValidator.tryValidate({ ...VALID_RECIPE, userId: 1 })
    assert.isTrue(hasUnknownKey(userIdError, 'userId'))

    const [sourceError] = await createRecipeValidator.tryValidate({
      ...VALID_RECIPE,
      sourceUrl: 'https://example.com',
    })
    assert.isTrue(hasUnknownKey(sourceError, 'sourceUrl'))
  })

  test('rejects unknown nested keys', async ({ assert }) => {
    const [error] = await createRecipeValidator.tryValidate({
      ...VALID_RECIPE,
      ingredients: [{ name: 'makaron', alergens: ['gluten'] }],
    })
    assert.isTrue(hasUnknownKey(error, 'alergens'))
  })

  test('update rejects an empty patch', async ({ assert }) => {
    const [error, result] = await updateRecipeValidator.tryValidate({})
    assert.isNull(result)
    assert.isTrue(hasRule(error, EMPTY_PATCH_RULE))
  })

  test('update accepts a single field', async ({ assert }) => {
    const result = await updateRecipeValidator.validate({ title: 'Nowa nazwa' })
    assert.equal(result.title, 'Nowa nazwa')
  })

  test('update rejects an empty ingredients array', async ({ assert }) => {
    const [error, result] = await updateRecipeValidator.tryValidate({ ingredients: [] })
    assert.isNull(result)
    assert.isTrue(hasField(error, 'ingredients'))
  })
})
