import { describe, expect, it } from 'vitest'
import type { z } from 'zod'

import {
  createRecipeSchema,
  EMPTY_PATCH_RULE,
  updateRecipeSchema,
} from '@/features/recipes/recipe.schema'

const VALID_RECIPE = {
  title: 'Pasta',
  servings: 4,
  ingredients: [{ name: 'makaron' }],
}

/** Test-side view of a zod issue: field path plus the `params.rule` tag. */
type IssueView = { field?: string; message: string; code: string; rule?: string }

function errorsFor(schema: z.ZodType, input: unknown): IssueView[] {
  const result = schema.safeParse(input)

  if (result.success) {
    return []
  }

  return result.error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : undefined,
    message: issue.message,
    code: issue.code,
    rule: (issue as { params?: { rule?: unknown } }).params?.rule as string | undefined,
  }))
}

function hasField(errors: IssueView[], field: string) {
  return errors.some((error) => error.field === field)
}

function hasRule(errors: IssueView[], rule: string) {
  return errors.some((error) => error.rule === rule)
}

function hasUnknownKey(errors: IssueView[], key: string) {
  return errors.some(
    (error) => error.code === 'unrecognized_keys' && error.message.includes(`"${key}"`)
  )
}

describe('recipe schema', () => {
  it('accepts a full payload', () => {
    const result = createRecipeSchema.parse({
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

    expect(result.title).toBe('Pasta')
    expect(result.ingredients).toHaveLength(1)
  })

  it('accepts the minimal payload', () => {
    const result = createRecipeSchema.parse(VALID_RECIPE)

    expect(result.servings).toBe(4)
    expect(result.ingredients).toHaveLength(1)
  })

  it('accepts a free-form category and a fractional quantity', () => {
    const result = createRecipeSchema.parse({
      ...VALID_RECIPE,
      ingredients: [{ name: 'cukier', category: 'anything-at-all', quantity: 0.5 }],
    })

    expect(result.ingredients[0]?.category).toBe('anything-at-all')
    expect(result.ingredients[0]?.quantity).toBe(0.5)
  })

  it('normalizes empty optional text to null', () => {
    const result = createRecipeSchema.parse({
      ...VALID_RECIPE,
      description: '',
      cuisine: '   ',
      ingredients: [{ name: 'makaron', unit: '' }],
    })

    expect(result.description).toBeNull()
    expect(result.ingredients[0]?.unit).toBeNull()
  })

  it('rejects a missing title', () => {
    const errors = errorsFor(createRecipeSchema, {
      servings: 4,
      ingredients: [{ name: 'makaron' }],
    })

    expect(hasField(errors, 'title')).toBe(true)
  })

  it('rejects an empty ingredients array', () => {
    const errors = errorsFor(createRecipeSchema, {
      title: 'Pasta',
      servings: 4,
      ingredients: [],
    })

    expect(hasField(errors, 'ingredients')).toBe(true)
  })

  it('rejects an ingredient without a name', () => {
    const errors = errorsFor(createRecipeSchema, {
      title: 'Pasta',
      servings: 4,
      ingredients: [{}],
    })

    expect(hasField(errors, 'ingredients.0.name')).toBe(true)
  })

  it('rejects wrong types', () => {
    expect(hasField(errorsFor(createRecipeSchema, { ...VALID_RECIPE, title: 123 }), 'title')).toBe(
      true
    )
    expect(
      hasField(errorsFor(createRecipeSchema, { ...VALID_RECIPE, servings: 'four' }), 'servings')
    ).toBe(true)
    expect(
      hasField(
        errorsFor(createRecipeSchema, {
          ...VALID_RECIPE,
          ingredients: [{ name: 'makaron', optional: 'yes' }],
        }),
        'ingredients.0.optional'
      )
    ).toBe(true)
  })

  it('rejects unknown keys', () => {
    const userIdErrors = errorsFor(createRecipeSchema, { ...VALID_RECIPE, userId: 1 })
    expect(hasUnknownKey(userIdErrors, 'userId')).toBe(true)

    const sourceErrors = errorsFor(createRecipeSchema, {
      ...VALID_RECIPE,
      sourceUrl: 'https://example.com',
    })
    expect(hasUnknownKey(sourceErrors, 'sourceUrl')).toBe(true)
  })

  it('rejects unknown nested keys', () => {
    const errors = errorsFor(createRecipeSchema, {
      ...VALID_RECIPE,
      ingredients: [{ name: 'makaron', alergens: ['gluten'] }],
    })

    expect(hasUnknownKey(errors, 'alergens')).toBe(true)
  })

  it('rejects an empty patch', () => {
    const errors = errorsFor(updateRecipeSchema, {})

    expect(hasRule(errors, EMPTY_PATCH_RULE)).toBe(true)
  })

  it('accepts a single-field patch', () => {
    const result = updateRecipeSchema.parse({ title: 'Nowa nazwa' })

    expect(result.title).toBe('Nowa nazwa')
  })

  it('rejects an empty ingredients array in a patch', () => {
    const errors = errorsFor(updateRecipeSchema, { ingredients: [] })

    expect(hasField(errors, 'ingredients')).toBe(true)
  })
})
