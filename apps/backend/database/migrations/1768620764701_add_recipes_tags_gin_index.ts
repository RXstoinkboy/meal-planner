import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recipes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['tags'], 'recipes_tags_gin', 'gin')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['tags'], 'recipes_tags_gin')
    })
  }
}
