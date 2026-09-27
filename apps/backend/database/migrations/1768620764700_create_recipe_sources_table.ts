import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recipe_sources'

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

      table.string('url').notNullable()
      table
        .enum('kind', ['link', 'video', 'book'], {
          useNative: true,
          enumName: 'recipe_source_kind',
        })
        .notNullable()
      table.string('label').nullable()
      table.timestamp('added_at').notNullable().defaultTo(this.now())

      table.index(['recipe_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('drop type if exists "recipe_source_kind"')
  }
}
