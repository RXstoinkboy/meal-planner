import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recipe_steps'

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
      table.text('text').notNullable()
      table.integer('duration_minutes').nullable()

      table.index(['recipe_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
