import { describe, expect, it } from 'vitest'

import { toRecipeResponse } from '@/features/recipes/recipe.mapper'

type Fixture = Parameters<typeof toRecipeResponse>[0] & {
  userId: number
  sourceRawPath: string | null
  extractionModel: string | null
  deletedAt: Date | null
}

// ponytail: plain-object fixture — the mapper only reads fields
function fixture(overrides: Partial<Fixture> = {}): Fixture {
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
    ingredients: [
      {
        rawText: '2 łyżki oliwy',
        name: 'oliwa',
        quantity: { toString: () => '2' },
        unit: 'łyżka',
        category: 'pantry',
        optional: false,
        position: 1,
      },
    ],
    steps: [{ position: 1, text: 'Podgrzej', durationMinutes: null }],
    userId: 7,
    sourceRawPath: 'uploads/secret.pdf',
    extractionModel: 'gpt-5',
    deletedAt: null,
    ...overrides,
  }
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
  'user_id',
  'sourceRawPath',
  'source_raw_path',
  'extractionModel',
  'extraction_model',
  'deletedAt',
  'deleted_at',
]

const STEP_KEYS = ['text', 'durationMinutes', 'position']

const INGREDIENT_KEYS = ['rawText', 'name', 'quantity', 'unit', 'category', 'optional', 'position']

describe('recipe mapper', () => {
  it('exposes the exact recipe shape and leaks no private columns', () => {
    const output = toRecipeResponse(fixture())

    expect(Object.keys(output).sort()).toEqual([...RECIPE_KEYS].sort())

    for (const key of LEAKED_KEYS) {
      expect(output).not.toHaveProperty(key)
    }
  })

  it('derives minutes as prep + cook, null only when both are missing', () => {
    expect(toRecipeResponse(fixture()).minutes).toBe(35)
    expect(toRecipeResponse(fixture({ prepMinutes: null })).minutes).toBe(25)
    expect(toRecipeResponse(fixture({ cookMinutes: null })).minutes).toBe(10)
    expect(toRecipeResponse(fixture({ prepMinutes: null, cookMinutes: null })).minutes).toBeNull()
  })

  it('serializes decimal quantities as strings without trailing zeros', () => {
    const output = toRecipeResponse(
      fixture({
        ingredients: [{ ...fixture().ingredients[0], quantity: { toString: () => '200' } }],
      })
    )

    expect(output.ingredients[0]?.quantity).toBe('200')
  })

  it('keeps a null quantity null', () => {
    const output = toRecipeResponse(
      fixture({ ingredients: [{ ...fixture().ingredients[0], quantity: null }] })
    )

    expect(output.ingredients[0]?.quantity).toBeNull()
  })

  it('exposes display fields only on children', () => {
    const output = toRecipeResponse(fixture())

    expect(Object.keys(output.ingredients[0] ?? {}).sort()).toEqual(INGREDIENT_KEYS.sort())
    expect(Object.keys(output.steps[0] ?? {}).sort()).toEqual(STEP_KEYS.sort())
  })
})
