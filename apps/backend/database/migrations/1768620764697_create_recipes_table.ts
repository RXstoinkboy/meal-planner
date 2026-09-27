import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recipes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('title').notNullable()
      table.text('description').nullable()
      table.integer('servings').notNullable()
      table.integer('prep_minutes').nullable()
      table.integer('cook_minutes').nullable()
      table.string('cuisine').nullable()
      table.specificType('tags', 'text[]').notNullable().defaultTo('{}')
      table.specificType('tools', 'text[]').notNullable().defaultTo('{}')
      table.text('notes').nullable()

      table
        .enum('source_type', ['manual', 'link', 'image', 'pdf', 'suggestion'], {
          useNative: true,
          enumName: 'recipe_source_type',
        })
        .notNullable()
        .defaultTo('manual')
      table.string('source_url').nullable()
      table.string('source_raw_path').nullable()
      table.timestamp('source_fetched_at').nullable()
      table.string('extraction_model').nullable()
      table.jsonb('extraction_confidence').nullable()
      table.boolean('source_stale').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('drop type if exists "recipe_source_type"')
  }
}
