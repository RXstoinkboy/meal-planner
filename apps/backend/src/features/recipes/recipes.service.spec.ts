import { describe, expect, it } from 'vitest'

import { toIngredientRows, toStepRows } from '@/features/recipes/recipes.service'

describe('recipe payload', () => {
  it('fills server-owned defaults and positions', () => {
    const rows = toIngredientRows([
      { name: 'mąka' },
      { name: 'jajko', rawText: '2 jajka', quantity: 2, unit: 'szt', optional: true },
    ])

    expect(rows).toEqual([
      {
        name: 'mąka',
        rawText: 'mąka',
        quantity: null,
        unit: null,
        category: null,
        optional: false,
        position: 1,
      },
      {
        name: 'jajko',
        rawText: '2 jajka',
        quantity: '2',
        unit: 'szt',
        category: null,
        optional: true,
        position: 2,
      },
    ])
  })

  it('keeps a fractional quantity as a decimal string', () => {
    const [row] = toIngredientRows([{ name: 'cukier', quantity: 0.5 }])

    expect(row?.quantity).toBe('0.5')
  })

  it('positions steps in order and defaults the duration', () => {
    expect(toStepRows([{ text: 'gotuj' }, { text: 'jedz', durationMinutes: 5 }])).toEqual([
      { text: 'gotuj', durationMinutes: null, position: 1 },
      { text: 'jedz', durationMinutes: 5, position: 2 },
    ])
  })
})
