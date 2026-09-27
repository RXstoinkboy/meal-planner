import { test } from '@japa/runner'

import RecipeTransformer from '#features/recipes/transformers/recipe_transformer'
import type Recipe from '#features/recipes/models/recipe'

// ponytail: plain-object cast, Lucid fixtures need no rows for a shape test
function fixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Zupa',
    description: null,
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 25,
    cuisine: null,
    notes: 'mama robi z mniej soli',
    tags: ['quick'],
    tools: ['blender'],
    sourceType: 'manual',
    sourceUrl: null,
    userId: 7,
    sourceRawPath: 'uploads/secret.pdf',
    deletedAt: null,
    ingredients: [
      {
        id: 9,
        recipeId: 1,
        rawText: '2 łyżki oliwy',
        name: 'oliwa',
        quantity: '2',
        unit: 'łyżka',
        category: 'pantry',
        optional: false,
        position: 1,
      },
    ],
    steps: [{ id: 3, recipeId: 1, position: 1, text: 'Podgrzej', durationMinutes: null }],
    ...overrides,
  } as unknown as Recipe
}

const RECIPE_KEYS = [
  'id',
  'title',
  'description',
  'servings',
  'prepMinutes',
  'cookMinutes',
  'cuisine',
  'notes',
  'tags',
  'tools',
  'sourceType',
  'sourceUrl',
  'minutes',
  'ingredients',
  'steps',
]

const LEAKED_KEYS = [
  'userId',
  'sourceRawPath',
  'deletedAt',
  'user_id',
  'source_raw_path',
  'deleted_at',
]

const STEP_KEYS = ['text', 'durationMinutes', 'position']

const INGREDIENT_KEYS = ['rawText', 'name', 'quantity', 'unit', 'category', 'optional', 'position']

test.group('RecipeTransformer', () => {
  test('exposes the exact recipe shape and leaks no private columns', ({ assert }) => {
    const output = new RecipeTransformer(fixture()).toObject()

    assert.deepEqual(Object.keys(output).sort(), [...RECIPE_KEYS].sort())

    for (const key of LEAKED_KEYS) {
      assert.notProperty(output, key)
    }
  })

  test('derives minutes as prep + cook, null only when both are missing', ({ assert }) => {
    assert.equal(new RecipeTransformer(fixture()).toObject().minutes, 35)
    assert.isNull(
      new RecipeTransformer(fixture({ prepMinutes: null, cookMinutes: null })).toObject().minutes
    )
  })

  test('ingredients and steps expose display fields only', ({ assert }) => {
    const output = new RecipeTransformer(fixture()).toObject()

    assert.deepEqual(Object.keys(output.ingredients[0]).sort(), INGREDIENT_KEYS.sort())
    assert.deepEqual(Object.keys(output.steps[0]).sort(), STEP_KEYS.sort())
  })
})
