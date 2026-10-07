import { test } from '@japa/runner'

import { toIngredientRows, toStepRows } from '#features/recipes/services/recipe_payload'

test.group('Recipe payload', () => {
  test('ingredient rows fill server-owned defaults and positions', ({ assert }) => {
    const rows = toIngredientRows([
      { name: 'mąka' },
      { name: 'jajko', rawText: '2 jajka', quantity: 2, unit: 'szt', optional: true },
    ])

    assert.deepEqual(rows, [
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

  test('fractional quantity stays a decimal string', ({ assert }) => {
    const [row] = toIngredientRows([{ name: 'cukier', quantity: 0.5 }])

    assert.isString(row.quantity)
    assert.equal(row.quantity, '0.5')
  })

  test('step rows position in order and default duration', ({ assert }) => {
    assert.deepEqual(toStepRows([{ text: 'gotuj' }, { text: 'jedz', durationMinutes: 5 }]), [
      { text: 'gotuj', durationMinutes: null, position: 1 },
      { text: 'jedz', durationMinutes: 5, position: 2 },
    ])
  })
})
