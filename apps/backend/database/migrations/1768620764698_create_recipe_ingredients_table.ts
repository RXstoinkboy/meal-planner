import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recipe_ingredients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('recipe_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('recipes')
        .onDelete('CASCADE')

      table.integer('position').notNullable()
      table.string('raw_text').notNullable()
      table.string('name').notNullable()
      table.decimal('quantity').nullable()
      table.string('unit').nullable()
      table.string('category').nullable()
      table.boolean('optional').notNullable().defaultTo(false)

      table.index(['recipe_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
